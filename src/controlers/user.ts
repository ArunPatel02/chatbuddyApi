import { Request, Response } from "express";
import { Otp, User } from "../database/models";
import chalk from "chalk";
import { SecureRequest } from "../middleware";

export const createUser = async (req: Request, res: Response) => {
    try {
        const userData = req.body
        console.log(userData)
        console.log(chalk.bgYellowBright.white("⌛ finding user..."));
        let userCreted = await User.findOne({ email: userData.email })
        if (userCreted) {
            console.log(chalk.bgBlue.white("✅ user already present"))
        } else {
            console.log(chalk.bgYellowBright.white("⌛ Creating user..."));
            userCreted = await User.create(userData)
            console.log(chalk.bgBlue.white("✅ user created"))
        }
        const token = userCreted.generateToken()
        if (token) {
            console.log(chalk.bgYellowBright.white("⌛ generating otp..."));
            const generatedOtp = Math.floor(100000 + Math.random() * 900000);
            const generateOtp = await Otp.create({ otp: generatedOtp, userId: userCreted._id })
            console.log(chalk.bgBlue.white("✅ otp sent"))
            if (generateOtp) {
                res.status(200).json({
                    success: true,
                    message: "otp send successfully",
                    body: {
                        userData: userCreted,
                        otp: generatedOtp
                    },
                })
            }
        }

    } catch (error) {
        console.log(chalk.bgRed.white("Error", error))
        res.status(400).json({
            success: false,
            message: "something went wrong",
        })
    }
}

export const checkOtp = async (req: SecureRequest, res: Response) => {
    try {
        const { otp, expoPushToken } = req.body;
        const userId = req.user?._id
        console.log(chalk.bgYellowBright.white("⌛ Checking OTP...", otp));
        const otpData = await Otp.findOne({ otp, userId });
        if (otpData) {
            console.log(chalk.bgBlue.white("✅ OTP matched successfully"));
            const userData = await User.findOneAndUpdate({ _id: userId }, { otpVerified: true, expoToken: expoPushToken })
            res.status(200).json({
                success: true,
                message: "OTP matched successfully",
                profileComplete: userData?.profileComplete ? true : false
            });
        } else {
            res.status(200).json({
                success: false,
                message: "OTP does not match",
            });
        }
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

export const updateUser = async (req: SecureRequest, res: Response) => {
    try {
        const updateData = req.body;
        console.log(chalk.bgYellowBright.white("⌛ Updating user..."));
        const updatedUser = await User.findByIdAndUpdate(req.user?._id, { ...updateData });

        if (updatedUser) {
            console.log(chalk.bgBlue.white("✅ User updated"));
            res.status(200).json({
                success: true,
                message: "User details updated successfully",
                body: {
                    userData: updatedUser
                },
            });
        } else {
            console.log(chalk.bgRed.white("User not found"));
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

// Function to get user from req.user._id
export const getUserById = async (req: SecureRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        console.log(chalk.bgYellowBright.white("⌛ Finding user by ID..."));
        const user = await User.findById(userId);

        if (user) {
            console.log(chalk.bgBlue.white("✅ User found"));
            res.status(200).json({
                success: true,
                message: "User found successfully",
                body: {
                    userData: user
                },
            });
        } else {
            console.log(chalk.bgRed.white("User not found"));
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

// Function to get user by ID from query
export const getFriendUserById = async (req: SecureRequest, res: Response) => {
    try {
        const userId = req.params.id;
        console.log(chalk.bgYellowBright.white("⌛ Finding user by ID...", userId));
        const user = await User.findById(userId);

        if (user) {
            console.log(chalk.bgBlue.white("✅ User found"));
            res.status(200).json({
                success: true,
                message: "User found successfully",
                body: {
                    userData: user
                },
            });
        } else {
            console.log(chalk.bgRed.white("User not found"));
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}