import { Request, Response } from "express";
import chalk from "chalk";
import { SecureRequest } from "../middleware";
import { Contact, Message, User } from "../database/models";
import mongoose from "mongoose";
import { Expo } from "expo-server-sdk";



//send messagge to user
export const sendMessage = async (req: SecureRequest, res: Response) => {
    try {
        const { text, receiverId, transactionId } = req.body
        const senderId = req.user?._id;
        // const socket = req.customSocket
        const socket = req.app.get("app-io")
        const expo: Expo = req.app.get("app-expo")
        console.log(chalk.bgYellowBright.white("⌛ sending message..."));
        const message = await Message.create({
            text: text,
            senderId: new mongoose.Types.ObjectId(senderId),
            receiverId: new mongoose.Types.ObjectId(receiverId as string),
        })
        const senderContact = await Contact.findOneAndUpdate({
            userId: new mongoose.Types.ObjectId(senderId),
            connectedUser: new mongoose.Types.ObjectId(receiverId as string)
        }, { lastMessage: message._id }, { upsert: true, new: true })

        const receiverContact = await Contact.findOneAndUpdate({
            userId: new mongoose.Types.ObjectId(receiverId as string),
            connectedUser: new mongoose.Types.ObjectId(senderId),
        }, { $push: { unreadMessages: message._id }, lastMessage: message._id }, { upsert: true, new: true })

        // console.log(receiverContact.isNew, "receiverContact")
        // console.log(senderContact.isNew, "senderContact")

        const contacts = await Contact.aggregate([
            { $match: { _id: receiverContact?._id } },
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
        const frienduser = await User.findById(receiverId)
        const receiverSocketId = frienduser?.socketId || ""
        const expoToken = frienduser?.expoToken
        if (receiverSocketId) {
            console.log(chalk.bgBlue.white("A receiver socket id", receiverSocketId));

            socket?.to(receiverSocketId).emit("new message", JSON.stringify(message))

            socket?.to(receiverSocketId).emit("contact updated", JSON.stringify(contacts[0]))
        }

        if (Expo.isExpoPushToken(expoToken)) {
            expo.sendPushNotificationsAsync([{
                to: expoToken,
                title: `${req.user?.fullName}`,
                body: message.text,
                channelId: "default",
                data: { "screen": "chatScreen" }
            }])
        }

        console.log(chalk.bgBlue.white("✅ message sent to receiver"))

        res.status(200).json({
            success: true,
            message: "message sent successfully",
            body: {
                messageData: message,
                transactionId: transactionId,
                contact: { senderContact, receiverContact }
            }
        })
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

//get messages by senderId or receiverId
export const getMessages = async (req: SecureRequest, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const cuurentUser = new mongoose.Types.ObjectId(req.user?._id)
        console.log(chalk.bgYellowBright.white("⌛ fetching messages..."));
        const messages = await Message.find({
            $or: [{ senderId: userId, receiverId: cuurentUser }, { senderId: cuurentUser, receiverId: userId }],
        });
        console.log(chalk.bgBlue.white("✅ messages found"));
        res.status(200).json({
            success: true,
            message: "messages fetched successfully",
            body: {
                messages: messages,
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

//update all message statuses to read
export const markMessagesAsRead = async (req: SecureRequest, res: Response) => {
    try {
        const cuurentUser = new mongoose.Types.ObjectId(req.user?._id)
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const socket = req.app.get("app-io")

        const contact = await Contact.findOne({ userId: cuurentUser, connectedUser: userId });

        const allIds = contact?.unreadMessages

        if (contact) {
            const allUpdatedMessages = await Message.updateMany(
                { _id: { $in: contact.unreadMessages } },
                { $set: { status: "read" } }
            );
            await Contact.findByIdAndUpdate(contact._id, { unreadMessages: [] })
            console.log(chalk.bgBlue.white("✅ messages marked as read"));

            const receiverSocketId = (await User.findById(userId))?.socketId || ""

            console.log(chalk.bgBlue.white("A read messages socket id", receiverSocketId, allIds))

            socket?.to(receiverSocketId).emit("markMessagesAsRead", JSON.stringify({ unreadMessages: allIds }))

            socket?.to(receiverSocketId).emit("markMessagesAsReadContact", JSON.stringify({ unreadMessages: allIds, userId: cuurentUser }))

            res.status(200).json({
                unreadMessages: allIds,
                success: true,
                message: "Messages marked as read successfully",
            });
        } else {
            console.log(chalk.bgRed.white("Error"));
            res.status(200).json({
                success: false,
                message: "Contact not found",
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