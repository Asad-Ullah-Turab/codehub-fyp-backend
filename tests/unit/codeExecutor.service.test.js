import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { CodeExecutorService } from '../../src/services/codeExecutorService.js';

describe('Code Executor Service Tests', () => {
  let service;
  let execSpy;
  let fsAccessSpy;
  let fsMkdirSpy;
  let fsWriteFileSpy;
  let fsRmSpy;

  beforeEach(() => {
    service = new CodeExecutorService();
    
    // Setup exec spy
    execSpy = jest.fn();
    fsAccessSpy = jest.spyOn(fs, 'access').mockRejectedValue(new Error('Not found'));
    fsMkdirSpy = jest.spyOn(fs, 'mkdir').mockResolvedValue();
    fsWriteFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue();
    fsRmSpy = jest.spyOn(fs, 'rm').mockResolvedValue();
    
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize with correct temp directory', () => {
      expect(service.tempDir).toBe(path.join(process.cwd(), 'temp'));
      expect(service.dockerDir).toBe(path.join(process.cwd(), 'docker'));
    });

    test('should ensure temp directory exists', async () => {
      await service.ensureTempDir();
      expect(fs.access).toHaveBeenCalledWith(service.tempDir);
      expect(fs.mkdir).toHaveBeenCalledWith(service.tempDir, { recursive: true });
    });
  });

  describe('Language Configuration', () => {
    test('should return correct config for Python', () => {
      const config = service.getLanguageConfig('python');
      expect(config.filename).toBe('main.py');
      expect(config.dockerfile).toBe('Dockerfile.python');
    });

    test('should return correct config for JavaScript', () => {
      const config = service.getLanguageConfig('javascript');
      expect(config.filename).toBe('main.js');
      expect(config.dockerfile).toBe('Dockerfile.javascript');
    });

    test('should return correct config for C++', () => {
      const config = service.getLanguageConfig('cpp');
      expect(config.filename).toBe('main.cpp');
      expect(config.dockerfile).toBe('Dockerfile.cpp');
    });

    test('should throw error for unsupported language', () => {
      expect(() => service.getLanguageConfig('ruby')).toThrow('Unsupported language: ruby');
    });
  });

  describe('Session Management', () => {
    test('should generate unique session IDs', () => {
      const id1 = service.generateSessionId();
      const id2 = service.generateSessionId();
      
      expect(id1).toMatch(/^session_\\d{13}_[a-f0-9]{8}$/);
      expect(id2).toMatch(/^session_\\d{13}_[a-f0-9]{8}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Code Execution', () => {
    beforeEach(() => {
      // Mock successful Docker execution
      execSpy.mockImplementation((command, callback) => {
        if (command.includes('docker run')) {
          callback(null, 'Hello, World!', '');
        } else {
          callback(null, '', '');
        }
      });
    });

    test('should execute Python code successfully', async () => {
      const code = 'print("Hello, World!")';
      const result = await service.executeCode(code, 'python');

      expect(result.output).toBe('Hello, World!');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.py'),
        code
      );
    });

    test('should execute JavaScript code successfully', async () => {
      const code = 'console.log("Hello, World!");';
      const result = await service.executeCode(code, 'javascript');

      expect(result.output).toBe('Hello, World!');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.js'),
        code
      );
    });

    test('should execute C++ code successfully', async () => {
      const code = '#include <iostream>\\nusing namespace std;\\nint main() { cout << "Hello, World!" << endl; return 0; }';
      const result = await service.executeCode(code, 'cpp');

      expect(result.output).toBe('Hello, World!');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.cpp'),
        code
      );
    });

    test('should handle code with input', async () => {
      execSpy.mockImplementation((command, callback) => {
        if (command.includes('docker run')) {
          callback(null, 'Input received: John', '');
        } else {
          callback(null, '', '');
        }
      });

      const code = 'name = input()\\nprint(f"Input received: {name}")';
      const input = 'John';
      const result = await service.executeCode(code, 'python', input);

      expect(result.output).toBe('Input received: John');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('input.txt'),
        input
      );
    });

    test('should handle compilation errors', async () => {
      execSpy.mockImplementation((command, callback) => {
        if (command.includes('docker run')) {
          callback(null, '', 'compilation error: undefined variable');
        } else {
          callback(null, '', '');
        }
      });

      const code = 'cout << undefinedVariable << endl;';
      const result = await service.executeCode(code, 'cpp');

      expect(result.output).toBe('compilation error: undefined variable');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    test('should handle runtime errors', async () => {
      execSpy.mockImplementation((command, callback) => {
        if (command.includes('docker run')) {
          callback(null, '', 'RuntimeError: division by zero');
        } else {
          callback(null, '', '');
        }
      });

      const code = 'print(1/0)';
      const result = await service.executeCode(code, 'python');

      expect(result.output).toBe('RuntimeError: division by zero');
    });

    test('should handle Docker execution timeout', async () => {
      execSpy.mockImplementation((command, callback) => {
        if (command.includes('docker run')) {
          // Simulate timeout
          const error = new Error('Command failed');
          error.killed = true;
          error.signal = 'SIGTERM';
          callback(error, '', 'Container execution timed out');
        } else {
          callback(null, '', '');
        }
      });

      const code = 'while True: pass';  // Infinite loop
      
      await expect(service.executeCode(code, 'python')).rejects.toThrow();
    });

    test('should handle Docker container startup failure', async () => {
      execSpy.mockImplementation((command, callback) => {
        if (command.includes('docker run')) {
          const error = new Error('docker: Error response from daemon');
          callback(error, '', 'Unable to find image');
        } else {
          callback(null, '', '');
        }
      });

      const code = 'print("Hello")';
      
      await expect(service.executeCode(code, 'python')).rejects.toThrow();
    });
  });

  describe('Docker Command Generation', () => {
    test('should generate correct Docker command for Python', async () => {
      await service.executeCode('print("test")', 'python');
      
      const dockerCall = execSpy.mock.calls.find(call => 
        call[0].includes('docker run')
      );
      
      expect(dockerCall[0]).toContain('codehub-python-base');
      expect(dockerCall[0]).toContain('--memory=128m');
      expect(dockerCall[0]).toContain('--cpus=0.5');
      expect(dockerCall[0]).toContain('--network=none');
      expect(dockerCall[0]).toContain('--timeout=10s');
    });

    test('should generate correct Docker command for JavaScript', async () => {
      await service.executeCode('console.log("test")', 'javascript');
      
      const dockerCall = execSpy.mock.calls.find(call => 
        call[0].includes('docker run')
      );
      
      expect(dockerCall[0]).toContain('codehub-javascript-base');
      expect(dockerCall[0]).toContain('--memory=128m');
      expect(dockerCall[0]).toContain('--cpus=0.5');
      expect(dockerCall[0]).toContain('--network=none');
    });

    test('should generate correct Docker command for C++', async () => {
      await service.executeCode('#include <iostream>', 'cpp');
      
      const dockerCall = execSpy.mock.calls.find(call => 
        call[0].includes('docker run')
      );
      
      expect(dockerCall[0]).toContain('codehub-cpp-base');
      expect(dockerCall[0]).toContain('--memory=128m');
      expect(dockerCall[0]).toContain('--cpus=0.5');
      expect(dockerCall[0]).toContain('--network=none');
    });
  });

  describe('Cleanup', () => {
    test('should clean up session directory after execution', async () => {
      await service.executeCode('print("test")', 'python');
      
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('session_'),
        { recursive: true, force: true }
      );
    });

    test('should clean up even if execution fails', async () => {
      execSpy.mockImplementation((command, callback) => {
        if (command.includes('docker run')) {
          callback(new Error('Execution failed'), '', '');
        } else {
          callback(null, '', '');
        }
      });

      await expect(service.executeCode('invalid code', 'python')).rejects.toThrow();
      
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('session_'),
        { recursive: true, force: true }
      );
    });
  });

  describe('Performance Monitoring', () => {
    test('should measure execution time', async () => {
      // Mock a delay in execution
      execSpy.mockImplementation((command, callback) => {
        if (command.includes('docker run')) {
          setTimeout(() => {
            callback(null, 'Hello, World!', '');
          }, 100);
        } else {
          callback(null, '', '');
        }
      });

      const result = await service.executeCode('print("Hello, World!")', 'python');
      
      expect(result.executionTime).toBeGreaterThanOrEqual(100);
    });

    test('should include execution statistics', async () => {
      const result = await service.executeCode('print("test")', 'python');
      
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(typeof result.executionTime).toBe('number');
    });
  });
});
