
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetAdminPassword() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured.");
    }

    const email = "customer@example.com";
    const newPassword = process.env.ADMIN_RESET_PASSWORD;

    if (!newPassword || newPassword.length < 6) {
      throw new Error(
        "Set ADMIN_RESET_PASSWORD to a new password of at least 6 characters."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new Error("Admin account not found.");
    }

    if (user.role !== "admin") {
      throw new Error(
        "This account is not an admin. Password was not changed."
      );
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    console.log("Admin password reset successfully.");
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword();

