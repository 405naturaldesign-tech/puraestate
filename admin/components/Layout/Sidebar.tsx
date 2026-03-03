import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null);

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      name: 'Properties',
      icon: Building2,
      href: '/properties',
      submenu: [
        { name: 'All Properties', href: '/properties' },
        { name: 'Add Property', href: '/properties/create' },
      ],
    },
    {
      name: 'Users',
      icon: Users,
      href: '/users',
      submenu: [
        { name: 'All Users', href: '/users' },
        { name: 'Agents', href: '/agents' },
      ],
    },
    {
      name: 'Bookings',
      icon: BarChart3,
      href: '/bookings',
    },
    {
      name: 'Payments',
      icon: CreditCard,
      href: '/payments',
    },
    {
      name: 'Messages',
      icon: MessageSquare,
      href: '/messages',
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      href: '/analytics',
    },
    {
      name: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-dark text-white overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">PuraEstate</h1>
        <p className="text-sm text-gray-400">Admin Dashboard</p>
      </div>

      <nav className="mt-8">
        {menuItems.map((item) => (
          <div key={item.name}>
            <button
              onClick={() =>
                setExpandedMenu(expandedMenu === item.name ? null : item.name)
              }
              className={clsx(
                'w-full flex items-center justify-between px-6 py-3 text-left transition-colors',
                router.pathname.includes(item.href)
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span>{item.name}</span>
              </div>
              {item.submenu && (
                <ChevronDown
                  size={16}
                  className={clsx(
                    'transition-transform',
                    expandedMenu === item.name && 'rotate-180'
                  )}
                />
              )}
            </button>

            {item.submenu && expandedMenu === item.name && (
              <div className="bg-gray-800">
                {item.submenu.map((subitem) => (
                  <Link
                    key={subitem.name}
                    href={subitem.href}
                    className={clsx(
                      'block px-12 py-2 text-sm transition-colors',
                      router.pathname === subitem.href
                        ? 'text-primary font-semibold'
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    {subitem.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="absolute bottom-6 left-6 right-6 border-t border-gray-700 pt-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
