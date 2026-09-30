import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  PlayCircle,
  CheckSquare,
  Dices,
  Users,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Gift,
  Youtube,
  Send,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  navigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { userProfile, settings } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!userProfile) return null;

  const referralLink = `${window.location.origin}/register?ref=${userProfile.referralCode}`;

  const copyRefLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const withdrawProgress = Math.min(100, ((userProfile.totalReferrals || 0) / (settings.minReferralsForWithdraw || 20)) * 100);
  const freeVerifyProgress = Math.min(100, ((userProfile.totalReferrals || 0) / (settings.freeVerificationReferrals || 50)) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Notice Banner */}
      {settings.noticeText && (
        <div className="bg-gradient-to-r from-amber-500 to-[#FF4500] text-white p-3 rounded-2xl shadow-sm flex items-center gap-2.5 text-xs font-medium border-2 border-[#ffeb3b] overflow-hidden">
          <Flame className="w-5 h-5 text-[#ffeb3b] shrink-0 animate-bounce" />
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <span className="inline-block animate-pulse font-semibold">{settings.noticeText}</span>
          </div>
        </div>
      )}

      {/* Main Balance Card (Red + Golden Theme) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#d32f2f] via-[#c62828] to-[#8e0000] text-white p-6 shadow-xl border-2 border-[#fbc02d]">
        {/* Background decorative coin */}
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-[#ffeb3b]/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-4 top-4 text-[#ffeb3b]/20 text-7xl font-black select-none pointer-events-none">
          ৳
        </div>

        <div className="relative z-10 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-amber-200 font-bold">
                মেইন ওয়ালেট ব্যালেন্স
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  userProfile.isVerified
                    ? 'bg-emerald-400 text-black border border-emerald-300'
                    : 'bg-[#ffeb3b] text-[#d32f2f] border border-amber-400'
                }`}
              >
                {userProfile.isVerified ? '✓ ভেরিফাইড মেম্বার' : 'আনভেরিফাইড'}
              </span>
            </div>
            <span className="text-xs text-amber-200">ID: {userProfile.referralCode}</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-['Poppins']">
              ৳ {(userProfile.balance || 0).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-400/40 text-xs">
            <div>
              <span className="text-red-200 text-[11px] block">মোট অর্জিত আয়</span>
              <span className="font-bold text-sm font-['Poppins'] text-amber-200">
                ৳ {(userProfile.totalIncome || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-red-200 text-[11px] block">মোট উত্তোলন (Paid)</span>
              <span className="font-bold text-sm font-['Poppins'] text-white">
                ৳ {(userProfile.totalWithdraw || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => navigate('/withdraw')}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#ffeb3b] to-[#fbc02d] hover:from-[#fff59d] hover:to-[#fdd835] text-[#8e0000] font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <ArrowDownToLine className="w-4 h-4 text-[#d32f2f]" />
              <span>টাকা উত্তোলন করুন (Withdraw)</span>
            </button>
            <button
              onClick={() => navigate('/earn-games')}
              className="py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition border border-white/30"
            >
              <PlayCircle className="w-4 h-4 text-[#ffeb3b]" />
              <span>অ্যাড দেখুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Notice / Callout */}
      {!userProfile.isVerified && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#d32f2f] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900">
                উত্তোলনের জন্য একাউন্ট ভেরিফাই প্রয়োজন
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                ২০ রেফার + ১৫০৳ অ্যাক্টিভেশন ফি অথবা ৫০ রেফার সম্পন্ন করে ফ্রিতে ভেরিফাই করুন।
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/account')}
            className="px-3 py-1.5 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition"
          >
            ভেরিফাই
          </button>
        </div>
      )}

      {/* 4 Earning Methods Action Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FF4500]" />
            <span>আজকের আয়ের মাধ্যমসমূহ</span>
          </h3>
          <span className="text-[11px] text-gray-500 font-semibold">দৈনিক আনলিমিটেড সুযোগ</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Ad Watching */}
          <div
            onClick={() => navigate('/earn-games')}
            className="group cursor-pointer bg-white p-4 rounded-2xl border-2 border-amber-200 hover:border-[#FF4500] shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-orange-100 text-[#FF4500] group-hover:scale-110 transition">
                <PlayCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black bg-red-100 text-[#d32f2f] px-2 py-0.5 rounded-full">
                ৳২০০/দিন
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-sm text-gray-900">বিজ্ঞাপন দেখুন</h4>
              <p className="text-[11px] text-gray-500">৪টি কার্ড, ১০টি করে অ্যাড ভিউ</p>
            </div>
          </div>

          {/* Daily Tasks */}
          <div
            onClick={() => navigate('/tasks')}
            className="group cursor-pointer bg-white p-4 rounded-2xl border-2 border-amber-200 hover:border-[#d32f2f] shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-red-100 text-[#d32f2f] group-hover:scale-110 transition">
                <CheckSquare className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                প্রতি কাজে ৳৫
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-sm text-gray-900">ডেইলি টাস্ক</h4>
              <p className="text-[11px] text-gray-500">YouTube, Telegram ফলো</p>
            </div>
          </div>

          {/* Lucky Spin Wheel */}
          <div
            onClick={() => navigate('/spin-wheel')}
            className="group cursor-pointer bg-white p-4 rounded-2xl border-2 border-amber-200 hover:border-[#fbc02d] shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-yellow-100 text-[#fbc02d] group-hover:scale-110 transition">
                <Dices className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                ফ্রি স্পিন
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-sm text-gray-900">লাকি স্পিন হুইল</h4>
              <p className="text-[11px] text-gray-500">দৈনিক ৳২০ পর্যন্ত ফ্রি রিওয়ার্ড</p>
            </div>
          </div>

          {/* Referral Team */}
          <div
            onClick={() => navigate('/team')}
            className="group cursor-pointer bg-white p-4 rounded-2xl border-2 border-amber-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                ৳৭০/রেফার
              </span>
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-sm text-gray-900">রেফার অ্যান্ড আর্ন</h4>
              <p className="text-[11px] text-gray-500">টিম মেম্বার যুক্ত করুন</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Referral Status Card */}
      <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-[#fbc02d] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-xl text-[#d32f2f]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">রেফারেল পারফর্মেন্স স্ট্যাটাস</h3>
              <p className="text-[11px] text-gray-500">প্রতি রেফারে নিশ্চিত ৳৭০ কমিশন</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/team')}
            className="text-xs text-[#d32f2f] font-bold hover:underline flex items-center"
          >
            বিস্তারিত টিম <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bars */}
        <div className="space-y-3 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-gray-700">উত্তোলনের জন্য রেফার রিকোয়ারমেন্ট:</span>
              <span className="text-[#d32f2f] font-bold font-['Poppins']">
                {userProfile.totalReferrals || 0} / {settings.minReferralsForWithdraw || 20} টি
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF4500] to-[#d32f2f] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${withdrawProgress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-gray-700">ফ্রি একাউন্ট ভেরিফিকেশন প্রগ্রেস:</span>
              <span className="text-emerald-700 font-bold font-['Poppins']">
                {userProfile.totalReferrals || 0} / {settings.freeVerificationReferrals || 50} টি
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${freeVerifyProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Commission metrics */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2.5 bg-yellow-50 rounded-xl border border-yellow-200">
            <span className="text-gray-500 text-[11px] block">পেন্ডিং রেফার বোনাস</span>
            <span className="font-extrabold text-amber-800 text-sm font-['Poppins']">
              ৳ {(userProfile.referralBonusPending || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-gray-400 block">(নতুন মেম্বারের ৫০৳ আয়ে পেইড হবে)</span>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-gray-500 text-[11px] block">পেইড রেফারেল ইনকাম</span>
            <span className="font-extrabold text-emerald-800 text-sm font-['Poppins']">
              ৳ {(userProfile.referralIncome || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block">ব্যালেন্সে যুক্ত হয়েছে ✓</span>
          </div>
        </div>

        {/* Copy Referral Link Input */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1 block">আপনার রেফারেল লিংক:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-amber-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 select-all"
            />
            <button
              onClick={copyRefLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-sm transition ${
                copied ? 'bg-emerald-600' : 'bg-[#d32f2f] hover:bg-[#b71c1c]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Community Channels */}
      <div className="bg-gradient-to-r from-red-600 to-[#FF4500] rounded-3xl p-5 text-white shadow-lg border-2 border-[#ffeb3b]">
        <h3 className="font-black text-base flex items-center gap-2 mb-1">
          <Award className="w-5 h-5 text-[#ffeb3b]" />
          <span>অফিসিয়াল কমিউনিটিতে যোগ দিন</span>
        </h3>
        <p className="text-xs text-amber-100 mb-3.5 leading-relaxed">
          প্রতিদিনের পেমেন্ট প্রুফ, নতুন কাজের আপডেট ও লাইভ সাপোর্টের জন্য আমাদের সাথে থাকুন।
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href="https://t.me/BDEasyEarning_1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 py-2.5 px-3 rounded-xl font-bold text-xs transition"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>টেলিগ্রাম চ্যানেল</span>
          </a>
          <a
            href="https://youtube.com/@bdeasyearning"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 py-2.5 px-3 rounded-xl font-bold text-xs transition"
          >
            <Youtube className="w-4 h-4 text-white" />
            <span>ইউটিউব চ্যানেল</span>
          </a>
        </div>
      </div>
    </div>
  );
};
