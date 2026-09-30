import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { History, Sparkles, PlayCircle, CheckSquare, Dices, Gift } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface HistoryItem {
  id: string;
  type: 'ad' | 'task' | 'spin' | 'referral';
  title: string;
  amount: number;
  date: string;
}

export const IncomeHistoryPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    // We can fetch from ad_views, task_completions, spins
    const items: HistoryItem[] = [];

    // Fetch ad views
    const qAds = query(
      collection(db, 'ad_views'),
      where('userId', '==', userProfile.uid),
      orderBy('viewedAt', 'desc')
    );

    const unsubAds = onSnapshot(qAds, (snap) => {
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          type: 'ad',
          title: `বিজ্ঞাপন ভিউ (কার্ড #${data.cardId || 1})`,
          amount: data.reward || 5,
          date: data.viewedAt || ''
        });
      });
      combineAndSort();
    });

    // Fetch task completions
    const qTasks = query(
      collection(db, 'task_completions'),
      where('userId', '==', userProfile.uid),
      orderBy('completedAt', 'desc')
    );

    const unsubTasks = onSnapshot(qTasks, (snap) => {
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          type: 'task',
          title: 'টাস্ক সম্পন্ন বোনাস',
          amount: data.reward || 5,
          date: data.completedAt || ''
        });
      });
      combineAndSort();
    });

    // Fetch spins
    const qSpins = query(
      collection(db, 'spins'),
      where('userId', '==', userProfile.uid),
      orderBy('spunAt', 'desc')
    );

    const unsubSpins = onSnapshot(qSpins, (snap) => {
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          type: 'spin',
          title: 'লাকি স্পিন হুইল পুরস্কার',
          amount: data.amount || 1,
          date: data.spunAt || ''
        });
      });
      combineAndSort();
    });

    const combineAndSort = () => {
      const sorted = [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setHistory(sorted);
      setLoading(false);
    };

    return () => {
      unsubAds();
      unsubTasks();
      unsubSpins();
    };
  }, [userProfile]);

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      <div className="bg-gradient-to-r from-[#FF4500] to-[#d32f2f] text-white p-5 rounded-3xl shadow-xl border-2 border-[#ffeb3b] flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold text-amber-200">আয়ের রেকর্ড</span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">আয়ের হিস্ট্রি</h2>
          <p className="text-xs text-amber-100 mt-1">
            আপনার অর্জিত সব ইনকামের বিস্তারিত টাইমলাইন
          </p>
        </div>
        <div className="p-3 bg-white/20 rounded-2xl border border-white/30 shrink-0">
          <History className="w-7 h-7 text-[#ffeb3b]" />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 divide-y divide-gray-100 space-y-2">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">লোড হচ্ছে...</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            এখনও কোনো আয়ের রেকর্ড নেই। অ্যাড অথবা টাস্ক সম্পন্ন করুন!
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-[#d32f2f]">
                  {item.type === 'ad' ? (
                    <PlayCircle className="w-4 h-4" />
                  ) : item.type === 'task' ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : item.type === 'spin' ? (
                    <Dices className="w-4 h-4" />
                  ) : (
                    <Gift className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900">{item.title}</h4>
                  <span className="text-[10px] text-gray-400 block">
                    {item.date ? new Date(item.date).toLocaleString('bn-BD') : ''}
                  </span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600 font-['Poppins']">
                +৳{item.amount.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
