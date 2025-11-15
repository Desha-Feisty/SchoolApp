import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, BookOpen, Users, Clock, BarChart3, Edit, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalQuizzes: 0,
    totalStudents: 0,
    activeQuizzes: 0
  });

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure auth header is present
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch teacher's courses
      const coursesResponse = await axios.get('http://localhost:3000/courses', { headers });
      const teacherCourses = coursesResponse.data.courses;
      setCourses(teacherCourses);
      
      // Calculate stats
      let totalQuizzes = 0;
      let totalStudents = 0;
      let activeQuizzes = 0;
      const allQuizzes = [];
      
      for (const course of teacherCourses) {
        try {
          const quizzesResponse = await axios.get(`http://localhost:3000/quizzes/${course._id}/quizzes`, { headers });
          const courseQuizzes = quizzesResponse.data.quizzes;
          totalQuizzes += courseQuizzes.length;
          
          // Count active quizzes (published and within time window)
          const now = new Date();
          activeQuizzes += courseQuizzes.filter(quiz => 
            quiz.published && 
            new Date(quiz.openAt) <= now && 
            new Date(quiz.closeAt) >= now
          ).length;
          
          allQuizzes.push(...courseQuizzes.slice(0, 3)); // Take first 3 quizzes from each course
          
          // Get roster for student count
          const rosterResponse = await axios.get(`http://localhost:3000/courses/${course._id}/roster`, { headers });
          totalStudents += (rosterResponse.data.roster || []).length;
        } catch (error) {
          console.error(`Error fetching data for course ${course._id}:`, error);
        }
      }
      
      setRecentQuizzes(allQuizzes.slice(0, 5)); // Take 5 most recent quizzes
      setStats({
        totalCourses: teacherCourses.length,
        totalQuizzes,
        totalStudents,
        activeQuizzes
      });
      
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard data');
      toast.error(error.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
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
            onClick={fetchTeacherData}
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Professor {user.name}!</h1>
        <p className="text-purple-100">Manage your courses and track student progress.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 rounded-full p-3">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeQuizzes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/courses"
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600 font-medium">Create New Course</span>
            </Link>
            
            {courses.length > 0 && (
              <Link
                to={`/courses/${courses[0]._id}/quizzes`}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <Plus className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-gray-600 font-medium">Create New Quiz</span>
              </Link>
            )}
            
            <button
              onClick={() => fetchTeacherData()}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600 font-medium">Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Quizzes */}
      {recentQuizzes.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Recent Quizzes
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentQuizzes.map((quiz) => (
                <div key={quiz._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Course: {courses.find(c => c._id === quiz.course)? courses.find(c => c._id === quiz.course).title : 'Unknown'}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {quiz.durationMinutes} minutes
                        </div>
                        <div className="flex items-center">
                          Status: 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            quiz.published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {quiz.published ? 'Published' : 'Draft'}
                          </span>
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
                      <Link
                        to={`/courses/${quiz.course}/quizzes`}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-green-600" />
            My Courses
          </h2>
        </div>
        <div className="p-6">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full p-6 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-4">Create your first course to get started.</p>
              <Link
                to="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.description || 'No description available'}</p>
                  
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <div>Join Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{course.joinCode}</span></div>
                    <div>Created: {new Date(course.createdAt).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Link
                      to={`/courses/${course._id}/quizzes`}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm text-center"
                    >
                      Manage Quizzes
                    </Link>
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

export default TeacherDashboard;