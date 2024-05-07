// Import necessary modules and types
import { Request, Response } from "express";
import chalk from "chalk";
import { SecureRequest } from "../middleware";
import { FriendRequest, User } from "../database/models";
import mongoose from "mongoose";
import { Socket } from "socket.io";
import { Expo } from "expo-server-sdk";

// Create export for creating a friend request
export const createFriendRequest = async (req: SecureRequest, res: Response) => {
    try {
        const friendRequestData = req.body;
        const socket: Socket = req.app.get("app-io")
        const expo: Expo = req.app.get("app-expo")
        console.log(chalk.bgYellowBright.white("⌛ Sending friend request..."));
        const createdFriendRequest = await (await FriendRequest.create({ from: new mongoose.Types.ObjectId(req.user?._id as string), to: friendRequestData.friendId })).populate('from', 'fullName email avatar')
        console.log(chalk.bgBlue.white("✅ Friend request sent successfully"));

        const frienduser = await User.findById(friendRequestData.friendId)
        const receiverSocketId = frienduser?.socketId || ""
        const expoToken = frienduser?.expoToken
        console.log(chalk.bgBlue.white("✅ a friend request sent to socket", receiverSocketId, expoToken));

        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("receiveFriendRequest", JSON.stringify(createdFriendRequest))
        }
        if (Expo.isExpoPushToken(expoToken)) {
            try {
                expo.sendPushNotificationsAsync([{
                    to: expoToken,
                    title: `${req.user?.fullName} send you a friend request.`,
                    channelId: "default",
                    data: { "screen": "friendrequest" }
                }])
            } catch (error) {
                console.log("notification error")
            }
        }
        res.status(200).json({
            success: true,
            message: "Friend request created successfully",
            body: {
                friendRequestData: createdFriendRequest
            },
        });
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

// Accept a friend request
export const acceptFriendRequest = async (req: SecureRequest, res: Response) => {
    try {
        const friendRequestId = req.body.friendRequestId; // Assuming friendRequestId is passed in the request params
        const socket: Socket = req.app.get("app-io")
        const expo: Expo = req.app.get("app-expo")
        console.log(chalk.bgYellowBright.white("⌛ Accepting friend request..."));
        const updatedFriendRequest = await FriendRequest.findByIdAndUpdate(friendRequestId, { status: "accepted" }, { new: true })
        const updatedFriendRequestpopulate = await updatedFriendRequest?.populate('from', 'fullName email avatar')
        console.log(chalk.bgBlue.white("✅ Friend request accepted", updatedFriendRequestpopulate));

        const frienduser = await User.findById(updatedFriendRequest?.from)
        const receiverSocketId = frienduser?.socketId || ""
        const expoToken = frienduser?.expoToken
        console.log(chalk.bgBlue.white("✅ a friendrequest accept to socket", receiverSocketId, expoToken));

        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("acceptFriendRequest", JSON.stringify(updatedFriendRequestpopulate))
        }

        if (Expo.isExpoPushToken(expoToken)) {
            expo.sendPushNotificationsAsync([{
                to: expoToken,
                title: `${req.user?.fullName} accepted your friend request.`,
                channelId: "default",
                data: { "screen": "friendrequest" }
            }])
        }

        res.status(200).json({
            success: true,
            message: "Friend request accepted",
            body: {
                friendRequestData: updatedFriendRequest
            },
        });
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

// Reject a friend request
export const rejectFriendRequest = async (req: SecureRequest, res: Response) => {
    try {
        const friendId = req.params.friendId; // Assuming friendId is passed in the request params
        console.log(chalk.bgYellowBright.white("⌛ Rejecting friend request..."));
        const updatedFriendRequest = await FriendRequest.findByIdAndDelete(friendId);
        console.log(chalk.bgBlue.white("✅ Friend request rejected"));
        res.status(200).json({
            success: true,
            message: "Friend request rejected",
            body: {
                friendRequestData: updatedFriendRequest
            },
        });
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

// Get list of all users except the current user to send friend requests
export const getUsersToSendFriendRequest = async (req: SecureRequest, res: Response) => {
    try {
        const currentUser = req.user?._id;
        console.log(chalk.bgYellowBright.white("🔍 Getting list of users to send friend requests...", currentUser));
        const users = await User.aggregate([
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
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

// Get friend requests for a user with lookup to users
export const getFriendRequests = async (req: SecureRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        console.log(chalk.bgYellowBright.white("🔍 Getting friend requests for user...", userId));
        const friendRequests = await FriendRequest.find({ to: userId, status: "pending" }).populate('from', 'fullName email avatar');
        console.log(chalk.bgBlue.white("✅ Friend requests found"));
        res.status(200).json({
            success: true,
            message: "Friend requests retrieved successfully",
            body: {
                friendRequests: friendRequests
            },
        });
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}



// Get list of friends for a user
export const getFriendList = async (req: SecureRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        console.log(chalk.bgYellowBright.white("🔍 Getting list of friends for user...", userId));
        const friends = await FriendRequest.find({ $or: [{ from: userId, status: "accepted" }, { to: userId, status: "accepted" }] }).populate('from to', 'fullName email avatar');
        console.log(chalk.bgBlue.white("✅ Friends list retrieved successfully"));
        const friendList = friends.map((list: any) => {
            const { from, to, ...data } = list;
            if (String(from._id) !== String(userId)) {
                return { ...data, user: from }
            } else {
                return { ...data, user: to }
            }
        })
        res.status(200).json({
            success: true,
            message: "List of friends retrieved successfully",
            body: {
                friends: friendList
            },
        });
    } catch (error) {
        console.log(chalk.bgRed.white("Error", error));
        res.status(400).json({
            success: false,
            message: "Something went wrong",
        });
    }
}