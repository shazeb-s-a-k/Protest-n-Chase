# 📢 Awaaz: Voices of Jantar Mantar (3D Web Game)

> A high-octane, non-violent 3D hybrid solo & multiplayer browser action game celebrating youth civic movements and peaceful activism, set against the historic astronomical architecture of **Jantar Mantar, New Delhi**.

---

## 🌟 Game Highlights

- 🏛️ **Authentic 3D Landmark**: Faithfully modeled 3D recreation of Delhi's **Jantar Mantar**, including the colossal **Samrat Yantra** sundial ramp, open-columned **Ram Yantra** circular observatories, **Jai Prakash Yantra** sunken marble bowls, Delhi Police command tents, and DTC transfer buses.
- ⚡️ **Subway Surfers-Style Agility**: High-speed sprint, parkour slides under high barricades, vaulting over obstacles, and responsive 3rd-person chase camera.
- 📢 **Non-Violent Activism Gameplay**:
  - **The Protestors (Gen-Z Voices)**: Soundwave megaphone chants, live-streaming viral reach, drop placard traps, and bus jailbreaks to free detained allies.
  - **Delhi Police (Crowd Control Unit)**: Movable steel barricades, tear gas smoke screens, non-lethal water cannon surges, and transfer bus detentions.
- 🎮 **Rapid-Tap QTE Minigames**:
  - **Break-Free Struggle**: Mash Spacebar / Rapid-Tap touch button when grappled to break police lock and perform an evasive backflip escape!
  - **Canister Kickaway**: Rapidly kick away incoming smoke canisters before detonation.
  - **Bus Jailbreak**: Sneak to the rear emergency latch of the police bus to liberate captured teammates!
- 🌐 **Hybrid Solo & P2P Multiplayer**:
  - **Solo Mode**: Intelligent finite-state-machine AI for patrol, megaphone hearing, flanking, pursuit, and evasion.
  - **Multiplayer Mode**: 100% serverless Peer-to-Peer WebRTC DataChannels via PeerJS using 5-character room codes. Zero hosting cost, instant play!
- 📱 **Full Desktop & Mobile Support**: Keyboard & mouse controls on desktop; high-precision virtual dual analog thumbstick + rapid tap screen zones on mobile.
- 🚀 **Vercel Ready**: Preconfigured with `vercel.json` for one-click deployment.

---

## 🕹️ Controls

### Desktop Keyboard
| Key | Action |
| :--- | :--- |
| **W / A / S / D** or **Arrow Keys** | Move character in all directions |
| **Shift** | Tactical Sprint (consumes stamina) |
| **Space** | Jump / Vault (or Rapid-Mash during Break-Free QTE) |
| **C** | Slide under barricades / Parkour duck |
| **Q** | Ability 1: **Megaphone Chant** (Protestor) / **Deploy Barricade** (Police) |
| **F** | Ability 2: **Viral Live-Stream Hype** (Protestor) / **Water Cannon Push** (Police) |
| **R** | Ability 3: **Throw Smoke Canister** (Police) |
| **E** | Interact: **Bus Jailbreak** / **Kickaway Canister QTE** |
| **V** | Toggle Camera Mode (Subway Surfers Chase Follow ↔ Tactical Bird's-Eye View) |
| **M** | Toggle Synthesized Audio Mute |

### Mobile Touch
- **Left Thumb Virtual Joystick**: 360-degree smooth analog movement.
- **Right Thumb Action Buttons**: Instant Jump, Parkour Slide, and Sprint toggle.
- **Center Rapid-Tap Button**: Full-width glowing button that triggers during Grapple and Canister minigames.

---

## 🛠️ Tech Stack & Architecture

- **Engine**: Three.js (WebGL 2.0) with custom low-poly cel-shaded materials, shadow maps, and ACES Filmic tone mapping.
- **Frontend**: React 18 + TypeScript + Vite.
- **Styling**: Tailwind CSS + Glassmorphism UI + Lucide Icons.
- **Audio**: Web Audio API procedural synthesizer (no external audio files needed; generates real megaphones, sirens, whistles, dhol drumbeats, and heartbeat pulses in code).
- **Networking**: PeerJS (WebRTC DataChannel P2P mesh).
- **Effects**: Canvas Confetti + Custom Three.js particle systems for smoke, water jets, soundwaves, and floating live-stream emojis.

---

## 🚀 Running Locally & Deploying to Vercel

### Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server
npm run dev

# 3. Open in browser: http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

### Deploy to Vercel
1. Push this repository to GitHub / GitLab.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository. The included `vercel.json` and Vite framework preset will automatically configure the build command (`npm run build`) and output directory (`dist`).
4. Click **Deploy**!
