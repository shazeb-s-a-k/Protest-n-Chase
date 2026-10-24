# 📢 Awaaz: Voices of Jantar Mantar (3D Action Game)

> The definitive, non-violent 3D hybrid solo & multiplayer action web game celebrating youth civic movements and peaceful activism, set against the historic astronomical architecture of **Jantar Mantar, New Delhi**.

---

## 🌟 Game Features & Highlights

- 🏛️ **Authentic 3D Jantar Mantar**: Faithfully modeled 3D recreation of Delhi's landmark with the colossal **Samrat Yantra** sundial ramp, open-columned **Ram Yantra** circular observatories, **Jai Prakash Yantra** sunken marble bowls, DTC detainment transfer buses, and "Varun" water cannon riot truck.
- ☕️ **3D Power-Ups & Collectibles**:
  - ☕️ **Cutting Chai**: Restores 100% stamina + gives 1.45x super sprint!
  - 📢 **Amplifier Booster**: Doubles megaphone soundwave radius and stun duration!
  - 📶 **5G Portable Hotspot**: 5x live-stream viewer reach acceleration!
  - 🛡️ **Peace Aura**: 7-second grapple immunity bubble!
  - 🧯 **Traffic Cone Snuffer**: Smothers and extinguishes nearby tear gas canisters!
- 🌧️ **Dynamic Weather & Atmosphere**:
  - **Golden Dust**: Warm amber sun flare with drifting sunlight dust motes.
  - **Monsoon Rain**: Overcast skies with 1,400 rain streak particles and pavement reflections.
  - **Cyberpunk Night**: Dark indigo Delhi sky with neon placards, streetlights, and flashing police lightbars.
- 🕊️ **Interactive Delhi Wildlife**:
  - Flocks of low-poly pigeons (Kabootar) pecking peacefully on the lawns that take flight in panic when runners approach or when megaphones blast!
- 📸 **Cinematic Photo Booth & Poster Creator**:
  - Press `P` (or click Camera icon) to freeze frame, apply aesthetic filters (*Raw HDR*, *Golden Hour*, *Cyberpunk*, *1970s Vintage*, *Noir B&W*), add official event watermarks, and download high-resolution posters!
- ⚡️ **Subway Surfers-Style Agility**: High-speed sprint, parkour slide under barricades (`C`), vaulting over obstacles (`Space`), and responsive 3rd-person follow cam.
- 📱 **Full Mobile & Desktop Controls**:
  - **Desktop**: Full WASD / Arrow keys, Space jump, Shift sprint, C slide, Q/E/F/R/H abilities, Right-click drag 360° camera orbit, and Mouse wheel zoom.
  - **Mobile**: 360° virtual analog joystick, quick jump/slide/sprint thumb buttons, direct ability triggers, and haptic vibration feedback.
- 🎮 **Rapid-Tap QTE Minigames**:
  - **Break-Free Struggle**: Mash Spacebar / Rapid-Tap touch button when grappled to break police lock with an evasive backflip escape!
  - **Canister Kickaway**: Rapidly mash to deflect incoming tear gas canisters before detonation.
- 🌐 **Serverless P2P Multiplayer & Smart AI**:
  - Solo mode runs autonomous AI state machines for patrol, megaphone detection, pursuit, flanking, and evasion.
  - Multiplayer mode uses PeerJS WebRTC DataChannels with 5-character room codes. Requires zero backend server hosting and runs 100% free and static on Vercel!
- 🚀 **Vercel Ready**: Preconfigured with `vercel.json` for one-click deployment.

---

## 🕹️ Controls Guide

### Desktop Keyboard & Mouse
| Key / Input | Action |
| :--- | :--- |
| **W / A / S / D** or **Arrow Keys** | Move character in all directions |
| **Shift** | Tactical Sprint (consumes stamina) |
| **Space** | Jump / Vault (or Rapid-Mash during Break-Free QTE) |
| **C** | Slide under barricades / Parkour duck |
| **Q** | Ability 1: **Megaphone Chant** (Protestor) / **Deploy Barricade** (Police) |
| **F** | Ability 2: **Viral Live-Stream Hype** (Protestor) / **Water Cannon Push** (Police) |
| **R** | Ability 3: **Throw Smoke Canister** (Police) |
| **E** | Interact: **Bus Jailbreak** / **Kickaway Canister QTE** |
| **H** | Ability 4: **Form Human Chain** (Immovable peaceful barrier) |
| **P** | **Photo Booth**: Freeze frame, apply filters & download HD poster |
| **V** | Cycle Camera View (Chase Follow ↔ Tactical Bird's-Eye ↔ First-Person) |
| **M** | Toggle Synthesized Audio Mute |
| **Right-Click Drag** | 360° Free Camera Orbit around character |
| **Mouse Wheel** | Camera Zoom In / Out |
| **Escape** | Open Settings & Quality Menu |

### Mobile Touch
- **Left Thumb Virtual Joystick**: 360-degree analog thumbstick.
- **Right Thumb Action Buttons**: Quick-access **Jump**, **Parkour Slide**, and **Sprint Toggle**.
- **Right Ability Arc**: Direct thumb buttons for Chant, Hype, Free Bus, Human Chain (Protestors) or Barricade, Smoke, Water (Police).
- **Center Rapid-Tap Button**: Full-width glowing button that triggers during Grapple and Canister minigames.

---

## 🚀 Running Locally & Deploying to Vercel

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev

# 3. Build production bundle
npm run build
```

Deploying to Vercel is as simple as importing the repository; `vercel.json` will automatically configure routing and caching.
