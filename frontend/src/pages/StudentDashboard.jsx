import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { BookOpen, Clock, Play, CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [myGrades, setMyGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch available quizzes
      const quizzesResponse = await axios.get('http://localhost:3000/quizzes/available', { headers });
      setAvailableQuizzes(quizzesResponse.data.quizzes || []);
      
      // Fetch enrolled courses
      const coursesResponse = await axios.get('http://localhost:3000/courses', { headers });
      setEnrolledCourses(coursesResponse.data.courses || []);
      
      // Fetch my grades
      const gradesResponse = await axios.get('http://localhost:3000/attempts/my', { headers });
      setMyGrades(gradesResponse.data.results || []);
      
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard data');
      toast.error(error.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCourse = async () => {
    try {
      if (!joinCode.trim()) return;
      setJoining(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post('http://localhost:3000/courses/join', { joinCode: joinCode.trim() }, { headers });
      setJoinCode('');
      toast.success('Joined course successfully');
      await fetchStudentData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join course');
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isQuizOpen = (quiz) => {
    const now = new Date();
    const openAt = new Date(quiz.openAt);
    const closeAt = new Date(quiz.closeAt);
    return now >= openAt && now <= closeAt;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchStudentData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
        <p className="text-blue-100">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{availableQuizzes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {availableQuizzes.filter(quiz => {
                  const quizDate = new Date(quiz.openAt);
                  const weekFromNow = new Date();
                  weekFromNow.setDate(weekFromNow.getDate() + 7);
                  return quizDate <= weekFromNow;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Course */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Join a Course</h2>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter join code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleJoinCourse}
            disabled={!joinCode.trim() || joining}
            className={`px-4 py-2 rounded-md text-white ${joining ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
          >
            {joining ? 'Joining...' : 'Join Course'}
          </button>
        </div>
      </div>

      {/* Available Quizzes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Play className="h-5 w-5 mr-2 text-blue-600" />
            Available Quizzes
          </h2>
        </div>
        
        <div className="p-6">
          {availableQuizzes.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes available</h3>
              <p className="text-gray-500">Check back later for new quizzes from your teachers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableQuizzes.map((quiz) => (
                <div key={quiz._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{quiz.description || 'No description available'}</p>
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {quiz.course.title}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {quiz.durationMinutes} minutes
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {quiz.attemptsAllowed} attempt{quiz.attemptsAllowed !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-gray-500">
                          Opens: {formatDate(quiz.openAt)}
                        </span>
                        <span className="text-gray-500">
                          Closes: {formatDate(quiz.closeAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      {isQuizOpen(quiz) ? (
                        <Link
                          to={`/quizzes/${quiz._id}/attempt`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Quiz
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed flex items-center"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Not Available
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600" />
            My Courses
          </h2>
        </div>
        
        <div className="p-6">
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
              <p className="text-gray-500">Join a course using a join code from your teacher.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((course) => (
                <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.description || 'No description available'}</p>
                  <div className="mt-3 text-sm text-gray-500">
                    Join Code: {course.joinCode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Grades */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Grades</h2>
        </div>
        <div className="p-6">
          {myGrades.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No grades yet</h3>
              <p className="text-gray-500">Submit quizzes to see your scores here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">Course</th>
                    <th className="py-2 pr-4">Quiz</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {myGrades.map((g) => (
                    <tr key={g.attemptId} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{g.course?.title}</td>
                      <td className="py-2 pr-4">{g.quiz?.title}</td>
                      <td className="py-2 pr-4 font-medium text-gray-900">{g.score}</td>
                      <td className="py-2 pr-4">{g.submittedAt ? formatDate(g.submittedAt) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;