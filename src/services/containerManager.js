import Docker from 'dockerode';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContainerManager {
  constructor() {
    this.docker = new Docker();
    this.containers = {
      python: null,
      javascript: null,
      cpp: null
    };
    this.containerNames = {
      python: 'codehub-python-executor',
      javascript: 'codehub-javascript-executor',
      cpp: 'codehub-cpp-executor'
    };
    // Go up two directories from src/services to reach project root, then into docker
    this.dockerDir = path.join(__dirname, '..', '..', 'docker');
  }

  /**
   * Build Docker image for a language
   */
  async buildImage(language) {
    const imageName = `codehub-${language}-persistent`;
    const dockerfilePath = `Dockerfile.${language}.persistent`;
    
    console.log(`Building ${language} image from ${this.dockerDir}...`);
    
    try {
      const { stdout, stderr } = await execAsync(
        `docker build -t ${imageName} -f ${dockerfilePath} .`,
        { cwd: this.dockerDir, timeout: 120000 }
      );
      
      if (stderr && !stderr.includes('naming to')) {
        console.log(`Build output: ${stderr}`);
      }
      
      console.log(`${language} image built successfully`);
      return true;
    } catch (error) {
      console.error(`Error building ${language} image:`, error.message);
      throw error;
    }
  }

  /**
   * Start a container for a language
   */
  async startContainer(language) {
    const imageName = `codehub-${language}-persistent`;
    const containerName = this.containerNames[language];

    try {
      // Check if container already exists
      const existingContainer = this.docker.getContainer(containerName);
      try {
        const info = await existingContainer.inspect();
        if (info.State.Running) {
          console.log(`${language} container already running`);
          this.containers[language] = existingContainer;
          return existingContainer;
        } else {
          // Start existing container
          await existingContainer.start();
          console.log(`${language} container started`);
          this.containers[language] = existingContainer;
          return existingContainer;
        }
      } catch (inspectError) {
        // Container doesn't exist, create new one
      }
    } catch (error) {
      // Container doesn't exist, continue to create
    }

    // Create and start new container
    console.log(`Creating ${language} container...`);
    const container = await this.docker.createContainer({
      Image: imageName,
      name: containerName,
      ExposedPorts: {
        '8765/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '8765/tcp': [{ HostPort: '0' }] // Random port
        },
        Memory: 256 * 1024 * 1024, // 256MB
        CpuQuota: 50000, // 50% CPU
        NetworkMode: 'bridge'
      }
    });

    await container.start();
    console.log(`${language} container started`);
    this.containers[language] = container;
    
    // Wait a moment for the WebSocket server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return container;
  }

  /**
   * Get the WebSocket port for a container
   */
  async getContainerPort(language) {
    const container = this.containers[language];
    if (!container) {
      throw new Error(`${language} container not found`);
    }

    const info = await container.inspect();
    const port = info.NetworkSettings.Ports['8765/tcp'][0].HostPort;
    return port;
  }

  /**
   * Get container IP address
   */
  async getContainerIP(language) {
    const container = this.containers[language];
    if (!container) {
      throw new Error(`${language} container not found`);
    }

    const info = await container.inspect();
    return info.NetworkSettings.IPAddress;
  }

  /**
   * Stop a container
   */
  async stopContainer(language) {
    const container = this.containers[language];
    if (!container) {
      console.log(`${language} container not found`);
      return;
    }

    try {
      await container.stop();
      await container.remove();
      console.log(`${language} container stopped and removed`);
      this.containers[language] = null;
    } catch (error) {
      console.error(`Error stopping ${language} container:`, error.message);
    }
  }

  /**
   * Stop all containers
   */
  async stopAllContainers() {
    console.log('Stopping all executor containers...');
    const languages = Object.keys(this.containers);
    await Promise.all(languages.map(lang => this.stopContainer(lang)));
  }

  /**
   * Start all containers
   */
  async startAllContainers() {
    console.log('Starting executor containers...');
    const languages = ['python', 'javascript', 'cpp'];
    
    for (const language of languages) {
      try {
        await this.buildImage(language);
        await this.startContainer(language);
      } catch (error) {
        console.error(`Failed to start ${language} container:`, error.message);
      }
    }
    
    console.log('All executor containers started successfully');
  }

  /**
   * Check if a container is running
   */
  async isContainerRunning(language) {
    const container = this.containers[language];
    if (!container) return false;

    try {
      const info = await container.inspect();
      return info.State.Running;
    } catch (error) {
      return false;
    }
  }
}

const containerManager = new ContainerManager();
export default containerManager;
