import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TravelDashboard from './pages/TravelDashboard';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import ExplorePage from './pages/ExplorePage';
import TripDetailPage from './pages/TripDetailPage';
import MyTripsPage from './pages/MyTripsPage';
import TripPage from './pages/TripPage';
import ExpensePage from './pages/ExpensePage';
import BookingsPage from './pages/BookingsPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import RecommendationPage from './pages/RecommendationPage';
import useAuthStore from './store/authStore';

import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';

// ── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />;
  return children;
}

// ── Guest Route ───────────────────────────────────────────────────────────────
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/explore" replace />;
  return children;
}

export default function App() {
  return (
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* Public */}
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/explore"  element={<ExplorePage />} />
          <Route path="/explore/:id" element={<TripDetailPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

          {/* Authenticated user */}
          <Route path="/dashboard" element={
            <ProtectedRoute><TravelDashboard /></ProtectedRoute>} />
          <Route path="/trips" element={
            <ProtectedRoute><MyTripsPage /></ProtectedRoute>} />
          <Route path="/trips/:id" element={
            <ProtectedRoute><TripPage /></ProtectedRoute>} />
          <Route path="/trips/:tripId/expenses" element={
            <ProtectedRoute><ExpensePage /></ProtectedRoute>} />
          <Route path="/bookings" element={
            <ProtectedRoute><BookingsPage /></ProtectedRoute>} />
          <Route path="/expenses" element={
            <ProtectedRoute><MyTripsPage expenseMode /></ProtectedRoute>} />
          <Route path="/recommend" element={
            <ProtectedRoute><RecommendationPage /></ProtectedRoute>} />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/packages/new" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/predefined/new" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/packages" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />

        <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
              },
            }}
        />
      </BrowserRouter>
  );
}
