# CodeHub - Code Execution Setup

This setup allows users to run Python, C++, and JavaScript code safely in Docker containers.

## Prerequisites

- Docker installed and running
- Node.js (for the backend)

## Setup Instructions

### 1. Install Docker Images
Run the setup script to build the required Docker images:

**Windows:**
```bash
setup-docker.bat
```

**Linux/Mac:**
```bash
chmod +x setup-docker.sh
./setup-docker.sh
```

### 2. Start the Backend
```bash
npm install
npm run dev
```

### 3. API Endpoints

#### Execute Code
```
POST /api/code/execute
Content-Type: application/json

{
  "code": "print('Hello World')",
  "language": "python",
  "input": "optional input"
}
```

#### Get Supported Languages
```
GET /api/code/languages
```

## Supported Languages

- **Python** (3.11-alpine)
- **C++** (GCC latest)
- **JavaScript** (Node.js 18-alpine)

## Security Features

- Isolated Docker containers
- Memory limit: 128MB
- CPU limit: 0.5 cores
- Network isolation: no network access
- Execution timeout: 10 seconds
- Non-root user execution

## File Structure

```
docker/
├── Dockerfile.python     # Python runtime
├── Dockerfile.cpp        # C++ runtime
└── Dockerfile.javascript # JavaScript runtime

src/
├── controllers/
│   └── codeExecutionController.js
├── services/
│   └── codeExecutorService.js
└── routes/
    └── codeExecutionRoutes.js
```

## Example Usage

### Python
```python
name = input("Enter your name: ")
print(f"Hello, {name}!")
```

### C++
```cpp
#include <iostream>
using namespace std;

int main() {
    string name;
    cout << "Enter your name: ";
    cin >> name;
    cout << "Hello, " << name << "!" << endl;
    return 0;
}
```

### JavaScript
```javascript
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter your name: ', (name) => {
    console.log(`Hello, ${name}!`);
    rl.close();
});
```