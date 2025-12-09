'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import { Search, Filter, MoreHorizontal } from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: any; // Firestore Timestamp
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar />
      
      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Users</h1>
            <p className="text-text-secondary">Manage all registered users</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="pl-10 pr-4 py-2 bg-white border border-func-border-subtle rounded-lg focus:outline-none focus:border-func-border"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-func-border-subtle rounded-lg hover:bg-gray-50">
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800">
              Add User
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl border border-func-border-subtle overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-func-border-subtle">
              <tr>
                <th className="px-6 py-4 font-medium text-text-secondary text-sm uppercase tracking-wider">User</th>
                <th className="px-6 py-4 font-medium text-text-secondary text-sm uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-medium text-text-secondary text-sm uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium text-text-secondary text-sm uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 font-medium text-text-secondary text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-func-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-periwinkle flex items-center justify-center text-text-primary font-bold">
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{user.displayName || 'No Name'}</div>
                          <div className="text-sm text-text-secondary">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-mint text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-text-secondary hover:text-text-primary">
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
