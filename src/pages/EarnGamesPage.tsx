import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import {
  PlayCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Flame,
  Award,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AdCardConfig, AdViewRecord } from '../types';
import { playRewardSound, checkAndPayReferralBonus } from '../utils/security';

const AD_CARDS: AdCardConfig[] = [
  {
    id: 1,
    title: 'অ্যাড স্পেশাল ১',
    subtitle: '১০টি অ্যাড দেখুন, ইনকাম করুন ৫০৳',
    reward: 5,
    dailyLimit: 10,
    links: [
      'https://omg10.com/4/11841693',
      'https://omg10.com/4/11841696',
      'https://www.profitableratecpmnetwork.com/vbwzbi3b0?key=befec77b6037121863ee75b589c8c3a5'
    ]
  },
  {
    id: 2,
    title: 'অ্যাড স্পেশাল ২',
    subtitle: '১০টি অ্যাড দেখুন, ইনকাম করুন ৫০৳',
    reward: 5,
    dailyLimit: 10,
    links: [
      'https://www.profitableratecpmnetwork.com/c2nu3fwha?key=abbf64d2c8f7ca282e263331ffe36512',
      'https://www.profitableratecpmnetwork.com/t594xc09g?key=51a9eeef8a7f72668f14bb329e385479'
    ]
  },
  {
    id: 3,
    title: 'অ্যাড স্পেশাল ৩',
    subtitle: '১০টি অ্যাড দেখুন, ইনকাম করুন ৫০৳',
    reward: 5,
    dailyLimit: 10,
    links: [
      'https://www.profitableratecpmnetwork.com/shtjqipnz?key=d4c8fa7049edbdbafbf264c73cfac78c',
      'https://omg10.com/4/11841693'
    ]
  },
  {
    id: 4,
    title: 'অ্যাড স্পেশাল ৪',
    subtitle: '১০টি অ্যাড দেখুন, ইনকাম করুন ৫০৳',
    reward: 5,
    dailyLimit: 10,
    links: [
      'https://omg10.com/4/11841696',
      'https://www.profitableratecpmnetwork.com/vbwzbi3b0?key=befec77b6037121863ee75b589c8c3a5'
    ]
  }
];

export const EarnGamesPage: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [todayViews, setTodayViews] = useState<{ [cardId: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
    4: 0
  });

  const [activeWatchingCard, setActiveWatchingCard] = useState<AdCardConfig | null>(null);
  const [currentAdUrl, setCurrentAdUrl] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [saving, setSaving] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch today's ad views for this user
  useEffect(() => {
    if (!userProfile) return;
    const q = query(
      collection(db, 'ad_views'),
      where('userId', '==', userProfile.uid),
      where('dateStr', '==', todayStr)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const counts: { [cardId: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
      snapshot.forEach((d) => {
        const item = d.data() as AdViewRecord;
        if (counts[item.cardId] !== undefined) {
          counts[item.cardId]++;
        }
      });
      setTodayViews(counts);
    });

    return () => unsub();
  }, [userProfile, todayStr]);

  // Handle visibility or focus change while watching ad
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (activeWatchingCard && startTimeRef.current && !isSuccess) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        // If user came back before 15 seconds, cancel the ad!
        if (document.visibilityState === 'visible' && elapsed < 14) {
          clearInterval(timerIntervalRef.current);
          setIsCancelled(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeWatchingCard, isSuccess]);

  const handleStartWatch = (card: AdCardConfig) => {
    const currentCount = todayViews[card.id] || 0;
    if (currentCount >= card.dailyLimit) {
      alert('আজকের জন্য এই কার্ডের ১০টি বিজ্ঞাপনের সীমা শেষ হয়েছে!');
      return;
    }

    // Ad link rotation using localStorage
    const savedIndexKey = `bd_ad_idx_${card.id}`;
    const currentIndex = parseInt(localStorage.getItem(savedIndexKey) || '0', 10);
    const selectedUrl = card.links[currentIndex % card.links.length];
    const nextIndex = (currentIndex + 1) % card.links.length;
    localStorage.setItem(savedIndexKey, nextIndex.toString());

    setActiveWatchingCard(card);
    setCurrentAdUrl(selectedUrl);
    setSecondsRemaining(15);
    setIsCancelled(false);
    setIsSuccess(false);
    startTimeRef.current = Date.now();

    // Open target ad in new tab
    window.open(selectedUrl, '_blank');

    // Start 15s countdown
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          finishAdSuccess(card, selectedUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishAdSuccess = async (card: AdCardConfig, adUrl: string) => {
    if (!userProfile) return;
    setIsSuccess(true);
    setSaving(true);

    try {
      const now = new Date().toISOString();
      // Record ad view
      await addDoc(collection(db, 'ad_views'), {
        userId: userProfile.uid,
        cardId: card.id,
        adUrl,
        reward: card.reward,
        viewedAt: now,
        dateStr: todayStr
      });

      // Credit balance
      const newBalance = (userProfile.balance || 0) + card.reward;
      const newTotal = (userProfile.totalIncome || 0) + card.reward;

      await updateDoc(doc(db, 'users', userProfile.uid), {
        balance: newBalance,
        totalIncome: newTotal,
        lastActiveAt: now
      });

      // Layer 5 check: if user reaches 50 BDT, pay 70 BDT to referrer
      await checkAndPayReferralBonus(userProfile.uid, newTotal);

      playRewardSound();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      refreshProfile();
    } catch (err) {
      console.error('Ad view reward error', err);
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setActiveWatchingCard(null);
    setIsCancelled(false);
    setIsSuccess(false);
  };

  const totalEarnedToday = Object.values(todayViews).reduce((a, b) => a + b, 0) * 5;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#FF4500] via-[#d32f2f] to-[#b71c1c] text-white p-5 rounded-3xl shadow-xl border-2 border-[#ffeb3b] flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold text-amber-200">
            বিজ্ঞাপন দেখে প্রতিদিন আয়
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5 font-['Poppins']">
            ডেইলি মোট ৳২০০ পর্যন্ত
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            ৪টি কার্ডে দৈনিক ১০টি করে মোট ৪০টি বিজ্ঞাপন দেখুন। প্রতিটিতে পাবেন ৫৳!
          </p>
        </div>
        <div className="bg-white/20 p-3 rounded-2xl text-center border border-white/30 shrink-0">
          <span className="text-[10px] text-amber-200 block font-bold">আজকের আয়</span>
          <span className="text-2xl font-black font-['Poppins'] text-[#ffeb3b]">
            ৳{totalEarnedToday}
          </span>
        </div>
      </div>

      {/* 4 Ad Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AD_CARDS.map((card) => {
          const viewed = todayViews[card.id] || 0;
          const isCompleted = viewed >= card.dailyLimit;
          const progressPercent = (viewed / card.dailyLimit) * 100;

          return (
            <div
              key={card.id}
              className="bg-white rounded-3xl p-5 border-2 border-amber-200 hover:border-[#FF4500] shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black bg-amber-100 text-[#d32f2f] px-2.5 py-1 rounded-full border border-amber-300">
                    কার্ড #{card.id}
                  </span>
                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    +৳{card.reward} / ভিউ
                  </span>
                </div>

                <h3 className="font-extrabold text-gray-900 text-base">{card.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{card.subtitle}</p>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 font-semibold">
                    <span>আজকের অগ্রগতি:</span>
                    <span className="text-[#d32f2f] font-bold font-['Poppins']">
                      {viewed} / {card.dailyLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#FF4500] to-[#d32f2f] h-2.5 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                {isCompleted ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>আজকের লিমিট শেষ (১০/১০)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartWatch(card)}
                    className="w-full py-3 bg-gradient-to-r from-[#FF4500] to-[#d32f2f] hover:from-[#e03d00] hover:to-[#b71c1c] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                  >
                    <PlayCircle className="w-4 h-4 text-[#ffeb3b]" />
                    <span>বিজ্ঞাপন দেখুন (+৫৳)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ad Watching Modal / Countdown Popup */}
      {activeWatchingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border-4 border-[#ffeb3b] relative space-y-4">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {isCancelled ? (
              /* Cancelled state: user returned before 15 seconds */
              <div className="space-y-3 py-3">
                <div className="w-16 h-16 rounded-full bg-red-100 text-[#d32f2f] flex items-center justify-center mx-auto border-2 border-red-300">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900">বিজ্ঞাপন বাতিল হয়েছে!</h3>
                <p className="text-xs text-red-600 font-medium leading-relaxed">
                  ১৫ সেকেন্ডের পূর্বে ফিরে আসায় রিওয়ার্ড বাতিল করা হয়েছে। প্রতিটি বিজ্ঞাপন সম্পূর্ণ
                  ১৫ সেকেন্ড দেখুন।
                </p>
                <button
                  onClick={closeModal}
                  className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition"
                >
                  ঠিক আছে
                </button>
              </div>
            ) : isSuccess ? (
              /* Success state: 15 seconds completed */
              <div className="space-y-3 py-3 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900">অভিনন্দন! ৳৫ অর্জিত! 🎉</h3>
                <p className="text-xs text-gray-600">
                  সফলভাবে বিজ্ঞাপন দেখা সম্পন্ন হয়েছে। টাকা আপনার একাউন্টে যোগ হয়েছে।
                </p>
                <button
                  onClick={closeModal}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs shadow transition active:scale-95"
                >
                  পরের বিজ্ঞাপনে যান
                </button>
              </div>
            ) : (
              /* Running timer state */
              <div className="space-y-4 py-2">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-amber-200 border-t-[#d32f2f] animate-spin" />
                  <div className="absolute text-2xl font-black text-[#d32f2f] font-['Poppins']">
                    {secondsRemaining}s
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900">বিজ্ঞাপন লোড হচ্ছে...</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    দয়া করে নতুন ট্যাবে বিজ্ঞাপনটি অন্তত ১৫ সেকেন্ড খোলা রাখুন।
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2 text-left">
                  <Clock className="w-4 h-4 text-[#FF4500] shrink-0" />
                  <span>টাইমার শেষ হলে স্বয়ংক্রিয়ভাবে ৫৳ আপনার ব্যালেন্সে যোগ হবে।</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
