@echo off
title AI Resume Screening - Frontend Server (Vite + React)
echo ====================================================================
echo Starting AI Resume Screening Frontend Server...
echo ====================================================================

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [ERROR] node_modules not found in frontend directory!
    echo Please install dependencies first:
    echo   npm install
    pause
    exit /b 1
)

echo Starting Vite development server on http://localhost:3000...
npm run dev

pause
