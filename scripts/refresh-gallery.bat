@echo off
chcp 65001 >nul
REM photos-preview.html 을 Supabase 최신 상태로 재생성.
REM  - 작업 스케줄러(매일 자정)가 실행하거나, 수동으로 더블클릭해도 됨.
cd /d "C:\roqkf\ai photo booth"
echo ==== %date% %time% ==== >> gallery-refresh.log
"C:\Program Files\nodejs\node.exe" scripts\build-gallery-preview.mjs >> gallery-refresh.log 2>&1
