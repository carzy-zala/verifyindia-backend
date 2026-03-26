import express from 'express';
import { getCaptcha, getGSTDetails } from '../controllers/gst.controller.js';

const router = express.Router();

router.get('/getCaptcha', getCaptcha);
router.post('/getGSTDetails', getGSTDetails);

export default router;
