# AKR Studio — Autonomous Cloud Sandbox & Claude Code Orchestration

A web orchestration studio built with **React 19**, **GSAP**, **Framer Motion**, **Swiper.js**, and an Anthropic **Claude Code** inspired terminal interface.

## Flow & Architecture

1. **AKR Dashboard Launchpad**:
   - The user first lands on the animated **AKR Dashboard**.
   - Features dynamic 3D card templates powered by **Swiper.js** and entrance animations with **GSAP** & **Framer Motion**.
   - Clicking **"Create Template Environment"** triggers `POST /api/sandbox/create` to provision a Kubernetes sandbox pod and service.
   - A real-time 4-step provisioning modal tracks container creation with celebratory confetti upon completion.

2. **Claude Code Workspace & AI Panel**:
   - Once provisioned, the user is transitioned directly into the interactive workspace.
   - **Claude Code Terminal**: Signature Anthropic warm-dark aesthetic, model token and cost indicators, live Socket.io PTY connection, and quick-prompt CLI bar.
   - **AI Panel**: Prompt area for streaming or generating code via `POST /ai/generate` with one-click insertion into the active editor or saving as a new file.
   - **File Tree**: Hierarchical directory tree calling `GET /list-files`, `GET /read-file`, and `PATCH /update-files`.
   - **In-Screen & Tab Preview**: Live preview container with viewport switches and an external preview button opening `http://${sandboxid}.preview.localhost` in a new tab.

## Running the Application

```bash
cd frontend
npm install
npm run dev
```

The application runs on `http://localhost:5173`.
