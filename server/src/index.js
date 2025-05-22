const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const pomodoroRoutes = require('./routes/pomodoros');
const statsRoutes = require('./routes/stats');
const projectRoutes = require('./routes/projects');
const milestoneRoutes = require('./routes/milestones');
const noteRoutes = require('./routes/notes');
const reminderRoutes = require('./routes/reminders');
const countdownRoutes = require('./routes/countdowns');
const aggregateRoutes = require('./routes/aggregate');

const adminRoutes = require('./routes/admin');
const standaloneTaskRoutes = require('./routes/standaloneTasks');
const fastTaskRoutes = require('./routes/fastTasks');

const activeTimerRoutes = require('./routes/activeTimer');
const contactRoutes = require('./routes/contactRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from both production and development origins
    const allowedOrigins = ['https://ai-pomo.com', 'http://localhost:3000'];

    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS requests for all routes
app.options('*', cors(corsOptions));

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use(passport.initialize());

// Configure passport
require('./config/passport')(passport);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.use('/pomodoros', pomodoroRoutes);
app.use('/stats', statsRoutes);
app.use('/projects', projectRoutes);
// Register milestone routes in both places to handle both patterns
app.use('/projects', milestoneRoutes); // For /projects/:projectId/milestones
app.use('/milestones', milestoneRoutes); // For /milestones/:id
app.use('/projects', noteRoutes);
app.use('/reminders', reminderRoutes);
app.use('/countdowns', countdownRoutes);
app.use('/aggregate', aggregateRoutes);

app.use('/standalone-tasks', standaloneTaskRoutes);
app.use('/fast-tasks', fastTaskRoutes);
app.use('/active-timer', activeTimerRoutes);
app.use('/contact', contactRoutes);

app.use('/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Pomodoro Timer API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and listening on all interfaces`);
});
