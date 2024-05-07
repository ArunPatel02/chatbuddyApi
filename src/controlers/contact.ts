import { Request, Response } from "express";
import chalk from "chalk";
import { SecureRequest } from "../middleware";
import { Contact } from "../database/models";
import mongoose from "mongoose";

//get contact from contact schema
export const getContact = async (req: SecureRequest, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?._id);
        console.log(chalk.bgYellowBright.white("⌛ fetching contact..."));

        const contacts = await Contact.aggregate([
            { $match: { userId: userId } },
            {
                $lookup: {
                    from: "messages",
                    localField: "lastMessage",
                    foreignField: "_id",
                    as: "message"
                }
            },
            {
                $addFields: {
                    lastMessage: { $last: "$message" },
                    unreadMessagesCount: { $size: { $ifNull: ["$unreadMessages", []] } }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "connectedUser",
                    foreignField: "_id",
                    as: "connectedUsers"
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    connectedUser: { $arrayElemAt: ["$connectedUsers", 0] },
                    lastMessage: 1,
                    unreadMessagesCount: 1,
                    updatedAt: 1,
                    createdAt: 1,
                }
            }
        ]);

        console.log(chalk.bgBlue.white("✅ contact found"));
        res.status(200).json({
            success: true,
            message: "contact fetched successfully",
            body: {
                contacts: contacts,
            }
        });
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}