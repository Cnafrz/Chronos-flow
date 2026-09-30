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

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex flex-col w-64 border-r border-border bg-card/30 p-4 gap-4 shrink-0">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-md mb-8" />
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-full bg-muted animate-pulse rounded-md mt-auto" />
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4 mt-12 md:mt-0">
            <div>
              <div className="h-10 w-48 bg-muted animate-pulse rounded-md mb-2" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="hidden sm:block h-10 w-24 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-32 w-full bg-muted animate-pulse rounded-2xl shrink-0" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
            <div className="h-full w-full bg-muted animate-pulse rounded-xl" />
            <div className="h-full w-full bg-muted animate-pulse rounded-xl hidden md:block" />
            <div className="h-full w-full bg-muted animate-pulse rounded-xl hidden md:block" />
          </div>
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
