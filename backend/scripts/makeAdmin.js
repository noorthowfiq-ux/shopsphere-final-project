
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/User");

dotenv.config();

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "customer@example.com";

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      console.log("User not found. Register the account first.");
      return;
    }

    user.role = "admin";
    await user.save();

    console.log(`Admin role assigned to ${user.email}`);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

makeAdmin();
