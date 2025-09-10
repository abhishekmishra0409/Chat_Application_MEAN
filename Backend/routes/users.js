const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const upload = require('../middleware/upload');

// Apply auth protection to all routes
router.use(authController.protect);

// GET /api/users - Get all users
router.get('/', userController.getUsers);

// GET /api/users/search - Search users
router.get('/search', userController.searchUsers);

// GET /api/users/me - Get current user profile
router.get('/me', userController.getCurrentUser);

// GET /api/users/chat-partners - Get user's chat partners
router.get('/chat-partners', userController.getChatPartners);

// GET /api/users/stats - Get user statistics
router.get('/stats', userController.getUserStats);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// PUT /api/users/:id - Update user profile
router.put('/:id', [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('avatar')
        .optional()
        .isURL()
        .withMessage('Avatar must be a valid URL')
], userController.updateUser);

// PATCH /api/users/online-status - Update online status
router.patch('/online-status', userController.updateOnlineStatus);

// POST /api/users/upload-avatar - Upload user avatar
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);

// POST /api/users/change-password - Change password
router.post('/change-password', [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
], userController.changePassword);

// DELETE /api/users/:id - Delete user account
router.delete('/:id', userController.deleteUser);

module.exports = router;