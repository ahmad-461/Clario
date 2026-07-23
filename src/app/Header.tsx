"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import { ClarioLogo } from "./ClarioLogo";
import { AuthModal } from "./AuthModal";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
  onSessionChange?: (user: User | null) => void;
  currentPage?: "home" | "history" | "reset-password";
}

export function Header({ onSessionChange, currentPage = "home" }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"login" | "signup">("login");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!supabaseClient) return;

    // Fetch initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (onSessionChange) onSessionChange(currentUser);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (onSessionChange) onSessionChange(currentUser);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [onSessionChange]);

  const handleLogout = async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    setDropdownOpen(false);
    window.location.href = "/";
  };

  const handleAuthSuccess = () => {
    // When log in is successful, refresh page state or let subscription handle it
    setDropdownOpen(false);
  };

  const openAuth = (tab: "login" | "signup") => {
    setInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const scrollToTool = () => {
    if (currentPage !== "home") {
      window.location.href = "/#workspace-tool";
      return;
    }
    const element = document.getElementById("workspace-tool");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const textarea = document.getElementById("inputText");
        const fileBtn = document.getElementById("fileInput");
        if (textarea) {
          textarea.focus();
        } else if (fileBtn) {
          fileBtn.focus();
        }
      }, 500);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownOpen && !(e.target as HTMLElement).closest(".user-menu-container")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <>
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-50 py-3.5 px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded-lg p-1"
          aria-label="Clario Home"
        >
          <ClarioLogo size="sm" />
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Try the Tool button */}
          {currentPage === "home" && (
            <button
              type="button"
              onClick={scrollToTool}
              className="hidden sm:inline-block px-4 py-2 bg-[#0D9488]/10 text-[#0F766E] hover:bg-[#0D9488]/15 rounded-xl text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
            >
              Try the Tool
            </button>
          )}

          {/* Auth status block */}
          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              {/* History Link */}
              <Link
                href="/history"
                className={`text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded px-2 py-1 ${
                  currentPage === "history"
                    ? "text-[#0D9488]"
                    : "text-[#334155] hover:text-[#0F172A]"
                }`}
              >
                History
              </Link>

              {/* User Dropdown / Display */}
              <div className="relative user-menu-container">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded-xl p-1 hover:bg-slate-50 transition"
                >
                  {/* Simple Avatar with Initials */}
                  <div className="h-8 w-8 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:inline text-xs font-bold text-slate-700 max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <svg
                    className={`h-4 w-4 text-slate-500 transition-transform duration-150 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                      <p className="text-xs font-bold text-slate-500 truncate">Account</p>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#7F1D1D] hover:bg-red-50 hover:text-[#7F1D1D] transition focus-visible:outline-none focus-visible:bg-red-50"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="px-3.5 py-1.5 md:px-4 md:py-2 text-slate-600 hover:text-[#0F172A] text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded-xl"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="px-3.5 py-1.5 md:px-4 md:py-2 bg-[#0D9488] text-white hover:bg-[#0D9488]/90 text-sm font-bold rounded-xl shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488]"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal rendered as a sibling of header to avoid CSS Filter/Backdrop containing block limitations */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialTab={initialTab}
      />
    </>
  );
}
