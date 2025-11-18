const Joi = require('joi');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Enrollment = require('../models/Enrollment');

const createSchema = Joi.object({
  title: Joi.string().min(2).required(),
  description: Joi.string().allow('').optional(),
  openAt: Joi.date().required(),
  closeAt: Joi.date().required(),
  durationMinutes: Joi.number().integer().min(1).required(),
  attemptsAllowed: Joi.number().integer().min(1).default(1),
}).unknown(true).custom((value, helpers) => {
  if (new Date(value.openAt) >= new Date(value.closeAt)) {
    return helpers.error('any.invalid', { message: 'openAt must be before closeAt' });
  }
  return value;
});

async function createQuiz(req, res) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const quiz = await Quiz.create({ course: course._id, ...value, published: false });
    res.status(201).json({ quiz });
  } catch (err) {
    res.status(500).json({ error: 'Create quiz failed' });
  }
}

const addQuestionSchema = Joi.object({
  prompt: Joi.string().min(2).required(),
  points: Joi.number().integer().min(0).default(1),
  orderIndex: Joi.number().integer().min(0).default(0),
  choices: Joi.array().items(Joi.object({ text: Joi.string().required(), isCorrect: Joi.boolean().default(false) })).min(2).required(),
});

async function addQuestion(req, res) {
  try {
    const { value, error } = addQuestionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const q = await Question.create({ quiz: quiz._id, type: 'mcq_single', ...value });
    res.status(201).json({ question: q });
  } catch (err) {
    res.status(500).json({ error: 'Add question failed' });
  }
}

const updateQuestionSchema = Joi.object({
  prompt: Joi.string().min(2).optional(),
  points: Joi.number().integer().min(0).optional(),
  orderIndex: Joi.number().integer().min(0).optional(),
  choices: Joi.array().items(Joi.object({ text: Joi.string().required(), isCorrect: Joi.boolean().default(false) })).min(2).optional(),
}).min(1);

async function updateQuestion(req, res) {
  try {
    const { value, error } = updateQuestionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { questionId } = req.params;
    const q = await Question.findById(questionId).populate({ path: 'quiz', populate: { path: 'course' } });
    if (!q) return res.status(404).json({ error: 'Question not found' });
    if (q.quiz.course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (value.prompt !== undefined) q.prompt = value.prompt;
    if (value.points !== undefined) q.points = value.points;
    if (value.orderIndex !== undefined) q.orderIndex = value.orderIndex;
    if (value.choices !== undefined) q.choices = value.choices;
    await q.save();
    res.json({ question: q });
  } catch (err) {
    res.status(500).json({ error: 'Update question failed' });
  }
}

async function deleteQuestion(req, res) {
  try {
    const { questionId } = req.params;
    const q = await Question.findById(questionId).populate({ path: 'quiz', populate: { path: 'course' } });
    if (!q) return res.status(404).json({ error: 'Question not found' });
    if (q.quiz.course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await Question.findByIdAndDelete(questionId);
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete question failed' });
  }
}

const addQuestionBodySchema = Joi.object({
  quizId: Joi.string().required(),
  prompt: Joi.string().min(2).required(),
  points: Joi.number().integer().min(0).default(1),
  orderIndex: Joi.number().integer().min(0).default(0),
  choices: Joi.array().items(Joi.object({ text: Joi.string().required(), isCorrect: Joi.boolean().default(false) })).min(2).required(),
});

async function addQuestionViaBody(req, res) {
  try {
    const { value, error } = addQuestionBodySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const quiz = await Quiz.findById(value.quizId).populate('course');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const q = await Question.create({ quiz: quiz._id, type: 'mcq_single', prompt: value.prompt, points: value.points, orderIndex: value.orderIndex, choices: value.choices });
    res.status(201).json({ question: q });
  } catch (err) {
    res.status(500).json({ error: 'Add question failed' });
  }
}

async function publishQuiz(req, res) {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    quiz.published = true;
    await quiz.save();
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ error: 'Publish quiz failed' });
  }
}

async function listCourseQuizzes(req, res) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    // Check if user is teacher of the course or enrolled student
    const isTeacher = course.teacher.toString() === req.user.id;
    const enrollment = await Enrollment.findOne({ user: req.user.id, course: courseId });
    
    if (!isTeacher && !enrollment) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const quizzes = await Quiz.find({ course: courseId })
      .select(isTeacher ? 'title description openAt closeAt durationMinutes attemptsAllowed published createdAt' : 'title description openAt closeAt durationMinutes attemptsAllowed')
      .sort({ createdAt: -1 });

    // For students, only return published quizzes
    const filteredQuizzes = isTeacher ? quizzes : quizzes.filter(q => q.published);

    res.json({ 
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        joinCode: course.joinCode,
        teacher: course.teacher,
        createdAt: course.createdAt
      },
      quizzes: filteredQuizzes 
    });
  } catch (err) {
    res.status(500).json({ error: 'List quizzes failed' });
  }
}

async function listAvailableQuizzes(req, res) {
  try {
    // Get all courses the student is enrolled in
    const enrollments = await Enrollment.find({ user: req.user.id });
    const courseIds = enrollments.map(e => e.course);

    if (courseIds.length === 0) {
      return res.json({ quizzes: [] });
    }

    const now = new Date();
    const quizzes = await Quiz.find({
      course: { $in: courseIds },
      published: true,
      openAt: { $lte: now },
      closeAt: { $gte: now }
    })
      .populate('course', 'title')
      .select('title description openAt closeAt durationMinutes attemptsAllowed course')
      .sort({ openAt: 1 });

    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: 'List available quizzes failed' });
  }
}

async function getQuizDetails(req, res) {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Check if user is teacher of the course or enrolled student
    const isTeacher = quiz.course.teacher.toString() === req.user.id;
    const enrollment = await Enrollment.findOne({ user: req.user.id, course: quiz.course._id });
    
    if (!isTeacher && !enrollment) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // For students, only return if quiz is published and within time window
    if (!isTeacher) {
      if (!quiz.published) {
        return res.status(403).json({ error: 'Quiz not available' });
      }
      const now = new Date();
      if (now < quiz.openAt || now > quiz.closeAt) {
        return res.status(403).json({ error: 'Quiz not available' });
      }
    }

    const questions = await Question.find({ quiz: quizId })
      .select(isTeacher ? 'prompt choices points orderIndex' : 'prompt choices points orderIndex')
      .sort({ orderIndex: 1 });

    res.json({ 
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        openAt: quiz.openAt,
        closeAt: quiz.closeAt,
        durationMinutes: quiz.durationMinutes,
        attemptsAllowed: quiz.attemptsAllowed,
        published: quiz.published,
        course: quiz.course
      },
      questions 
    });
  } catch (err) {
    res.status(500).json({ error: 'Get quiz details failed' });
  }
}

async function updateQuiz(req, res) {
  try {
    const { quizId } = req.params;
    const updateSchema = Joi.object({
      title: Joi.string().min(2).optional(),
      description: Joi.string().allow('').optional(),
      openAt: Joi.date().optional(),
      closeAt: Joi.date().optional(),
      durationMinutes: Joi.number().integer().min(1).optional(),
      attemptsAllowed: Joi.number().integer().min(1).optional(),
    }).custom((value, helpers) => {
      if (value.openAt && value.closeAt && new Date(value.openAt) >= new Date(value.closeAt)) {
        return helpers.error('any.invalid', { message: 'openAt must be before closeAt' });
      }
      return value;
    });

    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    if (value.title !== undefined) quiz.title = value.title;
    if (value.description !== undefined) quiz.description = value.description;
    if (value.openAt !== undefined) quiz.openAt = value.openAt;
    if (value.closeAt !== undefined) quiz.closeAt = value.closeAt;
    if (value.durationMinutes !== undefined) quiz.durationMinutes = value.durationMinutes;
    if (value.attemptsAllowed !== undefined) quiz.attemptsAllowed = value.attemptsAllowed;

    await quiz.save();
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ error: 'Update quiz failed' });
  }
}

async function deleteQuiz(req, res) {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await Question.deleteMany({ quiz: quiz._id });
    await Quiz.findByIdAndDelete(quizId);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete quiz failed' });
  }
}

async function createQuizFromBody(req, res) {
  try {
    const { courseId, ...payload } = req.body || {};
    const { value, error } = createSchema.validate(payload);
    if (error) return res.status(400).json({ error: error.details[0].message });
    
    
    if (!courseId) return res.status(400).json({ error: 'courseId is required' });
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const quiz = await Quiz.create({ course: course._id, ...value, published: false });
    res.status(201).json({ quiz });
  } catch (err) {
    res.status(500).json({ error: 'Create quiz failed' });
  }
}

module.exports = { createQuiz, createQuizFromBody, addQuestion, addQuestionViaBody, updateQuestion, deleteQuestion, publishQuiz, listCourseQuizzes, listAvailableQuizzes, getQuizDetails, updateQuiz, deleteQuiz };
