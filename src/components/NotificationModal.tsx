import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { Bell, CheckCheck, X, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import { playRewardSound } from '../utils/security';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to personal and broadcast notifications
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as AppNotification;
          if (data.userId === currentUser.uid || !data.userId || data.userId === 'all') {
            list.push({ ...data, id: d.id });
          }
        });
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Notifications read error', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((item) => {
        if (!item.isRead) {
          const ref = doc(db, 'notifications', item.id);
          batch.update(ref, { isRead: true });
        }
      });
      await batch.commit();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Mark all read error', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-[#fbc02d] overflow-hidden mt-16 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#FF4500] px-5 py-3.5 flex items-center justify-between text-white border-b-2 border-[#ffeb3b]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#ffeb3b]" />
            <h3 className="font-bold text-lg">নোটিফিকেশন</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={markAllAsRead}
                className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#ffeb3b]" />
                <span>সব পড়া হয়েছে</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 divide-y divide-amber-100">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="w-6 h-6 border-2 border-[#d32f2f] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>নোটিফিকেশন লোড হচ্ছে...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-amber-300 stroke-[1.5]" />
              <p className="text-sm font-medium">কোনো নতুন নোটিফিকেশন নেই</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`pt-3 first:pt-0 pb-1 rounded-xl transition ${
                  !item.isRead ? 'bg-amber-50/70 p-2.5 border border-amber-200' : 'p-2'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 rounded-full bg-amber-100 text-[#d32f2f] mt-0.5 shrink-0">
                      {item.type === 'bonus' ? (
                        <Sparkles className="w-4 h-4 text-[#fbc02d]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#d32f2f]" />
                      )}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{item.message}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(item.createdAt).toLocaleString('bn-BD', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  {!item.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d32f2f] shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-amber-50 border-t border-amber-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-xl font-medium text-sm transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
