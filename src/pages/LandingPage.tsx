import React, { useState } from 'react';
import {
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Users,
  Award,
  AlertTriangle,
  Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  navigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { loginWithPhone, loginWithGoogle, userProfile, visitorId } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect to dashboard
  if (userProfile) {
    navigate('/dashboard');
    return null;
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phone.trim() || !password) {
      setErrorMsg('ফোন নাম্বার এবং পাসওয়ার্ড দিন!');
      return;
    }

    setLoading(true);
    const res = await loginWithPhone(phone, password);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message || 'লগইন ব্যর্থ হয়েছে।');
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'গুগল সাইন-ইনে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      {/* Brand Hero */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF4500] via-[#d32f2f] to-[#b71c1c] text-white shadow-xl border-4 border-[#ffeb3b] mb-2 transform hover:rotate-6 transition">
          <span className="text-4xl font-black">৳</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight font-['Poppins']">
          BD Easy Earning
        </h1>
        <p className="text-sm font-semibold text-[#d32f2f] bg-amber-100 py-1 px-4 rounded-full inline-block border border-amber-300">
          ✨ সহজে আয় করুন, প্রতিদিন!
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-amber-200 flex flex-col items-center">
          <Zap className="w-6 h-6 text-[#FF4500] mb-1" />
          <span className="font-bold text-xs text-gray-800">অ্যাড দেখে আয়</span>
          <span className="text-[10px] text-gray-500">প্রতিদিন ৳২০০ পর্যন্ত</span>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-amber-200 flex flex-col items-center">
          <Users className="w-6 h-6 text-[#d32f2f] mb-1" />
          <span className="font-bold text-xs text-gray-800">রেফারেল বোনাস</span>
          <span className="text-[10px] text-emerald-600 font-bold">প্রতি রেফারে ৳৭০</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-[#fbc02d]">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-bold text-gray-900">অ্যাকাউন্টে প্রবেশ করুন</h2>
          <p className="text-xs text-gray-500 mt-1">আপনার ১১ ডিজিটের ফোন নাম্বার দিয়ে লগইন করুন</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-[#d32f2f] rounded-xl flex items-start gap-2.5 text-xs text-[#d32f2f] font-medium animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePhoneLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              ফোন নাম্বার (BD Format)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#FF4500] to-[#d32f2f] hover:from-[#e03d00] hover:to-[#b71c1c] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition transform active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <span>যাচাই হচ্ছে...</span>
            ) : (
              <>
                <span>লগইন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400 font-medium">অথবা</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        {/* Google Login button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>গুগল দিয়ে দ্রুত লগইন করুন</span>
        </button>

        {/* Go to Registration link */}
        <div className="mt-5 text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            নতুন একাউন্ট খুলতে চান?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#d32f2f] font-bold hover:underline ml-1"
            >
              এখানে রেজিস্ট্রেশন করুন
            </button>
          </p>
        </div>
      </div>

      {/* Device Lock Security Badge */}
      <div className="bg-amber-100/80 border border-amber-300 rounded-2xl p-3.5 text-center text-xs text-amber-900 flex items-center justify-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#d32f2f] shrink-0" />
        <span className="font-medium">
          ১টি ফোন ও ডিভাইস থেকে কেবল ১টি অ্যাকাউন্ট অনুমোদিত (স্মার্ট ডিভাইস লক সক্রিয়)
        </span>
      </div>
    </div>
  );
};
