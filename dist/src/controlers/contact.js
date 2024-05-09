var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chalk from "chalk";
import { Contact } from "../database/models";
import mongoose from "mongoose";
//get contact from contact schema
export const getContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = new mongoose.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        console.log(chalk.bgYellowBright.white("⌛ fetching contact..."));
        const contacts = yield Contact.aggregate([
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
    }
    catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
});
