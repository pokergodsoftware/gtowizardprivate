@echo off
echo ========================================
echo  UPLOAD TRAINER ASSETS TO CLOUDFLARE R2
echo ========================================
echo.

echo Uploading trainer audio files to Cloudflare R2...
echo This will upload all files from public/trainer/ directory
echo.

REM Upload all trainer assets to R2
rclone copy ./public/trainer cloudflare:gto-wizard-spots/trainer ^
  --progress ^
  --stats 10s ^
  --transfers 8 ^
  --checksum

echo.
echo ========================================
echo  Upload Complete!
echo ========================================
echo.
echo Files uploaded to: cloudflare:gto-wizard-spots/trainer
echo Location: https://pub-27b29c1ed40244eb8542637289be3cf7.r2.dev/trainer/
echo.
echo Uploaded files:
echo - timebank1.ogg
echo - timebank1.mp3
echo - timebank2.ogg
echo - timebank2.mp3
echo - README_AUDIO.md
echo - AUDIO_INSTRUCTIONS.md
echo - test-audio.html
echo.
pause
