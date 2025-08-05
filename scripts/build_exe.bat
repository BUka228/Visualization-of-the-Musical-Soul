@echo off
echo ========================================
echo  Сборка exe файла для Yandex Music
echo ========================================
echo.

cd /d "%~dp0"

python build_exe.py

echo.
echo Нажмите любую клавишу для выхода...
pause >nul