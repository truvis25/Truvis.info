'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, accessToken, isAuthenticated, isAdmin, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    if (accessToken) {
      await authApi.logout(accessToken).catch(() => {});
    }
    clearAuth();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-navbar">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center">
              <span className="text-gold-500 font-bold text-sm">TV</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-navy-900 font-bold text-lg tracking-tight">TruVis</span>
              <span className="text-gold-500 font-bold text-lg">.info</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/directory" className="text-gray-600 hover:text-navy-900 text-sm font-medium transition-colors">
              Directory
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-navy-900 text-sm font-medium transition-colors">
              Insights
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-navy-900 text-sm font-medium transition-colors">
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-amber-600 hover:text-amber-700">
                    Admin
                  </Link>
                )}
                <Link href="/dashboard" className="btn-ghost text-sm">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  List Your Company
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
