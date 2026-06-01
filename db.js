const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // We added { family: 4 } to force IPv4 and bypass hotspot drops
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            family: 4
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;