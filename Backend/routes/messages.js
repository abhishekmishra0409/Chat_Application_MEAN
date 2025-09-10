const express = require('express');
const messageController = require('../controllers/messageController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/', messageController.sendMessage);
router.get('/:chatRoomId', messageController.getMessages);

module.exports = router;