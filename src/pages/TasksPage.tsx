import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  setDoc,
  getDocs
} from 'firebase/firestore';
import {
  CheckSquare,
  ExternalLink,
  Gift,
  Youtube,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { TaskItem, TaskCompletion } from '../types';
import { playRewardSound, checkAndPayReferralBonus } from '../utils/security';

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'task_yt_sub',
    title: 'YouTube সাবস্ক্রাইব করুন',
    link: 'https://youtube.com/@bdeasyearning',
    reward: 5,
    dailyLimit: 1,
    isActive: true,
    category: 'youtube',
    description: 'আমাদের অফিসিয়াল ইউটিউব চ্যানেল সাবস্ক্রাইব করে সাপোর্ট করুন।'
  },
  {
    id: 'task_tg_join',
    title: 'Telegram চ্যানেলে জয়েন করুন',
    link: 'https://t.me/BDEasyEarning_1',
    reward: 5,
    dailyLimit: 1,
    isActive: true,
    category: 'telegram',
    description: 'পেমেন্ট প্রুফ ও দৈনিক আপডেটের জন্য টেলিগ্রাম চ্যানেলে জয়েন থাকুন।'
  },
  {
    id: 'task_share_post',
    title: 'ফেসবুকে ভিডিও শেয়ার করুন',
    link: 'https://youtube.com/@bdeasyearning',
    reward: 5,
    dailyLimit: 1,
    isActive: true,
    category: 'youtube',
    description: 'আমাদের ইউটিউব ভিডিও ফেসবুকে বন্ধুদের সাথে শেয়ার করুন।'
  }
];

export const TasksPage: React.FC = () => {
  const { userProfile, updateBalance, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch tasks
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      if (!snapshot.empty) {
        const list: TaskItem[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as TaskItem);
        });
        setTasks(list);
      } else {
        // Seed initial tasks if empty
        DEFAULT_TASKS.forEach((t) => {
          setDoc(doc(db, 'tasks', t.id), t).catch(() => {});
        });
        setTasks(DEFAULT_TASKS);
      }
    });

    return () => unsub();
  }, []);

  // Fetch user completed tasks today
  useEffect(() => {
    if (!userProfile) return;
    const q = query(
      collection(db, 'task_completions'),
      where('userId', '==', userProfile.uid),
      where('dateStr', '==', todayStr)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => {
        ids.push(d.data().taskId);
      });
      setCompletedTaskIds(ids);
      setTodayCompletedCount(ids.length);
    });

    return () => unsub();
  }, [userProfile, todayStr]);

  // Window focus listener for returning from external link
  useEffect(() => {
    const handleFocus = () => {
      if (activeTask && !completedTaskIds.includes(activeTask.id)) {
        // Show reward collection popup with small delay
        setTimeout(() => {
          setShowCollectModal(true);
        }, 1200);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTask, completedTaskIds]);

  const handleStartTask = (task: TaskItem) => {
    setActiveTask(task);
    // Open in new tab
    window.open(task.link, '_blank');
  };

  const handleCollectReward = async () => {
    if (!activeTask || !userProfile || collecting) return;
    setCollecting(true);

    try {
      const now = new Date().toISOString();
      // Record task completion in Firestore
      await addDoc(collection(db, 'task_completions'), {
        userId: userProfile.uid,
        taskId: activeTask.id,
        reward: activeTask.reward,
        completedAt: now,
        dateStr: todayStr
      });

      // Update user balance
      const newBalance = (userProfile.balance || 0) + activeTask.reward;
      const newTotal = (userProfile.totalIncome || 0) + activeTask.reward;

      await updateDoc(doc(db, 'users', userProfile.uid), {
        balance: newBalance,
        totalIncome: newTotal,
        lastActiveAt: now
      });

      // Layer 5 check: if user crossed 50 BDT, release referrer 70 BDT bonus!
      await checkAndPayReferralBonus(userProfile.uid, newTotal);

      // Play sound and trigger confetti
      playRewardSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setShowCollectModal(false);
      setActiveTask(null);
      refreshProfile();
    } catch (err) {
      console.error('Task collect error', err);
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-[#d32f2f] to-[#FF4500] text-white p-5 rounded-3xl shadow-lg border-2 border-[#ffeb3b] flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold text-amber-200">ডেইলি টাস্ক রিওয়ার্ড</span>
          <h2 className="text-xl sm:text-2xl font-black mt-0.5">সহজ কাজ করে আয় করুন</h2>
          <p className="text-xs text-amber-100 mt-1">
            প্রতিটি লিংকে ক্লিক করে কাজটি শেষ করুন এবং ৳৫ করে ইনকাম করুন!
          </p>
        </div>
        <div className="bg-white/20 p-3 rounded-2xl text-center border border-white/30 shrink-0">
          <span className="text-[10px] text-amber-200 block font-bold">আজকে সম্পন্ন</span>
          <span className="text-2xl font-black font-['Poppins']">{todayCompletedCount} টি</span>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#d32f2f]" />
          <span>উপলব্ধ কাজের তালিকা</span>
        </h3>

        {tasks.map((task) => {
          const isDone = completedTaskIds.includes(task.id);
          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border-2 transition flex items-center justify-between gap-3 ${
                isDone
                  ? 'bg-gray-50 border-gray-200 opacity-80'
                  : 'bg-white border-amber-200 hover:border-[#FF4500] shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-3 rounded-xl mt-0.5 ${
                    task.category === 'youtube'
                      ? 'bg-red-100 text-[#FF0000]'
                      : 'bg-sky-100 text-[#229ED9]'
                  }`}
                >
                  {task.category === 'youtube' ? (
                    <Youtube className="w-5 h-5" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-900">{task.title}</h4>
                    <span className="bg-[#ffeb3b] text-[#d32f2f] text-xs font-black px-2 py-0.5 rounded-full border border-amber-300">
                      +৳{task.reward}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {task.description || 'লিংকে ক্লিক করে পেজটি ভিজিট করুন'}
                  </p>
                </div>
              </div>

              <div>
                {isDone ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>সম্পন্ন ✓</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartTask(task)}
                    className="px-4 py-2 bg-gradient-to-r from-[#FF4500] to-[#d32f2f] hover:from-[#e03d00] hover:to-[#b71c1c] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition shrink-0"
                  >
                    <span>কাজ শুরু করুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collect Reward Modal */}
      {showCollectModal && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border-4 border-[#ffeb3b] space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-[#d32f2f] flex items-center justify-center mx-auto border-2 border-amber-300 animate-bounce">
              <Gift className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900">কাজটি সফল হয়েছে! 🎉</h3>
              <p className="text-xs text-gray-600 mt-1">
                আপনার ৳{activeTask.reward} রিওয়ার্ড প্রস্তুত আছে। এখনি ওয়ালেটে যোগ করে নিন!
              </p>
            </div>

            <button
              onClick={handleCollectReward}
              disabled={collecting}
              className="w-full py-3.5 bg-gradient-to-r from-[#d32f2f] to-[#FF4500] text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-base active:scale-95 transition"
            >
              <Sparkles className="w-5 h-5 text-[#ffeb3b]" />
              <span>{collecting ? 'যোগ হচ্ছে...' : `৳${activeTask.reward} কালেক্ট করুন`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
