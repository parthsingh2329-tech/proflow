import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
          <div className="max-w-lg w-full bg-slate-800 p-6 rounded-xl border border-rose-500/50 shadow-2xl">
            <h2 className="text-xl font-bold text-rose-400 mb-2">Something went wrong</h2>
            <pre className="text-xs bg-slate-950 p-3 rounded text-rose-300 overflow-x-auto mb-4 font-mono">
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg"
            >
              Reset & Go to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<div className="p-8 text-center text-slate-500">404 Not Found</div>} />
      </Routes>
    </ErrorBoundary>
  );
}
