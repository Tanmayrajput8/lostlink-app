const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/user");

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB Atlas");

        const existingAdmin = await User.findOne({
            email: "admin@lostlink.com"
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash("Admin12345", 10);

        const admin = new User({
            name: "LostLink Admin",
            email: "admin@lostlink.com",
            password: hashedPassword,
            phone: "9999999999",
            role: "admin"
        });

        await admin.save();

        console.log("Admin created successfully!");
        console.log("Email: admin@lostlink.com");
        console.log("Password: Admin12345");

        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
}

createAdmin();