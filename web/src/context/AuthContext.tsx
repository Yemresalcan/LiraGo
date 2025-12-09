'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  username: string;
  displayName: string;
  role: 'admin';
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in from localStorage
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('adminUser');
      }
    } else {
      // Redirect to login if not authenticated and not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        router.push('/login');
      }
    }
    setLoading(false);
  }, [router]);

  const signIn = async (username: string, password: string) => {
    try {
      // Validate credentials via server-side API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid username or password');
      }

      const data = await response.json();
      const adminUser: AdminUser = {
        username: data.username,
        displayName: data.displayName || 'Admin',
        role: 'admin'
      };
      
      // Store in localStorage
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      setUser(adminUser);
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('adminUser');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
