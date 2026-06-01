const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    eventType: { type: String, default: 'Workshop' }, // Will now accept our dropdown categories
    location: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // UPDATED: Registration link is now completely optional
    regLink: { type: String, required: false },

    // NEW: Toggle for whether the interest count shows on the map
    showInterestCount: { type: Boolean, default: true },

    interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);