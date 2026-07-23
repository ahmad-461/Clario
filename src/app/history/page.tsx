"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "../Header";
import { supabaseClient } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { AuthModal } from "../AuthModal";

interface HistoryEntry {
  id: string;
  user_id: string;
  created_at: string;
  input_type: "text" | "pdf" | "image";
  tone_mode: "simple" | "student" | "teacher" | "elderly-friendly" | "elderly";
  explanation_text: string;
  risk_level: "low" | "medium" | "high";
  risk_reason: string | null;
  manipulation_flags: string[] | null;
  confidence_level: "high" | "medium" | "low";
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Subscribe/Fetch auth session
  useEffect(() => {
    if (!supabaseClient) {
      setSessionChecked(true);
      setLoading(false);
      return;
    }

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionChecked(true);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSessionChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch history list once user is verified
  useEffect(() => {
    if (!sessionChecked) return;
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError("");
      try {
        if (!supabaseClient) return;

        const { data, error: histErr } = await supabaseClient
          .from("explanation_history")
          .select("*")
          .order("created_at", { ascending: false });

        if (histErr) {
          throw new Error(histErr.message);
        }

        setHistory(data as HistoryEntry[] || []);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("We couldn't retrieve your explanation history. Please try again in a moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, sessionChecked]);

  // Handle deletion of an entry
  const handleDelete = async (id: string) => {
    if (!supabaseClient) return;
    setDeletingId(id);
    try {
      const { error: delErr } = await supabaseClient
        .from("explanation_history")
        .delete()
        .eq("id", id);

      if (delErr) {
        throw new Error(delErr.message);
      }

      // Remove from state list
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting history entry:", err);
      alert("Failed to delete the entry. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // View full explanation details: share via sessionStorage and redirect to home
  const handleViewDetails = (item: HistoryEntry) => {
    try {
      sessionStorage.setItem("clario_view_history", JSON.stringify(item));
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to share history state:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A] font-sans flex flex-col">
      {/* Header */}
      <Header onSessionChange={(currentUser) => setUser(currentUser)} currentPage="history" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-medium text-slate-900">
            Your Explanation History
          </h1>
          <p className="text-[#334155] text-sm md:text-base font-semibold">
            Review, copy, print, or delete your previously simplified documents and texts.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <svg className="animate-spin h-8 w-8 text-[#0D9488]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-bold text-slate-500">Loading your history...</span>
          </div>
        )}

        {/* Guest User / Logged-out State */}
        {sessionChecked && !user && !loading && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center gap-6 max-w-md mx-auto my-12 animate-fade-in">
            <div className="p-4 bg-teal-50 text-[#0D9488] rounded-full">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Login Required</h2>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                Explanation history is a feature for logged-in users only. It stores your results securely so you can access them anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-3 bg-[#0D9488] text-white hover:bg-[#0D9488]/90 font-bold rounded-xl shadow transition"
            >
              Log In or Sign Up
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 text-[#7F1D1D] rounded-xl text-sm font-semibold animate-fade-in">
            {error}
          </div>
        )}

        {/* History List State */}
        {sessionChecked && user && !loading && !error && (
          <>
            {history.length === 0 ? (
              /* Empty History List */
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center gap-5 max-w-lg mx-auto animate-fade-in">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900">Your list is empty</h3>
                  <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                    You haven&apos;t saved any explanations yet! Go back to the homepage and try simplifying a confusing message or file.
                  </p>
                </div>
                <Link
                  href="/"
                  className="px-6 py-2.5 bg-[#0D9488]/10 text-[#0F766E] hover:bg-[#0D9488]/15 font-bold rounded-xl text-sm transition"
                >
                  Simplify Something Now
                </Link>
              </div>
            ) : (
              /* Active History Cards */
              <div className="grid grid-cols-1 gap-6">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col gap-4"
                  >
                    {/* Entry Header Info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-500">
                          {formatDate(item.created_at)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* Input Type Icon/Label */}
                          <span className="text-xs font-semibold text-slate-700 capitalize flex items-center gap-1">
                            {item.input_type === "pdf" && "📄 PDF"}
                            {item.input_type === "image" && "🖼️ Image"}
                            {item.input_type === "text" && "✏️ Pasted Text"}
                          </span>
                        </div>
                      </div>

                      {/* Badges container */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {/* Tone Badge */}
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F0FDFA] text-[#0F766E] border border-[#0D9488]/10 capitalize">
                          {item.tone_mode === "elderly-friendly" ? "Elderly-friendly" : item.tone_mode}
                        </span>

                        {/* Risk level Badge */}
                        {item.risk_level === "low" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#137333] border border-[#137333]/15">
                            No Obvious Risk
                          </span>
                        )}
                        {item.risk_level === "medium" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/15">
                            Medium Risk
                          </span>
                        )}
                        {item.risk_level === "high" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/15 animate-pulse">
                            High Risk
                          </span>
                        )}

                        {/* Confidence Badge */}
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#475569] border border-[#475569]/15 capitalize">
                          {item.confidence_level} Confidence
                        </span>
                      </div>
                    </div>

                    {/* Explanation Text Preview */}
                    <div className="text-slate-800 text-sm md:text-base leading-relaxed line-clamp-3 font-semibold">
                      {item.explanation_text}
                    </div>

                    {/* Entry Actions */}
                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-xs font-bold text-[#7F1D1D] hover:underline focus:outline-none disabled:opacity-50 flex items-center gap-1"
                      >
                        {deletingId === item.id ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-[#7F1D1D]" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete entry
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewDetails(item)}
                        className="px-4 py-2 bg-[#0D9488] text-white hover:bg-[#0D9488]/90 font-bold rounded-xl text-xs shadow-sm transition"
                      >
                        View Full Explanation &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-8 border-t border-slate-200 mt-16 text-xs font-semibold text-slate-500">
        &copy; {new Date().getFullYear()} Clario. All history and preferences are fully private.
      </footer>

      {/* Client auth trigger helper */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // fetchHistory will auto-trigger on user state update
        }}
      />
    </div>
  );
}
