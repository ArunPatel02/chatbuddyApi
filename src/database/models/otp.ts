import mongoose from "mongoose";

interface OtpInterface {
    otp: number;
    userId: mongoose.Schema.Types.ObjectId;
    expireIn?: Date;
}

const otpSchema = new mongoose.Schema<OtpInterface>({
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
}, { timestamps: true, expireAfterSeconds : 600 })

const Otp = mongoose.model<OtpInterface, mongoose.Model<OtpInterface>>("otp", otpSchema)

export default Otp