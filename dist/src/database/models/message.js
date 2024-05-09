import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
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
const Message = mongoose.model("message", messageSchema);
export default Message;
