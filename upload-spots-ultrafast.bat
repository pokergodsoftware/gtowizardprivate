@echo off
echo ========================================
echo  ULTRA FAST - Size/ModTime Check Only
echo ========================================
echo.

echo Syncing spots to Cloudflare R2 (size+modtime)...
echo Super fast - only checks size and modification time
echo.

rclone sync ./spots cloudflare:gto-wizard-spots/spots ^
  --progress ^
  --stats 10s ^
  --transfers 32 ^
  --fast-list ^
  --size-only

echo.
echo ========================================
echo  Upload Complete!
echo ========================================
echo.
echo Files synced to: cloudflare:gto-wizard-spots/spots
echo Only modified files were uploaded (size check)
echo.
pause
