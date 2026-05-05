const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const User = require('../models/User');

async function createOrUpdateAdmin() {
    try {
        // Nhập email của user cần promote thành admin
        const email = process.argv[2];

        if (!email) {
            console.log('Usage: node create-admin.js <email>');
            console.log('Example: node create-admin.js admin@nestora.com');
            process.exit(1);
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found!`);
            process.exit(1);
        }

        // Update roles to include admin
        if (!user.roles.includes('admin')) {
            user.roles.push('admin');
            await user.save();
            console.log(`✅ User ${email} has been promoted to admin!`);
            console.log('Current roles:', user.roles);
        } else {
            console.log(`User ${email} is already an admin.`);
            console.log('Current roles:', user.roles);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createOrUpdateAdmin();
