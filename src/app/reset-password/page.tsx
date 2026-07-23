"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "../Header";
import { supabaseClient } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  // Monitor auth state changes to confirm that the recovery session is successfully active
  useEffect(() => {
    if (!supabaseClient) return;

    // Check if the user is logged in (which happens automatically when arriving from recovery link)
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionActive(true);
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionActive(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!supabaseClient) {
      setError("The authentication service is not configured on the server.");
      return;
    }

    if (!password) {
      setError("Please choose a new password.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords you entered do not match. Please try typing them again.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateErr } = await supabaseClient.auth.updateUser({
        password: password,
      });

      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSuccess(true);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A] font-sans flex flex-col">
      {/* Header */}
      <Header currentPage="reset-password" />

      {/* Main Form container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col justify-center gap-6 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-8 flex flex-col gap-6">
          <div className="text-center space-y-1.5">
            {/* Inline SVG Logo Mark: The Resolved Loop */}
            <svg
              className="h-10 w-15 mx-auto hover:scale-105 transition-transform duration-200"
              viewBox="0 0 48 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M 6 18 C 6 10, 13 6, 17 6 C 23 6, 23 20, 17 20 C 13 20, 10 16, 10 12 C 10 8, 14 6, 18 8"
                stroke="#0F172A"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 18 8 C 22 10, 26 24, 34 24 C 39 24, 42 18, 42 12"
                stroke="#0D9488"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="42" cy="12" r="3.2" fill="#0D9488" />
            </svg>
            <h1 className="text-2xl font-display font-medium text-slate-900 mt-3">
              Set Your New Password
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Choose a strong, secure password that you can remember.
            </p>
          </div>

          {/* If no session is active */}
          {!sessionActive && !success && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold leading-relaxed">
              ⚠️ <span className="font-bold">Session Notice:</span> You must arrive on this page via the secure link sent in your recovery email. If you have not requested a reset, please visit the home page to start the process.
            </div>
          )}

          {/* Success Box */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl flex flex-col gap-3 animate-fade-in text-sm font-semibold">
              <p>🎉 Password updated successfully! Your new password is now active.</p>
              <Link
                href="/"
                className="w-full py-2.5 px-4 text-center rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-bold text-xs shadow transition-all duration-150 focus:outline-none"
              >
                Go to Homepage
              </Link>
            </div>
          )}

          {/* Error Box */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-[#7F1D1D] rounded-xl text-xs md:text-sm font-semibold leading-relaxed animate-fade-in" role="alert">
              {error}
            </div>
          )}

          {/* Reset password Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-password" className="text-xs font-bold text-slate-700">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    disabled={loading}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-slate-900 placeholder-slate-400 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirm-new-password" className="text-xs font-bold text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    required
                    disabled={loading}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-slate-900 placeholder-slate-400 disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0D9488] hover:bg-[#0D9488]/90 text-white shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0D9488] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-8 border-t border-slate-200 mt-16 text-xs font-semibold text-slate-500">
        &copy; {new Date().getFullYear()} Clario. Empowering reading with clarity, compassion, and absolute privacy.
      </footer>
    </div>
  );
}
