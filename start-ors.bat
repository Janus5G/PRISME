@echo off
title PRISME Optical Routing Simulator
cd /d "%~dp0"

echo.
echo  ===================================
echo   PRISME Optical Routing Simulator
echo  ===================================
echo.

REM Find Python
where python >nul 2>&1
if %errorlevel%==0 (
    set PY=python
) else (
    where python3 >nul 2>&1
    if %errorlevel%==0 (
        set PY=python3
    ) else (
        echo  FEJL: Python ikke fundet. Installer fra python.org
        pause
        exit /b 1
    )
)

echo  Fundet: %PY%
%PY% --version
echo.

REM Opret venv hvis den ikke findes
if not exist ".venv\Scripts\activate.bat" (
    echo  Opretter virtuelt miljo...
    %PY% -m venv .venv
    if %errorlevel% neq 0 (
        echo  FEJL: Kunne ikke oprette venv
        pause
        exit /b 1
    )
)

REM Aktiver venv
call .venv\Scripts\activate.bat

REM Installer hvis ikke allerede gjort
pip show fastapi >nul 2>&1
if %errorlevel% neq 0 (
    echo  Installerer afhængigheder...
    pip install -e ".[dev]"
    if %errorlevel% neq 0 (
        echo  FEJL: Installation mislykkedes
        pause
        exit /b 1
    )
    echo.
)

echo  Starter server...
echo.
echo  ===================================
echo   Aaben i din browser:
echo   http://127.0.0.1:8000
echo   http://127.0.0.1:8000/prisme
echo  ===================================
echo.
echo  Tryk Ctrl+C for at stoppe.
echo.

python -m optical_router --reload

pause
