# AI-Coordinated Group Chat

An intelligent, secure, real-time group messaging platform. This application integrates Groq AI with a Supabase PostgreSQL backend to analyze conversations, detect intent, and trigger structured human confirmations (action cards) based on chat context.

---

## 🚀 Project Milestones & Progress

We are building this application iteratively to ensure maximum security, performance, and reliability. Below is the progress tracking for our milestones.

### ✅ Milestone 1: The Secure Group Chat Foundation
*Status: Completed*

**Objective:** Establish the core infrastructure, real-time database schema, and functional group chat interface without AI.

**What was accomplished:**
1. **Database Architecture:** Created robust relational tables (`profiles`, `groups`, `group_members`, `messages`).
2. **Security & RLS:** Enforced strict Row Level Security (RLS) so users can only access messages and groups they belong to.
3. **Frontend Refactor:** Shifted to a scalable, feature-based React/Vite architecture (`src/features/...`).
4. **Authentication:** Integrated Supabase Auth (Sign Up / Log In).
5. **Real-time Chat UI:** Built out the master `ChatWindow`, `GroupList`, and `MessageComposer` using a premium dark-mode glassmorphism UI. Users can create groups and chat instantly via Supabase Realtime private channels.

**Testing & Validation:**
- **Expected Output:** Users can authenticate, create groups securely, and exchange messages instantly. The PostgreSQL schema should build cleanly, and RLS should prevent unauthorized reads/writes.
- **Actual Output:** `001_schema.sql` and `002_rls.sql` executed successfully after dropping legacy tables. Vite dev server running stably on port 5173. Realtime subscriptions via `supabase.channel` confirmed functional.

**Screenshots:**
*(Drop your screenshots into `public/screenshots/` to display them here)*

![Authentication UI](./public/screenshots/milestone1-auth.png)
<br/>
*Premium glassmorphism Authentication flow.*

![Group Chat UI](./public/screenshots/milestone1-chat.png)
<br/>
*Real-time group chat interface with active groups.*

---

### ✅ Milestone 2: AI Infrastructure & Job Queuing
*Status: Completed*

**Objective:** Safely connect Groq AI to the chat stream without blocking the UI, using background jobs.

**Upcoming Tasks:**
- Initialize Supabase Edge Functions (`process-ai-jobs`, `analyze-message`).
- Connect to the Groq API securely.
- Define strict JSON schemas for Intent Detection and Entity Extraction.

**Testing & Validation:**
- **Expected Output:** When a user sends a message, a job is inserted into `ai_analysis_jobs`. The Edge Function reads the context window, queries the Groq API securely, extracts structured intent (e.g. `work_status_request`), and saves the analysis without blocking the chat UI.
- **Actual Output:** Created `003_triggers.sql` to automatically queue jobs on new messages. Wrote `process-ai-jobs/index.ts` Deno Edge Function with strict JSON schema parsing for the `llama3-8b-8192` Groq model. Ready for CLI deployment.

---

### ⏳ Milestone 3: Action Cards & Human Verification
*Status: Not Started*

**Objective:** The core value proposition—tagging users for work status, generating action cards, and posting verified system updates.

**Upcoming Tasks:**
- Build inline Action Cards in the React UI.
- Create the response flow (Completed / In Progress / Blocked + Proof Upload).
- Implement `respond-to-action` and `publish-system-event` edge functions.

**Testing & Validation:**
- **Expected Output:** An AI-detected task request visually renders as an Action Card for the assignee. The assignee can click "Completed", triggering a secure backend update that posts a factual, system-verified message back to the group chat.
- **Actual Output:** *(Pending execution)*

---

### ⏳ Milestone 4: Advanced Workflows & Polish
*Status: Not Started*

**Objective:** Expand capabilities to handle complex structured data (like recipes) and add observability.

**Upcoming Tasks:**
- Recipe/Document checklist workflow.
- Daily AI priority recap generation.
- Sentry/PostHog integration for monitoring.

**Testing & Validation:**
- **Expected Output:** Complex prompts like recipe sharing accurately extract ingredients into interactive checklists. Error tracking properly logs failed Groq API requests.
- **Actual Output:** *(Pending execution)*

---

## 🛠 Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend & Auth:** Supabase (PostgreSQL, Realtime, Auth, Edge Functions)
- **AI Engine:** Groq API (Structured Outputs)
