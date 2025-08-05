#!/usr/bin/env python3
"""
Скрипт для создания exe файла из collect_yandex_music_data.py
Использует PyInstaller для упаковки
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def check_pyinstaller():
    """Проверяет установку PyInstaller"""
    try:
        import PyInstaller
        print("✅ PyInstaller найден")
        return True
    except ImportError:
        print("❌ PyInstaller не установлен!")
        print("💡 Установите его командой: pip install pyinstaller")
        return False

def install_requirements():
    """Устанавливает зависимости"""
    print("🔄 Установка зависимостей...")
    
    requirements_file = Path(__file__).parent.parent / "requirements.txt"
    
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True)
        print("✅ Зависимости установлены")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка установки зависимостей: {e}")
        return False

def create_exe():
    """Создает exe файл"""
    print("🔄 Создание exe файла...")
    
    script_dir = Path(__file__).parent
    main_script = script_dir / "collect_yandex_music_data.py"
    dist_dir = script_dir / "dist"
    build_dir = script_dir / "build"
    
    # Очищаем предыдущие сборки
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    if build_dir.exists():
        shutil.rmtree(build_dir)
    
    # Параметры для PyInstaller
    pyinstaller_args = [
        "pyinstaller",
        "--onefile",  # Один exe файл
        "--console",  # Консольное приложение
        "--name", "YandexMusicCollector",  # Имя exe файла
        "--icon", "NONE",  # Без иконки (можно добавить позже)
        "--clean",  # Очистить кэш
        "--noconfirm",  # Не спрашивать подтверждения
        str(main_script)
    ]
    
    try:
        # Запускаем PyInstaller
        result = subprocess.run(pyinstaller_args, cwd=script_dir, check=True, 
                              capture_output=True, text=True)
        
        print("✅ exe файл создан успешно!")
        
        # Проверяем результат
        exe_file = dist_dir / "YandexMusicCollector.exe"
        if exe_file.exists():
            file_size = exe_file.stat().st_size / (1024 * 1024)  # MB
            print(f"📁 Файл: {exe_file}")
            print(f"📊 Размер: {file_size:.1f} MB")
            
            # Создаем README для пользователей
            create_readme(dist_dir)
            
            return True
        else:
            print("❌ exe файл не найден после сборки")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка создания exe: {e}")
        if e.stdout:
            print("STDOUT:", e.stdout)
        if e.stderr:
            print("STDERR:", e.stderr)
        return False

def create_readme(dist_dir: Path):
    """Создает README файл для пользователей"""
    readme_content = """# Yandex Music Collector

Программа для скачивания музыкальной коллекции из Яндекс.Музыки для использования в Music Galaxy 3D.

## Как использовать:

1. **Запустите программу**: Дважды кликните на `YandexMusicCollector.exe`

2. **Получите токен**:
   - Откройте music.yandex.ru в браузере
   - Войдите в свой аккаунт
   - Нажмите F12 (DevTools)
   - Перейдите: Application → Cookies → music.yandex.ru
   - Найдите cookie 'Session_id' и скопируйте его значение

3. **Следуйте инструкциям программы**:
   - Вставьте токен
   - Выберите папку для сохранения
   - Выберите, скачивать ли аудиофайлы

4. **Результат**:
   - Папка с вашей музыкальной коллекцией
   - Файл `metadata.json` с информацией о треках
   - Папка `audio/` с MP3 файлами (если выбрали скачивание)

## Использование в Music Galaxy 3D:

1. Откройте веб-приложение Music Galaxy 3D
2. На лендинг-странице нажмите "Создать свою галактику"
3. Выберите созданную папку с музыкой
4. Наслаждайтесь 3D-визуализацией!

## Требования:

- Аккаунт Яндекс.Музыки с лайкнутыми треками
- Интернет-соединение для скачивания
- Свободное место на диске (зависит от количества треков)

## Поддержка:

Если возникли проблемы, проверьте:
- Правильность токена Session_id
- Наличие лайкнутых треков в вашем аккаунте
- Стабильность интернет-соединения

---
Music Galaxy 3D - Визуализация вашей музыкальной души
"""
    
    readme_file = dist_dir / "README.txt"
    with open(readme_file, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"📄 Создан README: {readme_file}")

def main():
    """Основная функция"""
    print("🔨 Сборщик exe файла для Yandex Music Collector")
    print("=" * 60)
    
    # Проверяем PyInstaller
    if not check_pyinstaller():
        install_choice = input("Установить PyInstaller? (y/n): ").strip().lower()
        if install_choice in ['y', 'yes', 'да', '']:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
                print("✅ PyInstaller установлен")
            except subprocess.CalledProcessError:
                print("❌ Не удалось установить PyInstaller")
                sys.exit(1)
        else:
            print("❌ PyInstaller необходим для создания exe")
            sys.exit(1)
    
    # Устанавливаем зависимости
    if not install_requirements():
        sys.exit(1)
    
    # Создаем exe
    if create_exe():
        print("\n🎉 Готово!")
        print("📁 exe файл создан в папке scripts/dist/")
        print("💡 Теперь можно распространять YandexMusicCollector.exe")
    else:
        print("\n❌ Не удалось создать exe файл")
        sys.exit(1)

if __name__ == "__main__":
    main()