import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { LogOut, User, FileText, Users } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <FileText className="inline mr-2" size={20} />
            Testimonials Admin
          </Link>
          
          <ul className="nav-links">
            <li>
              <Link 
                to="/testimonials" 
                className={isActive('/testimonials') ? 'active' : ''}
              >
                <FileText className="inline mr-1" size={16} />
                Testimonials
              </Link>
            </li>
            <li>
              <Link 
                to="/users" 
                className={isActive('/users') ? 'active' : ''}
              >
                <Users className="inline mr-1" size={16} />
                Users
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              <User className="inline mr-1" size={16} />
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container">
        {children}
      </main>
    </div>
  );
};

export default Layout;