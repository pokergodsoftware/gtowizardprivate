@echo off
echo ========================================
echo  FAST UPLOAD - Only Modified Files
echo ========================================
echo.

echo Syncing spots to Cloudflare R2 (checksum mode)...
echo This only uploads changed/new files
echo.

rclone sync ./spots cloudflare:gto-wizard-spots/spots ^
  --checksum ^
  --progress ^
  --stats 10s ^
  --transfers 32 ^
  --fast-list

echo.
echo ========================================
echo  Upload Complete!
echo ========================================
echo.
echo Files synced to: cloudflare:gto-wizard-spots/spots
echo Only modified files were uploaded
echo.
pause
