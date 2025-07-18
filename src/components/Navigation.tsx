import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from './AdminLogin';
import { useState } from 'react';

function Navigation() {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      logout();
    } else {
      setShowAdminLogin(true);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
              <MapPin className="h-6 w-6" />
              <span className="font-semibold text-lg">Know Borivali</span>
            </Link>

            <div className="flex items-center space-x-8">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-4' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/resources" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/resources') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-4' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Resources
              </Link>
              <Link 
                to="/add-resource" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/add-resource') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-4' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Add Resource
              </Link>
              
              {/* Admin Button */}
              <button
                onClick={handleAdminClick}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  isAdmin 
                    ? 'text-red-600 hover:text-red-700' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {isAdmin ? (
                  <>
                    <LogOut className="h-4 w-4" />
                    Logout Admin
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin onClose={() => setShowAdminLogin(false)} />
      )}
    </>
  );
}

export default Navigation;