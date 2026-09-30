import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Bell,
  Wallet,
  Home,
  CheckSquare,
  PlayCircle,
  Dices,
  Users,
  ArrowDownToLine,
  Trophy,
  History,
  Clock,
  User,
  ShieldCheck,
  LogOut,
  Download,
  Youtube,
  Send,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationModal } from './NotificationModal';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { playSuccessChime } from '../utils/security';

interface HeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, navigate }) => {
  const { userProfile, currentUser, logout, isAdmin } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // Real-time unread notification count
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((d) => {
        const data = d.data();
        if ((data.userId === currentUser.uid || !data.userId || data.userId === 'all') && !data.isRead) {
          count++;
        }
      });
      if (count > unreadCount && unreadCount !== 0) {
        playSuccessChime();
      }
      setUnreadCount(count);
    });
    return () => unsub();
  }, [currentUser]);

  const navLinks = [
    { route: '/dashboard', label: 'হোম ড্যাশবোর্ড', icon: Home },
    { route: '/tasks', label: 'দৈনিক কাজ (Tasks)', icon: CheckSquare },
    { route: '/earn-games', label: 'বিজ্ঞাপন দেখুন (৳২০০/দিন)', icon: PlayCircle, highlight: true },
    { route: '/spin-wheel', label: 'স্পিন অ্যান্ড আর্ন', icon: Dices },
    { route: '/team', label: 'আমার টিম (রেফার ৳৭০)', icon: Users, badge: '৳৭০' },
    { route: '/withdraw', label: 'উত্তোলন (Withdraw)', icon: ArrowDownToLine },
    { route: '/leaderboard', label: 'সেরা আর্নার তালিকা', icon: Trophy },
    { route: '/income-history', label: 'আয়ের ইতিহাস', icon: History },
    { route: '/pending-status', label: 'পেন্ডিং রিকোয়েস্ট', icon: Clock },
    { route: '/account', label: 'অ্যাকাউন্ট সেটিংস', icon: User },
  ];

  if (isAdmin) {
    navLinks.push({ route: '/admin', label: 'অ্যাডমিন প্যানেল 🛡️', icon: ShieldCheck, highlight: true });
  }

  const handleNav = (route: string) => {
    navigate(route);
    setDrawerOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FF4500] text-white shadow-md border-b-2 border-[#ffeb3b]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-1 rounded-xl hover:bg-black/15 text-white active:scale-95 transition"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-[#ffeb3b]" />
            </button>

            <button
              onClick={() => navigate(userProfile ? '/dashboard' : '/')}
              className="flex items-center gap-2 text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffeb3b] to-[#fbc02d] text-[#d32f2f] flex items-center justify-center font-black text-xl shadow-inner border border-white">
                ৳
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-white flex items-center gap-1 font-['Poppins']">
                  BD Easy Earning
                </span>
                <span className="text-[10px] text-[#ffeb3b] font-medium leading-none">
                  সহজে আয় করুন, প্রতিদিন!
                </span>
              </div>
            </button>
          </div>

          {/* Right: Balance Pill & Notification & PWA Install */}
          <div className="flex items-center gap-2">
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-gray-900 text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm animate-pulse transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>অ্যাপ ইন্সটল</span>
              </button>
            )}

            {userProfile && (
              <button
                onClick={() => navigate('/withdraw')}
                className="flex items-center gap-1.5 bg-[#fffdf0] text-[#d32f2f] font-bold px-3 py-1.5 rounded-full shadow border-2 border-[#ffeb3b] text-xs sm:text-sm hover:scale-105 active:scale-95 transition"
              >
                <Wallet className="w-4 h-4 text-[#d32f2f]" />
                <span className="font-['Poppins']">৳ {(userProfile.balance || 0).toFixed(2)}</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 rounded-xl hover:bg-black/15 text-white active:scale-90 transition"
              title="নোটিফিকেশন"
            >
              <Bell className="w-5 h-5 text-[#ffeb3b]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#d32f2f] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 sm:w-80 max-w-full bg-[#fffdf0] h-full shadow-2xl flex flex-col z-10 border-r-4 border-[#FF4500] animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="bg-[#FF4500] p-4 text-white flex items-center justify-between border-b-2 border-[#ffeb3b]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#ffeb3b] text-[#d32f2f] flex items-center justify-center font-black text-xl border-2 border-white shadow">
                  ৳
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight font-['Poppins']">BD Easy Earning</h3>
                  <p className="text-[11px] text-[#ffeb3b]">সহজে আয় করুন, প্রতিদিন!</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-black/20 text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* User card in drawer */}
            {userProfile && (
              <div className="m-3 p-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md border-2 border-[#fbc02d]">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-amber-200">বর্তমান ব্যালেন্স</span>
                    <span className="text-2xl font-black font-['Poppins']">৳ {(userProfile.balance || 0).toFixed(2)}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${userProfile.isVerified ? 'bg-emerald-400 text-black' : 'bg-yellow-400 text-black'}`}>
                    {userProfile.isVerified ? '✓ ভেরিফাইড' : 'আনভেরিফাইড'}
                  </span>
                </div>
                <div className="mt-2 text-xs flex justify-between text-amber-100 border-t border-white/20 pt-1.5">
                  <span>রেফারেল: {userProfile.totalReferrals || 0} টি</span>
                  <span>মোট আয়: ৳ {userProfile.totalIncome || 0}</span>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => handleNav(item.route)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                      isActive
                        ? 'bg-[#d32f2f] text-white shadow-sm'
                        : item.highlight
                        ? 'bg-amber-100 text-[#d32f2f] hover:bg-amber-200 font-bold border border-amber-300'
                        : 'text-gray-800 hover:bg-amber-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#ffeb3b]' : 'text-[#d32f2f]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-[#ffeb3b] text-[#d32f2f] text-[10px] font-black px-1.5 py-0.5 rounded-full border border-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Social Channels in Drawer */}
              <div className="pt-3 border-t border-amber-200 mt-2 space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3">সোশ্যাল চ্যানেল</span>
                <a
                  href="https://t.me/BDEasyEarning_1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[#229ED9] hover:bg-sky-50 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram চ্যানেল</span>
                </a>
                <a
                  href="https://youtube.com/@bdeasyearning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-[#FF0000] hover:bg-red-50 transition"
                >
                  <Youtube className="w-4 h-4" />
                  <span>YouTube চ্যানেল</span>
                </a>
              </div>
            </nav>

            {/* Logout button */}
            {userProfile && (
              <div className="p-3 border-t border-amber-200 bg-amber-50">
                <button
                  onClick={() => {
                    logout();
                    setDrawerOpen(false);
                    navigate('/');
                  }}
                  className="w-full py-2.5 px-3 bg-red-100 hover:bg-red-200 text-[#d32f2f] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>লগআউট করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        unreadCount={unreadCount}
      />
    </>
  );
};
