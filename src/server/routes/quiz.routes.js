const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const quizController = require('../controllers/quiz.controller');
const attemptController = require('../controllers/attempt.controller');

router.post('/:courseId/quizzes', authMiddleware, requireRole('teacher'), quizController.createQuiz);
router.get('/:courseId/quizzes', authMiddleware, quizController.listCourseQuizzes);
router.get('/available', authMiddleware, quizController.listAvailableQuizzes);
router.get('/:quizId', authMiddleware, quizController.getQuizDetails);
router.post('/:quizId/questions', authMiddleware, requireRole('teacher'), quizController.addQuestion);
router.post('/:quizId/publish', authMiddleware, requireRole('teacher'), quizController.publishQuiz);
router.get('/:quizId/grades', authMiddleware, requireRole('teacher'), attemptController.listQuizGrades);

module.exports = router;