import express from 'express';
import codeChatController from '../controllers/codeChatController.js';
import { auth } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Send message to code editor AI chatbot
router.post('/message', auth, aiLimiter, codeChatController.sendMessage);

// Clear all code chats for the user
router.delete('/clear', auth, codeChatController.clearChats);

// Get code chat history
router.get('/history', auth, codeChatController.getChatHistory);

export default router;