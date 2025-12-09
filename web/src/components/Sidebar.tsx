import Link from 'next/link';
import { LayoutDashboard, Receipt, Settings, History, Plus, User, ChevronRight, LogOut, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="w-72 bg-[#1C1C1E] text-white h-screen fixed left-0 top-0 flex flex-col p-6 rounded-r-3xl z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-black rounded-full transform rotate-45"></div>
        </div>
        <span className="text-xl font-bold tracking-tight">Bi Lira Admin</span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <Link href="/" className="flex items-center gap-4 px-4 py-3 bg-[#2C2C2E] rounded-xl text-white transition-colors">
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link href="/users" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#2C2C2E] rounded-xl transition-colors">
          <User size={20} />
          <span className="font-medium">Users</span>
        </Link>
        <Link href="/receipts" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#2C2C2E] rounded-xl transition-colors">
          <Receipt size={20} />
          <span className="font-medium">Receipts</span>
        </Link>
        <Link href="/upload-bills" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#2C2C2E] rounded-xl transition-colors">
          <Upload size={20} />
          <span className="font-medium">Upload Bills</span>
        </Link>
        <Link href="/settings" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#2C2C2E] rounded-xl transition-colors">
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </Link>
      </nav>

      {/* Bottom Widgets */}
      <div className="space-y-4 mt-auto">

        {/* User Profile */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
             A
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{user?.displayName || 'Admin'}</div>
            <div className="text-xs text-gray-400 truncate">{user?.role || 'Administrator'}</div>
          </div>
          <button onClick={() => signOut()} className="text-gray-400 hover:text-white" title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
