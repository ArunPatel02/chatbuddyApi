import mongoose, { Schema, Document } from 'mongoose';

interface Contact {
    userId: Schema.Types.ObjectId;
    unreadMessages?: Schema.Types.Array;
    connectedUser: Schema.Types.ObjectId;
    lastMessage: Schema.Types.ObjectId;
}

const contactSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    connectedUser: { type: Schema.Types.ObjectId, ref: 'User' },
    unreadMessages: [{ type: Schema.Types.ObjectId, ref: 'Message', default: [] }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

const Contact = mongoose.model<Contact>('Contact', contactSchema);

export default Contact;