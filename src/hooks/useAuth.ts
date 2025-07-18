import { useState, useEffect } from 'react';

export interface User {
  isAdmin: boolean;
  username: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('know-borivali-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('know-borivali-user');
      }
    }
    setLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    // Simple admin login - in production this would be more secure
    if (username === 'qwerty' && password === 'qwerty') {
      const adminUser: User = {
        isAdmin: true,
        username: 'admin'
      };
      setUser(adminUser);
      localStorage.setItem('know-borivali-user', JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('know-borivali-user');
    // Refresh the page to clear admin view
    window.location.reload();
  };

  return {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.isAdmin || false
  };
}