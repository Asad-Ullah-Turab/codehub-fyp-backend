import geminiService from '../services/geminiService.js';
import AIChat from '../models/AIChat.js';

class AIChatController {
  async sendMessage(req, res) {
    try {
      const { message, context, contextId, contextTitle, contentScope } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      // Build context-aware prompt with strict scope - BEGINNER FRIENDLY
      let systemContext;
      if (context === 'course' && contextTitle) {
        systemContext = `You are a friendly AI tutor helping beginners learn about "${contextTitle}" in a programming course.

IMPORTANT - KEEP IT SIMPLE FOR BEGINNERS:
- Use simple, everyday language (avoid jargon)
- Give SHORT, clear answers (2-3 sentences max)
- If you must explain something complex, break it into simple steps
- Use real-world examples when helpful
- ONLY answer questions about "${contextTitle}"
- If asked about unrelated topics, say: "I can only help with questions about ${contextTitle}. Please ask about this specific topic."
${contentScope ? `\nCurrent section content you should reference: ${contentScope}` : ''}`;
      } else if (context === 'tutorial' && contextTitle) {
        systemContext = `You are a friendly AI tutor helping beginners learn about "${contextTitle}" from this tutorial.

IMPORTANT - KEEP IT SIMPLE FOR BEGINNERS:
- Use simple, everyday language (avoid jargon)
- Give SHORT, clear answers (2-3 sentences max)
- If you must explain something complex, break it into simple steps
- Use real-world examples when helpful
- ONLY answer questions about this tutorial topic: "${contextTitle}"
- If asked about other topics, say: "I can only answer questions about this tutorial on ${contextTitle}. Please focus your question on this topic."
${contentScope ? `\nTutorial content you should reference: ${contentScope}` : ''}`;
      } else {
        systemContext = `You are a friendly AI assistant helping beginners with programming. Use simple language and keep answers short and clear.`;
      }

      const prompt = `${systemContext}\n\nUser question: ${message}\n\nProvide a SHORT, beginner-friendly answer (max 2-3 sentences). Use simple words and avoid technical jargon. Remember to stay within the scope defined above.`;

      // Call Gemini API
      const response = await geminiService.callGemini(prompt);
      const aiResponse = geminiService.extractText(response);

      // Save to database (optional)
      try {
        await AIChat.create({
          user: req.user?._id,
          message,
          response: aiResponse,
          context: context || 'general',
          contextTitle: contextTitle || '',
          contextId: contextId || '',
          contentScope: contentScope || ''
        });
      } catch (dbError) {
        console.error('Error saving chat to database:', dbError);
        // Continue even if DB save fails
      }

      res.status(200).json({
        success: true,
        data: {
          response: aiResponse
        }
      });
    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI response',
        error: error.message
      });
    }
  }

  async clearChats(req, res) {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Delete all chats for the current user
      const result = await AIChat.deleteMany({ user: userId });

      res.status(200).json({
        success: true,
        message: 'All chats cleared successfully',
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error clearing chats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear chats',
        error: error.message
      });
    }
  }

  async getChatHistory(req, res) {
    try {
      const userId = req.user?._id;
      const { context, contextId } = req.query;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Build query based on filters
      let query = { user: userId };
      if (context) query.context = context;
      if (contextId) query.contextId = contextId;

      // Fetch chats and sort by creation date
      const chats = await AIChat.find(query)
        .sort({ createdAt: 1 })
        .limit(50); // Limit to last 50 chats per context

      res.status(200).json({
        success: true,
        data: chats
      });
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat history',
        error: error.message
      });
    }
  }
}

export default new AIChatController();
