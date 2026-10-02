# AI-Coordinated Group Chat (Chaat)

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

---

### ✅ Milestone 2: AI Infrastructure & Job Queuing
*Status: Completed*

**Objective:** Safely connect Groq AI to the chat stream without blocking the UI, using background jobs.

**What was accomplished:**
- Initialized Supabase Edge Functions.
- Defined strict JSON schemas for Intent Detection and Entity Extraction for the Groq API.
- Implemented asynchronous handling of AI jobs to prevent chat UI blocking.

---

### ✅ Milestone 3: Action Cards, Networking & Inline Suggestions
*Status: Completed*

**Objective:** The core value proposition—tagging users for work status, building a P2P network, and generating smart conversational action cards.

**What was accomplished:**
1. **Peer-to-Peer Networking:** Implemented `@username` claiming, connections, and magic invite links to instantly create private workspaces with your network.
2. **Action Cards:** Built interactive inline Action Cards in the React UI for AI-detected tasks.
3. **Action Response Flow:** Users can interact with cards to mark them as Completed/In Progress/Blocked and upload proof.
4. **Live Sync Deduplication:** Engineered custom client-side deduplication logic to work flawlessly with Supabase Realtime WebSocket broadcasts.
5. **Conversational AI Integrations:** Removed rigid side panels in favor of seamless, inline AI conversational prompts ("✨ AI Suggestion: Would you like to convert this message into an interactive checklist?").

---

### ✅ Milestone 4: Advanced Workflows & Polish
*Status: Completed*

**Objective:** Expand capabilities to handle complex structured data (like interactive collaborative checklists) and polish the real-time UX.

**What was accomplished:**
1. **Structured Checklists:** Added the `analyze-message` Edge Function (powered by Groq `openai/gpt-oss-20b` for rigid JSON outputs). It silently reads messages, detects lists of requirements/tasks, and injects interactive Checklist Action Cards directly into the chat feed.
2. **Universal Collaboration:** Senders or receivers can instantly interact with generated checklists to mark items complete. 
3. **Poll-Style Avatars:** When any user checks off a task, their profile avatar instantly appears perfectly alongside the checklist item (similar to a WhatsApp poll), making tracking accountability seamless.
4. **Granular Realtime Sync:** Wrote specialized Supabase Realtime listeners targeting the `checklist_items` table so that checking an item syncs the tick and profile avatar to all clients immediately without a page refresh.
5. **Strict RLS Security:** Locked down `checklist_items` with specific RLS policies ensuring only authenticated group members can query or modify the items within their workspace.

---

### ✅ Milestone 5: Realtime Stability & Architectural Polish
*Status: Completed*

**Objective:** Guarantee 100% reliable WebSocket message delivery by isolating backend data streams and bypassing Supabase RLS replication bugs.

**What was accomplished:**
1. **Isolated WebSocket Channels:** Discovered and patched a known Supabase limitation where failing Row Level Security (RLS) rules on a single table would silently terminate an entire multi-table realtime channel. 
2. **Event Stream Decoupling:** Split the `useGroupRealtime` architecture into dedicated channels (`messages:{id}` vs `actions:{id}`), ensuring core chat functionality never goes down even if checklist syncs encounter permission errors.
3. **Optimized Presence:** Removed conflicting `presence` configuration on channels that were dropping `postgres_changes` payloads due to backend schema mismatches.
4. **Data Aggregation via WebSockets:** Dynamically fetching sender profiles instantly upon receiving barebone database insertion payloads via WebSockets, eliminating the "Unknown Sender" bug while maintaining a minimal network footprint.


#### 🔧 Setup Instructions for AI Edge Functions:
To activate the Groq AI checklist detection feature, you must deploy the edge functions:

1. **Deploy the Edge Functions (Bypassing JWT for Webhooks):**
   ```bash
   npx supabase functions deploy analyze-message --no-verify-jwt
   npx supabase functions deploy generate-group-recap
   ```
2. **Set your Groq API Key:**
   ```bash
   npx supabase secrets set GROQ_API_KEY=your_groq_api_key_here
   ```
3. **Configure the Database Webhook:**
   - Go to your Supabase Dashboard > **Database** > **Webhooks**.
   - Create a new webhook on the `messages` table.
   - Set the trigger to **Insert**.
   - Set the destination to call the `analyze-message` edge function via HTTP POST.
   - *Note: Deploying with `--no-verify-jwt` ensures the webhook can securely trigger the function internally without needing manual auth headers.*

---

## 🛠 Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend & Auth:** Supabase (PostgreSQL, Realtime, Auth, Edge Functions)
- **AI Engine:** Groq API (Structured Outputs)
