import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import {
  Users,
  Copy,
  Check,
  Gift,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

export const TeamPage: React.FC = () => {
  const { userProfile, settings } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!userProfile) return null;

  const referralLink = `${window.location.origin}/register?ref=${userProfile.referralCode}`;

  const copyRefLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'BD Easy Earning এ যোগ দিন',
        text: `সহজে প্রতিদিন আয় করুন BD Easy Earning এ! আমার রেফারেল কোড: ${userProfile.referralCode}`,
        url: referralLink
      }).catch(() => {});
    } else {
      copyRefLink();
    }
  };

  // Fetch referrals
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('referredBy', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as UserProfile);
        });
        setTeamMembers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Team fetch error', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userProfile.uid]);

  const activeEarningCount = teamMembers.filter((m) => m.firstIncomeDone).length;
  const pendingEarningCount = teamMembers.length - activeEarningCount;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#FF4500] via-[#d32f2f] to-[#b71c1c] text-white p-5 rounded-3xl shadow-xl border-2 border-[#ffeb3b] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold text-amber-200">
              রেফার অ্যান্ড আর্ন প্রোগ্রাম
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-0.5">প্রতি রেফারে নিশ্চিত ৳৭০</h2>
            <p className="text-xs text-amber-100 mt-1">
              আপনার বন্ধুদের আমন্ত্রণ জানান এবং আনলিমিটেড লাইফটাইম কমিশন ইনকাম করুন!
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-2xl border border-white/30 shrink-0">
            <Gift className="w-8 h-8 text-[#ffeb3b] animate-bounce" />
          </div>
        </div>

        {/* Link Share Box */}
        <div className="bg-black/25 p-3 rounded-2xl border border-white/20 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-200 font-bold">
            <span>আপনার রেফারেল কোড:</span>
            <span className="font-mono text-base text-[#ffeb3b] tracking-wider bg-black/30 px-3 py-0.5 rounded-lg border border-amber-400/40">
              {userProfile.referralCode}
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-white text-gray-800 text-xs px-3 py-2.5 rounded-xl font-mono truncate focus:outline-none"
            />
            <button
              onClick={copyRefLink}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition ${
                copied ? 'bg-emerald-600 text-white' : 'bg-[#ffeb3b] text-[#d32f2f] hover:bg-yellow-300'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
            </button>
            <button
              onClick={handleShare}
              className="px-3 py-2.5 bg-white/30 hover:bg-white/40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center"
              title="শেয়ার করুন"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer 5 Policy Info Card */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 space-y-2 text-xs text-gray-700">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          <Sparkles className="w-4 h-4 text-[#FF4500]" />
          <span>শর্তসাপেক্ষ রেফারেল কমিশন (লেয়ার ৫ সুরক্ষা):</span>
        </div>
        <p className="leading-relaxed text-gray-600">
          ১. আপনার লিংকে কেউ একাউন্ট খুললে আপনার <b>পেন্ডিং বোনাসে ৳৭০</b> যোগ হবে।
        </p>
        <p className="leading-relaxed text-gray-600">
          ২. নতুন রেফারেল মেম্বার কাজ করে প্রথম <b>৫০৳ আয় সম্পন্ন করলেই</b> সাথে সাথে ৭০৳ আপনার
          মেইন ব্যালেন্সে জমা হয়ে যাবে!
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-[11px] text-gray-500 font-bold block">মোট রেফারেল</span>
          <span className="text-2xl font-black text-gray-900 font-['Poppins']">
            {teamMembers.length}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-[11px] text-gray-500 font-bold block">পেইড রেফার আয়</span>
          <span className="text-2xl font-black text-emerald-600 font-['Poppins']">
            ৳{(userProfile.referralIncome || 0).toFixed(0)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-[11px] text-gray-500 font-bold block">পেন্ডিং বোনাস</span>
          <span className="text-2xl font-black text-amber-600 font-['Poppins']">
            ৳{(userProfile.referralBonusPending || 0).toFixed(0)}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-[11px] text-gray-500 font-bold block">৫০৳ সম্পন্ন মেম্বার</span>
          <span className="text-2xl font-black text-[#d32f2f] font-['Poppins']">
            {activeEarningCount}
          </span>
        </div>
      </div>

      {/* Team Member List */}
      <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#d32f2f]" />
            <span>আপনার রেফারেল মেম্বার তালিকা ({teamMembers.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-400 text-xs">টিম লোড হচ্ছে...</div>
        ) : teamMembers.length === 0 ? (
          <div className="py-10 text-center text-gray-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-amber-300" />
            <p className="text-xs font-medium">এখনও কোনো মেম্বার যুক্ত হয়নি</p>
            <p className="text-[11px] text-gray-400">
              আপনার রেফারেল লিংকটি শেয়ার করে এখনই টিম তৈরি শুরু করুন!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 space-y-2">
            {teamMembers.map((member, idx) => {
              const maskedPhone = member.phone
                ? member.phone.substring(0, 3) + '••••' + member.phone.substring(7)
                : 'গোপনীয়';

              return (
                <div key={idx} className="pt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-[#d32f2f] flex items-center justify-center font-bold text-sm">
                      {member.fullName ? member.fullName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{member.fullName || 'ইউজার'}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>মোবাইল: {maskedPhone}</span>
                        <span>•</span>
                        <span>{new Date(member.createdAt).toLocaleDateString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {member.firstIncomeDone ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>৫০৳ সম্পন্ন (পেইড ✓)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>পেন্ডিং (৳{member.totalIncome || 0}/৫০)</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
