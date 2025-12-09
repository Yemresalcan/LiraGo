'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, Filter, Users, DollarSign, Receipt } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: any;
  category: string;
  userId: string;
  userEmail?: string;
  userName?: string;
}

interface UserInfo {
  email: string;
  displayName: string;
}

interface DashboardStats {
  totalExpenses: number;
  totalUsers: number;
  totalReceipts: number;
}

export default function Dashboard() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalExpenses: 0, totalUsers: 0, totalReceipts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // First, fetch all users to create a mapping
        const userMap: { [userId: string]: UserInfo } = {};
        let userCount = 0;
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          userCount = usersSnapshot.size;
          usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            userMap[doc.id] = {
              email: data.email || 'Unknown',
              displayName: data.displayName || data.email || 'Unknown User'
            };
          });
        } catch (err) {
          console.warn('Failed to fetch users:', err);
        }

        // Fetch all transactions from all collections
        const collectionsToFetch = [
          'receipts',
          'electricity_bills',
          'water_bills',
          'naturalGas_bills',
          'gas_bills',
          'internet_bills',
          'other_bills'
        ];

        let allTransactions: Transaction[] = [];
        let totalExpenses = 0;

        for (const colName of collectionsToFetch) {
          try {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);
            
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              const amount = data.amount || data.cost || 0;
              const userId = data.userId || '';
              totalExpenses += amount;

              allTransactions.push({
                id: doc.id,
                title: data.merchant || data.title || data.description || (colName === 'receipts' ? 'Unknown Receipt' : `${colName.replace('_bills', '')} Bill`),
                amount: amount,
                date: data.date,
                category: data.category || colName.replace('_bills', ''),
                userId: userId,
                userEmail: userMap[userId]?.email || 'Unknown',
                userName: userMap[userId]?.displayName || 'Unknown User'
              });
            });
          } catch (err) {
            console.warn(`Failed to fetch from ${colName}:`, err);
          }
        }

        // Sort by date (newest first)
        allTransactions.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setStats({
          totalExpenses: totalExpenses,
          totalUsers: userCount,
          totalReceipts: allTransactions.length
        });

        setRecentTransactions(allTransactions.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    } catch (e) {
        return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      
      <main className="ml-72 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-black">Dashboard</h1>
            <p className="text-gray-500">Welcome back, Admin</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
               A
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black text-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-gray-800 rounded-lg">
                        <DollarSign size={24} className="text-white" />
                    </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Total Expenses</h3>
                <p className="text-3xl font-bold">
                  {loading ? '...' : formatCurrency(stats.totalExpenses)}
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Users size={24} className="text-blue-600" />
                    </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalUsers.toLocaleString()}
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Receipt size={24} className="text-purple-600" />
                    </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">Total Receipts</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalReceipts.toLocaleString()}
                </p>
            </div>
        </div>

        {/* Recent Transactions Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Recent Receipts</h2>
                    <p className="text-sm text-gray-500">Latest bills uploaded by users</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600">
                        <Search size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            <th className="pb-4">Merchant / Title</th>
                            <th className="pb-4">User</th>
                            <th className="pb-4">Date</th>
                            <th className="pb-4">Category</th>
                            <th className="pb-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading...</td></tr>
                        ) : recentTransactions.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-gray-500">No receipts found.</td></tr>
                        ) : (
                            recentTransactions.map((t) => (
                                <tr key={t.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                {t.title.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900">{t.title}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                                {t.userName?.substring(0, 1).toUpperCase() || 'U'}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">{t.userName}</div>
                                                <div className="text-gray-400 text-xs">{t.userEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-gray-500 text-sm">{formatDate(t.date)}</td>
                                    <td className="py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right font-medium text-gray-900">
                                        {formatCurrency(t.amount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 text-center">
                <Link href="/receipts" className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    View all receipts
                </Link>
            </div>
        </div>
      </main>
    </div>
  );
}
