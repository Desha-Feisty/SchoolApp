const Joi = require('joi');
const dayjs = require('dayjs');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');

async function ensureEnrollment(userId, courseId) {
  const enr = await Enrollment.findOne({ user: userId, course: courseId });
  return !!enr && enr.status === 'active';
}

async function countAttempts(userId, quizId) {
  return Attempt.countDocuments({ user: userId, quiz: quizId, status: { $in: ['in_progress', 'submitted', 'graded'] } });
}

async function startAttempt(req, res) {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    
    const now = dayjs();
    if (!quiz.published) return res.status(400).json({ error: 'Quiz not published' });
    if (now.isBefore(dayjs(quiz.openAt))) {
      return res.status(400).json({ error: 'Quiz not yet open' });
    }
    if (now.isAfter(dayjs(quiz.closeAt))) {
      return res.status(400).json({ error: 'Quiz has closed' });
    }
    
    // Check enrollment - convert ObjectId to string for comparison
    const enrolled = await ensureEnrollment(req.user.id, quiz.course.toString());
    if (!enrolled) {
      console.log(`Enrollment check failed: user ${req.user.id}, course ${quiz.course.toString()}, quiz ${quizId}`);
      return res.status(403).json({ error: 'Not enrolled in course' });
    }

    // Cleanup expired in_progress attempts so they don't block new attempts
    await Attempt.updateMany(
      { user: req.user.id, quiz: quiz._id, status: 'in_progress', endAt: { $lte: now.toDate() } },
      { $set: { status: 'expired' } }
    );

    // Resume existing active attempt if present
    const activeAttempt = await Attempt.findOne({ user: req.user.id, quiz: quiz._id, status: 'in_progress', endAt: { $gt: now.toDate() } }).lean();
    if (activeAttempt) {
      const questions = await Question.find({ quiz: quiz._id }).sort({ orderIndex: 1 }).lean();
      return res.status(200).json({ attemptId: activeAttempt._id, endAt: activeAttempt.endAt, questions: questions.map(q => ({ id: q._id, prompt: q.prompt, choices: q.choices.map(c => ({ id: c._id, text: c.text })) })) });
    }

    const taken = await countAttempts(req.user.id, quizId);
    if (taken >= (quiz.attemptsAllowed || 1)) {
      return res.status(400).json({ error: `Attempts exhausted (${taken}/${quiz.attemptsAllowed || 1} used)` });
    }

    // Calculate end time: either quiz close time or duration from now, whichever comes first
    const durationEnd = now.add(quiz.durationMinutes, 'minute');
    const quizEnd = dayjs(quiz.closeAt);
    const endAt = durationEnd.isBefore(quizEnd) ? durationEnd.toDate() : quizEnd.toDate();
    const questions = await Question.find({ quiz: quiz._id }).sort({ orderIndex: 1 }).lean();
    const responses = questions.map(q => ({ question: q._id, selectedChoiceIds: [], pointsAwarded: 0 }));
    const attempt = await Attempt.create({ quiz: quiz._id, user: req.user.id, startedAt: now.toDate(), endAt, responses });
    res.status(201).json({ attemptId: attempt._id, endAt, questions: questions.map(q => ({ id: q._id, prompt: q.prompt, choices: q.choices.map(c => ({ id: c._id, text: c.text })) })) });
  } catch (err) {
    console.error('Start attempt error:', err);
    res.status(500).json({ error: 'Start attempt failed' });
  }
}

const autosaveSchema = Joi.object({
  questionId: Joi.string().required(),
  selectedChoiceIds: Joi.array().items(Joi.string()).required(),
});

async function autosaveAnswer(req, res) {
  try {
    const { value, error } = autosaveSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { attemptId } = req.params;
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const now = dayjs();
    if (now.isAfter(dayjs(attempt.endAt))) return res.status(400).json({ error: 'Attempt expired' });
    const resp = attempt.responses.find(r => r.question.toString() === value.questionId);
    if (!resp) return res.status(404).json({ error: 'Response not found' });
    resp.selectedChoiceIds = value.selectedChoiceIds;
    await attempt.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Autosave failed' });
  }
}

async function submitAttempt(req, res) {
  try {
    const { attemptId } = req.params;
    const attempt = await Attempt.findById(attemptId).populate({ path: 'responses.question', model: 'Question' });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const now = dayjs();
    if (now.isAfter(dayjs(attempt.endAt))) {
      attempt.status = 'expired';
      await attempt.save();
      return res.status(400).json({ error: 'Attempt expired' });
    }
    // Auto-grade MCQ single
    let total = 0;
    for (const resp of attempt.responses) {
      const q = resp.question;
      const correctChoice = q.choices.find(c => c.isCorrect);
      const isCorrect = correctChoice && resp.selectedChoiceIds.length === 1 && resp.selectedChoiceIds[0].toString() === correctChoice._id.toString();
      resp.pointsAwarded = isCorrect ? (q.points || 1) : 0;
      total += resp.pointsAwarded;
    }
    attempt.score = total;
    attempt.status = 'graded';
    attempt.submittedAt = now.toDate();
    await attempt.save();
    res.json({ score: total });
  } catch (err) {
    res.status(500).json({ error: 'Submit failed' });
  }
}

async function getResult(req, res) {
  try {
    const { attemptId } = req.params;
    const attempt = await Attempt.findById(attemptId).populate({ path: 'responses.question', model: 'Question' });
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.user.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({ status: attempt.status, score: attempt.score, submittedAt: attempt.submittedAt });
  } catch (err) {
    res.status(500).json({ error: 'Get result failed' });
  }
}

async function listQuizGrades(req, res) {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.course.teacher.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const attempts = await Attempt.find({ quiz: quiz._id, status: 'graded' })
      .populate('user', 'name email')
      .select('user score submittedAt status')
      .sort({ submittedAt: -1 })
      .lean();
    const results = attempts.map(a => ({
      attemptId: a._id,
      student: a.user,
      score: a.score,
      submittedAt: a.submittedAt,
      status: a.status,
    }));
    res.json({ quiz: { _id: quiz._id, title: quiz.title }, results });
  } catch (err) {
    res.status(500).json({ error: 'List grades failed' });
  }
}

module.exports = { startAttempt, autosaveAnswer, submitAttempt, getResult, listQuizGrades };
async function listMyGrades(req, res) {
  try {
    const attempts = await Attempt.find({ user: req.user.id, status: 'graded' })
      .populate({ path: 'quiz', select: 'title course', populate: { path: 'course', select: 'title' } })
      .select('quiz score submittedAt status')
      .sort({ submittedAt: -1 })
      .lean();
    const results = attempts.map(a => ({
      attemptId: a._id,
      quiz: { _id: a.quiz?._id, title: a.quiz?.title || 'Unknown Quiz' },
      course: { _id: a.quiz?.course?._id, title: a.quiz?.course?.title || 'Unknown Course' },
      score: a.score,
      submittedAt: a.submittedAt,
      status: a.status,
    }));
    res.json({ results });
  } catch (err) {
    console.error('listMyGrades error:', err);
    res.status(500).json({ error: 'List my grades failed' });
  }
}

module.exports.listMyGrades = listMyGrades;