'use client';

import { useState, useEffect } from 'react';

import { Bell, Heart, Home, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/properties', label: 'Properties' },
  { href: '/map', label: 'Map View' },
  { href: '/agents', label: 'Agents' },
  { href: '/analytics', label: 'Market Analytics' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        isScrolled
          ? 'border-b border-neutral-200 bg-white/95 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95'
          : 'bg-transparent'
      )}
    >
      <div className="container-app">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Home className="h-4 w-4" />
            </div>
            <span className="gradient-text text-lg">PuraEstate</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname?.startsWith(link.href)
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                {/* Search */}
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/search" aria-label="Search">
                    <Search className="h-5 w-5" />
                  </Link>
                </Button>

                {/* Favorites */}
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/favorites" aria-label="Favorites">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  <Badge
                    variant="danger"
                    className="absolute -right-0.5 -top-0.5 h-4 w-4 items-center justify-center p-0 text-2xs"
                  >
                    3
                  </Badge>
                </Button>

                {/* User Menu */}
                <div className="relative ml-1">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                      <Avatar
                        src={user?.avatar_url}
                        name={user?.full_name}
                        size="sm"
                      />
                      <span className="hidden text-sm font-medium text-neutral-700 dark:text-neutral-300 lg:block">
                        {user?.first_name}
                      </span>
                    </summary>
                    <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/saved-searches"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        Saved Searches
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'moderator') && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                          Admin
                        </Link>
                      )}
                      <div className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                      <button
                        onClick={logout}
                        className="block w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
                      >
                        Sign out
                      </button>
                    </div>
                  </details>
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 dark:border-neutral-800 dark:bg-neutral-950 md:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block rounded-lg px-3 py-2.5 text-sm font-medium',
                  pathname?.startsWith(link.href)
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                )}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" fullWidth asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button size="sm" fullWidth asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
