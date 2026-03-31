# 🍅 Pomodoro Chibcha App

> A focused, aesthetic, and integrated productivity dashboard for the modern developer.

![Project Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📖 Overview

**Pomodoro Chibcha App** is more than just a timer; it's a complete productivity command center. It integrates your Google Ecosystem (Tasks & Calendar) with a customizable Pomodoro timer and ambient soundscapes, all wrapped in a stunning, dark-mode "High-End Corporate" aesthetic.

**Why?** Because constantly switching tabs between your calendar, todo list, and timer breaks flow. This app brings them all together.

## ✨ Features

- **🍅 Advanced Pomodoro Timer**: Custom intervals, "Auto-start" capabilities, and browser notifications.
- **✅ Google Tasks Integration**:
  - Two-way sync: Mark tasks as done here, and they update in Google.
  - **Optimistic UI**: Instant feedback with zero lag.
  - **Visual Priority**: Color-coded indicators based on due dates (Traffic Light System).
- **📅 Smart Calendar**:
  - View "Today's" and "Tomorrow's" meetings at a glance.
  - **Meeting Alerts**: Visual warnings when a meeting is about to start.
  - **Auto-Pause**: Ambient audio pauses automatically when a meeting approaches.
- **🎧 Ambient Soundscapes**: Built-in Lofi, Classical, and Electronic radio for deep focus.
- **🎨 Premium UX**: Glassmorphism, smooth animations (Framer Motion), and confetti celebrations.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS tokens
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (Google Provider with Refresh Token Rotation)
- **State/Data**: React Query (TanStack Query) patterns via custom hooks + Axios
- **APIs**: Google Tasks API, Google Calendar API

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud Project with `Tasks API` and `Calendar API` enabled.

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/leotinoco/pomodoro-chibcha-app.git
    cd pomodoro-chibcha-app
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory:

    ```env
    # Google OAuth (Get these from Google Cloud Console)
    GOOGLE_CLIENT_ID=your_client_id
    GOOGLE_CLIENT_SECRET=your_client_secret

    # NextAuth
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_random_secret_string
    ```

4.  **Run the development server**

    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## 🔄 Changelog

See [CHANGELOG.md](./CHANGELOG.md) or visit `/changelog` in the app to see the latest updates.

## 🤝 Contributing

Contributions are welcome! Please run `python scripts/generate_changelog.py` before submitting a PR to ensure the changelog is up to date.

## 📄 License

This project is licensed under the MIT License.
