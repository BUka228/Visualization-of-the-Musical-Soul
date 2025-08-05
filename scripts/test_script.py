#!/usr/bin/env python3
"""
Простой тест для проверки работы основных функций
"""

import sys
import os

def test_imports():
    """Тестирует импорты"""
    print("🔄 Тестирование импортов...")
    
    try:
        import yandex_music
        print("✅ yandex-music импортирован")
    except ImportError as e:
        print(f"❌ Ошибка импорта yandex-music: {e}")
        return False
    
    try:
        import requests
        print("✅ requests импортирован")
    except ImportError as e:
        print(f"❌ Ошибка импорта requests: {e}")
        return False
    
    try:
        import json
        print("✅ json импортирован")
    except ImportError as e:
        print(f"❌ Ошибка импорта json: {e}")
        return False
    
    return True

def test_functions():
    """Тестирует основные функции"""
    print("\n🔄 Тестирование функций...")
    
    # Импортируем функции из основного скрипта
    sys.path.append(os.path.dirname(__file__))
    
    try:
        from collect_yandex_music_data import (
            sanitize_filename,
            format_token_for_display,
            create_output_structure
        )
        
        # Тест sanitize_filename
        test_filename = "Test<>Song|Name?.mp3"
        clean_filename = sanitize_filename(test_filename)
        print(f"✅ sanitize_filename: '{test_filename}' -> '{clean_filename}'")
        
        # Тест format_token_for_display
        test_token = "very_long_token_string_for_testing"
        formatted_token = format_token_for_display(test_token)
        print(f"✅ format_token_for_display: '{test_token}' -> '{formatted_token}'")
        
        # Тест create_output_structure
        test_dir = "test_output"
        metadata_file, audio_dir = create_output_structure(test_dir)
        print(f"✅ create_output_structure создал: {metadata_file}, {audio_dir}")
        
        # Очищаем тестовую папку
        import shutil
        if os.path.exists(test_dir):
            shutil.rmtree(test_dir)
            print("✅ Тестовая папка очищена")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка тестирования функций: {e}")
        return False

def main():
    """Основная функция теста"""
    print("🧪 Тест компонентов Yandex Music Collector")
    print("=" * 50)
    
    # Тестируем импорты
    if not test_imports():
        print("\n❌ Тест импортов провален")
        sys.exit(1)
    
    # Тестируем функции
    if not test_functions():
        print("\n❌ Тест функций провален")
        sys.exit(1)
    
    print("\n✅ Все тесты пройдены успешно!")
    print("💡 Основной скрипт готов к использованию")

if __name__ == "__main__":
    main()