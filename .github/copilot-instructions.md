# GTO Wizard Private - AI Agent Instructions

## Project Overview
React/TypeScript poker GTO (Game Theory Optimal) training application with Vite. Users load poker "spots" (tournament situations), visualize optimal strategies via 13x13 hand range grids, and practice decisions with real-time feedback.

## Architecture Principles

### Data Model
- **AppData**: Root object containing `id`, `fileName`, `tournamentPhase`, `settings`, `equity`, and `nodes: Map<number, NodeData>`
- **NodeData**: Decision tree node with `player`, `street`, `actions`, and `hands` (169 poker combinations with `played` frequencies and `evs`)
- **Lazy Loading**: Spots stored in `/spots/` hierarchy, nodes loaded on-demand via `loadNode()` to handle 12,000+ node trees
- **Dual Environment**: Dev uses local files (`./spots/`), production uses Cloudflare R2 CDN via `getResourceUrl()` in `config.ts`

### State Management Pattern
```typescript
// App.tsx manages global state
const [solutions, setSolutions] = useState<AppData[]>([]);
const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
const [viewerState, setViewerState] = useState({ currentNodeId, selectedHand, displayMode });
```
**Critical**: Use `solutionsRef.current` for synchronous access to latest solutions state (ref kept in sync via useEffect).

### URL State Synchronization
- All viewer state encoded in URL via `lib/urlUtils.ts`: `?page=solutions&solution=./spots/final_table/speed32_1&node=5&hand=AKs`
- Use `updateUrl()` on navigation, `decodeUrlState()` on mount, `findSolutionByPath()` for solution lookup
- Enables deep linking and browser back/forward navigation

## Critical Developer Workflows

### Setup (Windows)
```bash
npm install
.\generate_index.bat  # Generates solutions-metadata.json + creates public/spots junction
npm run dev           # Vite dev server on port 3000
```
**Key**: `generate_solutions.cjs` scans `/spots/` folder structure, reads `settings.json`/`equity.json`/`nodes/*.json`, generates manifests with relative paths (`./spots/...` not `/spots/...` - this is critical for Vite).

### Versioning & Deploy
```bash
.\release.bat         # Interactive: bump version → commit → push → Vercel auto-deploy
# Or individual: .\version-patch.bat, .\version-minor.bat, .\version-major.bat
```
Updates `package.json` and `src/version.ts` using SemVer. Vercel auto-deploys on push to `main`.

### Adding New Spots
1. Place folder in `/spots/{tournament_phase}/{spot_id}/` with `settings.json`, `equity.json`, `nodes/*.json`
2. Run `.\generate_index.bat` to regenerate metadata
3. Restart dev server

## Project-Specific Patterns

### Poker Action Colors (GTO Wizard Style)
```typescript
// lib/pokerUtils.ts → getActionColor()
'Allin': 'bg-[#d946ef]'   // Magenta
'Raise': 'bg-[#f97316]'   // Orange
'Fold':  'bg-[#0ea5e9]'   // Cyan
'Call':  'bg-[#10b981]'   // Green (also Check for BB)
```
**Exception**: BB's "Check" is green (treated like call), others' checks are gray.

### Range Grid (HandCell.tsx)
- 13x13 matrix: pairs diagonal (AA-22), suited above (AKs), offsuit below (AKo)
- Each cell segmented by `played` frequencies: `[0.3, 0.0, 0.7]` = 30% fold, 70% raise
- EV calculation: `sum(evs[i] * played[i])` displayed in cell
- Colors from `getActionColor()`, segments rendered as absolute-positioned divs

### Component Hierarchy
```
App.tsx
├─ SolutionsLibrary (home page)
├─ Trainer (practice mode with auth)
│  ├─ TrainerSimulator (spot-by-spot training)
│  ├─ TournamentMode (session-based challenges)
│  └─ AuthPage (Firebase auth)
└─ Viewer (selected solution)
   ├─ Header (decision tree navigation)
   ├─ RangeGrid (13x13 hands)
   ├─ Sidebar (PokerTable, ActionsBar, ComboDetail)
   └─ PokerTable/ (modular visual components)
      ├─ PlayerCard, ChipStack, PotDisplay
      └─ TournamentInfo, PayoutPanel
```

### PokerTable Refactoring (Dec 2024)
Broke monolithic `PokerTable.tsx` (800 lines) into:
- `hooks/usePlayerPositions.ts` - Player layout calculations
- `utils/pokerTableCalculations.ts` - Pot, bets, tournament name logic
- `components/PokerTable/{PlayerCard,ChipStack,PotDisplay,etc}.tsx` - UI components

**Pattern**: Extract logic to utils/hooks, keep components presentational. See `POKERTABLE_BEFORE_AFTER.md`.

### Firebase Integration
- **Stats persistence**: `utils/statsUtils.ts` syncs user stats to Firestore (offline-first with localStorage fallback)
- **Authentication**: `components/AuthPage.tsx` handles login/register, stores `poker_current_user` in localStorage
- **Config**: `src/firebase/config.ts` - follow `FIREBASE_SETUP.md` for credentials
- **Pattern**: Try Firebase operations in try/catch, gracefully degrade if offline

### Error Handling
```typescript
// lib/errorMessages.ts - centralized error messages
throw new AppError(ERROR_MESSAGES.MISSING_SETTINGS, ErrorType.FILE);
// Use retryFetch() for network requests with exponential backoff
```

## Integration Points

### Cloudflare R2 (Production Assets)
- `config.ts` switches between local files (dev) and R2 CDN (prod) via `VITE_CDN_URL` env var
- Upload: `wrangler r2 object put gto-wizard-spots/spots --file=./spots --recursive`
- Assets: `public/trainer/` images uploaded separately via `upload-trainer-to-r2.bat`

### Vite Configuration
```typescript
// vite.config.ts
server: { port: 3000, host: '0.0.0.0' }  // External access
resolve: { alias: { '@': path.resolve(__dirname, '.') } }
define: { 'process.env.GEMINI_API_KEY': ... }  // API keys injected
```

### File Paths Convention
- **Always use relative paths** in `solutions.json`: `./spots/final_table/1` (NOT `/spots/...`)
- **Asset URLs**: Use `getResourceUrl()` or `getTrainerAssetUrl()` helpers, never hardcode paths
- **Type imports**: `import type { NodeData } from '../types.ts'` (explicit .ts extension in imports)

## Common Tasks

**Debug node loading**: Check `AppData.path` is set, verify `loadNode()` fetches from correct URL, inspect Network tab for 404s.

**Add new component**: Follow PokerTable pattern - create in `components/{Feature}/ComponentName.tsx`, extract calculations to `utils/`, layout hooks to `hooks/`.

**Modify action colors**: Edit `getActionColor()` in `lib/pokerUtils.ts`, ensure contrast ratios for accessibility.

**Update spot metadata**: Re-run `generate_solutions.cjs` if spot files change (doesn't auto-watch).

## Testing in Production
1. Deploy to Vercel (auto on push)
2. Check DevTools Network tab: requests should hit `pub-27b29c1ed40244eb8542637289be3cf7.r2.dev`
3. Verify `solutions-metadata.json` loads from CDN
4. Test node navigation to confirm lazy loading works

## Documentation Map
- `ANALISE_PROJETO.md` - Deep technical architecture
- `ARQUITETURA_VISUAL.md` - Component diagrams and data flow
- `POKERTABLE_ARCHITECTURE_DIAGRAM.md` - Visual component breakdown
- `TRAINER_DOCS.md` - Trainer feature details
- `VERSIONING.md` - Release process
- `DEPLOY_STEPS.md` - Cloudflare R2 + Vercel setup
