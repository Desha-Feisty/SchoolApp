const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const quizRoutes = require('./routes/quiz.routes');
const attemptRoutes = require('./routes/attempt.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve simple UI for testing endpoints
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/quizzes', quizRoutes);
app.use('/attempts', attemptRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;