import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import QuizAttempt from './pages/QuizAttempt';
import CourseManagement from './pages/CourseManagement';
import QuizManagement from './pages/QuizManagement';
import QuestionsManagement from './pages/QuestionsManagement';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Dashboard redirect based on role
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return user.role === 'teacher' 
    ? <Navigate to="/teacher-dashboard" replace />
    : <Navigate to="/student-dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Dashboard redirect */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              
              {/* Student routes */}
              <Route 
                path="/student-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher routes */}
              <Route 
                path="/teacher-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/courses" 
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <CourseManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/courses/:courseId/quizzes" 
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <QuizManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/quizzes/:quizId/questions" 
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <QuestionsManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* Quiz attempt route */}
              <Route 
                path="/quizzes/:quizId/attempt" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <QuizAttempt />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<DashboardRedirect />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;