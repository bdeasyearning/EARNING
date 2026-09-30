import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Users,
  CreditCard,
  Phone,
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react';
import {
  collection,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { playRewardSound } from '../utils/security';

interface WithdrawPageProps {
  navigate: (route: string) => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({ navigate }) => {
  const { userProfile, settings, refreshProfile } = useAuth();
  const [amount, setAmount] = useState<number>(600);
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [accountType, setAccountType] = useState<'personal' | 'agent'>('personal');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Requirement Popup State
  const [requirementModal, setRequirementModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    actionLabel?: string;
    actionRoute?: string;
  }>({
    show: false,
    title: '',
    message: ''
  });

  if (!userProfile) return null;

  const minWithdraw = settings.minWithdraw || 600;
  const minReferrals = settings.minReferralsForWithdraw || 20;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    // Rule 1: Balance check
    if ((userProfile.balance || 0) < minWithdraw || amount < minWithdraw) {
      setRequirementModal({
        show: true,
        title: 'ব্যালেন্স অপর্যাপ্ত!',
        message: `মিনিমাম উত্তোলন ${minWithdraw}৳। আপনার বর্তমান ব্যালেন্স: ৳${(userProfile.balance || 0).toFixed(2)}। দয়া করে কাজ করে ব্যালেন্স বাড়ান।`,
        actionLabel: 'কাজ শুরু করুন',
        actionRoute: '/earn-games'
      });
      return;
    }

    // Rule 2: Minimum Referrals Check
    if ((userProfile.totalReferrals || 0) < minReferrals) {
      setRequirementModal({
        show: true,
        title: 'রেফারেল শর্ত অপূর্ণ!',
        message: `টাকা উত্তোলনের আগে অবশ্যই অন্তত ২০টি রেফার করতে হবে। বর্তমানে আপনার রেফার সংখ্যা: ${userProfile.totalReferrals || 0}/২০।`,
        actionLabel: 'রেফার লিংক নিন',
        actionRoute: '/team'
      });
      return;
    }

    // Rule 3: Account Verification Check
    if (!userProfile.isVerified) {
      setRequirementModal({
        show: true,
        title: 'অ্যাকাউন্ট ভেরিফাই করা নেই!',
        message: 'টাকা উত্তোলন করতে হলে আপনার অ্যাকাউন্টটি ভেরিফাইড হতে হবে। অনুগ্রহ করে অ্যাকাউন্ট সেটিংসে গিয়ে ভেরিফিকেশনের আবেদন করুন।',
        actionLabel: 'অ্যাকাউন্ট ভেরিফাই করুন',
        actionRoute: '/account'
      });
      return;
    }

    const cleanPhone = accountNumber.trim().replace(/\D/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      alert('সঠিক ১১ ডিজিটের ফোন নাম্বার দিন!');
      return;
    }

    if (amount > userProfile.balance) {
      alert('উত্তোলনের পরিমাণ বর্তমান ব্যালেন্সের চেয়ে বেশি হতে পারে না!');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();

      // Record withdrawal in Firestore
      await addDoc(collection(db, 'withdrawals'), {
        userId: userProfile.uid,
        userName: userProfile.fullName || 'ইউজার',
        userPhone: userProfile.phone || '',
        amount,
        method,
        accountNumber: cleanPhone,
        accountType,
        status: 'pending',
        requestedAt: now
      });

      // Deduct from user balance
      const newBalance = userProfile.balance - amount;
      const newTotalWithdraw = (userProfile.totalWithdraw || 0) + amount;

      await updateDoc(doc(db, 'users', userProfile.uid), {
        balance: newBalance,
        totalWithdraw: newTotalWithdraw,
        lastActiveAt: now
      });

      // Notification
      await addDoc(collection(db, 'notifications'), {
        userId: userProfile.uid,
        title: 'উত্তোলন রিকোয়েস্ট সফল! 📤',
        message: `আপনার ${amount}৳ উত্তোলনের রিকোয়েস্ট গ্রহণ করা হয়েছে। ২৪ ঘণ্টার মধ্যে আপনার ${method} একাউন্টে টাকা পাঠানো হবে।`,
        isRead: false,
        createdAt: now,
        type: 'withdraw'
      });

      playRewardSound();
      setSuccessMsg(`আপনার ৳${amount} উত্তোলনের রিকোয়েস্ট সফলভাবে জমা হয়েছে। ২৪ ঘণ্টার মধ্যে অ্যাডমিন অ্যাপ্রুভ করবেন।`);
      refreshProfile();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'উত্তোলন রিকোয়েস্টে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-[#d32f2f] to-[#FF4500] text-white p-5 rounded-3xl shadow-xl border-2 border-[#ffeb3b] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold text-amber-200">
            উত্তোলনযোগ্য ব্যালেন্স
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${userProfile.isVerified ? 'bg-emerald-400 text-black' : 'bg-yellow-400 text-black'}`}>
            {userProfile.isVerified ? '✓ একাউন্ট ভেরিফাইড' : 'আনভেরিফাইড'}
          </span>
        </div>
        <div className="text-3xl sm:text-4xl font-black font-['Poppins']">
          ৳ {(userProfile.balance || 0).toFixed(2)}
        </div>
        <div className="flex justify-between text-xs text-amber-100 pt-1 border-t border-white/20">
          <span>মোট উত্তোলন: ৳{(userProfile.totalWithdraw || 0).toFixed(0)}</span>
          <span>রেফার সংখ্যা: {userProfile.totalReferrals || 0}/{minReferrals}</span>
        </div>
      </div>

      {/* Conditions Overview */}
      <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-3">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#d32f2f]" />
          <span>উত্তোলনের পূর্বশর্তসমূহ:</span>
        </h3>

        <div className="space-y-2 text-xs">
          {/* Condition 1 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-gray-700">১. মিনিমাম ব্যালেন্স ৳{minWithdraw}</span>
            {(userProfile.balance || 0) >= minWithdraw ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> পূরণ হয়েছে
              </span>
            ) : (
              <span className="text-red-600 font-bold">ঘাটতি আছে</span>
            )}
          </div>

          {/* Condition 2 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-gray-700">২. ন্যূনতম ২০টি রেফার ({userProfile.totalReferrals || 0}/২০)</span>
            {(userProfile.totalReferrals || 0) >= minReferrals ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> পূরণ হয়েছে
              </span>
            ) : (
              <span className="text-red-600 font-bold">বাকি আছে</span>
            )}
          </div>

          {/* Condition 3 */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-gray-700">৩. অ্যাকাউন্ট ভেরিফিকেশন</span>
            {userProfile.isVerified ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ভেরিফাইড ✓
              </span>
            ) : (
              <span className="text-red-600 font-bold">ভেরিফাই করুন</span>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Withdrawal Form */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border-2 border-[#fbc02d]">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#FF4500]" />
          <span>টাকা তোলার ফর্ম পূরণ করুন</span>
        </h3>

        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          {/* Method selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              পেমেন্ট মাধ্যম বেছে নিন
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['bKash', 'Nagad', 'Rocket'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black transition border-2 flex flex-col items-center justify-center ${
                    method === m
                      ? 'bg-red-50 border-[#d32f2f] text-[#d32f2f] shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{m === 'bKash' ? 'বিকাশ' : m === 'Nagad' ? 'নগদ' : 'রকেট'}</span>
                  <span className="text-[10px] font-normal">{m}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">একাউন্টের ধরন</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('personal')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  accountType === 'personal'
                    ? 'bg-amber-100 border-[#FF4500] text-[#FF4500]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                পার্সোনাল (Personal)
              </button>
              <button
                type="button"
                onClick={() => setAccountType('agent')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  accountType === 'agent'
                    ? 'bg-amber-100 border-[#FF4500] text-[#FF4500]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                এজেন্ট (Agent)
              </button>
            </div>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {method} নাম্বার (১১ ডিজিট)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                maxLength={11}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#FF4500]"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">উত্তোলনের পরিমাণ (টাকা)</label>
              <button
                type="button"
                onClick={() => setAmount(Math.floor(userProfile.balance || 0))}
                className="text-[11px] text-[#d32f2f] font-bold hover:underline"
              >
                সব তুলুন (Max)
              </button>
            </div>
            <input
              type="number"
              min={minWithdraw}
              max={userProfile.balance || 0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full px-4 py-2.5 bg-amber-50/40 border border-gray-300 rounded-xl text-sm font-['Poppins'] font-bold focus:outline-none focus:border-[#FF4500]"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">
              * সর্বনিম্ন উত্তোলন ৳{minWithdraw}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF4500] via-[#d32f2f] to-[#b71c1c] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95 transition disabled:opacity-50"
          >
            <ArrowDownToLine className="w-4 h-4 text-[#ffeb3b]" />
            <span>{submitting ? 'অনুরোধ পাঠানো হচ্ছে...' : 'উত্তোলন কনফার্ম করুন'}</span>
          </button>
        </form>
      </div>

      {/* Requirement Failure Modal */}
      {requirementModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border-4 border-[#ffeb3b] relative space-y-4">
            <button
              onClick={() => setRequirementModal({ show: false, title: '', message: '' })}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-red-100 text-[#d32f2f] flex items-center justify-center mx-auto border-2 border-red-300">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900">{requirementModal.title}</h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                {requirementModal.message}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {requirementModal.actionRoute && (
                <button
                  onClick={() => {
                    const route = requirementModal.actionRoute;
                    setRequirementModal({ show: false, title: '', message: '' });
                    if (route) navigate(route);
                  }}
                  className="w-full py-3 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition"
                >
                  <span>{requirementModal.actionLabel}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setRequirementModal({ show: false, title: '', message: '' })}
                className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
