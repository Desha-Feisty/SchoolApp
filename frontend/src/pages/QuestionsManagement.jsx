import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit3, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';

const QuestionsManagement = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1
  });

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      
      // Fetch quiz details and questions
      const quizResponse = await axios.get(`http://localhost:3000/quizzes/${quizId}`);
      setQuiz(quizResponse.data.quiz);
      setQuestions(quizResponse.data.questions || []);
      
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      toast.error('Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    
    try {
      // Transform frontend data to match backend expectations
      let choices;
      
      if (formData.type === 'true_false') {
        // For true/false questions, create exactly 2 choices
        choices = [
          { text: 'True', isCorrect: formData.correctAnswer === 0 },
          { text: 'False', isCorrect: formData.correctAnswer === 1 }
        ];
      } else {
        // For multiple choice questions, use the options array
        const filteredOptions = formData.options.filter(opt => opt.trim() !== '');
        choices = filteredOptions.map((option, index) => ({
          text: option,
          isCorrect: index === formData.correctAnswer
        }));
      }
      
      const response = await axios.post(`http://localhost:3000/quizzes/${quizId}/questions`, {
        prompt: formData.question, // Backend expects 'prompt' not 'question'
        points: formData.points,
        orderIndex: questions.length, // Add order index
        choices: choices // Backend expects 'choices' not 'options'
      });
      
      setQuestions([...questions, response.data.question]);
      setFormData({
        question: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 1
      });
      setShowCreateForm(false);
      
      toast.success('Question created successfully!');
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error(error.response?.data?.error || 'Failed to create question');
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    
    try {
      // Transform frontend data to match backend expectations
      let choices;
      
      if (formData.type === 'true_false') {
        // For true/false questions, create exactly 2 choices
        choices = [
          { text: 'True', isCorrect: formData.correctAnswer === 0 },
          { text: 'False', isCorrect: formData.correctAnswer === 1 }
        ];
      } else {
        // For multiple choice questions, use the options array
        const filteredOptions = formData.options.filter(opt => opt.trim() !== '');
        choices = filteredOptions.map((option, index) => ({
          text: option,
          isCorrect: index === formData.correctAnswer
        }));
      }
      
      const response = await axios.put(`http://localhost:3000/quizzes/${quizId}/questions/${editingQuestion._id}`, {
        prompt: formData.question, // Backend expects 'prompt' not 'question'
        points: formData.points,
        choices: choices // Backend expects 'choices' not 'options'
      });
      
      setQuestions(questions.map(q => 
        q._id === editingQuestion._id ? response.data.question : q
      ));
      setEditingQuestion(null);
      setFormData({
        question: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 1
      });
      
      toast.success('Question updated successfully!');
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error(error.response?.data?.error || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/quizzes/${quizId}/questions/${questionId}`);
      setQuestions(questions.filter(q => q._id !== questionId));
      toast.success('Question deleted successfully!');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const startEditing = (question) => {
    setEditingQuestion(question);
    // Transform backend data to frontend format
    const correctAnswerIndex = question.choices.findIndex(choice => choice.isCorrect);
    setFormData({
      question: question.prompt, // Backend uses 'prompt', frontend uses 'question'
      type: 'multiple_choice', // Backend only supports mcq_single
      options: [...question.choices.map(choice => choice.text), '', '', '', ''].slice(0, 4),
      correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
      points: question.points
    });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({ ...formData, options: [...formData.options, ''] });
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      const newCorrectAnswer = formData.correctAnswer >= index ? Math.max(0, formData.correctAnswer - 1) : formData.correctAnswer;
      setFormData({ ...formData, options: newOptions, correctAnswer: newCorrectAnswer });
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/courses/${quiz?.course?._id}/quizzes`} className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Back to Quizzes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{quiz?.title || 'Quiz'}</h1>
          <p className="text-gray-600 mt-1">Manage questions for this quiz</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </button>
      </div>

      {/* Create/Edit Question Form */}
      {(showCreateForm || editingQuestion) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingQuestion ? 'Edit Question' : 'Create New Question'}
          </h2>
          
          <form onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion} className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              <textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your question"
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                  Points *
                </label>
                <input
                  type="number"
                  id="points"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>
            
            {formData.type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options (mark the correct answer)
                </label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === index}
                        onChange={() => setFormData({ ...formData, correctAnswer: index })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {formData.options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}
            
            {formData.type === 'true_false' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={formData.correctAnswer === 0}
                      onChange={() => setFormData({ ...formData, correctAnswer: 0 })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-2"
                    />
                    True
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={formData.correctAnswer === 1}
                      onChange={() => setFormData({ ...formData, correctAnswer: 1 })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-2"
                    />
                    False
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingQuestion ? 'Update Question' : 'Create Question'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingQuestion(null);
                  setFormData({
                    question: '',
                    type: 'multiple_choice',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    points: 1
                  });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Questions ({questions.length})</h2>
        </div>
        
        <div className="p-6">
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <Edit3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-500">Add your first question to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          Q{index + 1}
                        </span>
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                          {question.points} pts
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mt-2">{question.prompt}</h3>
                      
                      <div className="mt-3 space-y-1">
                        {question.choices.map((choice, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center space-x-2 p-2 rounded ${
                              choice.isCorrect
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className={`text-sm font-medium ${
                              choice.isCorrect ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className={`text-sm ${
                              choice.isCorrect ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {choice.text}
                            </span>
                            {choice.isCorrect && (
                              <span className="text-green-600 text-xs font-medium ml-auto">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex space-x-2">
                      <button
                        onClick={() => startEditing(question)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question._id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center text-sm"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionsManagement;