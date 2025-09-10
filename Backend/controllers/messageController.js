const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
    try {
        const { content, receiverId, chatRoomId, messageType = 'text', fileUrl = null } = req.body;
        const senderId = req.user._id;

        if (!content && !fileUrl) {
            return res.status(400).json({
                status: 'error',
                message: 'Message content or file is required'
            });
        }

        let messageData = {
            content,
            sender: senderId,
            messageType,
            fileUrl
        };

        if (receiverId) {
            messageData.receiver = receiverId;

            // Find or create private chat room
            let chatRoom = await ChatRoom.findOne({
                isGroup: false,
                participants: { $all: [senderId, receiverId], $size: 2 }
            });

            if (!chatRoom) {
                chatRoom = await ChatRoom.create({
                    name: 'Private Chat',
                    isGroup: false,
                    participants: [senderId, receiverId]
                });
            }

            messageData.chatRoom = chatRoom._id;
        } else if (chatRoomId) {
            messageData.chatRoom = chatRoomId;

            // Verify user is participant of the group
            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom.participants.includes(senderId)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You are not a participant of this chat room'
                });
            }
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Either receiverId or chatRoomId is required'
            });
        }

        const message = await Message.create(messageData);

        // Populate sender info
        await message.populate('sender', 'username avatar');

        // Update last message in chat room
        await ChatRoom.findByIdAndUpdate(message.chatRoom, {
            lastMessage: message._id
        });

        res.status(201).json({
            status: 'success',
            data: {
                message
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Verify user is participant of the chat room
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (!chatRoom.participants.includes(req.user._id)) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }

        const messages = await Message.find({ chatRoom: chatRoomId })
            .populate('sender', 'username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Mark messages as read
        await Message.updateMany(
            {
                chatRoom: chatRoomId,
                sender: { $ne: req.user._id },
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            status: 'success',
            results: messages.length,
            data: {
                messages: messages.reverse() // Return in chronological order
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};