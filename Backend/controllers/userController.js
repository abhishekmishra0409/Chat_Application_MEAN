const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get all users (with pagination and search)
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Exclude current user from results
        searchQuery._id = { $ne: req.user._id };

        const users = await User.find(searchQuery)
            .select('-password')
            .sort({ username: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await User.countDocuments(searchQuery);

        res.status(200).json({
            status: 'success',
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').lean();

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').lean();

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Update user profile
exports.updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, email, avatar } = req.body;
        const userId = req.params.id;

        // Check if user is updating their own profile
        if (userId !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only update your own profile'
            });
        }

        // Check if username or email already exists (excluding current user)
        const existingUser = await User.findOne({
            $and: [
                { _id: { $ne: userId } },
                { $or: [{ username }, { email }] }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Username or email already exists'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username, email, avatar },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Delete user account
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user is deleting their own account
        if (userId !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only delete your own account'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Delete user's messages
        await Message.deleteMany({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        });

        // Remove user from chat rooms
        await ChatRoom.updateMany(
            { participants: userId },
            { $pull: { participants: userId } }
        );

        // Delete empty chat rooms
        await ChatRoom.deleteMany({ participants: { $size: 0 } });

        // Delete user account
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            status: 'success',
            message: 'User account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Search users
exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!query || query.length < 2) {
            return res.status(400).json({
                status: 'error',
                message: 'Search query must be at least 2 characters long'
            });
        }

        const searchQuery = {
            _id: { $ne: req.user._id },
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        };

        const users = await User.find(searchQuery)
            .select('-password')
            .sort({ username: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await User.countDocuments(searchQuery);

        res.status(200).json({
            status: 'success',
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user is accessing their own stats
        if (userId !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only view your own statistics'
            });
        }

        const [
            totalMessages,
            totalChatRooms,
            unreadMessages,
            lastActive
        ] = await Promise.all([
            // Total messages sent
            Message.countDocuments({ sender: userId }),

            // Total chat rooms participated
            ChatRoom.countDocuments({ participants: userId }),

            // Unread messages
            Message.countDocuments({
                receiver: userId,
                isRead: false
            }),

            // Last active time (from user document)
            User.findById(userId).select('lastSeen')
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                statistics: {
                    totalMessages,
                    totalChatRooms,
                    unreadMessages,
                    lastActive: lastActive?.lastSeen || new Date()
                }
            }
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Update user online status
exports.updateOnlineStatus = async (req, res) => {
    try {
        const { isOnline } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                isOnline,
                lastSeen: isOnline ? new Date() : req.user.lastSeen
            },
            { new: true }
        ).select('-password');

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('Error updating online status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Get user's chat partners
exports.getChatPartners = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Find all unique users that the current user has chatted with
        const chatPartners = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    'user.password': 0,
                    'user.__v': 0
                }
            },
            {
                $replaceRoot: { newRoot: '$user' }
            },
            {
                $sort: { username: 1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        const total = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$receiver',
                            '$sender'
                        ]
                    }
                }
            },
            {
                $count: 'total'
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                users: chatPartners,
                pagination: {
                    page,
                    limit,
                    total: total[0]?.total || 0,
                    pages: Math.ceil((total[0]?.total || 0) / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting chat partners:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Upload user avatar
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'chat-app/avatars',
            width: 500,
            height: 500,
            crop: 'fill',
            quality: 'auto',
            format: 'webp'
        });

        // Delete the temporary file
        fs.unlinkSync(req.file.path);

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: result.secure_url },
            { new: true }
        ).select('-password');

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);

        // Clean up temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Change user password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Check current password
        const isCurrentPasswordValid = await user.correctPassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};