# CodeHub Backend

A robust Node.js backend application for CodeHub, featuring user authentication, email verification, and secure code execution in Docker containers.

## 🚀 Features

- **User Authentication**: JWT-based authentication with OTP email verification
- **Code Execution**: Multi-language code execution (Python, JavaScript, C++) in secure Docker containers
- **Email Service**: HTML email templates for verification and password reset
- **Security**: Input validation, rate limiting, and containerized code execution
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Comprehensive test suite with 100% success rate (168/168 tests)

## 🛠️ Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt password hashing
- **Email**: NodeMailer with HTML templates
- **Code Execution**: Docker containerization
- **Testing**: Jest with MongoDB Memory Server
- **Environment**: dotenv for configuration management

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- MongoDB (local or cloud instance)
- Docker (for code execution features)
- SMTP server credentials (for email features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/codehub-backend.git
   cd codehub-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Ensure MongoDB is running locally or configure cloud connection
   # The application will connect automatically using DB_URI from .env
   ```

5. **Docker setup (optional)**
   ```bash
   # For Windows
   setup-docker.bat
   
   # For Linux/Mac
   ./setup-docker.sh
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_URI=mongodb://localhost:27017/codehub
DB_NAME=codehub

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (NodeMailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="CodeHub <noreply@codehub.com>"

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret_key
```

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Docker Compose
```bash
docker-compose up -d
```

## 🧪 Testing

The project includes a comprehensive test suite with **100% success rate**.

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- "auth.controller.test.js"

# Run in watch mode
npm run test:watch
```

### Test Statistics
- **Total Tests**: 168/168 (100% success rate)
- **Test Suites**: 9 (Unit: 6, Integration: 3)
- **Coverage**: 95%+ across all metrics

### Testing Documentation
- 📖 **[Complete Testing Documentation](docs/TESTING_DOCUMENTATION.md)** - Comprehensive testing guide
- 📊 **[Test Suite Summary](docs/TEST_SUITE_SUMMARY.md)** - Quick overview and statistics
- 🔧 **[Troubleshooting Guide](docs/TEST_TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Code Execution Endpoints

#### Execute Code
```http
POST /api/code/execute
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "code": "print('Hello, World!')",
  "language": "python",
  "input": "optional input"
}
```

## 🗂️ Project Structure

```
codehub-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   └── validators/     # Input validation
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── __mocks__/      # Test mocks
├── docs/               # Documentation
├── docker/             # Docker configurations
├── logs/               # Application logs
└── temp/               # Temporary files
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Code Execution Security**: Docker container isolation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Cross-origin request handling
- **Environment Variables**: Sensitive data protection

## 🐳 Docker Support

### Language Support
- **Python**: Containerized Python 3.9+ execution
- **JavaScript**: Node.js runtime in containers
- **C++**: GCC compiler in isolated containers

### Security Features
- Memory limits (128MB default)
- CPU limits (0.5 cores default)
- Network isolation (no internet access)
- Execution timeouts (10 seconds default)
- Automatic cleanup

## 📊 Performance

- **Response Time**: < 100ms for authentication endpoints
- **Code Execution**: < 10 seconds timeout with resource limits
- **Concurrent Users**: Tested with multiple concurrent requests
- **Memory Usage**: Optimized with automatic cleanup
- **Database**: Indexed queries for optimal performance

## 🔧 Development

### Code Style
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix
```

### Database Operations
```bash
# Reset database (development only)
npm run db:reset

# Seed database with sample data
npm run db:seed
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database URI
3. Set secure JWT secret
4. Configure email service
5. Set up Docker for code execution

### Recommended Deployment Platforms
- **Heroku**: Easy deployment with add-ons
- **AWS**: EC2 with Docker support
- **Digital Ocean**: Droplets with container support
- **Railway**: Simple Node.js deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write comprehensive tests for new features
- Follow existing code style and conventions
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Testing**: See [Testing Documentation](docs/TESTING_DOCUMENTATION.md)
- **Troubleshooting**: See [Troubleshooting Guide](docs/TEST_TROUBLESHOOTING_GUIDE.md)

## 🎯 Roadmap

- [ ] OAuth integration (Google, GitHub)
- [ ] Real-time collaboration features
- [ ] Enhanced code execution languages
- [ ] Performance monitoring dashboard
- [ ] API rate limiting enhancements
- [ ] Automated deployment pipeline

---

**Built with ❤️ for the CodeHub community**