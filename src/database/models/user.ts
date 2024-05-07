import mongoose, { connect } from "mongoose";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../../config";
import chalk from "chalk";

interface UserInterface {
    email: string;
    loginToken: string;
    otpVerified: boolean;
    profileComplete: boolean;
    gender: "Male" | "Female";
    avatar?: string;
    dateOfBirth?: string;
    fullName?: string;
    socketId?: string;
    isOnline?: boolean;
    lastSeen?: Date;
    expoToken?: string;
}

interface UserModelInterface {
    generateToken(): string;
}

type UserModel = mongoose.Model<UserInterface, {}, UserModelInterface>;


const userSchema = new mongoose.Schema<UserInterface>({
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
}, { timestamps: true })


userSchema.methods.generateToken = function () {
    console.log(chalk.bgYellowBright.white("⌛ generating token"))
    const token = jwt.sign({ email: this.email }, JWT_SECRET as string);
    this.loginToken = token
    this.save()
    console.log(chalk.bgGreen.white("✅ token generated and saved to data base"))
    return token
};

const User = mongoose.model<UserInterface, UserModel>("user", userSchema)

export default User
