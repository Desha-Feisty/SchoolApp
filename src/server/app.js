const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const quizRoutes = require('./routes/quiz.routes');
const attemptRoutes = require('./routes/attempt.routes');
const { authMiddleware, requireRole } = require('./middleware/auth');
const quizController = require('./controllers/quiz.controller');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve simple UI for testing endpoints
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/docs', express.static(path.join(__dirname, '..', 'docs')));

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/api/courses', courseRoutes);
app.use('/quizzes', quizRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/attempts', attemptRoutes);
app.use('/api/attempts', attemptRoutes);

// Question management root-level endpoints
app.post('/api/questions', authMiddleware, requireRole('teacher'), quizController.addQuestionViaBody);
app.put('/api/questions/:questionId', authMiddleware, requireRole('teacher'), quizController.updateQuestion);
app.delete('/api/questions/:questionId', authMiddleware, requireRole('teacher'), quizController.deleteQuestion);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Utility endpoint to save ER diagram files generated client-side
app.post('/utils/save-er', async (req, res) => {
  try {
    const { svg, pngDataUrl } = req.body || {};
    if (!svg) return res.status(400).json({ error: 'svg is required' });
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
    const svgPath = path.join(docsDir, 'er-diagram.svg');
    fs.writeFileSync(svgPath, svg, 'utf8');
    let pngPath = null;
    if (pngDataUrl && pngDataUrl.startsWith('data:image/png;base64,')) {
      const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, '');
      pngPath = path.join(docsDir, 'er-diagram.png');
      fs.writeFileSync(pngPath, Buffer.from(base64, 'base64'));
    }
    res.json({ ok: true, svgPath: '/docs/er-diagram.svg', pngPath: pngPath ? '/docs/er-diagram.png' : null });
  } catch (e) {
    console.error('save-er error', e);
    res.status(500).json({ error: 'Failed to save ER files' });
  }
});

module.exports = app;