import { getCaptchaService, getGSTDetailsService } from '../services/gst.service.js';

export const getCaptcha = async (req, res, next) => {
    try {
        const result = await getCaptchaService();
        res.status(200).json(result);
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

        const data = await getGSTDetailsService(sessionId, GSTIN, captcha);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching GST Details:', error.message);
        if (error.message === 'Invalid session id') return res.status(400).json({ error: 'Invalid session id' });
        res.status(500).json({ error: 'Error in fetching GST Details' });
    }
};
