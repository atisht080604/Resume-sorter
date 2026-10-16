@echo off
title AI Resume Screening - Backend Server (Flask)
echo ====================================================================
echo Starting AI Resume Screening Backend Server...
echo ====================================================================

cd /d "%~dp0backend"

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at backend\venv!
    echo Please create the virtual environment first:
    echo   python -m venv venv
    echo   .\venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

echo Activating Python virtual environment...
call venv\Scripts\activate.bat

echo Starting Flask REST API on http://127.0.0.1:5000...
python run.py

pause
