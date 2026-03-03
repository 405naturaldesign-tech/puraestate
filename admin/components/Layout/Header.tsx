import React from 'react';
import { Bell, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

const Header: React.FC = () => {
  const { user } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <div className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-800">Admin Dashboard</h2>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
          <Settings size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
              <Link
                href="/settings/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
              >
                Profile Settings
              </Link>
              <Link
                href="/settings/security"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Security
              </Link>
              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 last:rounded-b-lg">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
