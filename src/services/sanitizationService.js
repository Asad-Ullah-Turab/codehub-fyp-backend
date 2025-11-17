/**
 * Sanitization Service
 * Handles input validation and output escaping for code execution
 * Prevents injection attacks, XSS, and resource exhaustion
 */

class SanitizationService {
  // Maximum code size (10MB should be reasonable for most use cases)
  MAX_CODE_SIZE = 10 * 1024 * 1024;

  // Maximum input size (5MB for stdin)
  MAX_INPUT_SIZE = 5 * 1024 * 1024;

  // Maximum output size to return (100KB to prevent memory issues)
  MAX_OUTPUT_SIZE = 100 * 1024;

  // Dangerous patterns that could exploit the container
  DANGEROUS_PATTERNS = {
    python: [
      /import\s+os\s*;?/gi,           // OS module access
      /import\s+sys\s*;?/gi,          // System module access
      /from\s+os\s+import/gi,         // Direct OS imports
      /subprocess/gi,                  // Subprocess execution
      /eval\s*\(/gi,                   // Dynamic code evaluation
      /exec\s*\(/gi,                   // Dynamic code execution
      /__import__/gi,                  // Dynamic imports
      /open\s*\(/gi,                   // File operations
      /socket/gi,                      // Network operations
    ],
    cpp: [
      /#include\s*<unistd\.h>/gi,     // Unix system calls
      /#include\s*<sys\/socket\.h>/gi, // Socket operations
      /system\s*\(/gi,                 // System command execution
      /fork\s*\(/gi,                   // Process forking
      /exec/gi,                        // Execution functions
    ],
    javascript: [
      /require\s*\(\s*['"]fs['"]\s*\)/gi,      // File system
      /require\s*\(\s*['"]child_process['"]\s*\)/gi, // Process execution
      /require\s*\(\s*['"]net['"]\s*\)/gi,     // Network
      /require\s*\(\s*['"]http['"]\s*\)/gi,    // HTTP
      /eval\s*\(/gi,                           // Dynamic evaluation
      /Function\s*\(/gi,                       // Dynamic function creation
      /import\s*\(\s*['"]fs['"]\s*\)/gi,       // ES6 file system
    ]
  };

  /**
   * Sanitize code input
   * @param {string} code - Code to sanitize
   * @param {string} language - Programming language
   * @returns {object} { isValid, code: sanitized_code, errors: [] }
   */
  sanitizeCode(code, language) {
    const errors = [];

    // Check code length
    if (!code || typeof code !== 'string') {
      errors.push('Code must be a non-empty string');
      return { isValid: false, code: '', errors };
    }

    if (code.length > this.MAX_CODE_SIZE) {
      errors.push(`Code exceeds maximum size of ${this.MAX_CODE_SIZE / 1024 / 1024}MB`);
      return { isValid: false, code: '', errors };
    }

    // Trim whitespace
    let sanitized = code.trim();

    // Check for dangerous patterns
    const patterns = this.DANGEROUS_PATTERNS[language] || [];
    const foundDangerous = [];

    patterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
        foundDangerous.push(pattern.source);
      }
    });

    if (foundDangerous.length > 0) {
      errors.push(`Dangerous patterns detected: ${foundDangerous.join(', ')}`);
    }

    // Check for null bytes
    if (sanitized.includes('\0')) {
      errors.push('Null bytes are not allowed');
    }

    // Language-specific validation
    const langValidation = this.validateLanguageSpecific(sanitized, language);
    if (!langValidation.isValid) {
      errors.push(...langValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      code: sanitized,
      errors
    };
  }

  /**
   * Language-specific validation
   * @param {string} code - Code to validate
   * @param {string} language - Programming language
   * @returns {object} { isValid, errors: [] }
   */
  validateLanguageSpecific(code, language) {
    const errors = [];

    switch (language) {
      case 'python':
        // Python-specific checks
        if (code.includes('__main__')) {
          // Allow __main__ but warn about direct script execution
          // This is actually OK for learning purposes
        }
        break;

      case 'cpp':
        // C++ specific checks
        // Check for main function
        if (!code.includes('main')) {
          errors.push('C++ code must contain a main() function');
        }
        // Check for proper includes
        if (!code.includes('#include')) {
          errors.push('C++ code must include headers');
        }
        break;

      case 'javascript':
        // JavaScript specific checks
        // Check for console.log usage
        if (!code.includes('console.log') && !code.includes('console.error')) {
          errors.push('JavaScript code should output using console.log() or console.error()');
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize user input (stdin)
   * @param {string} input - User input
   * @returns {object} { isValid, input: sanitized_input, errors: [] }
   */
  sanitizeInput(input) {
    const errors = [];

    if (input === null || input === undefined) {
      return { isValid: true, input: '', errors };
    }

    if (typeof input !== 'string') {
      errors.push('Input must be a string');
      return { isValid: false, input: '', errors };
    }

    if (input.length > this.MAX_INPUT_SIZE) {
      errors.push(`Input exceeds maximum size of ${this.MAX_INPUT_SIZE / 1024 / 1024}MB`);
      return { isValid: false, input: '', errors };
    }

    // Remove potentially problematic control characters
    // Keep standard whitespace (newlines, tabs) but remove other control chars
    const sanitized = input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except tab(\x09) and newline(\x0A)
      .trim();

    return {
      isValid: true,
      input: sanitized,
      errors
    };
  }

  /**
   * Escape output for safe display (prevents XSS)
   * @param {string} output - Code execution output
   * @returns {string} Escaped output safe for HTML display
   */
  escapeOutput(output) {
    if (!output || typeof output !== 'string') {
      return '';
    }

    // Limit output size
    if (output.length > this.MAX_OUTPUT_SIZE) {
      output = output.substring(0, this.MAX_OUTPUT_SIZE) + 
               `\n... (output truncated, exceeded ${this.MAX_OUTPUT_SIZE / 1024}KB limit)`;
    }

    // HTML entity encoding to prevent XSS
    return output
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Escape error messages for safe display
   * @param {string} error - Error message
   * @returns {string} Escaped error message
   */
  escapeError(error) {
    if (!error || typeof error !== 'string') {
      return '';
    }

    // Limit error message size
    if (error.length > 5000) {
      error = error.substring(0, 5000) + '\n... (error message truncated)';
    }

    return this.escapeOutput(error);
  }

  /**
   * Validate all inputs before code execution
   * @param {object} executionRequest - { code, language, input }
   * @returns {object} { isValid, errors: [], sanitized: { code, language, input } }
   */
  validateExecutionRequest(executionRequest) {
    const { code, language, input } = executionRequest;
    const errors = [];

    // Validate language
    const validLanguages = ['python', 'cpp', 'javascript'];
    if (!validLanguages.includes(language)) {
      errors.push(`Invalid language. Supported: ${validLanguages.join(', ')}`);
    }

    // Sanitize code
    const codeResult = this.sanitizeCode(code, language);
    if (!codeResult.isValid) {
      errors.push(...codeResult.errors);
    }

    // Sanitize input
    const inputResult = this.sanitizeInput(input);
    if (!inputResult.isValid) {
      errors.push(...inputResult.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        code: codeResult.code,
        language,
        input: inputResult.input
      }
    };
  }

  /**
   * Sanitize API response for client
   * @param {object} executionResult - { output, error, exitCode, executionTime }
   * @returns {object} Sanitized result safe to send to client
   */
  sanitizeExecutionResult(executionResult) {
    return {
      output: executionResult.output ? this.escapeOutput(executionResult.output) : '',
      error: executionResult.error ? this.escapeError(executionResult.error) : '',
      exitCode: executionResult.exitCode || 0,
      executionTime: executionResult.executionTime || 0,
      memoryUsed: executionResult.memoryUsed || 'N/A',
      warning: executionResult.memoryUsed ? null : 'Memory usage not available'
    };
  }
}

export default new SanitizationService();
