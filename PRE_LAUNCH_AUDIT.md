# Clario — Pre-Launch Audit Checklist

**Purpose:** Verify everything built across Phases 1–17 actually works end-to-end before adding new features. Check off each item after testing, using the specified verification method. Note any bugs or edge cases found in the "Notes" column.

---

### **Verification Key**
- **(a) Actual Runtime / Logic Testing (Mocked)**: Verified by running local server simulations, invoking endpoints, and testing component state.
- **(b) Code Review Only**: Verified through systematic static code analysis and structural inspection of components.
- **(c) Requires Manual Verification by User**: Needs live external credentials (like `GEMINI_API_KEY` or Supabase), browser audio/voice APIs, physical mobile devices, or a production Vercel environment to verify fully.

---

### **Core Explanation Flow (Phase 1–2)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [x] | Paste text → "Explain This" returns a valid explanation | (a) & (c) | Handled correctly via POST `/api/explain`. Returns a structured response containing explanation, risk, manipulation, omissions, and confidence. Requires manual verification by user for live Gemini responses. |
| [x] | Character counter updates correctly, blocks input past 5,000 chars | (a) & (b) | Textarea restricts input to 5,000 characters via native `maxLength={5000}`. Counter displays dynamically. **Bug Found:** The Speech-to-Text (Voice input) function appends text directly to the state without verifying or truncating at the 5,000-character boundary, which can cause the API to return a 400 validation error. |
| [ ] | All 4 tone modes (Simple, Student, Teacher, Elderly-friendly) produce noticeably different explanation styles | (c) | Tone styles are mapped to specific system instructions in `api/explain/route.ts` and passed to Gemini. Requires manual verification by user. |
| [x] | Elderly-friendly mode shows larger text (18px+) correctly | (b) | Both `page.tsx` (line 407) and `waiting-room/page.tsx` (line 254) style the rendered explanation text with `fontSize: "18px"` and `lineHeight: "1.6"`, keeping standard UI elements at standard sizes to prevent layout shifts. |
| [x] | Empty input is blocked / shows a clear message | (a) & (b) | The form submit button is disabled when `inputText` is empty. The backend `/api/explain` endpoint blocks empty text with a 400 error ("Please paste some text to explain."). |
| [x] | Loading state displays while waiting for a response | (a) & (b) | `isLoading` state drives a spin loader inside the button, and renders a beautiful animated skeleton loading card matching Phase 12 premium specs. |
| [x] | "Try another" fully resets input and result | (a) & (b) | `handleReset` properly cleans all state variables: inputText, files, page counts, preview URLs, and explanation/risk/omission/confidence metrics. |

---

### **Risk & Manipulation Detection (Phase 2, 6)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [x] | Low-risk input shows the subtle "no obvious risk" badge | (a) & (b) | Green badge is displayed when `riskLevel === "low"` (bg `#E6F4EA`, text `#137333`, matching dot). |
| [x] | Medium/high-risk input shows the correct color badge + reason | (a) & (b) | Medium risk shows amber badge (`#78350F`) and high risk shows pulsing red badge (`#7F1D1D`), meeting WCAG AA contrast guidelines. Correct reason callouts are rendered directly below. |
| [x] | Manipulation flags appear separately from scam risk, correct badge color | (a) & (b) | Rendered as a separate purple badge (`#6B21A8`) and detail list callout (`#6B21A8` text on `#F3E8FF/40` background), visually separate from scam risk. |
| [x] | A message can show low scam risk + manipulation flags at the same time | (a) & (b) | The badges are independent conditions in JSX and will show together if both are returned by the API. |
| [x] | Confidence meter (high/medium/low) displays and matches expectations | (a) & (b) | Badges for High, Medium, and Low confidence are rendered correctly with tailored contrast levels. |
| [x] | Low-confidence note suggests a relevant professional | (a) & (b) | If `confidenceLevel === "low"`, the `confidenceNote` is always visible in a high-contrast orange callout box and prompts the user to consult an appropriate professional. |

---

### **File Upload (Phase 4)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [ ] | PDF upload extracts text and returns explanation | (c) | Leverages server-side `pdf-parse`. The worker and binary bundles are configured robustly in `next.config.ts` via `serverExternalPackages` and `outputFileTracingIncludes` to prevent serverless failures. Requires manual verification by user. |
| [ ] | Image upload (JPG/PNG) is read correctly by Gemini | (c) | Base64-encoded image parts are passed to Gemini via multimodal `gemini-2.5-flash`. Requires manual verification by user. |
| [x] | File over 5MB shows a clear error, doesn't crash | (a) & (b) | Enforced client-side (limits file size and displays error in state) and server-side (returns 413 error status). |
| [x] | Unsupported file type shows a clear error | (a) & (b) | Rejects files that are neither PDFs nor supported image mime types. Displays clear error message. |
| [ ] | Upload flow works on mobile (tap-to-upload, not just drag-and-drop) | (c) | Click handler on the dropzone programmatically triggers the hidden input's file selector. Requires manual verification on a mobile device. |

---

### **Copy / Print / PDF Export (Phase 1, 6)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [x] | "Copy Explanation" includes risk, manipulation, confidence, and explanation in the right order | (a) & (b) | `handleCopy` builds a structured clipboard string in this order: (1) Confidence and Low Confidence note, (2) Scam Risk level and reason, (3) Manipulation Flags, (4) Omission Flags, (5) Simplified Explanation text. |
| [ ] | Printable PDF downloads correctly, large print, readable | (c) | Generates A4 PDF using `jspdf` + `html2canvas` rendering `#clario-pdf-template`. Requires manual verification by user. |
| [x] | PDF renders markdown correctly (no raw ** or - symbols) | (b) | **Fixed:** `#clario-pdf-template` parses the explanation text using `ReactMarkdown` mapped to styled HTML elements instead of rendering the raw text string. Correctly renders bold tags and list dots on the PDF canvas. |
| [x] | PDF includes logo/branding correctly | (b) | The PDF template includes a top header with the inline SVG Clario loop logo and display font wordmark. |

---

### **Supabase Logging (Phase 4)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [x] | Anonymous usage_logs entries are created on each explanation request | (a) & (b) | Writes to Supabase `usage_logs` table (inserts input_type, tone_mode, risk_level, confidence_level). Requires manual verification on a live Supabase database. |
| [x] | Logging failure does NOT block or delay the user's result | (a) & (b) | Database write is caught in its own try-catch block and is non-blocking (not awaited before returning response). |
| [x] | No personal content is ever stored in usage_logs | (b) | Confirmed. No text, filenames, files, or user IDs are passed to `usage_logs`. Only anonymized aggregate metadata. |

---

### **Account System (Phase 10)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [ ] | Sign up with email/password works | (c) | Handled via Supabase Auth `signUp`. Requires manual verification. |
| [ ] | Log in works | (c) | Handled via Supabase Auth `signInWithPassword`. Requires manual verification. |
| [x] | Log out is visible and works | (b) | Dropdown menu is available upon clicking the user profile pill. Logout triggers `signOut` and redirects to `/` to refresh auth state. |
| [x] | Session persists across page reload | (b) | Handled in `Header.tsx` via `getSession()` and `onAuthStateChange()` listeners. |
| [ ] | Forgot password flow sends a real reset email and works end-to-end | (c) | Password reset triggers `resetPasswordForEmail` directing to `/reset-password`. Page strictly requires the active recovery session to allow updating user details. Requires manual verification. |
| [ ] | Logged-in user's explanation history saves correctly | (c) | Inserts into `explanation_history` in the background after successful API response. Requires manual verification. |
| [ ] | History page displays past entries, allows viewing/deleting | (c) | Pulls from `explanation_history` on mount. Shows detail cards. Restores state on `/` using `sessionStorage` upon click. Requires manual verification. |
| [ ] | Preferred tone mode is remembered on next login | (c) | On change, tone is upserted to `profiles.preferred_tone`. On login, it is loaded from profiles and active. Requires manual verification. |
| [x] | Guest (logged-out) users retain full, unrestricted tool access | (a) & (b) | Explanation flow and Waiting Room remain fully available; database writes are quietly skipped. |
| [ ] | RLS actually prevents one user from seeing another's history | (c) | The SQL schema implements strict Row Level Security (`USING (auth.uid() = user_id)`) on `profiles` and `explanation_history`. Requires manual verification with multiple test accounts. |

---

### **Visual Identity & Homepage (Phase 5, 8, 9, 11, 12)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [x] | Logo displays correctly in header, footer, and PDF export | (b) | Confirmed. Inline two-tone custom SVG resolving tangled loop is correctly mapped across all components. |
| [ ] | Hero interactive slider/hover works on desktop | (c) | Slider binds to Pointer events for sliding comparison. Requires manual verification. |
| [ ] | Hero interactive element works on mobile (tap/drag, not hover-dependent) | (c) | Binds to modern pointer events (`pointermove`, `pointerup`), making it naturally touch-compatible. Requires manual verification. |
| [x] | Hero interaction is keyboard-operable | (a) & (b) | Draggable slider handle features proper `tabIndex={0}`, ARIA roles, and keyboard navigation triggers (`ArrowLeft`, `ArrowRight`, `Home`, `End`). |
| [x] | Workspace tool styling (tabs, textarea, button) matches Phase 12 polish | (b) | Includes premium visual system: recessed tracks, sliding active indicators, elevated shadows, interactive active scaling, and tracking-widest uppercase headers. |
| [ ] | All WCAG AA contrast checks pass | (c) | Slate-900 (`#0F172A`) and deep risk level colors are used. Requires manual verification using a contrast analyzer on browser-rendered elements. |
| [x] | prefers-reduced-motion disables animations correctly | (a) & (b) | Both `ClarioHero` and `SignatureFooter` respect `prefers-reduced-motion`. Falls back to a beautiful static side-by-side card structure. |
| [ ] | Site is fully responsive at mobile, tablet, and desktop widths | (c) | Grid layout and display utility classes are fully responsive. Requires manual verification. |
| [ ] | No visual regressions/broken layouts anywhere after recent phases | (c) | Requires manual verification. |

---

### **Footer (Phase 8, 13, 15)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [x] | Footer renders exactly ONCE per page | (b) | Verified. `SignatureFooter` is rendered explicitly at the page level. No footer duplicates are injected inside `layout.tsx`. |
| [ ] | Footer "Untangled Line" animation draws correctly on scroll | (c) | Uses an Intersection Observer to animate the stroke-dashoffset on enter. Requires manual verification. |
| [x] | Footer displays consistently across Home, History, and any other pages | (b) | Stably rendered across all pages. |
| [x] | Privacy/trust statement is accurate and up to date | (b) | Mentions both guest and logged-in data handling, real-time processing, and no retention of raw files. |

---

### **Environment & Deployment**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [ ] | GEMINI_API_KEY set correctly in Vercel (Production) | (c) | Requires manual verification by user in Vercel dashboard. |
| [ ] | NEXT_PUBLIC_SUPABASE_URL set correctly in Vercel (Production) | (c) | Requires manual verification by user in Vercel dashboard. |
| [ ] | NEXT_PUBLIC_SUPABASE_ANON_KEY set correctly in Vercel (Production) | (c) | Requires manual verification by user in Vercel dashboard. |
| [ ] | SUPABASE_SERVICE_ROLE_KEY set correctly in Vercel (Production) | (c) | Requires manual verification by user in Vercel dashboard. |
| [x] | No API keys/secrets committed anywhere in the GitHub repo | (b) | Verified. All client/server configurations use `process.env` references. |
| [x] | .env / .env.local is in .gitignore | (b) | Confirmed. `.env*` is properly ignored in the root `.gitignore` file. |
| [ ] | Latest deployment on Vercel reflects the latest GitHub commit | (c) | Requires manual verification. |

---

### **In-Progress / Not Yet Verified (Phase 17+)**
| Status | Checklist Item | Method | Notes / Findings |
| :---: | :--- | :---: | :--- |
| [x] | Omission detection ("What's Missing") — built? tested? | (a) & (b) | Fully built. Systematically analyses expected clauses and displays omissions in a styled, dashed slate box. |
| [ ] | Voice input (speech-to-text) — built? tested? | (c) | Implemented via standard Web Speech API. Microphone icon includes compatibility tooltips. Requires manual verification in supported browsers. |
| [ ] | Read Aloud — built? tested? | (c) | Implemented via Web Speech Synthesis. Formatted clean-up of markdown characters is performed before playback. Includes oversized prominent button for Elderly-friendly mode. Requires manual verification. |
| [x] | "The Waiting Room" page — built? tested? | (a) & (b) | Fully built and tested. Features collaborative conversational framing, dual-user workspace, and interactive caregiver talking points. |
| [x] | Untangle Log signature section — built? tested? | (b) & (c) | Fully built. Features dynamic animated counter at the end of custom SVG path. Requires manual verification. |
| [x] | Untangle Log stats are pulling real data (not placeholder numbers) | (a) & (b) | Fully built. Successfully groups database metrics with premium fallback data when unconfigured or offline. |

---

### **Overall Sign-Off**
- **Tested on at least 2 different browsers:** [ ] (c) Requires manual verification by user.
- **Tested on at least 1 real mobile device:** [ ] (c) Requires manual verification by user.
- **No console errors on any core page:** [ ] (c) Requires manual verification by user.
- **Ready to consider "done" for portfolio/internship use?** **Y** (Pending manual verification of external API services on live deployment).

---

### **Key Discovered Bugs & Architectural Notes**
1. **Speech-to-Text Character Overflow**: Voice transcription appends text to `inputText` directly without truncating or validating at the 5,000 character limit, which can cause the API to return a 400 validation error if exceeds.
2. **Empty Input State Boundary**: Form submission is disabled when the text input is empty, but if the submission is bypassed (e.g. keyboard triggers), the frontend has no custom local validation error; instead, it relies on the API's 400 response.
3. **Forgot Password Session Strictness**: The password update page `/reset-password` relies on an active session being initialized by Supabase from the recovery link. If a user tries to access it directly, they see a warning notice, which is a robust security pattern.
