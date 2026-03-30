import { useEffect, useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MemoryGame from './pages/games/MemoryGame';
import ReactionGame from './pages/games/ReactionGame';
import PatternGame from './pages/games/PatternGame';
import ReadingGame from './pages/games/ReadingGame';
import AITutor from './pages/AITutor';
import Analytics from './pages/Analytics';
import { Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const getAuthToken = () => localStorage.getItem('neurobuddy_token');

export const setAuthToken = (token) => localStorage.setItem('neurobuddy_token', token);

export const clearAuthToken = () => localStorage.removeItem('neurobuddy_token');

export const isAuthenticated = () => !!getAuthToken();

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App">
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/memory"
            element={
              <ProtectedRoute>
                <MemoryGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reaction"
            element={
              <ProtectedRoute>
                <ReactionGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/pattern"
            element={
              <ProtectedRoute>
                <PatternGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading"
            element={
              <ProtectedRoute>
                <ReadingGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor"
            element={
              <ProtectedRoute>
                <AITutor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;