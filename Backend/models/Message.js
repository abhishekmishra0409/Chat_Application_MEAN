const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return !this.chatRoom;
        }
    },
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: function() {
            return !this.receiver;
        }
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'video'],
        default: 'text'
    },
    fileUrl: {
        type: String,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ chatRoom: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);