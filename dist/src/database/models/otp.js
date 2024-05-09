import mongoose from "mongoose";
const otpSchema = new mongoose.Schema({
    otp: {
        type: Number,
        length: 6,
        require: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    expireIn: {
        type: Date,
    }
}, { timestamps: true, expireAfterSeconds: 600 });
const Otp = mongoose.model("otp", otpSchema);
export default Otp;
