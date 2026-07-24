# Clario

**Understand before you sign, click, or trust.**

Clario is a free, no-login AI web app that turns confusing text — contracts, leases, scam messages, forms, assignments — into plain language, while flagging manipulation, scam risk, and even what's suspiciously *missing* from a document. Built for students, teachers, elderly users, and anyone who's ever stared at a confusing message and had no idea what to do next.

🔗 **Live site:** [clario-one-delta.vercel.app](https://clario-one-delta.vercel.app/)

---

## The Problem

Confusing text isn't just inconvenient — it's dangerous. A rushed decision on a lease clause, a scam text designed to create panic, or a form nobody explained properly can have real consequences, especially for people who are elderly, non-native English speakers, or simply unfamiliar with legal/technical language.

Clario exists so that understanding comes *before* the decision, not after.

## Features

- **Plain-language explanations** — paste text, upload a PDF, or upload an image; get a clear explanation in seconds
- **Audience tone modes** — Simple, Student, Teacher, and Elderly-friendly, each adapting vocabulary, structure, and even font size to the reader
- **Scam & risk detection** — flags manipulative language, false urgency, and liability traps, with a plain-English explanation of *why*
- **Manipulation flags** — separately detects emotional pressure tactics (guilt-tripping, fear, control) in personal messages, distinct from financial scams
- **Omission detection ("What's Missing")** — flags notably absent information a document of that type would normally include (e.g. a lease missing a cancellation clause)
- **Confidence meter** — Clario shows how certain it is about its own explanation, and suggests consulting a professional when confidence is low
- **Voice input & read-aloud** — speak the confusing text instead of typing, and have the explanation read back aloud
- **Printable PDF export** — download a clean, large-print summary card of any explanation
- **The Waiting Room** — a companion mode designed for two people (e.g. a caregiver and an elderly parent) reading something confusing together, with AI-generated talking points to guide the conversation
- **The Untangle Log** — a public, anonymized transparency page showing real usage statistics
- **Optional accounts** — sign up to save explanation history and remember your preferred tone mode; the core tool works fully without an account

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **AI:** Google Gemini API (`gemini-2.5-flash`), free tier
- **Database & Auth:** Supabase (Postgres + Row Level Security + Supabase Auth)
- **File handling:** `pdf-parse` for PDF text extraction, native multimodal image input to Gemini
- **PDF export:** `jsPDF` + `html2canvas`
- **Voice:** Web Speech API (browser-native, no external service)
- **Hosting:** Vercel

## Design Principles

- **No login required** for core functionality — accessibility for elderly and non-technical users was a first-class design constraint, not an afterthought
- **Privacy by default** — guest usage stores no personal content, only anonymous aggregate metadata (tone mode, risk level, etc.)
- **WCAG AA accessibility** — contrast, keyboard navigation, and `prefers-reduced-motion` support throughout

## Notable Technical Challenges

A few real production issues solved during development, documented here because they were genuinely instructive:

- **Serverless PDF parsing failure on Vercel:** `pdf-parse`/`pdfjs-dist` failed in production with a "Cannot find module .../pdf.worker.mjs" error — Next.js's file tracing didn't bundle the worker file dynamically. Fixed by statically importing the worker and using `outputFileTracingIncludes` to force it into the serverless bundle.
- **Environment variable mismatches:** Diagnosed multiple silent failures (Gemini and Supabase auth both failing) that turned out to be environment variable *naming* mismatches in Vercel's dashboard — resolved by adding temporary runtime diagnostic logging to confirm exactly what was and wasn't reaching the deployed function.
- **Tailwind v4 color function incompatibility:** Avoided `oklch()`/`lab()` CSS color functions throughout, since `html2canvas` (used for PDF export) can't render them — hex/RGB only, by design, across the whole codebase.

## Running Locally

```bash
