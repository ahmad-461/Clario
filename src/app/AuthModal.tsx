"use client";

import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, onSuccess, initialTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync with initialTab prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError("");
      setInfoMessage("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, initialTab]);

  // Trap focus inside modal for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!supabaseClient) {
      setError("The account system is currently not configured on the server.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address (for example, name@example.com).");
      return;
    }

    setLoading(true);

    try {
      if (activeTab === "login") {
        if (!password) {
          setError("Please enter your password.");
          setLoading(false);
          return;
        }

        const { error: loginErr } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (loginErr) {
          // Map technical errors to friendly, non-technical messages
          const msg = loginErr.message.toLowerCase();
          if (msg.includes("invalid login credentials") || msg.includes("email not confirmed")) {
            setError("Incorrect email or password. Please double-check and try again.");
          } else {
            setError(loginErr.message);
          }
        } else {
          onSuccess();
          onClose();
        }
      } else if (activeTab === "signup") {
        if (!password) {
          setError("Please choose a password.");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError("Your password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("The passwords you entered do not match. Please try typing them again.");
          setLoading(false);
          return;
        }

        const { error: signUpErr, data } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/reset-password`,
          },
        });

        if (signUpErr) {
          setError(signUpErr.message);
        } else if (data?.user && data?.session === null) {
          // Confirmation email sent
          setInfoMessage("We've sent a confirmation link to your email. Please check your inbox and click the link to activate your account!");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        } else {
          // Logged in directly
          onSuccess();
          onClose();
        }
      } else if (activeTab === "forgot") {
        const { error: resetErr } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetErr) {
          setError(resetErr.message);
        } else {
          setInfoMessage("We have sent a password reset link to your email. Please check your inbox (and spam folder) and follow the instructions.");
          setEmail("");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header / Tabs */}
        <div className="flex border-b border-slate-200 bg-[#F4F6F9]/50 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError("");
              setInfoMessage("");
            }}
            className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition focus-visible:outline-none focus-visible:bg-slate-100 ${
              activeTab === "login"
                ? "border-[#0D9488] text-[#0D9488]"
                : "border-transparent text-[#334155] hover:text-[#0F172A]"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setError("");
              setInfoMessage("");
            }}
            className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition focus-visible:outline-none focus-visible:bg-slate-100 ${
              activeTab === "signup"
                ? "border-[#0D9488] text-[#0D9488]"
                : "border-transparent text-[#334155] hover:text-[#0F172A]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-[#334155] hover:bg-slate-100 hover:text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] z-10"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Form Body - with flex-1 min-h-0 to enable correct nested scrolling */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-5 overflow-y-auto flex-1 min-h-0">
          <div className="text-center shrink-0">
            <h2 id="auth-modal-title" className="text-xl font-display font-medium text-slate-900">
              {activeTab === "login" && "Welcome Back to Clario"}
              {activeTab === "signup" && "Create a Free Clario Account"}
              {activeTab === "forgot" && "Reset Your Password"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === "login" && "Access your saved reading history and preferences."}
              {activeTab === "signup" && "Save explanations to read again later and remember your default tone."}
              {activeTab === "forgot" && "We'll send you an email with a secure link to reset your password."}
            </p>
          </div>

          {/* Optional Note on Signup */}
          {activeTab === "signup" && (
            <div className="p-3 bg-teal-50 border border-teal-100 text-teal-800 rounded-xl text-xs font-semibold leading-relaxed shrink-0">
              💡 <span className="font-bold text-[#0F766E]">Optional Account:</span> Creating an account is fully optional. Clario will always remain 100% free and usable without signing up. Accounts exist solely for saving your explanation history and remembering your preferred tone automatically.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-[#7F1D1D] rounded-xl text-xs md:text-sm font-semibold leading-relaxed animate-fade-in shrink-0" role="alert">
              {error}
            </div>
          )}

          {/* Info Message */}
          {infoMessage && (
            <div className="p-3.5 bg-[#EFF6FF] border border-blue-100 text-blue-800 rounded-xl text-xs md:text-sm font-semibold leading-relaxed animate-fade-in shrink-0">
              {infoMessage}
            </div>
          )}

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-xs font-bold text-slate-700">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                disabled={loading}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-slate-900 placeholder-slate-400 disabled:opacity-50"
              />
            </div>

            {activeTab !== "forgot" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-password" className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  {activeTab === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("forgot");
                        setError("");
                        setInfoMessage("");
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      className="text-xs font-bold text-[#0D9488] hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-slate-900 placeholder-slate-400 disabled:opacity-50"
                />
              </div>
            )}

            {activeTab === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-confirm-password" className="text-xs font-bold text-slate-700">
                  Confirm Password
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent text-slate-900 placeholder-slate-400 disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0D9488] hover:bg-[#0D9488]/90 text-white shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0D9488] disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                {activeTab === "login" && "Log In"}
                {activeTab === "signup" && "Create Account"}
                {activeTab === "forgot" && "Send Reset Link"}
              </>
            )}
          </button>

          {/* Navigation link at the bottom of forgot password state */}
          {activeTab === "forgot" && (
            <div className="text-center mt-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setError("");
                  setInfoMessage("");
                }}
                className="text-xs font-bold text-[#0D9488] hover:underline focus:outline-none"
              >
                Back to Log In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
