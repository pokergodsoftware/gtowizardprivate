# Audio and Button Styling Fixes - November 5, 2025

## Issues Fixed

### 1. Audio Playback Error in Tournament Mode (Vercel Production)

**Problem:**
- Tournament mode timebank audio alerts were failing in production with error: `NotSupportedError: The element has no supported sources`
- Error occurred at line 3128 in `index-6CR2a8_c.js` (compiled version of `useTimebank.ts`)

**Root Cause:**
- Trainer audio files (`timebank1.ogg`, `timebank2.ogg`, `timebank1.mp3`, `timebank2.mp3`) were present locally in `public/trainer/` but were never uploaded to Cloudflare R2 CDN
- Production environment uses CDN via `getTrainerAssetUrl()` which pointed to missing files

**Solution:**
1. Created `upload-trainer-assets.bat` script to upload all trainer assets to Cloudflare R2
2. Uploaded files successfully to: `cloudflare:gto-wizard-spots/trainer`
3. Files are now accessible at: `https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/trainer/`

**Files Uploaded:**
- `timebank1.ogg` (OGG Vorbis format for Firefox/Chrome)
- `timebank2.ogg` (OGG Vorbis format for Firefox/Chrome)
- `timebank1.mp3` (MP3 fallback for Safari/older browsers)
- `timebank2.mp3` (MP3 fallback for Safari/older browsers)
- `README_AUDIO.md` (documentation)
- `AUDIO_INSTRUCTIONS.md` (setup instructions)
- `test-audio.html` (testing page)

**Hook Location:**
- `components/TrainerSimulator/hooks/useTimebank.ts`
- Initializes audio via `new Audio(getTrainerAssetUrl('timebank1.ogg'))`
- Plays at 8 seconds (timebank1) and 4 seconds (timebank2)

---

### 2. **Action Button Styling Inconsistency (Localhost vs Vercel)** 🎨

**Problem:**
- Action buttons (Fold/Call/Raise) displayed with different styling between localhost and Vercel
- Localhost: Buttons with texture background from `action_button.png`
- Vercel: Buttons without texture (plain colored background)

**Root Cause:**
- Component used relative path `url(./trainer/action_button.png)` which works in dev but fails in production
- The file exists in R2 but wasn't being loaded correctly
- Needed to use `getTrainerAssetUrl()` helper for proper CDN path resolution

**Solution:**
Changed in `components/TrainerSimulator/components/TrainerTable.tsx`:

1. **Import CDN helper**: Added `import { getTrainerAssetUrl } from '../../../src/config'`

2. **Background Image Path**: 
   ```typescript
   // Before
   backgroundImage: 'url(./trainer/action_button.png)'
   
   // After
   backgroundImage: `url(${getTrainerAssetUrl('action_button.png')})`
   ```

3. **Border Radius & Gap Spacing** (bonus improvements):
   - Border: `rounded-lg` → `rounded-xl`
   - 2 buttons: `gap-2` → `gap-3`
   - 3 buttons: `gap-1.5` → `gap-2`
   - 4+ buttons: `gap-1` → `gap-1.5`

**Visual Impact:**
- Buttons now display proper texture background in production
- More rounded corners matching GGPoker style
- Better visual separation between multiple action buttons
- Consistent appearance across dev and production environments

---

## Files Modified

### Created:
- `upload-trainer-assets.bat` - Script to upload trainer assets to R2

### Modified:
- `components/TrainerSimulator/components/TrainerTable.tsx`
  - Added import: `getTrainerAssetUrl` from config
  - Updated background image: `url(./trainer/action_button.png)` → `url(${getTrainerAssetUrl('action_button.png')})`
  - Updated `rounded-lg` → `rounded-xl`
  - Increased gap spacing for button containers

### Copied:
- `trainer/action_button.png` → `public/trainer/action_button.png` (for dev environment)
- Already existed in R2: `cloudflare:gto-wizard-spots/trainer/action_button.png` (233,602 bytes)

---

## Deployment

**Commit:**
```
1. fix: Update trainer action buttons styling - rounded-xl and increased gap spacing
2. fix: Use getTrainerAssetUrl for action button background image - fixes missing button texture in production
```

**Pushed to:** `main` branch
**Auto-deploy:** Vercel will automatically rebuild and deploy

**Verification Steps:**
1. Wait for Vercel deployment to complete (~2-3 minutes)
2. Open production URL in browser
3. Navigate to Trainer → Tournament Mode
4. Verify audio plays at 8s and 4s remaining on timebank
5. Check action buttons have proper rounded corners and spacing

---

## Technical Details

### Audio Implementation
- **Format**: OGG Vorbis (primary) + MP3 (fallback)
- **Volume**: 1.0 (100%)
- **Triggers**: 8 seconds (warning 1), 4 seconds (warning 2)
- **Error Handling**: Try-catch blocks prevent crashes if audio fails
- **CDN Path**: `{CDN_URL}/trainer/{filename}`

### Button Styling
- **Framework**: Tailwind CSS (via CDN)
- **Border Radius**: `rounded-xl` (0.75rem / 12px)
- **Gap Formula**:
  - 2 actions: 12px gap
  - 3 actions: 8px gap  
  - 4+ actions: 6px gap
- **Background**: Red gradient with hover states + texture overlay

---

## Future Improvements

1. **Audio Preloading**: Consider preloading audio files on tournament mode entry
2. **Browser Compatibility**: Test audio playback across all major browsers
3. **CDN Verification**: Add health check for trainer assets on app startup
4. **Tailwind Config**: Consider using PostCSS build instead of CDN for consistent styling
