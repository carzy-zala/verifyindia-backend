import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/session.model.js';
import GstData from '../models/gstData.model.js';

const GST_BASE_URL = 'https://services.gst.gov.in';

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
};

const parseCookies = (setCookieArray) => {
    if (!Array.isArray(setCookieArray)) return [];
    return setCookieArray.map(c => c.split(';')[0]);
};

export const getCaptcha = async (req, res, next) => {
    try {
        const initialRes = await axios.get(`${GST_BASE_URL}/services/searchtp`, { headers: DEFAULT_HEADERS });
        const initialCookies = initialRes.headers['set-cookie'] || [];

        const parsedInitialCookies = parseCookies(initialCookies);

        const captchaRes = await axios.get(`${GST_BASE_URL}/services/captcha`, {
            headers: {
                ...DEFAULT_HEADERS,
                'Cookie': parsedInitialCookies.join('; ')
            },
            responseType: 'arraybuffer'
        });

        let allCookies = [...initialCookies];
        if (captchaRes.headers['set-cookie']) {
            allCookies = [...allCookies, ...captchaRes.headers['set-cookie']];
        }

        const captchaBase64 = Buffer.from(captchaRes.data, 'binary').toString('base64');
        const sessionId = uuidv4();

        await Session.create({ sessionId, cookies: parseCookies(allCookies) });

        res.status(200).json({
            sessionId,
            image: `data:image/png;base64,${captchaBase64}`
        });
    } catch (error) {
        console.error('Error fetching captcha:', error.message);
        res.status(500).json({ error: 'Error in fetching captcha' });
    }
};

export const getGSTDetails = async (req, res, next) => {
    try {
        const { sessionId, GSTIN, captcha } = req.body;
        if (!sessionId || !GSTIN || !captcha) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const session = await Session.findOne({ sessionId });
        if (!session) {
            return res.status(400).json({ error: 'Invalid session id' });
        }

        const payload = { gstin: GSTIN, captcha };

        const response = await axios.post(`${GST_BASE_URL}/services/api/search/taxpayerDetails`, payload, {
            headers: {
                ...DEFAULT_HEADERS,
                'Cookie': session.cookies.join('; '),
                'Content-Type': 'application/json'
            }
        });

        // Check for logical errors from the official GST API (even if status is 200)
        if (response.data?.error || response.data?.errorCode) {
            const errorMsg = response.data.error?.message || response.data.error_msg || response.data.errorDesc || 'Invalid GSTIN or Captcha';
            return res.status(422).json({ error: errorMsg });
        }

        // Only store successfull taxpayer details
        await GstData.updateOne(
            { gstin: GSTIN },
            { $set: { data: response.data, fetchedAt: new Date() } },
            { upsert: true }
        );

        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error fetching GST Details:', error.message);
        res.status(500).json({ error: 'Error in fetching GST Details' });
    }
};
