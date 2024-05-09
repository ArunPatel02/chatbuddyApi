import mongoose, { Schema } from 'mongoose';
const contactSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    connectedUser: { type: Schema.Types.ObjectId, ref: 'User' },
    unreadMessages: [{ type: Schema.Types.ObjectId, ref: 'Message', default: [] }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });
const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
