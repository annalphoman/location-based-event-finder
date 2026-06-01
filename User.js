const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    previousName: { type: String, default: null }, // NEW: Stores the old name
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['Admin', 'Organizer', 'Attendee'],
        default: 'Attendee'
    },
    verificationStatus: { type: String, default: 'Pending' },
    isApproved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);