const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedChoiceIds: [{ type: mongoose.Schema.Types.ObjectId }],
  pointsAwarded: { type: Number, default: 0 },
});

const attemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  submittedAt: { type: Date },
  status: { type: String, enum: ['in_progress', 'submitted', 'graded', 'expired'], default: 'in_progress' },
  score: { type: Number, default: 0 },
  responses: [responseSchema],
}, { timestamps: true });

attemptSchema.index({ quiz: 1, user: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);