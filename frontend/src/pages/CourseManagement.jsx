import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, BookOpen, Users, Copy, Trash2, Edit3, Eye } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';

const CourseManagement = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/courses');
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:3000/courses', formData);
      
      setCourses([response.data, ...courses]);
      setFormData({ title: '', description: '' });
      setShowCreateForm(false);
      
      toast.success('Course created successfully!');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error.response?.data?.error || 'Failed to create course');
    }
  };

  const handleCopyJoinCode = (joinCode) => {
    navigator.clipboard.writeText(joinCode);
    toast.success('Join code copied to clipboard!');
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/courses/${courseId}`);
      setCourses(courses.filter(course => course._id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const fetchRoster = async (courseId) => {
    try {
      const response = await axios.get(`http://localhost:3000/courses/${courseId}/roster`);
      return response.data.students;
    } catch (error) {
      console.error('Error fetching roster:', error);
      return [];
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-1">Create and manage your courses</p>
        </div>
        
        <button
          onClick={() => {
            console.log('Create Course button clicked, current state:', showCreateForm);
            setShowCreateForm(!showCreateForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </button>
      </div>

      {/* Create Course Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Course</h2>
          
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter course title"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter course description (optional)"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Course
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
        </div>
        
        <div className="p-6">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500">Create your first course to get started with teaching.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{course.description || 'No description available'}</p>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            Join Code: {course.joinCode}
                          </span>
                          <button
                            onClick={() => handleCopyJoinCode(course.joinCode)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                            title="Copy join code"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Created: {new Date(course.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex space-x-2">
                      <Link
                        to={`/courses/${course._id}/quizzes`}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Manage Quizzes
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center text-sm"
                        title="Delete course"
                      >
                        <Trash2 className="h-3 w-3" />
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

export default CourseManagement;