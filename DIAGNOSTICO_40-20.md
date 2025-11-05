# Diagnosis: Missing 40-20 Spots on R2

## Identified Problem

**Local**: 14 spots in folder `spots/40-20/`
**Vercel/R2**: 0 spots (all missing)

## Missing Spots

1. speed32_12
2. speed32_13
3. speed32_15
4. speed32_16
5. speed32_17
6. speed32_18
7. speed32_2d
8. speed32_5d
9. speed32_6d
10. speed50_1
11. speed50_2
12. speed50_3
13. speed50_4
14. speed50_5

## Probable Cause

The 40-20 spots were never uploaded to Cloudflare R2 during the initial upload, or they were accidentally deleted.

The `solutions-metadata.json` **contains** the 14 entries, but the physical files are not in the R2 bucket.

## Fix

### Option 1: Automated Script (RECOMMENDED)

Run the provided batch script:

```powershell
.\upload-40-20-spots.bat
```

This script uploads:
- `settings.json` for each spot
- `equity.json` for each spot
- All `nodes/*.json` files for each spot

⏱️ **Estimated time**: 15-30 minutes (depending on number of nodes)

### Option 2: Manual Upload per Spot

```powershell
# Example for speed32_12
wrangler r2 object put gto-wizard-spots/spots/40-20/speed32_12/settings.json --file=./spots/40-20/speed32_12/settings.json
wrangler r2 object put gto-wizard-spots/spots/40-20/speed32_12/equity.json --file=./spots/40-20/speed32_12/equity.json

# Upload nodes (one by one)
wrangler r2 object put gto-wizard-spots/spots/40-20/speed32_12/nodes/0.json --file=./spots/40-20/speed32_12/nodes/0.json
# ... repeat for each node
```

### Option 3: PowerShell Upload Script

```powershell
$spots = @("speed32_12", "speed32_13", "speed32_15", "speed32_16", "speed32_17", "speed32_18", "speed32_2d", "speed32_5d", "speed32_6d", "speed50_1", "speed50_2", "speed50_3", "speed50_4", "speed50_5")

foreach ($spot in $spots) {
    Write-Host "Uploading $spot..." -ForegroundColor Cyan
    
    # Settings and Equity
    wrangler r2 object put "gto-wizard-spots/spots/40-20/$spot/settings.json" --file="./spots/40-20/$spot/settings.json"
    wrangler r2 object put "gto-wizard-spots/spots/40-20/$spot/equity.json" --file="./spots/40-20/$spot/equity.json"
    
    # Nodes
    Get-ChildItem ".\spots\40-20\$spot\nodes\*.json" | ForEach-Object {
        $nodeName = $_.Name
        wrangler r2 object put "gto-wizard-spots/spots/40-20/$spot/nodes/$nodeName" --file="./spots/40-20/$spot/nodes/$nodeName"
    }
    
    Write-Host "✓ $spot completed" -ForegroundColor Green
}
```

## Post-upload Verification

Wait 5-10 minutes for CDN propagation, then test:

```powershell
# Test a spot
Invoke-WebRequest -Uri "https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/40-20/speed32_12/settings.json" -Method Head

# If it returns 200 OK, it's working!
```

Or check via Vercel:
1. Go to https://gtowizardprivate.vercel.app
2. Click "Solutions Library"
3. Look for category "40~20% left"
4. It should show 14 spots

## Prevention

To avoid this in the future:

1. **Always verify after upload**:
   ```powershell
   # Test if spot is accessible
   Invoke-WebRequest -Uri "https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/spots/{category}/{spot}/settings.json" -Method Head
   ```

2. **Use verification scripts** before considering an upload complete

3. **Keep local backups** of spots (you're already doing this!)

4. **Log uploads** for auditing

## Status

- [ ] Upload started
- [ ] Upload completed
- [ ] Waiting for CDN propagation (5-10 min)
- [ ] Tested on Vercel
- [ ] Confirmed: 14 spots visible

---

**Date**: November 5, 2025
**Owner**: [Your name]
