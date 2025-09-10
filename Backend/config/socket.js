// socketServer.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

module.exports = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: ["http://localhost:4200", "http://localhost:3000", "http://localhost:8080"],
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Middleware for auth
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth && socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication error'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('+password'); // select if needed

            if (!user) return next(new Error('User not found'));

            socket.userId = user._id;
            socket.username = user.username;
            next();
        } catch (error) {
            console.error('Socket auth error:', error);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User ${socket.username} connected (${socket.id})`);

        // Update user online status
        try {
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: true,
                socketId: socket.id,
                lastSeen: new Date()
            });
        } catch (err) {
            console.error('Error updating user online status:', err);
        }

        // Join user personal room
        socket.join(socket.userId.toString());

        // Load chat rooms and join them
        let chatRooms = [];
        try {
            chatRooms = await ChatRoom.find({ participants: socket.userId });
            chatRooms.forEach(room => socket.join(room._id.toString()));
        } catch (err) {
            console.error('Error loading chat rooms for user:', err);
        }

        // send_message handler
        socket.on('send_message', async (data) => {
            try {
                const { content, receiverId, chatRoomId, messageType, fileUrl } = data;

                if (!content && messageType === 'text') {
                    socket.emit('error', { message: 'Message content required' });
                    return;
                }

                let messageData = {
                    content,
                    sender: socket.userId,
                    messageType: messageType || 'text',
                    fileUrl: fileUrl || null
                };

                // If private message to a receiverId, find or create private chat room
                if (receiverId) {
                    messageData.receiver = receiverId;

                    let chatRoom = await ChatRoom.findOne({
                        isGroup: false,
                        participants: { $all: [socket.userId, receiverId] }
                    });

                    // Ensure the found room is exactly a 2-participant private room
                    if (chatRoom && Array.isArray(chatRoom.participants) && chatRoom.participants.length === 2) {
                        // ok
                    } else {
                        // create new private room
                        chatRoom = await ChatRoom.create({
                            name: 'Private Chat',
                            isGroup: false,
                            participants: [socket.userId, receiverId]
                        });
                    }

                    messageData.chatRoom = chatRoom._id;
                } else if (chatRoomId) {
                    messageData.chatRoom = chatRoomId;
                } else {
                    socket.emit('error', { message: 'Either receiverId or chatRoomId is required' });
                    return;
                }

                const message = await Message.create(messageData);
                await message.populate('sender', 'username avatar');

                // Update last message on ChatRoom
                await ChatRoom.findByIdAndUpdate(message.chatRoom, { lastMessage: message._id });

                // Emit to all members of the chat room
                io.to(message.chatRoom.toString()).emit('receive_message', message);

                // Emit confirmation to sender
                socket.emit('message_sent', message);
            } catch (error) {
                console.error('send_message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicators
        socket.on('typing_start', (data) => {
            if (data && data.chatRoomId) {
                socket.to(data.chatRoomId).emit('user_typing', {
                    userId: socket.userId,
                    username: socket.username
                });
            }
        });

        socket.on('typing_stop', (data) => {
            if (data && data.chatRoomId) {
                socket.to(data.chatRoomId).emit('user_stop_typing', {
                    userId: socket.userId
                });
            }
        });

        // Create chat room (group or private creation flow)
        socket.on('create_chat_room', async (data) => {
            try {
                const { name, description, participants = [], isGroup = false, avatar } = data;

                // Ensure participants is array and include the creator
                const allParticipants = Array.from(new Set([socket.userId.toString(), ...participants.map(p => p.toString())]));

                // For private chats with two participants, check if already exists
                if (!isGroup && allParticipants.length === 2) {
                    const existingRoom = await ChatRoom.findOne({
                        isGroup: false,
                        participants: { $all: allParticipants }
                    });

                    if (existingRoom && Array.isArray(existingRoom.participants) && existingRoom.participants.length === 2) {
                        socket.emit('chat_room_created', { chatRoom: existingRoom });
                        return;
                    }
                }

                // Create chat room
                const chatRoom = await ChatRoom.create({
                    name: isGroup ? name : 'Private Chat',
                    description: isGroup ? description : '',
                    isGroup,
                    participants: allParticipants,
                    admin: isGroup ? socket.userId : null,
                    avatar
                });

                // Populate participant and admin fields for response
                await chatRoom.populate('participants', 'username avatar email isOnline');
                if (chatRoom.admin) await chatRoom.populate('admin', 'username avatar');

                // Join connected participants' sockets to the new room
                for (const clientSocket of io.sockets.sockets.values()) {
                    try {
                        if (clientSocket.userId && allParticipants.includes(clientSocket.userId.toString())) {
                            clientSocket.join(chatRoom._id.toString());
                        }
                    } catch (err) {
                        // non-fatal
                    }
                }

                socket.emit('chat_room_created', { chatRoom });

                // Notify all participants about the new room (except creator via direct socket emit)
                for (const participantId of allParticipants) {
                    if (participantId.toString() !== socket.userId.toString()) {
                        io.to(participantId.toString()).emit('new_chat_room', { chatRoom });
                    }
                }
            } catch (error) {
                console.error('create_chat_room error:', error);
                socket.emit('error', { message: 'Failed to create chat room' });
            }
        });

        // Join chat room
        socket.on('join_chat_room', (chatRoomId) => {
            try {
                socket.join(chatRoomId);
                socket.to(chatRoomId).emit('user_joined', {
                    userId: socket.userId,
                    username: socket.username
                });
            } catch (err) {
                console.error('join_chat_room error:', err);
            }
        });

        // Leave chat room
        socket.on('leave_chat_room', (chatRoomId) => {
            try {
                socket.leave(chatRoomId);
                socket.to(chatRoomId).emit('user_left', {
                    userId: socket.userId,
                    username: socket.username
                });
            } catch (err) {
                console.error('leave_chat_room error:', err);
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`User ${socket.username} disconnected (${socket.id})`);
            try {
                await User.findByIdAndUpdate(socket.userId, {
                    isOnline: false,
                    socketId: null,
                    lastSeen: new Date()
                });
            } catch (err) {
                console.error('Error updating user status on disconnect:', err);
            }

            // Notify all chat rooms that user went offline
            try {
                // chatRooms was loaded at connection; best effort notify them
                chatRooms.forEach(room => {
                    socket.to(room._id.toString()).emit('user_offline', {
                        userId: socket.userId,
                        lastSeen: new Date()
                    });
                });
            } catch (err) {
                console.error('Error notifying chat rooms on disconnect:', err);
            }
        });

    }); // end io.on('connection')

    return io;
};
