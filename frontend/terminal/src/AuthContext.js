import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dashboard_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('dashboard_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    setUser(userData);
    localStorage.setItem('dashboard_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dashboard_user');
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isViewer = () => {
    return user && user.role === 'viewer';
  };

  const canDesign = () => {
    return user && user.role === 'admin';
  };

  const canView = () => {
    return user && (user.role === 'admin' || user.role === 'viewer');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isViewer,
    canDesign,
    canView,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
