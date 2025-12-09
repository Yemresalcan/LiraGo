'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import { Search, Filter, MoreHorizontal, Download, Receipt, X, ChevronDown } from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
}

interface ReceiptData {
  id: string;
  title: string;
  amount: number;
  date: any;
  category: string;
  merchant?: string;
  currency?: string;
  imageUrl?: string;
  status?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['all', 'electricity', 'water', 'naturalGas', 'gas', 'internet', 'other', 'receipts'];

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        // First, fetch all users to create a mapping
        const userMap: { [userId: string]: UserInfo } = {};
        const userList: UserInfo[] = [];
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const userInfo = {
              id: doc.id,
              email: data.email || 'Unknown',
              displayName: data.displayName || data.email || 'Unknown User'
            };
            userMap[doc.id] = userInfo;
            userList.push(userInfo);
          });
          setUsers(userList);
        } catch (err) {
          console.warn('Failed to fetch users:', err);
        }

        const collectionsToFetch = [
          'receipts',
          'electricity_bills',
          'water_bills',
          'naturalGas_bills',
          'gas_bills',
          'internet_bills',
          'other_bills'
        ];

        const fetchPromises = collectionsToFetch.map(async (colName) => {
          const colRef = collection(db, colName);
          const q = query(colRef, limit(100));
          
          try {
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
              const data = doc.data();
              const userId = data.userId || '';
              return {
                id: doc.id,
                originalCollection: colName,
                title: data.merchant || data.title || data.description || (colName === 'receipts' ? 'Unknown Receipt' : `${colName.replace('_bills', '')} Bill`),
                amount: data.amount || data.cost || 0,
                date: data.date,
                category: colName === 'receipts' ? 'receipts' : colName.replace('_bills', ''),
                merchant: data.merchant || (colName !== 'receipts' ? colName.replace('_bills', '') : 'Unknown'),
                currency: data.currency || 'TRY',
                imageUrl: data.imageUrl,
                status: data.status,
                userId: userId,
                userEmail: userMap[userId]?.email || 'Unknown',
                userName: userMap[userId]?.displayName || 'Unknown User'
              } as ReceiptData;
            });
          } catch (err) {
            console.warn(`Failed to fetch from ${colName}:`, err);
            return [];
          }
        });

        const results = await Promise.all(fetchPromises);
        const allTransactions = results.flat();

        // Sort by date desc in memory
        allTransactions.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setReceipts(allTransactions);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, []);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        receipt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || receipt.category === selectedCategory;

      // User filter
      const matchesUser = selectedUser === 'all' || receipt.userId === selectedUser;

      return matchesSearch && matchesCategory && matchesUser;
    });
  }, [receipts, searchQuery, selectedCategory, selectedUser]);

  const formatCurrency = (amount: number, currency = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    } catch (e) {
        return 'Invalid Date';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedUser('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedUser !== 'all';

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      
      <main className="ml-72 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-black">Receipts</h1>
            <p className="text-gray-500">Manage and view all transaction receipts</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search receipts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black w-64"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || hasActiveFilters 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="bg-white text-black text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {[selectedCategory !== 'all', selectedUser !== 'all'].filter(Boolean).length}
                </span>
              )}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800">
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>
            <div className="flex gap-4 flex-wrap">
              {/* Category Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-500 mb-2">Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-black capitalize"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="capitalize">
                        {cat === 'all' ? 'All Categories' : cat === 'naturalGas' ? 'Natural Gas' : cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* User Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-500 mb-2">User</label>
                <div className="relative">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-black"
                  >
                    <option value="all">All Users</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.displayName} ({user.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                Error: {error}
            </div>
        )}

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-500">
          Showing {filteredReceipts.length} of {receipts.length} receipts
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm uppercase tracking-wider">Receipt Details</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm uppercase tracking-wider">User</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-gray-500 text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading receipts...</td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {hasActiveFilters ? 'No receipts match your filters.' : 'No receipts found.'}
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-black overflow-hidden">
                          {receipt.imageUrl ? (
                              <img src={receipt.imageUrl} alt="Receipt" className="w-full h-full object-cover" />
                          ) : (
                              <Receipt size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-black">{receipt.merchant || receipt.title || 'Unknown Merchant'}</div>
                          <div className="text-xs text-gray-400">ID: {receipt.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                          {receipt.userName?.substring(0, 1).toUpperCase() || 'U'}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{receipt.userName}</div>
                          <div className="text-gray-400 text-xs">{receipt.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${receipt.category === 'electricity' ? 'bg-yellow-100 text-yellow-800' : 
                          receipt.category === 'water' ? 'bg-blue-100 text-blue-800' : 
                          receipt.category === 'naturalGas' || receipt.category === 'gas' ? 'bg-orange-100 text-orange-800' : 
                          receipt.category === 'internet' ? 'bg-purple-100 text-purple-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {receipt.category === 'naturalGas' ? 'Natural Gas' : receipt.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatDate(receipt.date)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-black">
                      {formatCurrency(Number(receipt.amount), receipt.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-black">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
