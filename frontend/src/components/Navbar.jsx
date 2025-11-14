import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, PlusCircle, List, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-gray-800 hover:text-gray-600">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">SchoolApp</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {user.role === 'teacher' ? (
                  <>
                    <Link 
                      to="/teacher-dashboard" 
                      className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                    >
                      <List className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      to="/courses" 
                      className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Courses</span>
                    </Link>
                  </>
                ) : (
                  <Link 
                    to="/student-dashboard" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <List className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* User Info & Logout */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-md"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {user ? (
              <div className="space-y-2">
                {user.role === 'teacher' ? (
                  <>
                    <Link 
                      to="/teacher-dashboard" 
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <List className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      to="/courses" 
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Courses</span>
                    </Link>
                  </>
                ) : (
                  <Link 
                    to="/student-dashboard" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <List className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex items-center space-x-2 text-gray-600 px-3 py-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;