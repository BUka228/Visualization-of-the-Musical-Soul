@echo off
echo ========================================
echo  Yandex Music Collector
echo ========================================
echo.

cd /d "%~dp0"

echo Проверка зависимостей...
python -m pip install -r ../requirements.txt

echo.
echo Запуск сборщика...
python collect_yandex_music_data.py

echo.
echo Нажмите любую клавишу для выхода...
pause >nul