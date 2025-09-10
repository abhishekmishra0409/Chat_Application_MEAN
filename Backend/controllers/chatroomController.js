const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');
const Message = require('../models/Message');

exports.createChatRoom = async (req, res) => {
    try {
        const { name, description, participants, isGroup = false, avatar } = req.body;
        const creatorId = req.user._id;

        // Validate participants
        if (!participants || participants.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'At least one participant is required'
            });
        }

        // Include creator in participants if not already included
        const allParticipants = [...new Set([creatorId, ...participants])];

        // For private chats, check if room already exists
        if (!isGroup && allParticipants.length === 2) {
            const existingRoom = await ChatRoom.findOne({
                isGroup: false,
                participants: { $all: allParticipants, $size: 2 }
            });

            if (existingRoom) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Private chat room already exists',
                    data: { chatRoom: existingRoom }
                });
            }
        }

        // For group chats, name is required
        if (isGroup && !name) {
            return res.status(400).json({
                status: 'error',
                message: 'Group name is required'
            });
        }

        const chatRoomData = {
            name: isGroup ? name : 'Private Chat',
            description: isGroup ? description : '',
            isGroup,
            participants: allParticipants,
            admin: isGroup ? creatorId : null,
            avatar
        };

        const chatRoom = await ChatRoom.create(chatRoomData);
        await chatRoom.populate('participants', 'username avatar email isOnline');
        await chatRoom.populate('admin', 'username avatar');

        res.status(201).json({
            status: 'success',
            data: {
                chatRoom
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getUserChatRooms = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const chatRooms = await ChatRoom.find({ participants: userId })
            .populate('participants', 'username avatar email isOnline lastSeen')
            .populate('admin', 'username avatar')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // For private chats, set the room name to the other participant's username
        const enhancedChatRooms = chatRooms.map(room => {
            if (!room.isGroup && room.participants) {
                const otherParticipant = room.participants.find(
                    participant => participant._id.toString() !== userId.toString()
                );
                if (otherParticipant) {
                    room.name = otherParticipant.username;
                    room.avatar = otherParticipant.avatar;
                }
            }
            return room;
        });

        res.status(200).json({
            status: 'success',
            results: enhancedChatRooms.length,
            data: {
                chatRooms: enhancedChatRooms
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getChatRoomById = async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const userId = req.user._id;

        const chatRoom = await ChatRoom.findOne({
            _id: chatRoomId,
            participants: userId
        })
            .populate('participants', 'username avatar email isOnline lastSeen')
            .populate('admin', 'username avatar')
            .populate('lastMessage');

        if (!chatRoom) {
            return res.status(404).json({
                status: 'error',
                message: 'Chat room not found or access denied'
            });
        }

        // For private chats, set the room name to the other participant's username
        if (!chatRoom.isGroup && chatRoom.participants) {
            const otherParticipant = chatRoom.participants.find(
                participant => participant._id.toString() !== userId.toString()
            );
            if (otherParticipant) {
                chatRoom.name = otherParticipant.username;
                chatRoom.avatar = otherParticipant.avatar;
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                chatRoom
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.addParticipants = async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const { participantIds } = req.body;
        const userId = req.user._id;

        const chatRoom = await ChatRoom.findOne({
            _id: chatRoomId,
            participants: userId
        });

        if (!chatRoom) {
            return res.status(404).json({
                status: 'error',
                message: 'Chat room not found or access denied'
            });
        }

        if (!chatRoom.isGroup) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot add participants to private chat'
            });
        }

        // Check if user is admin
        if (chatRoom.admin.toString() !== userId.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'Only admin can add participants'
            });
        }

        // Add new participants (avoid duplicates)
        const newParticipants = participantIds.filter(
            id => !chatRoom.participants.includes(id)
        );

        if (newParticipants.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No new participants to add'
            });
        }

        chatRoom.participants = [...chatRoom.participants, ...newParticipants];
        await chatRoom.save();
        await chatRoom.populate('participants', 'username avatar email');

        res.status(200).json({
            status: 'success',
            data: {
                chatRoom
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.removeParticipant = async (req, res) => {
    try {
        const { chatRoomId, participantId } = req.params;
        const userId = req.user._id;

        const chatRoom = await ChatRoom.findOne({
            _id: chatRoomId,
            participants: userId
        });

        if (!chatRoom) {
            return res.status(404).json({
                status: 'error',
                message: 'Chat room not found or access denied'
            });
        }

        if (!chatRoom.isGroup) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot remove participants from private chat'
            });
        }

        // Check if user is admin or removing themselves
        if (chatRoom.admin.toString() !== userId.toString() && participantId !== userId.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'Only admin can remove other participants'
            });
        }

        // Cannot remove admin
        if (participantId === chatRoom.admin.toString()) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot remove admin from group'
            });
        }

        chatRoom.participants = chatRoom.participants.filter(
            id => id.toString() !== participantId
        );

        await chatRoom.save();
        await chatRoom.populate('participants', 'username avatar email');

        res.status(200).json({
            status: 'success',
            data: {
                chatRoom
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.deleteChatRoom = async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const userId = req.user._id;

        const chatRoom = await ChatRoom.findOne({
            _id: chatRoomId,
            participants: userId
        });

        if (!chatRoom) {
            return res.status(404).json({
                status: 'error',
                message: 'Chat room not found or access denied'
            });
        }

        // Only admin can delete group chats
        if (chatRoom.isGroup && chatRoom.admin.toString() !== userId.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'Only admin can delete group chat'
            });
        }

        await ChatRoom.findByIdAndDelete(chatRoomId);

        // Also delete all messages in this chat room
        await Message.deleteMany({ chatRoom: chatRoomId });

        res.status(200).json({
            status: 'success',
            message: 'Chat room deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};