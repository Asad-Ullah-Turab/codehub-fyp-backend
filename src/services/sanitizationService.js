const MAX_CODE_SIZE = 50000;
const MAX_INPUT_SIZE = 10000;
const MAX_OUTPUT_SIZE = 100000;
const MAX_ERROR_SIZE = 5000;

const VALID_LANGUAGES = ['python', 'cpp', 'javascript', 'sql', 'rust', 'haskell'];

const DANGEROUS_PATTERNS = {
  python: [
    /import\s+os\b/,
    /import\s+sys\b/,
    /import\s+subprocess/,
    /__import__/,
    /\beval\s*\(/,
    /\bexec\s*\(/,
    /\bopen\s*\(/,
  ],
  cpp: [
    /\bsystem\s*\(/,
    /\bpopen\s*\(/,
    /\bfork\s*\(/,
    /\bexecl\s*\(/,
    /\bexecv\s*\(/,
  ],
  javascript: [
    /require\s*\(\s*["']fs["']/,
    /require\s*\(\s*["']child_process["']/,
    /\bprocess\./,
    /\.readFileSync/,
    /\.writeFileSync/,
  ],
};

const escapeHtml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const sanitizeCode = (code, language) => {
  if (!code || typeof code !== 'string') {
    return { isValid: false, errors: ['Code must be a non-empty string'], code: '' };
  }

  const trimmed = code.trim();

  if (!trimmed) {
    return { isValid: false, errors: ['Code must be a non-empty string'], code: '' };
  }

  const errors = [];

  if (trimmed.length > MAX_CODE_SIZE) {
    errors.push(`Code exceeds maximum size of ${MAX_CODE_SIZE} characters`);
  }

  if (trimmed.includes('\0')) {
    errors.push('Null bytes detected in code');
  }

  const patterns = DANGEROUS_PATTERNS[language] || [];
  if (patterns.some((p) => p.test(trimmed))) {
    errors.push('Dangerous patterns detected in code');
  }

  return { isValid: errors.length === 0, errors, code: trimmed };
};

const sanitizeInput = (input) => {
  if (input === null || input === undefined) {
    return { isValid: true, errors: [], input: '' };
  }

  if (typeof input !== 'string') {
    return { isValid: false, errors: ['Input must be a string'], input: '' };
  }

  const errors = [];

  if (input.length > MAX_INPUT_SIZE) {
    errors.push(`Input exceeds maximum size of ${MAX_INPUT_SIZE} characters`);
  }

  // Remove control characters except \t, \n, \r
  const sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return { isValid: errors.length === 0, errors, input: sanitized };
};

const escapeOutput = (output) => {
  if (!output) return '';

  let result = typeof output === 'string' ? output : String(output);

  if (result.length > MAX_OUTPUT_SIZE) {
    result = result.slice(0, MAX_OUTPUT_SIZE) + '... [truncated]';
  }

  return escapeHtml(result);
};

const escapeError = (error) => {
  if (!error) return '';

  let result = typeof error === 'string' ? error : String(error);

  if (result.length > MAX_ERROR_SIZE) {
    result = result.slice(0, MAX_ERROR_SIZE) + '... [truncated]';
  }

  return escapeHtml(result);
};

const validateExecutionRequest = (request) => {
  const { code, language, input } = request || {};
  const errors = [];
  const sanitized = { code: '', input: '' };

  if (!VALID_LANGUAGES.includes(language)) {
    errors.push(`Invalid language: ${language}. Must be one of: ${VALID_LANGUAGES.join(', ')}`);
  }

  const codeResult = sanitizeCode(code, language);
  if (!codeResult.isValid) {
    errors.push(...codeResult.errors);
  } else {
    sanitized.code = codeResult.code;
  }

  const inputResult = sanitizeInput(input);
  if (!inputResult.isValid) {
    errors.push(...inputResult.errors);
  } else {
    sanitized.input = inputResult.input || '';
  }

  return { isValid: errors.length === 0, errors, sanitized };
};

const sanitizeExecutionResult = (result) => {
  const { output = '', error = '', exitCode = 0, executionTime = 0 } = result || {};
  return {
    output: escapeOutput(output),
    error: escapeError(error),
    exitCode: exitCode || 0,
    executionTime: executionTime || 0,
  };
};

const validateLanguageSpecific = (code, language) => {
  const errors = [];

  if (language === 'cpp' && !/\bmain\s*\(/.test(code)) {
    errors.push('C++ code must contain a main() function');
  }

  if (language === 'javascript' && !/\bconsole\b/.test(code)) {
    errors.push('JavaScript code should use console for output');
  }

  return { isValid: errors.length === 0, errors };
};

const sanitizationService = {
  MAX_CODE_SIZE,
  MAX_INPUT_SIZE,
  MAX_OUTPUT_SIZE,
  sanitizeCode,
  sanitizeInput,
  escapeOutput,
  escapeError,
  validateExecutionRequest,
  sanitizeExecutionResult,
  validateLanguageSpecific,
};

export default sanitizationService;
