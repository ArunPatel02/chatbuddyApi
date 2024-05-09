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
import { Contact, Message, User } from "../database/models";
import mongoose from "mongoose";
import { Expo } from "expo-server-sdk";
//send messagge to user
export const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { text, receiverId, transactionId } = req.body;
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // const socket = req.customSocket
        const socket = req.app.get("app-io");
        const expo = req.app.get("app-expo");
        console.log(chalk.bgYellowBright.white("⌛ sending message..."));
        const message = yield Message.create({
            text: text,
            senderId: new mongoose.Types.ObjectId(senderId),
            receiverId: new mongoose.Types.ObjectId(receiverId),
        });
        const senderContact = yield Contact.findOneAndUpdate({
            userId: new mongoose.Types.ObjectId(senderId),
            connectedUser: new mongoose.Types.ObjectId(receiverId)
        }, { lastMessage: message._id }, { upsert: true, new: true });
        const receiverContact = yield Contact.findOneAndUpdate({
            userId: new mongoose.Types.ObjectId(receiverId),
            connectedUser: new mongoose.Types.ObjectId(senderId),
        }, { $push: { unreadMessages: message._id }, lastMessage: message._id }, { upsert: true, new: true });
        // console.log(receiverContact.isNew, "receiverContact")
        // console.log(senderContact.isNew, "senderContact")
        const contacts = yield Contact.aggregate([
            { $match: { _id: receiverContact === null || receiverContact === void 0 ? void 0 : receiverContact._id } },
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
        const frienduser = yield User.findById(receiverId);
        const receiverSocketId = (frienduser === null || frienduser === void 0 ? void 0 : frienduser.socketId) || "";
        const expoToken = frienduser === null || frienduser === void 0 ? void 0 : frienduser.expoToken;
        if (receiverSocketId) {
            console.log(chalk.bgBlue.white("A receiver socket id", receiverSocketId));
            socket === null || socket === void 0 ? void 0 : socket.to(receiverSocketId).emit("new message", JSON.stringify(message));
            socket === null || socket === void 0 ? void 0 : socket.to(receiverSocketId).emit("contact updated", JSON.stringify(contacts[0]));
        }
        if (Expo.isExpoPushToken(expoToken)) {
            expo.sendPushNotificationsAsync([{
                    to: expoToken,
                    title: `${(_b = req.user) === null || _b === void 0 ? void 0 : _b.fullName}`,
                    body: message.text,
                    channelId: "default",
                    data: { "screen": "chatScreen" }
                }]);
        }
        console.log(chalk.bgBlue.white("✅ message sent to receiver"));
        res.status(200).json({
            success: true,
            message: "message sent successfully",
            body: {
                messageData: message,
                transactionId: transactionId,
                contact: { senderContact, receiverContact }
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
//get messages by senderId or receiverId
export const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const cuurentUser = new mongoose.Types.ObjectId((_c = req.user) === null || _c === void 0 ? void 0 : _c._id);
        console.log(chalk.bgYellowBright.white("⌛ fetching messages..."));
        const messages = yield Message.find({
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
    }
    catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
});
//update all message statuses to read
export const markMessagesAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const cuurentUser = new mongoose.Types.ObjectId((_d = req.user) === null || _d === void 0 ? void 0 : _d._id);
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const socket = req.app.get("app-io");
        const contact = yield Contact.findOne({ userId: cuurentUser, connectedUser: userId });
        const allIds = contact === null || contact === void 0 ? void 0 : contact.unreadMessages;
        if (contact) {
            const allUpdatedMessages = yield Message.updateMany({ _id: { $in: contact.unreadMessages } }, { $set: { status: "read" } });
            yield Contact.findByIdAndUpdate(contact._id, { unreadMessages: [] });
            console.log(chalk.bgBlue.white("✅ messages marked as read"));
            const receiverSocketId = ((_e = (yield User.findById(userId))) === null || _e === void 0 ? void 0 : _e.socketId) || "";
            console.log(chalk.bgBlue.white("A read messages socket id", receiverSocketId, allIds));
            socket === null || socket === void 0 ? void 0 : socket.to(receiverSocketId).emit("markMessagesAsRead", JSON.stringify({ unreadMessages: allIds }));
            socket === null || socket === void 0 ? void 0 : socket.to(receiverSocketId).emit("markMessagesAsReadContact", JSON.stringify({ unreadMessages: allIds, userId: cuurentUser }));
            res.status(200).json({
                unreadMessages: allIds,
                success: true,
                message: "Messages marked as read successfully",
            });
        }
        else {
            console.log(chalk.bgRed.white("Error"));
            res.status(200).json({
                success: false,
                message: "Contact not found",
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
