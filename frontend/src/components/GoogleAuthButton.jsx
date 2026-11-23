import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, CheckCircle2, ChevronDown } from 'lucide-react';
import { getGoogleAuthUrl } from '../services/auth';

export default function GoogleAuthButton({ user, onLogout, compact = false }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignIn = () => {
    const authUrl = getGoogleAuthUrl();
    window.location.href = authUrl;
  };

  if (!user) {
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleSignIn}
        className={`flex items-center space-x-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-800/90 hover:border-amber-500/40 text-zinc-100 transition-all cursor-pointer shadow-md shadow-black/40 group ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs'
        }`}
        title="Sign in with Google to enable authenticated features"
      >
        {/* Google 4-color SVG Icon */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>

        <span className="font-semibold tracking-wide group-hover:text-amber-200 transition-colors">
          {compact ? 'Sign In' : 'Sign in with Google'}
        </span>
      </motion.button>
    );
  }

  // User is signed in: show Avatar & Dropdown
  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/30 hover:border-amber-400 text-zinc-200 transition cursor-pointer shadow-sm"
      >
        {/* User Initial Avatar */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-xs text-black shadow-sm font-mono">
          {initial}
        </div>

        <div className="flex flex-col text-left max-w-[120px] sm:max-w-[160px] truncate">
          <span className="text-xs font-semibold text-white truncate leading-none">
            {displayName}
          </span>
          {!compact && (
            <span className="text-[10px] text-zinc-400 truncate mt-0.5 leading-none">
              {user.email}
            </span>
          )}
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </motion.button>

      {/* User Dropdown Menu */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-zinc-950/95 border border-zinc-800 p-2 shadow-2xl backdrop-blur-xl z-50 text-xs font-sans"
          >
            {/* User Profile Card */}
            <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80 mb-2">
              <div className="flex items-center space-x-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-sm text-black">
                  {initial}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-zinc-100 truncate text-sm">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate">
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 mt-2 pt-2 border-t border-zinc-800 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Google OAuth Verified</span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => {
                setDropdownOpen(false);
                onLogout();
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-500/20 transition cursor-pointer font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
