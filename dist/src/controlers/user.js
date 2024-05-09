var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Otp, User } from "../database/models";
import chalk from "chalk";
export const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = req.body;
        console.log(userData);
        console.log(chalk.bgYellowBright.white("⌛ finding user..."));
        let userCreted = yield User.findOne({ email: userData.email });
        if (userCreted) {
            console.log(chalk.bgBlue.white("✅ user already present"));
        }
        else {
            console.log(chalk.bgYellowBright.white("⌛ Creating user..."));
            userCreted = yield User.create(userData);
            console.log(chalk.bgBlue.white("✅ user created"));
        }
        const token = userCreted.generateToken();
        if (token) {
            console.log(chalk.bgYellowBright.white("⌛ generating otp..."));
            const generatedOtp = Math.floor(100000 + Math.random() * 900000);
            const generateOtp = yield Otp.create({ otp: generatedOtp, userId: userCreted._id });
            console.log(chalk.bgBlue.white("✅ otp sent"));
            if (generateOtp) {
                res.status(200).json({
                    success: true,
                    message: "otp send successfully",
                    body: {
                        userData: userCreted,
                        otp: generatedOtp
                    },
                });
            }
        }
    }
    catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "something went wrong",
        });
    }
});
export const checkOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { otp, expoPushToken } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log(chalk.bgYellowBright.white("⌛ Checking OTP...", otp));
        const otpData = yield Otp.findOne({ otp, userId });
        if (otpData) {
            console.log(chalk.bgBlue.white("✅ OTP matched successfully"));
            const userData = yield User.findOneAndUpdate({ _id: userId }, { otpVerified: true, expoToken: expoPushToken });
            res.status(200).json({
                success: true,
                message: "OTP matched successfully",
                profileComplete: (userData === null || userData === void 0 ? void 0 : userData.profileComplete) ? true : false
            });
        }
        else {
            res.status(200).json({
                success: false,
                message: "OTP does not match",
            });
        }
    }
    catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
});
export const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const updateData = req.body;
        console.log(chalk.bgYellowBright.white("⌛ Updating user..."));
        const updatedUser = yield User.findByIdAndUpdate((_b = req.user) === null || _b === void 0 ? void 0 : _b._id, Object.assign({}, updateData));
        if (updatedUser) {
            console.log(chalk.bgBlue.white("✅ User updated"));
            res.status(200).json({
                success: true,
                message: "User details updated successfully",
                body: {
                    userData: updatedUser
                },
            });
        }
        else {
            console.log(chalk.bgRed.white("User not found"));
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
    }
    catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
});
// Function to get user from req.user._id
export const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        console.log(chalk.bgYellowBright.white("⌛ Finding user by ID..."));
        const user = yield User.findById(userId);
        if (user) {
            console.log(chalk.bgBlue.white("✅ User found"));
            res.status(200).json({
                success: true,
                message: "User found successfully",
                body: {
                    userData: user
                },
            });
        }
        else {
            console.log(chalk.bgRed.white("User not found"));
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
    }
    catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
});
// Function to get user by ID from query
export const getFriendUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        console.log(chalk.bgYellowBright.white("⌛ Finding user by ID...", userId));
        const user = yield User.findById(userId);
        if (user) {
            console.log(chalk.bgBlue.white("✅ User found"));
            res.status(200).json({
                success: true,
                message: "User found successfully",
                body: {
                    userData: user
                },
            });
        }
        else {
            console.log(chalk.bgRed.white("User not found"));
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
    }
    catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
});
