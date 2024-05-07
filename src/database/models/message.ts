import mongoose from "mongoose";

// Define an interface for the message schema
interface IMessage {
    text: string;
    messageType: "text" | "image" | "video" | "doc";
    status?: "sent" | "delivered" | "read",
    senderId: mongoose.Schema.Types.ObjectId;
    receiverId: mongoose.Schema.Types.ObjectId;
    repliedTo?: mongoose.Schema.Types.ObjectId;
    isReplied: boolean;
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const messageSchema = new mongoose.Schema<IMessage>({
    text: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ["text", "image", "video", "doc"],
        default: "text",
        required: true
    },
    senderId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    receiverId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    repliedTo: {
        type: mongoose.Types.ObjectId,
        ref: "message"
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
        required: true
    },
    isReplied: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Message = mongoose.model<IMessage>("message", messageSchema);

export default Message;