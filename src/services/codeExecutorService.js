import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

class CodeExecutorService {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.dockerDir = path.join(process.cwd(), 'docker');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async executeCode(code, language, input = '') {
    const sessionId = this.generateSessionId();
    const sessionDir = path.join(this.tempDir, sessionId);
    
    try {
      await fs.mkdir(sessionDir, { recursive: true });
      
      const result = await this.runInDocker(code, language, sessionDir, input);
      
      await this.cleanup(sessionDir);
      
      return result;
    } catch (error) {
      await this.cleanup(sessionDir);
      throw error;
    }
  }

  async runInDocker(code, language, sessionDir, input) {
    const { filename, dockerfile } = this.getLanguageConfig(language);
    const filePath = path.join(sessionDir, filename);
    
    await fs.writeFile(filePath, code);
    
    if (input) {
      await fs.writeFile(path.join(sessionDir, 'input.txt'), input);
    }

    const dockerfilePath = path.join(this.dockerDir, dockerfile);
    const imageName = `codehub-${language}-${Date.now()}`;
    const containerName = `codehub-container-${Date.now()}`;

    try {
      await execAsync(`docker build -t ${imageName} -f ${dockerfilePath} ${sessionDir}`, {
        timeout: 30000
      });

      const runCommand = input 
        ? `docker run --rm --name ${containerName} --memory=128m --cpus=0.5 --network=none --timeout=10s ${imageName} < ${path.join(sessionDir, 'input.txt')}`
        : `docker run --rm --name ${containerName} --memory=128m --cpus=0.5 --network=none --timeout=10s ${imageName}`;

      const { stdout, stderr } = await execAsync(runCommand, {
        timeout: 15000,
        maxBuffer: 1024 * 1024
      });

      await execAsync(`docker rmi ${imageName}`).catch(() => {});

      return {
        output: stdout || stderr || 'No output',
        error: stderr ? true : false,
        executionTime: 'N/A'
      };

    } catch (error) {
      await execAsync(`docker rmi ${imageName}`).catch(() => {});
      
      if (error.message.includes('timeout')) {
        return {
          output: 'Error: Code execution timed out (10s limit)',
          error: true,
          executionTime: 'Timeout'
        };
      }
      
      return {
        output: `Error: ${error.message}`,
        error: true,
        executionTime: 'N/A'
      };
    }
  }

  getLanguageConfig(language) {
    const configs = {
      python: { filename: 'main.py', dockerfile: 'Dockerfile.python' },
      cpp: { filename: 'main.cpp', dockerfile: 'Dockerfile.cpp' },
      javascript: { filename: 'main.js', dockerfile: 'Dockerfile.javascript' }
    };

    if (!configs[language]) {
      throw new Error(`Unsupported language: ${language}`);
    }

    return configs[language];
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async cleanup(sessionDir) {
    try {
      await fs.rm(sessionDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default new CodeExecutorService();