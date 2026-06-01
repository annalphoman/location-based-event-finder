const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification'); // <-- Import Notification model

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name, email, password: hashedPassword,
            role: role || 'Attendee',
            isApproved: role === 'Admin' ? true : false,
            verificationStatus: role === 'Organizer' ? 'Pending' : 'Verified'
        });

        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token, _id: user._id, name: user.name,
            previousName: user.previousName, // NEW: Send old name to frontend
            email: user.email, role: user.role, isApproved: user.isApproved
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// NEW: Function to handle profile edits
exports.updateProfile = async (req, res) => {
    const { userId, newName } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // If an Organizer changes their name, log the old one
        if (user.role === 'Organizer' && user.name !== newName) {
            user.previousName = user.name;
        }

        user.name = newName;
        await user.save();

        res.status(200).json({
            _id: user._id, name: user.name, previousName: user.previousName,
            email: user.email, role: user.role, isApproved: user.isApproved
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};