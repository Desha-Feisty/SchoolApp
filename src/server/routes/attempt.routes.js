const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const attemptController = require('../controllers/attempt.controller');

router.post('/:quizId/attempts/start', authMiddleware, requireRole('student'), attemptController.startAttempt);
router.post('/start', authMiddleware, requireRole('student'), attemptController.startAttemptFromBody);
router.patch('/:attemptId/answers', authMiddleware, requireRole('student'), attemptController.autosaveAnswer);
router.put('/:attemptId/answer', authMiddleware, requireRole('student'), attemptController.autosaveAnswer);
router.post('/:attemptId/submit', authMiddleware, requireRole('student'), attemptController.submitAttempt);
router.put('/:attemptId/submit', authMiddleware, requireRole('student'), attemptController.submitAttempt);
router.get('/my', authMiddleware, requireRole('student'), attemptController.listMyGrades);
router.get('/my-grades', authMiddleware, requireRole('student'), attemptController.listMyGrades);
router.get('/:attemptId/result', authMiddleware, attemptController.getResult);
router.get('/:attemptId/grade', authMiddleware, requireRole('student'), attemptController.getResult);
router.get('/:attemptId', authMiddleware, requireRole('student'), attemptController.getAttemptDetails);

module.exports = router;