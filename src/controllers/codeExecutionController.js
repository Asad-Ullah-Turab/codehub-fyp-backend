import codeExecutorWSService from '../services/codeExecutorWSService.js';
import sanitizationService from '../services/sanitizationService.js';

class CodeExecutionController {
  async executeCode(req, res) {
    try {
      const { code, language, input } = req.body;

      if (!code || !language) {
        return res.status(400).json({
          success: false,
          message: 'Code and language are required'
        });
      }

      // Sanitize and validate all inputs
      const validation = sanitizationService.validateExecutionRequest({
        code,
        language,
        input: input || ''
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Execute code with sanitized inputs
      const result = await codeExecutorWSService.executeCode(
        validation.sanitized.code,
        validation.sanitized.language,
        validation.sanitized.input
      );

      // Sanitize execution result before sending to client
      const sanitizedResult = sanitizationService.sanitizeExecutionResult(result);

      res.status(200).json({
        success: true,
        data: sanitizedResult
      });

    } catch (error) {
      console.error('Code execution error:', error);
      
      // Sanitize error message before sending
      const safeErrorMsg = sanitizationService.escapeError(error.message);
      
      res.status(500).json({
        success: false,
        message: 'Code execution failed',
        error: safeErrorMsg
      });
    }
  }

  async getLanguages(req, res) {
    try {
      const languages = [
        { id: 'python', name: 'Python', version: '3.11' },
        { id: 'cpp', name: 'C++', version: 'GCC Latest' },
        { id: 'javascript', name: 'JavaScript', version: 'Node.js 18' }
      ];

      res.status(200).json({
        success: true,
        data: languages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new CodeExecutionController();