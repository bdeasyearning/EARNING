import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  CreditCard,
  Sparkles,
  Phone,
  Copy,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import {
  doc,
  updateDoc,
  collection,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { playRewardSound } from '../utils/security';

export const AccountPage: React.FC = () => {
  const { userProfile, settings, refreshProfile, logout } = useAuth();
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!userProfile) return null;

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('স্ক্রিনশটের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে হবে!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) {
      alert('অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) দিন!');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'activations'), {
        userId: userProfile.uid,
        userName: userProfile.fullName || 'ইউজার',
        userPhone: userProfile.phone || '',
        method,
        trxId: trxId.trim(),
        screenshot: screenshotBase64 || '',
        status: 'pending',
        submittedAt: now
      });

      // Notification
      await addDoc(collection(db, 'notifications'), {
        userId: userProfile.uid,
        title: 'ভেরিফিকেশন আবেদন জমা হয়েছে ⏳',
        message: `আপনার ১৫০৳ অ্যাক্টিভেশন ফি যাচাইয়ের আবেদন গ্রহণ করা হয়েছে। দ্রুতই অ্যাডমিন এটি ভেরিফাই করবেন।`,
        isRead: false,
        createdAt: now,
        type: 'verify'
      });

      playRewardSound();
      setSuccessMsg('আপনার আবেদন সফলভাবে জমা হয়েছে! অ্যাডমিন যাচাই করার পর আপনার অ্যাকাউন্টটি ভেরিফাইড হবে।');
      setTrxId('');
      setScreenshotBase64('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'আবেদন জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimFreeVerification = async () => {
    if ((userProfile.totalReferrals || 0) < (settings.freeVerificationReferrals || 50)) {
      alert('ফ্রি ভেরিফিকেশনের জন্য কমপক্ষে ৫০টি রেফার প্রয়োজন!');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'users', userProfile.uid), {
        isVerified: true,
        lastActiveAt: now
      });

      await addDoc(collection(db, 'activations'), {
        userId: userProfile.uid,
        userName: userProfile.fullName,
        userPhone: userProfile.phone,
        method: 'free_referral',
        status: 'approved',
        submittedAt: now,
        adminNote: '৫০ রেফার সম্পন্ন হওয়ায় স্বয়ংক্রিয় ফ্রি ভেরিফিকেশন'
      });

      await addDoc(collection(db, 'notifications'), {
        userId: userProfile.uid,
        title: 'অ্যাকাউন্ট ভেরিফাইড! 🎉',
        message: '৫০টি রেফার সফল করায় আপনার অ্যাকাউন্টটি ফ্রিতে ভেরিফাই করা হয়েছে!',
        isRead: false,
        createdAt: now,
        type: 'verify'
      });

      playRewardSound();
      setSuccessMsg('অভিনন্দন! আপনার অ্যাকাউন্টটি সম্পূর্ণ ফ্রিতে ভেরিফাইড করা হয়েছে!');
      refreshProfile();
    } catch (err) {
      console.error('Free verify error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const activeNumber = method === 'bKash' ? settings.bkashNumber : settings.nagadNumber;

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-amber-200 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4500] to-[#d32f2f] text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-[#ffeb3b]">
            {userProfile.fullName ? userProfile.fullName.charAt(0) : 'U'}
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-base text-gray-900">{userProfile.fullName}</h2>
            <p className="text-xs text-gray-500 font-mono">{userProfile.phone}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  userProfile.isVerified
                    ? 'bg-emerald-400 text-black'
                    : 'bg-amber-400 text-black'
                }`}
              >
                {userProfile.isVerified ? '✓ ভেরিফাইড মেম্বার' : 'আনভেরিফাইড মেম্বার'}
              </span>
              <span className="text-[10px] text-gray-400">ID: {userProfile.referralCode}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-gray-100">
          <div className="p-2 bg-amber-50 rounded-xl">
            <span className="text-[10px] text-gray-500 block">ব্যালেন্স</span>
            <span className="font-bold text-gray-900 font-['Poppins']">
              ৳{(userProfile.balance || 0).toFixed(1)}
            </span>
          </div>
          <div className="p-2 bg-amber-50 rounded-xl">
            <span className="text-[10px] text-gray-500 block">মোট রেফার</span>
            <span className="font-bold text-gray-900 font-['Poppins']">
              {userProfile.totalReferrals || 0}
            </span>
          </div>
          <div className="p-2 bg-amber-50 rounded-xl">
            <span className="text-[10px] text-gray-500 block">মোট উত্তোলন</span>
            <span className="font-bold text-gray-900 font-['Poppins']">
              ৳{(userProfile.totalWithdraw || 0).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Account Verification Section */}
      {!userProfile.isVerified ? (
        <div className="bg-white rounded-3xl p-5 shadow-xl border-2 border-[#fbc02d] space-y-4">
          <div className="flex items-center gap-2 text-[#d32f2f]">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-black text-base text-gray-900">অ্যাকাউন্ট ভেরিফিকেশন</h3>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            টাকা উত্তোলনের জন্য অ্যাকাউন্ট ভেরিফাই আবশ্যক। আপনি ২টি উপায়ে ভেরিফাই করতে পারেন:
          </p>

          {/* Option 2: 50 Referrals Free Claim */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800">বিকল্প ২: ৫০ রেফারে ফ্রি ভেরিফিকেশন</span>
              <span className="text-[10px] font-bold text-emerald-700 font-['Poppins']">
                {userProfile.totalReferrals || 0} / 50 টি
              </span>
            </div>
            <p className="text-[11px] text-emerald-700">
              ৫০টি রেফারেল সম্পন্ন হলে কোনো ফি ছাড়াই সম্পূর্ণ বিনামূল্যে ভেরিফাই করুন।
            </p>
            <button
              onClick={handleClaimFreeVerification}
              disabled={(userProfile.totalReferrals || 0) < 50 || submitting}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
            >
              {(userProfile.totalReferrals || 0) >= 50
                ? 'ফ্রি ভেরিফিকেশন দাবি করুন!'
                : `আরও ${Math.max(0, 50 - (userProfile.totalReferrals || 0))}টি রেফার বাকি`}
            </button>
          </div>

          <div className="my-2 text-center text-xs text-gray-400 font-bold">অথবা</div>

          {/* Option 1: 150 BDT Fee Payment */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-800">
              বিকল্প ১: ১৫০৳ পেমেন্ট করে ভেরিফাই করুন (বিকাশ / নগদ)
            </h4>

            {/* Method selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('bKash')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  method === 'bKash'
                    ? 'bg-red-50 border-[#d32f2f] text-[#d32f2f]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                বিকাশ (Send Money)
              </button>
              <button
                type="button"
                onClick={() => setMethod('Nagad')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  method === 'Nagad'
                    ? 'bg-amber-50 border-[#FF4500] text-[#FF4500]'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                নগদ (Send Money)
              </button>
            </div>

            {/* Admin Number Box */}
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 block">
                  আমাদের {method === 'bKash' ? 'বিকাশ' : 'নগদ'} পার্সোনাল নাম্বার:
                </span>
                <span className="text-sm font-black font-mono text-gray-900">{activeNumber}</span>
              </div>
              <button
                onClick={() => handleCopyNumber(activeNumber)}
                className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-[#d32f2f] flex items-center gap-1 shadow-sm active:scale-95"
              >
                {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি'}</span>
              </button>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium">
                {successMsg}
              </div>
            )}

            {/* Submission form */}
            <form onSubmit={handleSubmitVerification} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ট্রানজেকশন আইডি (TrxID)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 9JH76TGD4"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-[#FF4500]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  পেমেন্ট স্ক্রিনশট (ঐচ্ছিক কিন্তু দ্রুত অ্যাপ্রুভালের জন্য সহায়ক)
                </label>
                <div className="relative border-2 border-dashed border-amber-300 rounded-xl p-3 text-center bg-amber-50/30 hover:bg-amber-50/60 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                    {screenshotBase64 ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> স্ক্রিনশট সিলেক্ট করা হয়েছে
                      </span>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-amber-500" />
                        <span className="text-[11px] font-medium">স্ক্রিনশট আপলোড করতে ট্যাপ করুন</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-[#FF4500] to-[#d32f2f] text-white font-bold rounded-xl text-xs shadow-md active:scale-95 transition disabled:opacity-50"
              >
                {submitting ? 'জমা হচ্ছে...' : '১৫০৳ ভেরিফিকেশন আবেদন জমা দিন'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-black text-gray-900 text-base">আপনার অ্যাকাউন্ট সম্পূর্ণ ভেরিফাইড!</h3>
          <p className="text-xs text-gray-600">
            আপনি এখন কোনো বাধা ছাড়াই সরাসরি টাকা উত্তোলন করতে পারেন।
          </p>
        </div>
      )}

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-[#d32f2f] rounded-2xl text-xs font-bold transition border border-gray-200"
      >
        লগআউট করুন
      </button>
    </div>
  );
};
