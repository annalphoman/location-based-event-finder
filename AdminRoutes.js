const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification'); // <-- Added Notification Import

// GET all pending organizers for Garry's panel
router.get('/pending-organizers', async (req, res) => {
    try {
        const pending = await User.find({ role: 'Organizer', verificationStatus: 'Pending' });
        res.json(pending);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// APPROVE an organizer
router.put('/approve-organizer/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true, verificationStatus: 'Verified' }, { new: true });
        
        // NEW: Send approval notification to the Organizer
        if (user) {
            await Notification.create({
                recipient: user._id,
                type: 'Approval',
                message: `Congratulations! Your organizer account has been approved. You can now post events.`
            });
        }

        res.json({ message: `${user.name} is now approved to post events!` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// REJECT an organizer
router.put('/reject-organizer/:id', async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { isApproved: false, verificationStatus: 'Rejected' }, { new: true });
        
        // NEW: Send rejection notification to the Organizer
        if (user) {
            await Notification.create({
                recipient: user._id,
                type: 'System', // Using System type for rejections out of currently styled types.
                message: `Your organizer account request has been rejected.${reason ? ` Reason: ${reason}` : ''}`
            });
        }

        res.json({ message: `${user.name} has been rejected.` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all approved organizers
router.get('/approved-organizers', async (req, res) => {
    try {
        const approved = await User.find({
            role: 'Organizer',
            $or: [{ isApproved: true }, { verificationStatus: 'Verified' }]
        });
        res.json(approved);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// REVOKE an organizer's approval
router.put('/revoke-organizer/:id', async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { isApproved: false, verificationStatus: 'Revoked' }, { new: true });
        
        // Notify the Organizer of revocation
        if (user) {
            await Notification.create({
                recipient: user._id,
                type: 'System',
                message: `Your organizer approval has been revoked by an Admin.${reason ? ` Reason: ${reason}` : ''}`
            });
        }

        res.json({ message: `${user.name}'s approval has been revoked.` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;