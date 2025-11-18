const Joi = require('joi');
const dayjs = require('dayjs');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

function randomJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const createCourseSchema = Joi.object({
  title: Joi.string().min(2).required(),
  description: Joi.string().allow('').optional(),
});

async function createCourse(req, res) {
  try {
    const { value, error } = createCourseSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { title, description } = value;
    const course = await Course.create({ title, description, joinCode: randomJoinCode(), teacher: req.user.id });
    res.status(201).json({ course });
  } catch (err) {
    res.status(500).json({ error: 'Create course failed' });
  }
}

async function listMyCourses(req, res) {
  try {
    if (req.user.role === 'teacher') {
      const courses = await Course.find({ teacher: req.user.id }).lean();
      return res.json({ courses });
    } else {
      const enrollments = await Enrollment.find({ user: req.user.id, status: 'active' }).populate('course').lean();
      const courses = enrollments.map(e => ({ ...e.course, enrolledAt: e.createdAt }));
      return res.json({ courses });
    }
  } catch (err) {
    res.status(500).json({ error: 'List courses failed' });
  }
}

async function listAllCourses(req, res) {
  try {
    const courses = await Course.find({}).select('-joinCode').lean();
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: 'List courses failed' });
  }
}

async function getCourse(req, res) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select('-joinCode').lean();
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (req.user.role === 'teacher') {
      if (course.teacher.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else {
      const enrollment = await Enrollment.findOne({ user: req.user.id, course: courseId, status: 'active' }).lean();
      if (!enrollment) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: 'Get course failed' });
  }
}

const updateCourseSchema = Joi.object({
  title: Joi.string().min(2).optional(),
  description: Joi.string().allow('').optional(),
}).or('title', 'description');

async function updateCourse(req, res) {
  try {
    const { value, error } = updateCourseSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (value.title !== undefined) course.title = value.title;
    if (value.description !== undefined) course.description = value.description;
    await course.save();
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: 'Update course failed' });
  }
}

const joinSchema = Joi.object({ joinCode: Joi.string().required() });

async function joinCourse(req, res) {
  try {
    const { value, error } = joinSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.joinCode !== value.joinCode) return res.status(400).json({ error: 'Invalid join code' });
    await Enrollment.updateOne(
      { course: course._id, user: req.user.id },
      { $setOnInsert: { roleInCourse: 'student', status: 'active' } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Join course failed' });
  }
}

async function joinCourseByCode(req, res) {
  try {
    const { value, error } = joinSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const course = await Course.findOne({ joinCode: value.joinCode });
    if (!course) return res.status(404).json({ error: 'Invalid join code' });
    await Enrollment.updateOne(
      { course: course._id, user: req.user.id },
      { $setOnInsert: { roleInCourse: 'student', status: 'active' } },
      { upsert: true }
    );
    res.json({ ok: true, course });
  } catch (err) {
    res.status(500).json({ error: 'Join course failed' });
  }
}

async function getRoster(req, res) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const roster = await Enrollment.find({ course: course._id, status: 'active' }).populate('user', 'name email').lean();
    res.json({ roster });
  } catch (err) {
    res.status(500).json({ error: 'Get roster failed' });
  }
}

async function deleteCourse(req, res) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    
    // Delete all enrollments for this course
    await Enrollment.deleteMany({ course: course._id });
    
    // Delete the course
    await Course.findByIdAndDelete(courseId);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete course failed' });
  }
}

module.exports = { createCourse, listMyCourses, listAllCourses, getCourse, updateCourse, joinCourse, joinCourseByCode, getRoster, deleteCourse };