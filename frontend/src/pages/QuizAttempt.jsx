import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Clock, CheckCircle, AlertCircle, Play, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    startQuizAttempt();
  }, [quizId]);

  useEffect(() => {
    if (attempt && attempt.endAt) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const endTime = new Date(attempt.endAt).getTime();
        const remaining = Math.max(0, endTime - now);
        
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
          handleAutoSubmit();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [attempt]);

  const startQuizAttempt = async () => {
    try {
      setLoading(true);
      
      // Start the attempt
      const attemptResponse = await axios.post(`http://localhost:3000/attempts/${quizId}/attempts/start`);
      setAttempt(attemptResponse.data);
      setQuestions(attemptResponse.data.questions);
      
      // Fetch quiz details
      const quizResponse = await axios.get(`http://localhost:3000/quizzes/${quizId}`);
      setQuiz(quizResponse.data.quiz);
      
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      toast.error(error.response?.data?.error || 'Failed to start quiz attempt');
      navigate('/student-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }));
    
    // Auto-save answer
    autoSaveAnswer(questionId, choiceId);
  };

  const autoSaveAnswer = async (questionId, choiceId) => {
    try {
      await axios.patch(`http://localhost:3000/attempts/${attempt.attemptId}/answers`, {
        questionId,
        selectedChoiceIds: [choiceId]
      });
    } catch (error) {
      console.error('Error auto-saving answer:', error);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit your quiz? You cannot change your answers after submission.')) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Submit all answers first
      for (const [questionId, choiceId] of Object.entries(answers)) {
        await autoSaveAnswer(questionId, choiceId);
      }
      
      // Submit the attempt
      const response = await axios.post(`http://localhost:3000/attempts/${attempt.attemptId}/submit`);
      
      toast.success(`Quiz submitted successfully! Your score: ${response.data.score}/${questions.length}`);
      navigate('/student-dashboard');
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error(error.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      toast.warning('Time is up! Submitting your quiz...');
      await handleSubmit();
    } catch (error) {
      toast.error('Failed to auto-submit quiz');
      navigate('/student-dashboard');
    }
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz not available</h3>
          <p className="text-gray-500">This quiz may have expired or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-600 mt-1">{quiz.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              Course: {quiz.course.title} • {questions.length} questions • {quiz.durationMinutes} minutes
            </p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              timeRemaining < 60000 ? 'text-red-600' : 'text-blue-600'
            }`}>
              <Clock className="h-6 w-6 inline mr-2" />
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-500">Time remaining</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Question {index + 1} of {questions.length}
              </h3>
              <p className="text-gray-700 mt-2">{question.prompt}</p>
            </div>
            
            <div className="space-y-3">
              {question.choices.map((choice) => (
                <label
                  key={choice.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    answers[question.id] === choice.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={choice.id}
                    checked={answers[question.id] === choice.id}
                    onChange={() => handleAnswerChange(question.id, choice.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700">{choice.text}</span>
                  {answers[question.id] === choice.id && (
                    <CheckCircle className="h-5 w-5 text-blue-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Answered: {Object.keys(answers).length} of {questions.length} questions</p>
            <p className="mt-1">
              {Object.keys(answers).length === questions.length ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  All questions answered!
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {questions.length - Object.keys(answers).length} questions remaining
                </span>
              )}
            </p>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length === 0}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;