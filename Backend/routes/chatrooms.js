const express = require('express');
const chatroomController = require('../controllers/chatroomController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/', chatroomController.createChatRoom);
router.get('/', chatroomController.getUserChatRooms);
router.get('/:chatRoomId', chatroomController.getChatRoomById);
router.patch('/:chatRoomId/participants', chatroomController.addParticipants);
router.delete('/:chatRoomId/participants/:participantId', chatroomController.removeParticipant);
router.delete('/:chatRoomId', chatroomController.deleteChatRoom);

module.exports = router;