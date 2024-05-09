var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import chalk from "chalk";
import { FriendRequest, User } from "../database/models";
import mongoose from "mongoose";
import { Expo } from "expo-server-sdk";
// Create export for creating a friend request
export const createFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const friendRequestData = req.body;
        const socket = req.app.get("app-io");
        const expo = req.app.get("app-expo");
        console.log(chalk.bgYellowBright.white("⌛ Sending friend request..."));
        const createdFriendRequest = yield (yield FriendRequest.create({ from: new mongoose.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a._id), to: friendRequestData.friendId })).populate('from', 'fullName email avatar');
        console.log(chalk.bgBlue.white("✅ Friend request sent successfully"));
        const frienduser = yield User.findById(friendRequestData.friendId);
        const receiverSocketId = (frienduser === null || frienduser === void 0 ? void 0 : frienduser.socketId) || "";
        const expoToken = frienduser === null || frienduser === void 0 ? void 0 : frienduser.expoToken;
        console.log(chalk.bgBlue.white("✅ a friend request sent to socket", receiverSocketId, expoToken));
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("receiveFriendRequest", JSON.stringify(createdFriendRequest));
        }
        if (Expo.isExpoPushToken(expoToken)) {
            try {
                expo.sendPushNotificationsAsync([{
                        to: expoToken,
                        title: `${(_b = req.user) === null || _b === void 0 ? void 0 : _b.fullName} send you a friend request.`,
                        channelId: "default",
                        data: { "screen": "friendrequest" }
                    }]);
            }
            catch (error) {
                console.log("notification error");
            }
        }
        res.status(200).json({
            success: true,
            message: "Friend request created successfully",
            body: {
                friendRequestData: createdFriendRequest
            },
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
// Accept a friend request
export const acceptFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const friendRequestId = req.body.friendRequestId; // Assuming friendRequestId is passed in the request params
        const socket = req.app.get("app-io");
        const expo = req.app.get("app-expo");
        console.log(chalk.bgYellowBright.white("⌛ Accepting friend request..."));
        const updatedFriendRequest = yield FriendRequest.findByIdAndUpdate(friendRequestId, { status: "accepted" }, { new: true });
        const updatedFriendRequestpopulate = yield (updatedFriendRequest === null || updatedFriendRequest === void 0 ? void 0 : updatedFriendRequest.populate('from', 'fullName email avatar'));
        console.log(chalk.bgBlue.white("✅ Friend request accepted", updatedFriendRequestpopulate));
        const frienduser = yield User.findById(updatedFriendRequest === null || updatedFriendRequest === void 0 ? void 0 : updatedFriendRequest.from);
        const receiverSocketId = (frienduser === null || frienduser === void 0 ? void 0 : frienduser.socketId) || "";
        const expoToken = frienduser === null || frienduser === void 0 ? void 0 : frienduser.expoToken;
        console.log(chalk.bgBlue.white("✅ a friendrequest accept to socket", receiverSocketId, expoToken));
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("acceptFriendRequest", JSON.stringify(updatedFriendRequestpopulate));
        }
        if (Expo.isExpoPushToken(expoToken)) {
            expo.sendPushNotificationsAsync([{
                    to: expoToken,
                    title: `${(_c = req.user) === null || _c === void 0 ? void 0 : _c.fullName} accepted your friend request.`,
                    channelId: "default",
                    data: { "screen": "friendrequest" }
                }]);
        }
        res.status(200).json({
            success: true,
            message: "Friend request accepted",
            body: {
                friendRequestData: updatedFriendRequest
            },
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
// Reject a friend request
export const rejectFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const friendId = req.params.friendId; // Assuming friendId is passed in the request params
        console.log(chalk.bgYellowBright.white("⌛ Rejecting friend request..."));
        const updatedFriendRequest = yield FriendRequest.findByIdAndDelete(friendId);
        console.log(chalk.bgBlue.white("✅ Friend request rejected"));
        res.status(200).json({
            success: true,
            message: "Friend request rejected",
            body: {
                friendRequestData: updatedFriendRequest
            },
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
// Get list of all users except the current user to send friend requests
export const getUsersToSendFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const currentUser = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        console.log(chalk.bgYellowBright.white("🔍 Getting list of users to send friend requests...", currentUser));
        const users = yield User.aggregate([
            {
                $match: {
                    _id: { $ne: new mongoose.Types.ObjectId(currentUser) }
                }
            },
            {
                $lookup: {
                    from: "friendrequests",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$from", new mongoose.Types.ObjectId(currentUser)] },
                                        { $eq: ["$to", "$$userId"] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "sentFriendRequest"
                }
            },
            {
                $lookup: {
                    from: "friendrequests",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$to", new mongoose.Types.ObjectId(currentUser)] },
                                        { $eq: ["$from", "$$userId"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "receiveFriendRequest"
                }
            },
            {
                $match: {
                    $or: [
                        { "sentFriendRequest.0": { $exists: false } },
                        { "sentFriendRequest.0.status": { $ne: "accepted" } }
                    ]
                }
            },
            {
                $match: {
                    $or: [
                        { "receiveFriendRequest.0": { $exists: false } },
                        { "receiveFriendRequest.0.status": { $ne: "accepted" } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    email: 1,
                    avatar: 1,
                    sentFriendRequest: { $cond: { if: { $gt: [{ $size: "$sentFriendRequest" }, 0] }, then: true, else: false } },
                    receiveFriendRequest: { $cond: { if: { $gt: [{ $size: "$receiveFriendRequest" }, 0] }, then: true, else: false } }
                }
            }
        ]);
        console.log(chalk.bgBlue.white("✅ User found"));
        res.status(200).json({
            success: true,
            message: "List of users to send friend requests",
            body: {
                users: users
            },
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
// Get friend requests for a user with lookup to users
export const getFriendRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        console.log(chalk.bgYellowBright.white("🔍 Getting friend requests for user...", userId));
        const friendRequests = yield FriendRequest.find({ to: userId, status: "pending" }).populate('from', 'fullName email avatar');
        console.log(chalk.bgBlue.white("✅ Friend requests found"));
        res.status(200).json({
            success: true,
            message: "Friend requests retrieved successfully",
            body: {
                friendRequests: friendRequests
            },
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
// Get list of friends for a user
export const getFriendList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
        console.log(chalk.bgYellowBright.white("🔍 Getting list of friends for user...", userId));
        const friends = yield FriendRequest.find({ $or: [{ from: userId, status: "accepted" }, { to: userId, status: "accepted" }] }).populate('from to', 'fullName email avatar');
        console.log(chalk.bgBlue.white("✅ Friends list retrieved successfully"));
        const friendList = friends.map((list) => {
            const { from, to } = list, data = __rest(list, ["from", "to"]);
            if (String(from._id) !== String(userId)) {
                return Object.assign(Object.assign({}, data), { user: from });
            }
            else {
                return Object.assign(Object.assign({}, data), { user: to });
            }
        });
        res.status(200).json({
            success: true,
            message: "List of friends retrieved successfully",
            body: {
                friends: friendList
            },
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
