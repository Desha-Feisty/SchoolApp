const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const courseController = require('../controllers/course.controller');

router.post('/', authMiddleware, requireRole('teacher'), courseController.createCourse);
router.get('/', authMiddleware, courseController.listMyCourses);
router.get('/my-courses', authMiddleware, courseController.listMyCourses);
router.get('/:courseId', authMiddleware, courseController.getCourse);
router.put('/:courseId', authMiddleware, requireRole('teacher'), courseController.updateCourse);
router.delete('/:courseId', authMiddleware, requireRole('teacher'), courseController.deleteCourse);
router.post('/:courseId/enroll', authMiddleware, requireRole('student'), courseController.joinCourse);
router.post('/:courseId/join', authMiddleware, requireRole('student'), courseController.joinCourse);
router.post('/join', authMiddleware, requireRole('student'), courseController.joinCourseByCode);
router.get('/:courseId/roster', authMiddleware, requireRole('teacher'), courseController.getRoster);

module.exports = router;