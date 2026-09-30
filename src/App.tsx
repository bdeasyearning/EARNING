/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { SocialFAB } from './components/SocialFAB';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { EarnGamesPage } from './pages/EarnGamesPage';
import { SpinWheelPage } from './pages/SpinWheelPage';
import { TeamPage } from './pages/TeamPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { IncomeHistoryPage } from './pages/IncomeHistoryPage';
import { PendingStatusPage } from './pages/PendingStatusPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { WifiOff } from 'lucide-react';

const AppContent: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Sync route with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigate = (route: string) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf0] flex flex-col items-center justify-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FF4500] text-white flex items-center justify-center font-black text-2xl border-2 border-[#ffeb3b] shadow-xl animate-pulse">
          ৳
        </div>
        <div className="w-7 h-7 border-3 border-[#d32f2f] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-gray-600">BD Easy Earning লোড হচ্ছে...</span>
      </div>
    );
  }

  // Route renderer
  const renderPage = () => {
    // If not logged in and requesting protected page, route to landing or register
    if (!userProfile && currentRoute !== '/' && currentRoute !== '/register') {
      return <LandingPage navigate={navigate} />;
    }

    switch (currentRoute) {
      case '/':
        return userProfile ? <DashboardPage navigate={navigate} /> : <LandingPage navigate={navigate} />;
      case '/register':
        return <RegisterPage navigate={navigate} />;
      case '/dashboard':
        return <DashboardPage navigate={navigate} />;
      case '/tasks':
        return <TasksPage />;
      case '/earn-games':
        return <EarnGamesPage />;
      case '/spin-wheel':
        return <SpinWheelPage />;
      case '/team':
        return <TeamPage />;
      case '/withdraw':
        return <WithdrawPage navigate={navigate} />;
      case '/leaderboard':
        return <LeaderboardPage />;
      case '/income-history':
        return <IncomeHistoryPage />;
      case '/pending-status':
        return <PendingStatusPage />;
      case '/account':
        return <AccountPage />;
      case '/admin':
        return <AdminPage />;
      default:
        return userProfile ? <DashboardPage navigate={navigate} /> : <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf0] text-gray-900 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-1.5">
          <WifiOff className="w-4 h-4" />
          <span>ইন্টারনেট সংযোগ বিচ্ছিন্ন! আপনি অফলাইন মোডে আছেন।</span>
        </div>
      )}

      {/* Header */}
      <Header currentRoute={currentRoute} navigate={navigate} />

      {/* Main Page Content */}
      <main className="flex-1 pb-20">{renderPage()}</main>

      {/* Persistent Social Floating Action Button on all pages */}
      <SocialFAB />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
