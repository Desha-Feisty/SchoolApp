const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const attemptController = require('../controllers/attempt.controller');

router.post('/:quizId/attempts/start', authMiddleware, requireRole('student'), attemptController.startAttempt);
router.patch('/:attemptId/answers', authMiddleware, requireRole('student'), attemptController.autosaveAnswer);
router.post('/:attemptId/submit', authMiddleware, requireRole('student'), attemptController.submitAttempt);
router.get('/:attemptId/result', authMiddleware, attemptController.getResult);
router.get('/my', authMiddleware, requireRole('student'), attemptController.listMyGrades);

module.exports = router;