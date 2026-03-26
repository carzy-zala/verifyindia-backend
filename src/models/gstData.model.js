import mongoose from 'mongoose';

const gstDataSchema = new mongoose.Schema({
    gstin: {
        type: String,
        required: true,
        index: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    fetchedAt: {
        type: Date,
        default: Date.now
    }
});

const GstData = mongoose.model('GstData', gstDataSchema);

export default GstData;
