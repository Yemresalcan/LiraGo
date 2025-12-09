'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun,
  Save,
  Key,
  Mail,
  Smartphone,
  Database,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Loader2
} from 'lucide-react';

interface SettingsData {
  darkMode: boolean;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  twoFactorAuth: boolean;
  displayName: string;
}

const defaultSettings: SettingsData = {
  darkMode: false,
  language: 'tr',
  emailNotifications: true,
  pushNotifications: true,
  weeklyReports: false,
  twoFactorAuth: false,
  displayName: 'Admin'
};

export default function SettingsPage() {
  const { user } = useAuth();
  
  // Settings states
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [confirmClearText, setConfirmClearText] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved settings');
      }
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1C1C1E';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F3F4F6';
    }
  }, [settings.darkMode]);

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      // Update admin credentials if display name changed
      const storedUser = localStorage.getItem('adminUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.displayName = settings.displayName;
        localStorage.setItem('adminUser', JSON.stringify(parsedUser));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess(false);

    // Validate current password
    if (currentPassword !== 'kartalyuvasıYes?') {
      setPasswordError('Current password is incorrect');
      return;
    }

    // Validate new password
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // In a real app, you would update the password in the database
    // For this demo, we'll just show success
    setPasswordSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 2000);
  };

  const handleClearAllData = async () => {
    if (confirmClearText !== 'DELETE') {
      return;
    }

    setClearing(true);
    try {
      const collectionsToDelete = [
        'receipts',
        'electricity_bills',
        'water_bills',
        'naturalGas_bills',
        'gas_bills',
        'internet_bills',
        'other_bills'
      ];

      for (const colName of collectionsToDelete) {
        try {
          const snapshot = await getDocs(collection(db, colName));
          const batch = writeBatch(db);
          let count = 0;
          
          snapshot.docs.forEach((docSnapshot) => {
            batch.delete(doc(db, colName, docSnapshot.id));
            count++;
            
            // Firestore batch limit is 500
            if (count >= 500) {
              return;
            }
          });

          if (count > 0) {
            await batch.commit();
          }
        } catch (err) {
          console.warn(`Failed to delete from ${colName}:`, err);
        }
      }

      setClearSuccess(true);
      setTimeout(() => {
        setShowClearDataModal(false);
        setClearSuccess(false);
        setConfirmClearText('');
      }, 2000);
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${settings.darkMode ? 'bg-[#1C1C1E]' : 'bg-[#F3F4F6]'}`}>
      <Sidebar />
      
      <main className="ml-72 flex-1 p-8">
        <header className="mb-8">
          <h1 className={`text-2xl font-display font-bold ${settings.darkMode ? 'text-white' : 'text-black'}`}>Settings</h1>
          <p className="text-gray-500">Manage your admin panel preferences</p>
        </header>

        {/* Success Message */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <Check size={18} />
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Section */}
          <div className={`rounded-xl border p-6 shadow-sm ${settings.darkMode ? 'bg-[#2C2C2E] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className={`font-semibold ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Admin Profile</h2>
                <p className="text-sm text-gray-500">Manage your admin account details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Display Name</label>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => updateSetting('displayName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-500 ${
                    settings.darkMode 
                      ? 'bg-[#3C3C3E] border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-black'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                <input
                  type="text"
                  value="Administrator"
                  disabled
                  className={`w-full px-4 py-3 border rounded-xl cursor-not-allowed ${
                    settings.darkMode 
                      ? 'bg-[#2C2C2E] border-gray-600 text-gray-500' 
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className={`rounded-xl border p-6 shadow-sm ${settings.darkMode ? 'bg-[#2C2C2E] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Globe size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className={`font-semibold ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Appearance</h2>
                <p className="text-sm text-gray-500">Customize how the admin panel looks</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${settings.darkMode ? 'bg-[#3C3C3E]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  {settings.darkMode ? <Moon size={20} className="text-gray-400" /> : <Sun size={20} className="text-yellow-500" />}
                  <div>
                    <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Dark Mode</div>
                    <div className="text-sm text-gray-500">Switch to dark theme</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('darkMode', !settings.darkMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Language */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${settings.darkMode ? 'bg-[#3C3C3E]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Globe size={20} className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <div>
                    <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Language</div>
                    <div className="text-sm text-gray-500">Select your preferred language</div>
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    settings.darkMode 
                      ? 'bg-[#2C2C2E] border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-black'
                  }`}
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className={`rounded-xl border p-6 shadow-sm ${settings.darkMode ? 'bg-[#2C2C2E] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Bell size={20} className="text-orange-600" />
              </div>
              <div>
                <h2 className={`font-semibold ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
                <p className="text-sm text-gray-500">Configure how you receive notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${settings.darkMode ? 'bg-[#3C3C3E]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Mail size={20} className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <div>
                    <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive notifications via email</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.emailNotifications ? 'bg-black' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.emailNotifications ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Push Notifications */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${settings.darkMode ? 'bg-[#3C3C3E]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Smartphone size={20} className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <div>
                    <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Push Notifications</div>
                    <div className="text-sm text-gray-500">Receive push notifications</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.pushNotifications ? 'bg-black' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.pushNotifications ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Weekly Reports */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${settings.darkMode ? 'bg-[#3C3C3E]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Database size={20} className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <div>
                    <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Reports</div>
                    <div className="text-sm text-gray-500">Receive weekly summary reports</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('weeklyReports', !settings.weeklyReports)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.weeklyReports ? 'bg-black' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.weeklyReports ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className={`rounded-xl border p-6 shadow-sm ${settings.darkMode ? 'bg-[#2C2C2E] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <Shield size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className={`font-semibold ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Security</h2>
                <p className="text-sm text-gray-500">Manage your security settings</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Two Factor Auth */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${settings.darkMode ? 'bg-[#3C3C3E]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Key size={20} className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <div>
                    <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Two-Factor Authentication</div>
                    <div className="text-sm text-gray-500">Add an extra layer of security</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('twoFactorAuth', !settings.twoFactorAuth)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.twoFactorAuth ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.twoFactorAuth ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Change Password */}
              <div className={`p-4 rounded-xl ${settings.darkMode ? 'bg-[#3C3C3E]' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Key size={20} className={settings.darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <div>
                    <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>Change Password</div>
                    <div className="text-sm text-gray-500">Update your admin password</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    settings.darkMode 
                      ? 'bg-[#2C2C2E] border-gray-600 text-white hover:bg-[#3C3C3E]' 
                      : 'bg-white border-gray-200 text-black hover:bg-gray-100'
                  }`}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-red-600">Danger Zone</h2>
                <p className="text-sm text-gray-500">Irreversible actions</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Trash2 size={20} className="text-red-600" />
                <div>
                  <div className="font-medium text-gray-900">Clear All Data</div>
                  <div className="text-sm text-gray-500">This will permanently delete all receipts and bills</div>
                </div>
              </div>
              <button 
                onClick={() => setShowClearDataModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {passwordSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <p className="text-green-600 font-medium">Password changed successfully!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                      {passwordError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clear Data Modal */}
        {showClearDataModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-red-600">Clear All Data</h3>
                <button onClick={() => setShowClearDataModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {clearSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <p className="text-green-600 font-medium">All data cleared successfully!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Warning: This action cannot be undone!</p>
                        <p className="text-sm text-red-600 mt-1">
                          This will permanently delete all receipts, bills, and transaction data from the database.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <span className="font-bold text-red-600">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmClearText}
                      onChange={(e) => setConfirmClearText(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500"
                      placeholder="Type DELETE"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowClearDataModal(false);
                        setConfirmClearText('');
                      }}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAllData}
                      disabled={confirmClearText !== 'DELETE' || clearing}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {clearing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      {clearing ? 'Clearing...' : 'Clear All Data'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
