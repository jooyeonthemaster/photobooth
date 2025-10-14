@echo off
echo Building DNP Printer Service...

REM C# 컴파일러 경로 찾기
set CSC="C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if not exist %CSC% (
    echo Error: C# compiler not found at %CSC%
    exit /b 1
)

REM 컴파일
%CSC% /target:exe /out:DnpPrinter.exe DnpPrinter.cs /reference:System.Drawing.dll

if %ERRORLEVEL% EQU 0 (
    echo Build successful: DnpPrinter.exe created
) else (
    echo Build failed
    exit /b 1
)
