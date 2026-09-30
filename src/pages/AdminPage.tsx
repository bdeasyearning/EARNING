import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import {
  ShieldCheck,
  Users,
  CheckSquare,
  ArrowDownToLine,
  Bell,
  Link,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  Edit,
  Plus,
  Flame,
  Send,
  Eye,
  Ban
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  UserProfile,
  WithdrawalRequest,
  ActivationRequest,
  TaskItem,
  SuspiciousUserRecord,
  SystemSettings
} from '../types';

export const AdminPage: React.FC = () => {
  const { currentUser, isAdmin, settings } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'users'
    | 'tasks'
    | 'withdrawals'
    | 'activations'
    | 'notifications'
    | 'ad_links'
    | 'anti_fraud'
    | 'settings'
  >('dashboard');

  // State data
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activations, setActivations] = useState<ActivationRequest[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState<SuspiciousUserRecord[]>([]);

  // Search filter
  const [searchUser, setSearchUser] = useState('');

  // Balance edit modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);

  // New task form modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<TaskItem>>({
    title: '',
    link: '',
    reward: 5,
    category: 'youtube',
    isActive: true,
    dailyLimit: 1
  });

  // Broadcast Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | string>('all');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Screenshot preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch all live collections
  useEffect(() => {
    // Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      setAllUsers(list);
    });

    // Withdrawals
    const unsubWithdrawals = onSnapshot(
      query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')),
      (snap) => {
        const list: WithdrawalRequest[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as WithdrawalRequest));
        setWithdrawals(list);
      }
    );

    // Activations
    const unsubActivations = onSnapshot(
      query(collection(db, 'activations'), orderBy('submittedAt', 'desc')),
      (snap) => {
        const list: ActivationRequest[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ActivationRequest));
        setActivations(list);
      }
    );

    // Tasks
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const list: TaskItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as TaskItem));
      setTasks(list);
    });

    // Suspicious Users
    const unsubSuspicious = onSnapshot(collection(db, 'suspicious_users'), (snap) => {
      const list: SuspiciousUserRecord[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as SuspiciousUserRecord));
      setSuspiciousUsers(list);
    });

    return () => {
      unsubUsers();
      unsubWithdrawals();
      unsubActivations();
      unsubTasks();
      unsubSuspicious();
    };
  }, []);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Auth Guard
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-[#d32f2f] flex items-center justify-center mx-auto">
          <Ban className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">অননুমোদিত প্রবেশ!</h2>
        <p className="text-xs text-gray-600">
          এই পেজে শুধুমাত্র অনুমোদিত অ্যাডমিনের প্রবেশাধিকার রয়েছে।
        </p>
      </div>
    );
  }

  // Dashboard Stats Calculations
  const totalUsersCount = allUsers.length;
  const verifiedUsersCount = allUsers.filter((u) => u.isVerified).length;
  const totalSystemBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
  const pendingWithdrawCount = withdrawals.filter((w) => w.status === 'pending').length;
  const pendingActivationCount = activations.filter((a) => a.status === 'pending').length;
  const bannedUsersCount = allUsers.filter((u) => u.isBanned).length;

  // Actions
  const handleApproveWithdraw = async (item: WithdrawalRequest) => {
    if (!confirm(`${item.amount}৳ উত্তোলনের রিকোয়েস্ট অনুমোদন (Approve) করবেন?`)) return;
    try {
      await updateDoc(doc(db, 'withdrawals', item.id), {
        status: 'approved',
        processedAt: new Date().toISOString()
      });
      // Notify user
      await addDoc(collection(db, 'notifications'), {
        userId: item.userId,
        title: 'উত্তোলন সফল হয়েছে! 💰',
        message: `আপনার ${item.amount}৳ এর উত্তোলন (${item.method}) সফলভাবে পাঠানো হয়েছে।`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'withdraw'
      });
    } catch (err) {
      alert('উত্তোলন আপডেটে সমস্যা হয়েছে।');
    }
  };

  const handleRejectWithdraw = async (item: WithdrawalRequest) => {
    const reason = prompt('বাতিলের কারণ লিখুন:');
    if (!reason) return;
    try {
      await updateDoc(doc(db, 'withdrawals', item.id), {
        status: 'rejected',
        adminNote: reason,
        processedAt: new Date().toISOString()
      });

      // Refund user balance
      const userRef = doc(db, 'users', item.userId);
      const user = allUsers.find((u) => u.uid === item.userId);
      if (user) {
        await updateDoc(userRef, {
          balance: (user.balance || 0) + item.amount,
          totalWithdraw: Math.max(0, (user.totalWithdraw || 0) - item.amount)
        });
      }

      // Notify user
      await addDoc(collection(db, 'notifications'), {
        userId: item.userId,
        title: 'উত্তোলন বাতিল করা হয়েছে',
        message: `আপনার ${item.amount}৳ উত্তোলনের রিকোয়েস্ট বাতিল করা হয়েছে। কারণ: ${reason}। টাকা আপনার ব্যালেন্সে ফেরত পাঠানো হয়েছে।`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'withdraw'
      });
    } catch (err) {
      alert('উত্তোলন বাতিলে সমস্যা হয়েছে।');
    }
  };

  const handleApproveActivation = async (item: ActivationRequest) => {
    if (!confirm(`ইউজার ${item.userName} এর একাউন্ট ভেরিফাই করবেন?`)) return;
    try {
      await updateDoc(doc(db, 'activations', item.id), {
        status: 'approved'
      });

      await updateDoc(doc(db, 'users', item.userId), {
        isVerified: true
      });

      await addDoc(collection(db, 'notifications'), {
        userId: item.userId,
        title: 'অ্যাকাউন্ট ভেরিফাইড! 🎉',
        message: 'আপনার ভেরিফিকেশন আবেদন অনুমোদিত হয়েছে। এখন আপনি টাকা উত্তোলন করতে পারবেন।',
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'verify'
      });
    } catch (err) {
      alert('অ্যাক্টিভেশন অ্যাপ্রুভে সমস্যা হয়েছে।');
    }
  };

  const handleToggleBanUser = async (user: UserProfile) => {
    const actionName = user.isBanned ? 'আনব্যান' : 'ব্যান';
    if (!confirm(`আপনি কি এই ইউজারকে (${user.phone}) ${actionName} করতে চান?`)) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isBanned: !user.isBanned
      });
    } catch (err) {
      alert('ইউজার স্ট্যাটাস আপডেটে সমস্যা হয়েছে।');
    }
  };

  const handleSaveBalance = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        balance: Number(newBalance)
      });
      setEditingUser(null);
    } catch (err) {
      alert('ব্যালেন্স আপডেটে সমস্যা হয়েছে।');
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.link) return;

    try {
      const taskId = 'task_' + Date.now();
      await setDoc(doc(db, 'tasks', taskId), {
        ...taskForm,
        id: taskId
      });
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        link: '',
        reward: 5,
        category: 'youtube',
        isActive: true,
        dailyLimit: 1
      });
    } catch (err) {
      alert('টাস্ক তৈরিতে সমস্যা হয়েছে।');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('টাস্কটি ডিলিট করতে চান?')) return;
    await deleteDoc(doc(db, 'tasks', id));
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setSendingNotif(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: notifTarget === 'all' ? null : notifTarget,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'system'
      });
      setNotifTitle('');
      setNotifMessage('');
      alert('নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!');
    } catch (err) {
      alert('নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settingsForm);
      alert('সিস্টেম সেটিংস সফলভাবে আপডেট হয়েছে!');
    } catch (err) {
      alert('সেটিংস সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filter users
  const filteredUsers = allUsers.filter(
    (u) =>
      u.phone?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.referralCode?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Top Header */}
      <div className="bg-gradient-to-r from-[#FF4500] via-[#d32f2f] to-[#8e0000] text-white p-5 rounded-3xl shadow-xl border-2 border-[#ffeb3b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-2xl border border-white/30">
            <ShieldCheck className="w-8 h-8 text-[#ffeb3b]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-['Poppins']">
              BD Easy Earning অ্যাডমিন প্যানেল
            </h1>
            <p className="text-xs text-amber-100">
              অ্যাপ্লিকেশন নিয়ন্ত্রণ, উত্তোলন ও অ্যান্টি-ফ্রড ম্যানেজমেন্ট
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: Flame },
          { id: 'users', label: `ইউজার (${totalUsersCount})`, icon: Users },
          { id: 'withdrawals', label: `উত্তোলন (${pendingWithdrawCount})`, icon: ArrowDownToLine },
          { id: 'activations', label: `ভেরিফিকেশন (${pendingActivationCount})`, icon: ShieldCheck },
          { id: 'anti_fraud', label: `অ্যান্টি-ফ্রড (${suspiciousUsers.length})`, icon: AlertTriangle },
          { id: 'tasks', label: 'টাস্ক ম্যানেজার', icon: CheckSquare },
          { id: 'notifications', label: 'ব্রডকাস্ট', icon: Bell },
          { id: 'settings', label: 'সেটিংস', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition ${
                isActive
                  ? 'bg-[#d32f2f] text-white shadow-md border-2 border-[#ffeb3b]'
                  : 'bg-white text-gray-700 hover:bg-amber-100/60 border border-amber-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD STATS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block">মোট রেজিস্টার্ড ইউজার</span>
              <span className="text-2xl font-black text-gray-900 font-['Poppins']">
                {totalUsersCount}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block">ভেরিফাইড মেম্বার</span>
              <span className="text-2xl font-black text-emerald-600 font-['Poppins']">
                {verifiedUsersCount}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block">সিস্টেম ব্যালেন্স</span>
              <span className="text-2xl font-black text-[#d32f2f] font-['Poppins']">
                ৳{totalSystemBalance.toFixed(0)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block">পেন্ডিং উত্তোলন</span>
              <span className="text-2xl font-black text-amber-600 font-['Poppins']">
                {pendingWithdrawCount} টি
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block">পেন্ডিং ভেরিফিকেশন</span>
              <span className="text-2xl font-black text-purple-600 font-['Poppins']">
                {pendingActivationCount} টি
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block">ব্যান করা ইউজার</span>
              <span className="text-2xl font-black text-red-700 font-['Poppins']">
                {bannedUsersCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-gray-900 text-sm">ইউজার তালিকা ({allUsers.length})</h3>
            <div className="relative w-64 max-w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="নাম বা ফোন নাম্বার দিয়ে খুঁজুন..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-amber-50/50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-[#FF4500]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-amber-50 text-gray-600 font-bold border-b border-amber-200">
                <tr>
                  <th className="p-2.5">ইউজার</th>
                  <th className="p-2.5">ফোন</th>
                  <th className="p-2.5">ব্যালেন্স</th>
                  <th className="p-2.5">রেফারেল</th>
                  <th className="p-2.5">স্ট্যাটাস</th>
                  <th className="p-2.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.slice(0, 50).map((u) => (
                  <tr key={u.uid} className="hover:bg-amber-50/30">
                    <td className="p-2.5 font-bold text-gray-900">{u.fullName || 'মেম্বার'}</td>
                    <td className="p-2.5 font-mono">{u.phone}</td>
                    <td className="p-2.5 font-bold text-[#d32f2f] font-['Poppins']">
                      ৳{(u.balance || 0).toFixed(2)}
                    </td>
                    <td className="p-2.5">{u.totalReferrals || 0} টি</td>
                    <td className="p-2.5">
                      {u.isBanned ? (
                        <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          ব্যান
                        </span>
                      ) : u.isVerified ? (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          ভেরিফাইড
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          নরমাল
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setNewBalance(u.balance || 0);
                        }}
                        className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 font-bold"
                        title="ব্যালেন্স এডিট"
                      >
                        ব্যালেন্স
                      </button>
                      <button
                        onClick={() => handleToggleBanUser(u)}
                        className={`px-2 py-1 rounded-lg font-bold ${
                          u.isBanned
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {u.isBanned ? 'আনব্যান' : 'ব্যান'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAWALS APPROVAL */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center justify-between">
            <span>টাকা তোলার রিকোয়েস্ট তালিকা</span>
            <span className="text-xs text-amber-600 font-bold">পেন্ডিং: {pendingWithdrawCount}</span>
          </h3>

          <div className="divide-y divide-gray-100 space-y-3">
            {withdrawals.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                কোনো উত্তোলন রিকোয়েস্ট নেই
              </div>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-gray-900 font-['Poppins']">
                        ৳{w.amount}
                      </span>
                      <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        {w.method} ({w.accountType || 'Personal'})
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span>নাম্বার: <b className="font-mono text-gray-900">{w.accountNumber}</b></span>
                      <span className="mx-2">•</span>
                      <span>ইউজার: {w.userName} ({w.userPhone})</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      তারিখ: {new Date(w.requestedAt).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {w.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApproveWithdraw(w)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          অ্যাপ্রুভ (টাকা পেইড)
                        </button>
                        <button
                          onClick={() => handleRejectWithdraw(w)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition"
                        >
                          রিজেক্ট
                        </button>
                      </>
                    ) : w.status === 'approved' ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        ✓ অনুমোদিত ও পেইড
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                        বাতিল
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVATIONS & SCREENSHOTS APPROVAL */}
      {activeTab === 'activations' && (
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center justify-between">
            <span>ভেরিফিকেশন ও অ্যাক্টিভেশন রিকোয়েস্ট</span>
            <span className="text-xs text-purple-600 font-bold">পেন্ডিং: {pendingActivationCount}</span>
          </h3>

          <div className="divide-y divide-gray-100 space-y-3">
            {activations.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                কোনো ভেরিফিকেশন আবেদন জমা নেই
              </div>
            ) : (
              activations.map((a) => (
                <div key={a.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {a.userName} ({a.userPhone})
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                        {a.method} (১৫০৳)
                      </span>
                    </div>
                    {a.trxId && (
                      <div className="text-xs font-mono text-gray-700 mt-1">
                        TrxID: <b className="text-[#d32f2f]">{a.trxId}</b>
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {new Date(a.submittedAt).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.screenshot && (
                      <button
                        onClick={() => setPreviewImage(a.screenshot || null)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>স্ক্রিনশট দেখুন</span>
                      </button>
                    )}

                    {a.status === 'pending' ? (
                      <button
                        onClick={() => handleApproveActivation(a)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        ভেরিফাই কনফার্ম
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        ✓ ভেরিফাইড
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ANTI-FRAUD & SUSPICIOUS USERS (LAYERS 5, 7, 8, 9) */}
      {activeTab === 'anti_fraud' && (
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>সন্দেহভাজন ফ্রড অ্যাক্টিভিটি লগ (লেয়ার ৭ ও ৮)</span>
            </h3>
            <span className="text-xs font-bold text-red-600">
              ফ্ল্যাগড: {suspiciousUsers.length} টি
            </span>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
            <span className="font-bold block">অটো-ব্যান পলিসি (লেয়ার ৯):</span>
            <p>• ২৪ ঘণ্টায় ৫+ রেফার বা একই ব্রাউজার ডিভাইস থেকে একাধিক রেফার ব্লক করা হয়।</p>
            <p>• কোনো ইউজারের ৩টি ফ্রড চেষ্টা শনাক্ত হলে অ্যাকাউন্ট অটো-ব্যান করা যায়।</p>
          </div>

          <div className="divide-y divide-gray-100">
            {suspiciousUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                কোনো সন্দেহভাজন ফ্রড কার্যক্রম ধরা পড়েনি।
              </div>
            ) : (
              suspiciousUsers.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                      {s.reason}
                    </span>
                    <p className="text-xs text-gray-700 mt-1">{s.details || 'সন্দেহভাজন রেফারেল প্রচেষ্টা'}</p>
                    <span className="text-[10px] text-gray-400 font-mono">
                      User ID: {s.userId} • {new Date(s.flaggedAt).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const user = allUsers.find((u) => u.uid === s.userId);
                      if (user) handleToggleBanUser(user);
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                  >
                    ব্যান করুন
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: TASKS MANAGER */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">টাস্ক তালিকা ({tasks.length})</h3>
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3 py-1.5 bg-[#d32f2f] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন টাস্ক যোগ</span>
            </button>
          </div>

          <div className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-gray-900">{t.title}</h4>
                  <a
                    href={t.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#FF4500] hover:underline font-mono truncate max-w-xs block"
                  >
                    {t.link}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ৳{t.reward}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                    title="ডিলিট"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: BROADCAST NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#FF4500]" />
            <span>সকল ইউজারের কাছে পুশ নোটিফিকেশন পাঠান</span>
          </h3>

          <form onSubmit={handleSendBroadcast} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">নোটিফিকেশনের শিরোনাম</label>
              <input
                type="text"
                placeholder="যেমন: নতুন কাজের বোনাস শুরু হয়েছে!"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-[#FF4500]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">বার্তা (Message)</label>
              <textarea
                rows={3}
                placeholder="ইউজারদের উদ্দেশ্যে বিস্তারিত বার্তা লিখুন..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                required
                className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-[#FF4500]"
              />
            </div>

            <button
              type="submit"
              disabled={sendingNotif}
              className="px-5 py-2.5 bg-[#FF4500] hover:bg-[#d32f2f] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sendingNotif ? 'পাঠানো হচ্ছে...' : 'ব্রডকাস্ট পাঠান'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 8: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#d32f2f]" />
            <span>সিস্টেম সেটিংস ও পেমেন্ট নম্বর</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">মিনিমাম উত্তোলন (টাকা)</label>
                <input
                  type="number"
                  value={settingsForm.minWithdraw}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, minWithdraw: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">রেফার শর্ত (উত্তোলনের জন্য)</label>
                <input
                  type="number"
                  value={settingsForm.minReferralsForWithdraw}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      minReferralsForWithdraw: Number(e.target.value)
                    })
                  }
                  required
                  className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">প্রতি রেফারে বোনাস (টাকা)</label>
                <input
                  type="number"
                  value={settingsForm.referralBonus}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, referralBonus: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ফ্রি ভেরিফিকেশন রেফারেল সংখ্যা</label>
                <input
                  type="number"
                  value={settingsForm.freeVerificationReferrals}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      freeVerificationReferrals: Number(e.target.value)
                    })
                  }
                  required
                  className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">বিকাশ পার্সোনাল নম্বর</label>
                <input
                  type="text"
                  value={settingsForm.bkashNumber}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, bkashNumber: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">নগদ পার্সোনাল নম্বর</label>
                <input
                  type="text"
                  value={settingsForm.nagadNumber}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, nagadNumber: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">নোটিশ টেক্সট (মারকুই স্ক্রল)</label>
              <input
                type="text"
                value={settingsForm.noticeText}
                onChange={(e) => setSettingsForm({ ...settingsForm, noticeText: e.target.value })}
                className="w-full px-3 py-2 bg-amber-50/50 border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {savingSettings ? 'সেভ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Balance Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border-4 border-[#ffeb3b] space-y-3">
            <h3 className="font-bold text-sm text-gray-900">ব্যালেন্স এডিট করুন</h3>
            <p className="text-xs text-gray-500 font-mono">{editingUser.phone} ({editingUser.fullName})</p>

            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl font-['Poppins'] font-bold text-sm"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSaveBalance}
                className="flex-1 py-2 bg-[#d32f2f] text-white rounded-xl text-xs font-bold"
              >
                সেভ করুন
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border-4 border-[#ffeb3b] space-y-3">
            <h3 className="font-bold text-sm text-gray-900">নতুন টাস্ক তৈরি করুন</h3>

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">কাজের শিরোনাম</label>
                <input
                  type="text"
                  placeholder="যেমন: টেলিগ্রাম চ্যানেলে জয়েন করুন"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">লিংক</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={taskForm.link}
                  onChange={(e) => setTaskForm({ ...taskForm, link: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">রিওয়ার্ড (টাকা)</label>
                  <input
                    type="number"
                    value={taskForm.reward}
                    onChange={(e) => setTaskForm({ ...taskForm, reward: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-xs font-['Poppins']"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="telegram">Telegram</option>
                    <option value="facebook">Facebook</option>
                    <option value="web">Website</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#d32f2f] text-white rounded-xl text-xs font-bold"
                >
                  তৈরি করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-gray-800">পেমেন্ট স্ক্রিনশট</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-500 font-bold text-xs hover:text-black"
              >
                বন্ধ করুন ✕
              </button>
            </div>
            <img
              src={previewImage}
              alt="Payment Proof"
              className="w-full max-h-96 object-contain rounded-xl border"
            />
          </div>
        </div>
      )}
    </div>
  );
};
