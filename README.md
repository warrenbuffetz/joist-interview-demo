# Joist Trust Sandbox — Autonomous Invoice Assistant

A high-fidelity interactive prototype demonstrating a safe, voice-to-invoice workflow with live Web Speech API transcription and a decoupled **Project Handshake** trust engine.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in **Chrome** or **Edge** (required for Web Speech API).

## Demo Flow

1. **Tap the Voice Capture button** and speak naturally, e.g.:
   > "Install two GFCI outlets in the kitchen, replace the HVAC filter sixteen by twenty five, and bill one hour of standard labor."

2. Watch the **Handshake Trust Logs** stream in real time as the engine matches catalog SKUs.

3. The **Smartphone Preview** renders a verified (green) or amber alert (yellow) invoice.

### Demo Shortcuts (no microphone)

- **✓ Verified scenario** — injects a fully matched transcript
- **⚠ Amber scenario** — injects a transcript with pricing gaps

## Architecture

```
src/
├── hooks/useSpeechToText.ts    # Web Speech API hook
├── engine/handshakeEngine.ts   # Project Handshake trust pipeline
├── data/catalogData.ts         # Mock Joist parts catalog
└── components/
    ├── VoiceInputPanel.tsx     # Column 1
    ├── TrustLogsPanel.tsx      # Column 2
    └── SmartphonePreview.tsx   # Column 3
```

## Tech Stack

React · Tailwind CSS · Lucide React · Framer Motion · Web Speech API
