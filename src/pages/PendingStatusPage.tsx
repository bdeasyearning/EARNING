import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { Clock, CheckCircle2, XCircle, ArrowDownToLine, ShieldCheck } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { WithdrawalRequest, ActivationRequest } from '../types';

export const PendingStatusPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [tab, setTab] = useState<'withdrawals' | 'activations'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activations, setActivations] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    // Fetch user withdrawals
    const qW = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userProfile.uid),
      orderBy('requestedAt', 'desc')
    );

    const unsubW = onSnapshot(qW, (snap) => {
      const list: WithdrawalRequest[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as WithdrawalRequest);
      });
      setWithdrawals(list);
      setLoading(false);
    });

    // Fetch user activations
    const qA = query(
      collection(db, 'activations'),
      where('userId', '==', userProfile.uid),
      orderBy('submittedAt', 'desc')
    );

    const unsubA = onSnapshot(qA, (snap) => {
      const list: ActivationRequest[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as ActivationRequest);
      });
      setActivations(list);
    });

    return () => {
      unsubW();
      unsubA();
    };
  }, [userProfile]);

  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-5">
      <div className="bg-gradient-to-r from-[#FF4500] to-[#d32f2f] text-white p-5 rounded-3xl shadow-xl border-2 border-[#ffeb3b] flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold text-amber-200">আবেদনের অবস্থা</span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">পেন্ডিং স্ট্যাটাস</h2>
          <p className="text-xs text-amber-100 mt-1">
            আপনার উত্তোলন ও ভেরিফিকেশন আবেদনের রিয়েলটাইম আপডেট
          </p>
        </div>
        <div className="p-3 bg-white/20 rounded-2xl border border-white/30 shrink-0">
          <Clock className="w-7 h-7 text-[#ffeb3b]" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-amber-100/70 p-1.5 rounded-2xl border border-amber-300">
        <button
          onClick={() => setTab('withdrawals')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
            tab === 'withdrawals'
              ? 'bg-[#d32f2f] text-white shadow-sm'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>উত্তোলন রিকোয়েস্ট ({withdrawals.length})</span>
        </button>
        <button
          onClick={() => setTab('activations')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
            tab === 'activations'
              ? 'bg-[#d32f2f] text-white shadow-sm'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ভেরিফিকেশন ({activations.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl p-4 shadow-md border-2 border-amber-200 space-y-3">
        {tab === 'withdrawals' ? (
          withdrawals.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              কোনো উত্তোলন রিকোয়েস্ট নেই
            </div>
          ) : (
            withdrawals.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 font-['Poppins']">
                      ৳{item.amount}
                    </span>
                    <span className="text-xs text-gray-500">
                      via {item.method} ({item.accountNumber})
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {new Date(item.requestedAt).toLocaleString('bn-BD')}
                  </span>
                </div>

                <div>
                  {item.status === 'pending' ? (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> পেন্ডিং
                    </span>
                  ) : item.status === 'approved' ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> অ্যাপ্রুভড (পেইড)
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-300 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> বাতিল
                    </span>
                  )}
                </div>
              </div>
            ))
          )
        ) : activations.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            কোনো ভেরিফিকেশন আবেদন নেই
          </div>
        ) : (
          activations.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-gray-900">
                    {item.method === 'free_referral' ? '৫০ রেফারে ফ্রি ভেরিফিকেশন' : `${item.method} (১৫০৳)`}
                  </span>
                  {item.trxId && (
                    <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border text-gray-600">
                      Trx: {item.trxId}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {new Date(item.submittedAt).toLocaleString('bn-BD')}
                </span>
              </div>

              <div>
                {item.status === 'pending' ? (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> যাচাই হচ্ছে
                  </span>
                ) : item.status === 'approved' ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> সফল ভেরিফাইড
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-300 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> বাতিল
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
