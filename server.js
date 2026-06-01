const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// 1. IMPORT YOUR ROUTES
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/AdminRoutes'); // <--- IMPORT THE NEW ADMIN ROUTES

dotenv.config();
connectDB();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// 2. CONNECT THE URLS TO THE ROUTE FILES
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes); // <--- THIS IS THE BRIDGE WE ADDED

const PORT = process.env.PORT || 5000;
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));