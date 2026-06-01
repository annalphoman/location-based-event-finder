const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification'); // Add this at the top


exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, eventType, organizer, regLink } = req.body;

        const checkUser = await User.findById(organizer);
        if (!checkUser || checkUser.role !== 'Organizer' || !checkUser.isApproved) {
            return res.status(403).json({ message: "Action Blocked: Organizer not verified." });
        }

        // We completely removed the random math!
        // It now directly uses the 'location.lat' and 'location.lng' sent from the map click.

        const event = await Event.create({
            title, description, date, eventType,
            location, // This now contains the address, lat, and lng from the frontend
            organizer, regLink
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('organizer', 'name email');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.markInterested = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.body.userId;

        const event = await Event.findById(eventId);
        const user = await User.findById(userId); // Get user details

        if (!event) return res.status(404).json({ message: "Event not found" });

        if (!event.interestedUsers.includes(userId)) {
            event.interestedUsers.push(userId);
            await event.save();
        }
        res.status(200).json({ message: "Successfully marked as interested!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// NEW: Logic for deleting an event
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;

        // Find the event and delete it from MongoDB
        const deletedEvent = await Event.findByIdAndDelete(eventId);

        if (!deletedEvent) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({ message: "Event deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// NEW: Logic for updating an event and notifying users
exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const updates = req.body; // updated fields

        // Find the existing event to compare changes
        const existingEvent = await Event.findById(eventId);
        if (!existingEvent) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Apply updates
        const updatedEvent = await Event.findByIdAndUpdate(eventId, updates, { new: true });

        // Calculate diff messages
        let changes = [];
        if (updates.title && existingEvent.title !== updates.title) changes.push(`Title changed from "${existingEvent.title}" to "${updates.title}"`);
        if (updates.date && new Date(existingEvent.date).getTime() !== new Date(updates.date).getTime()) changes.push(`Date changed to ${new Date(updates.date).toLocaleDateString()}`);
        if (updates.location && existingEvent.location.address !== updates.location.address) changes.push(`Location changed to ${updates.location.address}`);
        if (updates.description && existingEvent.description !== updates.description) changes.push(`Description updated`);
        
        // Notify interested users if any significant changes were made
        if (changes.length > 0 && updatedEvent.interestedUsers.length > 0) {
            const notificationMessage = `The event "${existingEvent.title}" you are interested in has been updated! Changes: ${changes.join(', ')}.`;
            
            // Create a notification for every interested user
            const notifications = updatedEvent.interestedUsers.map(userId => ({
                recipient: userId,
                type: 'System', // Using System or a new 'Event Update' type
                message: notificationMessage
            }));

            await Notification.insertMany(notifications);
        }

        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};