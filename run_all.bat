@echo off
title AI Resume Screening - Master Launcher
echo ====================================================================
echo   AI-Powered Resume Screening System Using NLP and Semantic Similarity
echo   Master Launcher for Windows
echo ====================================================================
echo.

set SCRIPT_DIR=%~dp0

echo [1/3] Launching Flask Backend Server in a new window...
start "AI Resume Screening - Backend" cmd /c "%SCRIPT_DIR%start_backend.bat"

echo [2/3] Waiting for backend initialization (3 seconds)...
timeout /t 3 /nobreak >nul

echo [3/3] Launching React Vite Frontend Server in a new window...
start "AI Resume Screening - Frontend" cmd /c "%SCRIPT_DIR%start_frontend.bat"

echo.
echo ====================================================================
echo System launched successfully!
echo Backend API:  http://127.0.0.1:5000/api/health
echo Frontend Web: http://localhost:3000
echo ====================================================================
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Press any key to close this launcher window (servers will remain running).
pause >nul
