@echo off
echo ========================================
echo BACKEND PUSH SCRIPTI
echo ========================================
cd /d C:\Users\Azram\Desktop\zeta-ai\backend
git add .
git commit -m "Backend guncellemesi - %date% %time%"
git push
echo ========================================
echo PUSH TAMAMLANDI!
echo ========================================
pause