'use client';

import {
  BarChart3,
  Bell,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/properties', icon: Home, label: 'Properties' },
  { href: '/favorites', icon: Heart, label: 'Favorites' },
  { href: '/saved-searches', icon: BookmarkCheck, label: 'Saved Searches' },
  { href: '/compare', icon: Compass, label: 'Compare' },
  { href: '/map', icon: Map, label: 'Map View' },
  { href: '/agents', icon: Users, label: 'Agents' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const adminItems = [
  { href: '/admin', icon: Settings, label: 'Admin' },
  { href: '/admin/users', icon: Users, label: 'Users' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex h-full flex-col border-r border-neutral-200 bg-white transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Home className="h-4 w-4" />
          </div>
          {sidebarOpen && (
            <span className="gradient-text font-bold text-lg">PuraEstate</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname?.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  title={!sidebarOpen ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              );
            })}
          </div>

          {isAdmin && (
            <>
              <div className="my-4 h-px bg-neutral-200 dark:bg-neutral-700" />
              {sidebarOpen && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Admin
                </p>
              )}
              <div className="space-y-1">
                {adminItems.map(({ href, icon: Icon, label }) => {
                  const active = pathname?.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={!sidebarOpen ? label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {sidebarOpen && <span>{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* User & Toggle */}
        <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <Link href="/profile" className="flex min-w-0 items-center gap-2.5 rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {user?.email}
                  </p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={logout}
                title="Sign out"
                className="shrink-0"
              >
                <LogOut className="h-4 w-4 text-neutral-500" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={toggleSidebar}
            className="mt-2 text-neutral-500"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {navItems.find(
                (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
              )?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-danger-500" />
            </Button>
            <Link href="/profile">
              <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
