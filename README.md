# SmartSpend 💰🤖

<div align="center">

<img src="./public/logo.svg" alt="SmartSpend Logo" width="80" height="80" />

### Intelligent Personal Finance & AI-Powered Financial Coach

SmartSpend is a modern, privacy-first personal finance platform designed to make money management effortless. Track expenses, manage dynamic category budgets, gain deep spending analytics, and get personalized financial guidance through an integrated AI assistant.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

[Live Demo](https://app.smartspend.in) · [Report Bug](https://github.com/Aditya17-04/SmartSpend/issues) · [Request Feature](https://github.com/Aditya17-04/SmartSpend/issues)

</div>

---

## 🌟 Key Features

### 📊 Real-Time Expense & Income Tracking
- **Quick Logging:** Seamlessly add daily transactions with custom notes, payment methods (UPI, Card, Cash), and tags.
- **Smart Categorization:** Automatically categorize food, shopping, utilities, entertainment, travel, and more.
- **Search & Filtering:** Instant multi-parameter filtering by date range, category, type, and keywords.

### 🎯 Dynamic Budgeting & Alert Meters
- **Category Caps:** Set tailored monthly spending limits per category.
- **Visual Budget Progress:** Real-time progress bars indicating safe, warning, and overspent states.
- **Proactive Alerts:** Receive heads-up notifications before crossing budget thresholds.

### 🤖 AskSmartSpend — AI Financial Coach
- **24/7 Context-Aware Assistance:** Ask questions in plain language regarding your spending trends and saving strategies.
- **Groq & Qwen AI Backend:** High-speed inference using state-of-the-art LLMs via secure serverless functions.
- **Actionable Recommendations:** Get automated weekly spending digests and tailored tips to optimize your cash flow.

### 👨‍👩‍👦 Parent Dashboard & Family Access
- **Consent-Driven Supervision:** Enable parents or guardians to monitor spending while maintaining user privacy.
- **Cryptographic Invite Tokens:** Secure approval flow backed by PostgreSQL Row-Level Security (RLS).
- **Read-Only Oversight:** Supervise allowances, trends, and budget adherence without manual report generation.

### 📈 Visual Analytics & Reporting
- **Interactive Charts:** Powered by Recharts — explore income vs. expense breakdowns, monthly trendlines, and category distribution.
- **Export to PDF & Excel:** Generate beautifully styled PDF statements (`jsPDF`, `jspdf-autotable`) or export raw data to Excel (`xlsx`) for tax or auditing purposes.
- **CSV Import:** Bulk import bank statements or transaction files in one click.

### 🔒 Enterprise-Grade Privacy & Security
- **Supabase Authentication:** Secure email/password and session handling.
- **Row-Level Security (RLS):** Database-level security guarantees users can only access their own snapshots and authorized parent records.
- **Local Fallback:** Robust local persistence ensuring seamless offline experience.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 8](https://vitejs.dev/) |
| **Styling & UI Components** | [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) |
| **Motion & Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Charts & Visualizations** | [Recharts](https://recharts.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL with RLS) |
| **AI Integration** | [Gemini API](https://ai.google.dev/) ([gemini-2.0-flash](https://deepmind.google/technologies/gemini/)) via Serverless API |
| **Document Processing** | [jsPDF](https://github.com/parallax/jsPDF), [SheetJS (xlsx)](https://sheetjs.com/), [PDF.js](https://mozilla.github.io/pdf.js/) |
| **Linting & Code Quality** | [Oxlint](https://oxc.rs/) |

---

## 📂 Project Structure

```text
smart-spend/
├── api/                     # Vercel serverless functions (e.g., Groq AI chat endpoint)
│   └── chat.ts
├── public/                  # Static assets, SVG icons, and logos
│   ├── favicon.svg
│   ├── icons.svg
│   └── logo.svg
├── src/
│   ├── assets/              # Component-level static resources
│   ├── components/          # Reusable UI components & layouts
│   │   ├── layout/          # Sidebar, Navbar, Page shells
│   │   ├── shared/          # Buttons, Cards, Modals, Logo
│   │   └── ui/              # Radix UI primitives & styled widgets
│   ├── context/             # Global React state (AuthContext, FinanceContext)
│   ├── data/                # Initial seeds, categories, and mock profiles
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility helpers, Supabase client, formatters
│   ├── pages/               # Application views
│   │   ├── auth/            # Landing page, Login, Registration
│   │   ├── AskSmartSpend.tsx # AI Chat assistant
│   │   ├── Budgets.tsx      # Budget setting & tracking
│   │   ├── Dashboard.tsx    # Primary finance overview
│   │   ├── Insights.tsx     # Analytics & spending trends
│   │   ├── ParentDashboard.tsx # Family & parental supervision view
│   │   ├── Register.tsx     # Expense registration & transaction log
│   │   └── Settings.tsx     # User profile, theme, and security controls
│   ├── types/               # TypeScript interfaces & domain types
│   ├── App.tsx              # Root routing & layout controller
│   ├── index.css            # Tailwind directives & custom CSS variables
│   └── main.tsx             # Application bootstrap
├── supabase/                # PostgreSQL schema & migration scripts
│   ├── schema.sql           # Core tables & RLS policies
│   └── parent-access-migration.sql # Family consent & access migration
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher) or [pnpm](https://pnpm.io/)
- A free [Supabase](https://supabase.com/) account
- A [Groq](https://groq.com/) API key (optional, for AI chat features)

### 1. Clone the Repository

```bash
git clone https://github.com/Aditya17-04/SmartSpend.git
cd SmartSpend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory by copying the example:

```bash
cp .env.example .env.local
```

Populate the variables with your configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Groq AI Key (used in serverless api/chat.ts)
GROQ_API_KEY=your-groq-api-key
```

### 4. Set Up Supabase Database

1. Navigate to your Supabase project's **SQL Editor**.
2. Run the queries inside [`supabase/schema.sql`](./supabase/schema.sql) to initialize:
   - `finance_snapshots` table for user financial records.
   - `parent_access` table for guardian consent and sharing workflows.
   - Row-Level Security (RLS) policies and performance indexes.

### 5. Run Development Server

```bash
npm run dev
```

The application will be running locally at `http://localhost:5173`.

---

## 📜 Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Typechecks with TypeScript and compiles production assets into `dist/`. |
| `npm run preview` | Locally serves the production build from `dist/` to verify functionality. |
| `npm run lint` | Runs [Oxlint](https://oxc.rs/) to perform lightning-fast static code analysis. |

---

## 🔒 Security & Privacy Architecture

SmartSpend is architected around the principle of user data sovereignty:

- **Row-Level Security (RLS):** All snapshot records are bound to authenticated `auth.uid()` credentials. Database records cannot be read or modified by unauthorized third parties.
- **Family Consent Handshake:** Parents can only inspect a child's spending snapshot once a mutual invitation token is initiated by the child and explicitly verified.
- **Zero Sensitive Credential Storage:** Banking credentials or card numbers are never collected or stored.

---

## 🚢 Deployment

### Deploying to Vercel

1. Push your code to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Deploy! Vercel will automatically build the Vite frontend and expose `/api/chat.ts` as a serverless function.

---

## 🤝 Contributing

Contributions make the open-source community an inspiring place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Aditya17-04">Aditya</a> & Contributors</sub>
</div>
