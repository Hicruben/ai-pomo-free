# AI-Pomo Free - Open Source Pomodoro Timer

A feature-rich, open-source Pomodoro timer application built with React to help you boost productivity and manage your work sessions effectively.

> **🚀 Looking for the full-featured version?** Check out [AI-Pomo.com](https://ai-pomo.com) - our premium platform with advanced AI features, unlimited projects, and priority support!

This is the free, self-hostable version of AI-Pomo, perfect for individuals and teams who want to run their own Pomodoro timer with essential productivity features.

## Features

### Authentication and Data Persistence
- User registration and login
- Google OAuth integration
- MongoDB database for data storage
- Cross-device synchronization

### Core Timer Functionality
- Precise countdown timer for work and break sessions
- User-customizable session durations
- Clear visual progress feedback
- Manual controls (start, pause, stop/reset, skip)
- Session persistence across page reloads

### Notifications and Sound
- Sound alerts for session completion
- Multiple sound options
- Volume control
- Optional ticking sound during work sessions

### Task Management
- Task list with add, edit, and delete functionality
- Task association with Pomodoro sessions
- Task completion tracking
- Pomodoro estimation for tasks

### UI/UX
- Minimalist design
- Clear typography and visual hierarchy
- Light/dark theme support
- Responsive design for all devices

### Productivity Statistics
- Track completed Pomodoros
- Streak tracking
- Statistics display

### Rest Quality Enhancement
- Guided rest activities library
- Optional participation in guided activities

### Gamification
- Points/experience system
- Achievements/badges
- Visual streak tracking

### AI Features (Optional)
- AI-powered project generation from descriptions
- Automatic task breakdown and estimation
- Smart subtask generation
- Requires DeepSeek API key (free tier available)

## Getting Started

### Prerequisites
- Node.js and npm installed on your machine
- Docker and Docker Compose (for MongoDB)

### Installation

#### 1. Start MongoDB with Docker Compose

```bash
# From the project root directory
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Mongo Express (web-based MongoDB admin interface) on port 8081

You can access Mongo Express at http://localhost:8081 with:
- Username: admin
- Password: password

The MongoDB connection details can be found and configured in `server/.env.production` after copying from `server/.env.example`.

#### 2. Start the Backend Server

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Initialize the database (first time only)
npm run init-db

# Start the development server
npm run dev
```

The server will run on http://localhost:5000.

#### 3. Start the Frontend Development Server

```bash
# Navigate to the frontend directory
cd pomodoro-timer

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open in your browser at http://localhost:3000.

## Usage

1. Set your preferred timer durations in the settings
2. Add tasks you want to work on
3. Select a task and start the timer
4. Work until the timer ends
5. Take a break when prompted
6. Repeat the process to boost your productivity

## Docker Commands

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs

# Stop and remove containers, networks, and volumes
docker-compose down -v
```

## Environment Variables

### Backend Server

Create a `.env.production` file in the `server` directory by copying the example file:

```bash
cp server/.env.example server/.env.production
```

Then, edit `server/.env.production` to fill in your specific credentials and settings (e.g., MongoDB URI, JWT Secret, Google OAuth keys, email server details).

### Frontend Application

Create a `.env.production` file in the `pomodoro-timer` directory by copying the example file:

```bash
cp pomodoro-timer/.env.example pomodoro-timer/.env.production
```

The default `REACT_APP_API_URL=/api` should work if you are running the backend server on the same domain or using a proxy. If your backend is on a different URL (e.g., `http://localhost:5000` during local development when not using a proxy), update `pomodoro-timer/.env.production` accordingly:

```
REACT_APP_API_URL=http://localhost:5000
```

### AI Features Setup (Optional)

To enable AI-powered project generation and task breakdown features:

1. Get a free API key from [DeepSeek](https://platform.deepseek.com/)
2. Add it to your frontend environment file:

```bash
# In pomodoro-timer/.env.production
REACT_APP_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**Note**: The AI features work entirely client-side for this open-source version. For production use, consider implementing a backend proxy to keep API keys secure.

## Deployment

### Production Build

1. **Build the frontend:**
```bash
cd pomodoro-timer
npm run build
```

2. **Set up environment variables:**
   - Copy and configure `server/.env.example` to `server/.env.production`
   - Copy and configure `pomodoro-timer/.env.example` to `pomodoro-timer/.env.production`

3. **Start the production server:**
```bash
cd server
npm start
```

4. **Serve the frontend:**
   - Use a web server like Nginx to serve the built files from `pomodoro-timer/build/`
   - Configure reverse proxy to route API calls to your backend server

### Docker Deployment

Use the provided `docker-compose.yml` for easy deployment:

```bash
docker-compose up -d
```

This will start MongoDB and you can then run the application servers.

**⚠️ Security Note**: The default Docker configuration uses basic credentials (`admin`/`password`). For production deployments, make sure to:
1. Change the MongoDB credentials in `docker-compose.yml`
2. Update the corresponding credentials in `mongo-init.js`
3. Update your `MONGODB_URI` in the server environment configuration

## Technologies Used

### Frontend
- React
- Styled Components
- React Icons
- Web Audio API
- Axios for API requests
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB for data storage
- JWT for authentication
- Passport.js for Google OAuth
- Bcrypt for password hashing

### Infrastructure
- Docker and Docker Compose for containerization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## About AI-Pomo

This open-source version is maintained by the team behind [AI-Pomo.com](https://ai-pomo.com), a comprehensive productivity platform that extends these core features with:

- **Advanced AI Project Generation** - Automatically break down complex projects into manageable tasks
- **Unlimited Projects** - No restrictions on the number of active projects
- **Priority Support** - Get help when you need it
- **Advanced Analytics** - Detailed productivity insights and reporting
- **Team Collaboration** - Share projects and track team productivity
- **Cloud Sync** - Access your data from anywhere

**[Try AI-Pomo.com →](https://ai-pomo.com)**

## Contributing

We welcome contributions to AI-Pomo Free! Please feel free to submit issues, feature requests, and pull requests.

## Support

- **Community Support**: Use GitHub Issues for bug reports and feature requests
- **Premium Support**: Available at [AI-Pomo.com](https://ai-pomo.com) for our hosted platform users

## Acknowledgments

- The Pomodoro Technique was developed by Francesco Cirillo
- Inspired by various Pomodoro timer applications and productivity tools
- Built with ❤️ by the [AI-Pomo.com](https://ai-pomo.com) team
