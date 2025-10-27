@echo off
REM ===============================================
REM Photobooth Deployment Package Creator
REM ===============================================

echo.
echo ========================================
echo  Creating deployment package...
echo ========================================
echo.

REM Step 1: Build
echo [1/3] Building application...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

REM Step 2: Create deployment zip
echo.
echo [2/3] Creating deployment package...
cd .next\standalone

REM Create zip file name with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set filename=photobooth-%mydate%-%mytime%.zip

echo Creating: %filename%
powershell Compress-Archive -Path * -DestinationPath ..\..\%filename% -Force

cd ..\..

echo.
echo ========================================
echo  Deployment package created!
echo ========================================
echo.
echo File: %filename%
echo Location: %cd%
echo.
echo [3/3] Copy this file to photobooth PC and extract it.
echo.
pause
