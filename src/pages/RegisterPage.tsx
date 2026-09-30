import React, { useState, useEffect } from 'react';
import {
  Phone,
  Lock,
  User,
  Gift,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps {
  navigate: (route: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { registerWithPhone, userProfile, visitorId } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check URL parameters for ?ref=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || localStorage.getItem('bd_ref_code');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      localStorage.setItem('bd_ref_code', ref.toUpperCase());
    }
  }, []);

  if (userProfile) {
    navigate('/dashboard');
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg('সঠিক ১১ ডিজিটের বাংলাদেশি ফোন নাম্বার দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('দুটি পাসওয়ার্ড মিলছে না!');
      return;
    }

    setLoading(true);
    const res = await registerWithPhone(
      cleanPhone,
      password,
      fullName,
      referralCode.trim() || undefined
    );
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      {/* Brand Hero */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF4500] text-white shadow-lg border-2 border-[#ffeb3b] mb-1">
          <Gift className="w-8 h-8 text-[#ffeb3b] animate-bounce" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight font-['Poppins']">
          নতুন অ্যাকাউন্ট খুলুন
        </h1>
        <p className="text-xs text-[#d32f2f] font-bold bg-amber-100 py-1 px-3 rounded-full inline-block border border-amber-300">
          🎁 রেজিস্ট্রেশন করলেই পাচ্ছেন ১০৳ ওয়েলকাম বোনাস!
        </p>
      </div>

      {/* Register Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-[#fbc02d]">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-[#d32f2f] rounded-xl flex items-start gap-2.5 text-xs text-[#d32f2f] font-medium animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">নিরাপত্তা সতর্কতা:</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">আপনার পূর্ণ নাম</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="যেমন: মোঃ রাসেল ইসলাম"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#FF4500]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              মোবাইল নাম্বার (১১ ডিজিট)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#FF4500]"
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">
              * ১টি ফোন থেকে শুধু ১টি অ্যাকাউন্ট খোলা যাবে
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">পাসওয়ার্ড (কমপক্ষে ৬ ডিজিট)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#FF4500]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#FF4500]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              রেফারেল কোড (ঐচ্ছিক)
            </label>
            <div className="relative">
              <Gift className="absolute left-3.5 top-3 w-4 h-4 text-amber-500" />
              <input
                type="text"
                placeholder="BDXXXXXX"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border border-gray-300 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-[#FF4500]"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>৪-লেয়ার ডিভাইস প্রটেকশন নীতি:</span>
            </div>
            <p>• ফোন নাম্বার ও ব্রাউজার ডিভাইস লক যাচাই করা হবে।</p>
            <p>• একই ফোনে ডুপ্লিকেট অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে ব্লক হবে।</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#FF4500] to-[#d32f2f] hover:from-[#e03d00] hover:to-[#b71c1c] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition transform active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <span>যাচাই ও অ্যাকাউন্ট তৈরি হচ্ছে...</span>
            ) : (
              <>
                <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            আগেই একাউন্ট রয়েছে?{' '}
            <button
              onClick={() => navigate('/')}
              className="text-[#d32f2f] font-bold hover:underline ml-1"
            >
              এখানে লগইন করুন
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
