# StitchAI - Project Specification

> Source of truth for agentic development. Last updated: 2026-02-28.

## Vision

Turn a photo of an outfit into a custom sewing pattern fitted to a person's body measurements. The user uploads a garment photo, their body measurements are captured (by a teammate's module), and StitchAI generates interactive pattern pieces with a 3D assembly animation showing how the pieces fit together.

**Hackathon priority: Presentation and polish > pattern accuracy.**

## Team Responsibilities

| Area | Owner | Notes |
|------|-------|-------|
| Vision model (garment analysis) | Colleague | Using Nemotron VL or similar |
| Body measurements from photo | Colleague | Separate module |
| Frontend app + 3D assembly demo | Us (this repo) | Vite + React + Three.js |
| Pattern generation logic | Shared | VLM → structured JSON → render |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vite 7 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + Shadcn UI |
| 3D Engine | Three.js via @react-three/fiber |
| 3D Helpers | @react-three/drei (controls, loaders, Float) |
| 3D Animation | @react-spring/three (spring physics) |
| Routing | React Router v7 |
| Icons | Lucide React |
| Package Manager | Bun |

## Architecture

```
src/
├── main.tsx                    # React entry
├── App.tsx                     # Router + providers
├── index.css                   # Tailwind + theme
├── lib/
│   └── utils.ts                # cn() utility
├── components/
│   ├── Layout.tsx              # App shell (header, nav, footer)
│   ├── ui/                     # Shadcn components
│   └── three/                  # Three.js components
│       ├── PatternAssembly.tsx  # Main 3D scene (Canvas + controls)
│       ├── PatternPiece3D.tsx   # Individual animated pattern piece
│       ├── DressForm.tsx        # Mannequin/dress form mesh
│       └── Scene.tsx            # Lighting, environment, camera
├── pages/
│   ├── HomePage.tsx            # Landing with hero + 3-step flow
│   ├── UploadPage.tsx          # Photo upload (drag-drop)
│   ├── MeasurementsPage.tsx    # Body measurement display
│   ├── PatternViewerPage.tsx   # 2D SVG pattern viewer
│   ├── AssemblyPage.tsx        # 3D assembly animation (THREE.JS DEMO)
│   └── InstructionsPage.tsx    # Step-by-step sewing guide
└── data/
    └── pattern-pieces.ts       # Pattern piece definitions (shapes, positions, colors)
```

## Pages & Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | HomePage | Landing page, hero, 3-step process |
| `/upload` | UploadPage | Photo upload with drag-drop |
| `/measurements` | MeasurementsPage | Display extracted measurements |
| `/pattern` | PatternViewerPage | 2D SVG pattern viewer |
| `/assembly` | AssemblyPage | **3D animated pattern assembly demo** |
| `/instructions` | InstructionsPage | Step-by-step sewing guide |

## 3D Assembly Demo (Key Feature)

The centerpiece of the hackathon demo. Shows how flat pattern pieces assemble into a garment.

### States
1. **Exploded** — Pattern pieces float in space around a dress form, gently bobbing. Each piece is labeled and color-coded.
2. **Assembling** — Pieces animate with spring physics to their assembled positions on the dress form. Staggered timing (one piece at a time).
3. **Assembled** — All pieces in final position, user can orbit/zoom the 3D view.

### Interactions
- **Assemble/Explode toggle** — Main CTA button
- **Orbit controls** — Click-drag to rotate, scroll to zoom
- **Hover highlight** — Hovering a piece highlights it and shows its name
- **Click to isolate** — Click a piece to solo it, click again to show all
- **Piece list sidebar** — Same pattern pieces list as 2D viewer, synced with 3D

### Pattern Pieces (Demo Set)
| Piece | Color | Flat Position | Assembled Position |
|-------|-------|--------------|-------------------|
| Front Bodice | #c47a5a | Front-left, floating | Front torso |
| Back Bodice | #8fbc8f | Back-right, floating | Back torso |
| Left Sleeve | #6b8eb5 | Far left, floating | Left arm |
| Right Sleeve | #6b8eb5 | Far right, floating | Right arm |
| Collar | #d4a574 | Top center, floating | Neckline |
| Front Skirt | #b57b9e | Bottom-left, floating | Front waist-down |
| Back Skirt | #7eb5a0 | Bottom-right, floating | Back waist-down |

### Technical Approach
- Pattern pieces are thin ExtrudeGeometry from 2D shapes (not SVG import — define shapes in code for reliability)
- Use `@react-spring/three` animated meshes for position/rotation transitions
- Use `@react-three/drei` Float for idle bobbing effect
- Dress form: procedural wireframe mannequin (no external model dependency)
- Soft lighting: ambient + directional + subtle environment map

## Data Flow (Future Integration)

```
Photo Upload → [Colleague's VLM] → Garment Description JSON
                                          ↓
Photo Upload → [Colleague's Module] → Body Measurements JSON
                                          ↓
                              Pattern Generation Engine
                                          ↓
                              Pattern Pieces JSON
                                    ↓           ↓
                            2D SVG Viewer   3D Assembly
```

### Pattern Piece JSON Schema (for integration)

```typescript
interface PatternPiece {
  id: string;
  name: string;
  color: string;
  // 2D shape as array of [x, y] points (closed polygon)
  shape: [number, number][];
  // Position when assembled on body
  assembledPosition: [number, number, number];
  assembledRotation: [number, number, number];
  // Sewing metadata
  cutCount: number;
  cutOnFold: boolean;
  grainDirection: 'vertical' | 'horizontal';
  seamAllowance: number; // in cm
  instructions: string;
}
```

## Design Tokens

Warm, crafty palette defined in `src/index.css` using oklch:
- Background: warm cream
- Primary: terracotta (#c47a5a range)
- Accent: muted earth tones
- Pattern piece colors: distinct but harmonious (see table above)

## Development Commands

```bash
bun run dev      # Start dev server (localhost:5173)
bun run build    # Type-check + production build
bun run lint     # ESLint
bun run preview  # Preview production build
```

## Hackathon Demo Script

1. Open landing page — show polished UI and "From Photo to Pattern" tagline
2. Upload a photo of an outfit
3. Show measurements extracted (can be hardcoded for demo)
4. Show 2D pattern viewer with individual pieces
5. **Navigate to 3D Assembly** — the wow moment
6. Click "Assemble" — watch pieces fly into position with satisfying spring animations
7. Orbit around the assembled garment
8. Click individual pieces to isolate and inspect
9. Mention: "Each piece is print-ready with seam allowances and markings"
