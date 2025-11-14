const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String },
  openAt: { type: Date, required: true },
  closeAt: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  attemptsAllowed: { type: Number, default: 1 },
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);