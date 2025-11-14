const mongoose = require('mongoose');

const choiceSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
}, { _id: true });

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  type: { type: String, enum: ['mcq_single'], required: true },
  prompt: { type: String, required: true },
  points: { type: Number, default: 1 },
  orderIndex: { type: Number, default: 0 },
  choices: [choiceSchema],
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);