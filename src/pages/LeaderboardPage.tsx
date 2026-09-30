import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { Trophy, Medal, Crown, Users, TrendingUp } from 'lucide-react';
import { db } from '../firebase';
import { UserProfile } from '../types';

export const LeaderboardPage: React.FC = () => {
  const [tab, setTab] = useState<'earners' | 'referrers'>('earners');
  const [topEarners, setTopEarners] = useState<UserProfile[]>([]);
  const [topReferrers, setTopReferrers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Top earners query
    const qEarners = query(
      collection(db, 'users'),
      orderBy('totalIncome', 'desc'),
      limit(20)
    );

    const unsubEarners = onSnapshot(qEarners, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      setTopEarners(list);
      setLoading(false);
    });

    // Top referrers query
    const qReferrers = query(
      collection(db, 'users'),
      orderBy('totalReferrals', 'desc'),
      limit(20)
    );

    const unsubReferrers = onSnapshot(qReferrers, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      setTopReferrers(list);
    });

    return () => {
      unsubEarners();
      unsubReferrers();
    };
  }, []);

  const currentList = tab === 'earners' ? topEarners : topReferrers;

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#FF4500] to-[#d32f2f] text-white p-5 rounded-3xl shadow-xl border-2 border-[#ffeb3b] text-center space-y-1">
        <div className="inline-flex p-2.5 rounded-2xl bg-[#ffeb3b] text-[#d32f2f] shadow mb-1">
          <Trophy className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black font-['Poppins']">সেরা লিডারবোর্ড</h2>
        <p className="text-xs text-amber-100">
          আমাদের সেরা সফল আর্নার এবং সেরা রেফারারদের তালিকা
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-amber-100/70 p-1.5 rounded-2xl border border-amber-300">
        <button
          onClick={() => setTab('earners')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
            tab === 'earners'
              ? 'bg-[#d32f2f] text-white shadow-sm'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>সেরা আর্নার</span>
        </button>
        <button
          onClick={() => setTab('referrers')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
            tab === 'referrers'
              ? 'bg-[#d32f2f] text-white shadow-sm'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>সেরা রেফারার</span>
        </button>
      </div>

      {/* Leaderboard list */}
      <div className="bg-white rounded-3xl p-4 shadow-md border-2 border-amber-200 divide-y divide-amber-100">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">লিডারবোর্ড লোড হচ্ছে...</div>
        ) : currentList.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">কোনো রেকর্ড পাওয়া যায়নি</div>
        ) : (
          currentList.map((user, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const maskedPhone = user.phone
              ? user.phone.substring(0, 3) + '••••' + user.phone.substring(7)
              : 'গোপনীয়';

            return (
              <div
                key={idx}
                className={`py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 ${
                  isTop3 ? 'font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-[#ffeb3b] text-amber-900 border-2 border-amber-400 shadow-sm'
                        : rank === 2
                        ? 'bg-slate-200 text-slate-800 border-2 border-slate-300'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-gray-900 leading-tight">
                      {user.fullName || 'মেম্বার'}
                    </h4>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      {maskedPhone}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {tab === 'earners' ? (
                    <div>
                      <span className="text-xs font-black text-[#d32f2f] font-['Poppins'] block">
                        ৳{(user.totalIncome || 0).toFixed(0)}
                      </span>
                      <span className="text-[9px] text-gray-400">মোট আয়</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-black text-emerald-700 font-['Poppins'] block">
                        {user.totalReferrals || 0} টি
                      </span>
                      <span className="text-[9px] text-gray-400">রেফার সংখ্যা</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
