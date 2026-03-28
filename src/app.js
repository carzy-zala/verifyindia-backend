import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import gstRoutes from './routes/gst.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import mongoSanitize from 'express-mongo-sanitize';

const app = express();

app.use(helmet());


app.use(cors({
    origin: ['http://localhost:3000', 'https://www.indiatradecheck.com', 'https://www.indiatradecheck.org', 'https://www.indiatradecheck.co.uk'],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
// Workaround for express-mongo-sanitize with Express 5
app.use((req, res, next) => {
    Object.defineProperty(req, 'query', {
        value: { ...req.query },
        writable: true,
        configurable: true,
        enumerable: true,
    });
    next();
});
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ message: 'OK' });
});
app.use('/api/v1', gstRoutes);
app.use(errorHandler);

export default app;
