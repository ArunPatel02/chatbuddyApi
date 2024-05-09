import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../../config";
import chalk from "chalk";
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    loginToken: {
        type: String,
        // required: true,
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    profileComplete: {
        type: Boolean,
        default: false
    },
    gender: {
        type: String,
        enum: ["Male", "Female"]
    },
    avatar: {
        type: String,
    },
    dateOfBirth: {
        type: String,
    },
    fullName: {
        type: String,
    },
    socketId: {
        type: String,
    },
    isOnline: {
        type: Boolean,
        default: true,
    },
    lastSeen: {
        type: Date,
    },
    expoToken: {
        type: String,
    }
}, { timestamps: true });
userSchema.methods.generateToken = function () {
    console.log(chalk.bgYellowBright.white("⌛ generating token"));
    const token = jwt.sign({ email: this.email }, JWT_SECRET);
    this.loginToken = token;
    this.save();
    console.log(chalk.bgGreen.white("✅ token generated and saved to data base"));
    return token;
};
const User = mongoose.model("user", userSchema);
export default User;
