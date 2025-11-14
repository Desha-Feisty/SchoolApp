const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roleInCourse: { type: String, enum: ['student', 'TA'], default: 'student' },
  status: { type: String, enum: ['active', 'removed'], default: 'active' },
}, { timestamps: true });

enrollmentSchema.index({ course: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);