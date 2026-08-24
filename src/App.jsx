import { Toaster } from "@/components/ui/toaster"
import { Toaster as HotToaster } from "react-hot-toast"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import DailyView from './pages/DailyView';
import WeeklyView from './pages/WeeklyView';
import PartnerDashboard from "./pages/PartnerDashboard";
import CalendarView from "./pages/CalendarView";
import GoalsView from "./pages/GoalsView";
import NotesView from "./pages/NotesView";
import AnalyticsView from "./pages/AnalyticsView";
import SettingsView from "./pages/SettingsView";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading ChronosFlow...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show auth screens
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated → show main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DailyView />} />
        <Route path="/weekly" element={<WeeklyView />} />
        <Route path="/partner" element={<PartnerDashboard />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/goals" element={<GoalsView />} />
        <Route path="/notes" element={<NotesView />} />
        <Route path="/analytics" element={<AnalyticsView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
      {/* Redirect auth pages to home if already logged in */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <HotToaster position="top-center" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
