import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'user' | 'owner' | 'admin';
  isVerified: boolean;
  profileImage?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'user' | 'owner';
    otp: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getProfile();
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      console.error('Login error in AuthContext:', error);
      // Provide more specific error messages
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.error || 'Invalid input data');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(error.response?.data?.error || 'Login failed. Please try again.');
      }
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'user' | 'owner';
    otp: string;
  }) => {
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
