import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    cookies: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now, expires: 300 }
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
