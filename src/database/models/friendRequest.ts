// File: src/database/models/friendRequest.ts

import mongoose from "mongoose";

interface FriendRequestInterface {
    from: mongoose.Schema.Types.ObjectId;
    to: mongoose.Schema.Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
}

const friendRequestSchema = new mongoose.Schema<FriendRequestInterface>({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

const FriendRequest = mongoose.model<FriendRequestInterface>("friendrequest", friendRequestSchema);

export default FriendRequest;