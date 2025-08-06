#!/usr/bin/env python3
"""
Скрипт для сбора данных из Яндекс.Музыки и скачивания треков
Использует неофициальное API через библиотеку yandex-music
Создает структуру папок для Music Galaxy 3D
"""

import json
import os
import sys
import datetime
import requests
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from yandex_music import Client
from yandex_music.exceptions import YandexMusicError


def get_token_from_user() -> str:
    """Получает токен от пользователя с инструкциями"""
    print("=" * 60)
    print("🎵 СБОР ДАННЫХ ИЗ ЯНДЕКС.МУЗЫКИ")
    print("=" * 60)
    
    # Проверяем, есть ли сохраненный токен
    saved_token = load_saved_token()
    if saved_token:
        print(f"✅ Найден сохраненный токен: {format_token_for_display(saved_token)}")
        use_saved = input("Использовать сохраненный токен? (y/n): ").strip().lower()
        if use_saved in ['y', 'yes', 'да', '']:
            return saved_token
    
    print("\n📋 ИНСТРУКЦИЯ ПО ПОЛУЧЕНИЮ ТОКЕНА:")
    print("1. Перейдите по ссылке:")
    print("   https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d")
    print("2. Авторизуйтесь при необходимости и предоставьте доступ")
    print("3. Браузер перенаправит на адрес вида:")
    print("   https://music.yandex.ru/#access_token=****&token_type=bearer&expires_in=31535645")
    print("4. ОЧЕНЬ БЫСТРО произойдет редирект на другую страницу!")
    print("5. Успейте скопировать ссылку и извлеките токен после 'access_token='")
    print("-" * 60)
    
    token = input("Введите токен access_token: ").strip()
    if not token:
        print("❌ Токен не может быть пустым!")
        sys.exit(1)
    
    if len(token) < 20:
        print("❌ Токен слишком короткий! Проверьте правильность копирования.")
        sys.exit(1)
    
    # Сохраняем токен для будущего использования
    save_token(token)
    
    return token

def load_saved_token() -> Optional[str]:
    """Загружает сохраненный токен"""
    try:
        # Сначала проверяем временный файл от Electron
        temp_token_file = os.path.join(os.path.dirname(__file__), '.temp_token')
        if os.path.exists(temp_token_file):
            with open(temp_token_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data['token']
        
        # Затем проверяем обычный сохраненный токен
        token_file = os.path.join(os.path.dirname(__file__), '.yandex_token')
        if os.path.exists(token_file):
            with open(token_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Проверяем возраст токена
            created_at = datetime.datetime.fromisoformat(data['created_at'])
            age_hours = (datetime.datetime.now() - created_at).total_seconds() / 3600
            
            if age_hours < 24:  # Токен действителен 24 часа
                return data['token']
            else:
                print(f"⚠️ Сохраненный токен устарел ({age_hours:.1f} ч.)")
                return None
    except Exception as e:
        print(f"⚠️ Ошибка загрузки сохраненного токена: {e}")
        return None

def save_token(token: str) -> None:
    """Сохраняет токен для будущего использования"""
    try:
        token_file = os.path.join(os.path.dirname(__file__), '.yandex_token')
        data = {
            'token': token,
            'created_at': datetime.datetime.now().isoformat()
        }
        
        with open(token_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print("💾 Токен сохранен для будущего использования")
    except Exception as e:
        print(f"⚠️ Не удалось сохранить токен: {e}")

def format_token_for_display(token: str) -> str:
    """Форматирует токен для безопасного отображения"""
    if len(token) <= 10:
        return token
    
    start = token[:4]
    end = token[-4:]
    middle = '*' * min(12, len(token) - 8)
    
    return f"{start}{middle}{end}"


def extract_genre(track) -> str:
    """Извлекает жанр из данных трека"""
    try:
        # Пробуем получить жанр из исполнителя
        if track.artists and len(track.artists) > 0:
            artist = track.artists[0]
            if hasattr(artist, 'genres') and artist.genres:
                return artist.genres[0]
        
        # Пробуем получить жанр из альбома
        if track.albums and len(track.albums) > 0:
            album = track.albums[0]
            if hasattr(album, 'genre') and album.genre:
                return album.genre
        
        return "unknown"
    except Exception:
        return "unknown"


def get_cover_url(track) -> Optional[str]:
    """Получает URL обложки трека"""
    try:
        if track.cover_uri:
            # Заменяем %% на размер изображения
            return f"https://{track.cover_uri.replace('%%', '400x400')}"
        
        # Пробуем получить обложку из альбома
        if track.albums and len(track.albums) > 0:
            album = track.albums[0]
            if hasattr(album, 'cover_uri') and album.cover_uri:
                return f"https://{album.cover_uri.replace('%%', '400x400')}"
        
        return None
    except Exception:
        return None


def get_download_url(client: Client, track) -> Optional[str]:
    """Получает URL для скачивания полного трека в высоком качестве"""
    try:
        # Запрашиваем информацию о загрузке
        download_info_list = track.get_download_info(get_direct_links=True)
        
        # Ищем лучшее качество MP3
        best_quality = None
        for info in download_info_list:
            if info.codec == 'mp3':
                if best_quality is None or info.bitrate_in_kbps > best_quality.bitrate_in_kbps:
                    best_quality = info
        
        if best_quality:
            print(f"  ✅ Ссылка для скачивания найдена: '{track.title}' ({best_quality.bitrate_in_kbps}kbps)")
            return best_quality.direct_link
        
        print(f"  ⚠️ Ссылка для скачивания недоступна: '{track.title}'")
        return None
        
    except YandexMusicError as e:
        print(f"  ❌ Ошибка API при получении ссылки для '{track.title}': {e}")
        return None
    except Exception as e:
        print(f"  ❌ Непредвиденная ошибка при получении ссылки для '{track.title}': {e}")
        return None


def sanitize_filename(filename: str) -> str:
    """Очищает имя файла от недопустимых символов"""
    # Заменяем недопустимые символы
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Убираем лишние пробелы и точки
    filename = filename.strip('. ')
    
    # Ограничиваем длину
    if len(filename) > 100:
        filename = filename[:100]
    
    return filename


def download_track(url: str, output_path: str, track_title: str) -> bool:
    """Скачивает трек по URL"""
    try:
        print(f"  🔄 Скачивание: {track_title}")
        
        # Создаем директорию если не существует
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Скачиваем файл
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        # Сохраняем файл
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        # Проверяем размер файла
        file_size = os.path.getsize(output_path)
        if file_size < 1024:  # Меньше 1KB - подозрительно
            print(f"  ⚠️ Подозрительно маленький файл: {file_size} байт")
            os.remove(output_path)
            return False
        
        print(f"  ✅ Скачано: {track_title} ({file_size // 1024} KB)")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Ошибка скачивания {track_title}: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Непредвиденная ошибка при скачивании {track_title}: {e}")
        return False


def create_output_structure(output_dir: str) -> tuple[str, str]:
    """Создает структуру папок для Music Galaxy 3D"""
    # Создаем основную папку
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Создаем папку для аудио
    audio_path = output_path / "audio"
    audio_path.mkdir(exist_ok=True)
    
    metadata_file = output_path / "metadata.json"
    
    print(f"📁 Создана структура папок:")
    print(f"  📂 {output_path}")
    print(f"  📂 {audio_path}")
    print(f"  📄 {metadata_file}")
    
    return str(metadata_file), str(audio_path)


def process_track(client: Client, track, audio_dir: str, download_audio: bool = True) -> Dict[str, Any]:
    """Обрабатывает один трек и возвращает данные для JSON"""
    try:
        # Основная информация
        track_data = {
            "id": str(track.id),
            "title": track.title,
            "artist": track.artists[0].name if track.artists else "Unknown Artist",
            "album": track.albums[0].title if track.albums else "Unknown Album",
            "duration": track.duration_ms // 1000 if track.duration_ms else 0,
            "genre": extract_genre(track),
            "cover_url": get_cover_url(track),
            "available": track.available if hasattr(track, 'available') else True
        }
        
        # Скачиваем аудиофайл если нужно
        if download_audio and track_data["available"]:
            download_url = get_download_url(client, track)
            if download_url:
                # Создаем имя файла
                audio_filename = f"{track_data['id']}.mp3"
                audio_path = os.path.join(audio_dir, audio_filename)
                
                # Скачиваем трек
                if download_track(download_url, audio_path, track_data['title']):
                    print(f"  ✅ Трек скачан: {track.title}")
                else:
                    print(f"  ⚠️ Не удалось скачать: {track.title}")
                    track_data["available"] = False
            else:
                print(f"  ⚠️ Ссылка недоступна: {track.title}")
                track_data["available"] = False
        
        return track_data
    
    except Exception as e:
        print(f"❌ Ошибка обработки трека: {e}")
        return None


def collect_liked_tracks(token: str, output_dir: str, download_audio: bool = True) -> List[Dict[str, Any]]:
    """Собирает данные о лайкнутых треках и скачивает их"""
    try:
        print("🔄 Подключение к Яндекс.Музыке...")
        client = Client(token).init()
        
        print("✅ Успешное подключение!")
        print("🔄 Получение лайкнутых треков...")
        
        # Получаем лайкнутые треки
        liked_tracks = client.users_likes_tracks()
        if not liked_tracks or not liked_tracks.tracks:
            print("❌ Не найдено лайкнутых треков")
            return []
        
        # Создаем структуру папок
        metadata_file, audio_dir = create_output_structure(output_dir)
        
        tracks_data = []
        total_tracks = len(liked_tracks.tracks)
        downloaded_count = 0
        
        print(f"📊 Найдено {total_tracks} лайкнутых треков")
        if download_audio:
            print("🎵 Начинаем скачивание треков...")
        else:
            print("🔄 Обработка метаданных...")
        
        for i, track_short in enumerate(liked_tracks.tracks, 1):
            try:
                # Получаем полную информацию о треке
                track = client.tracks([track_short.id])[0]
                
                print(f"\n[{i}/{total_tracks}] Обработка: {track.title} - {track.artists[0].name if track.artists else 'Unknown'}")
                
                track_data = process_track(client, track, audio_dir, download_audio)
                if track_data:
                    tracks_data.append(track_data)
                    if download_audio and track_data.get('available', False):
                        downloaded_count += 1
                
                # Небольшая пауза между запросами
                time.sleep(0.5)
                
            except Exception as e:
                print(f"⚠️  Пропуск трека {i}: {e}")
                continue
        
        # Статистика
        available_tracks = sum(1 for track in tracks_data if track.get('available', False))
        
        print(f"\n✅ Успешно обработано {len(tracks_data)} треков")
        if download_audio:
            print(f"🎵 Скачано аудиофайлов: {downloaded_count}")
            print(f"📁 Доступно для воспроизведения: {available_tracks} треков")
        
        return tracks_data
    
    except YandexMusicError as e:
        print(f"❌ Ошибка Яндекс.Музыки: {e}")
        print("💡 Проверьте правильность токена")
        sys.exit(1)
    
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        sys.exit(1)


def save_data_to_json(tracks_data: List[Dict[str, Any]], output_file: str):
    """Сохраняет данные в JSON файл"""
    try:
        # Создаем директорию если не существует
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # Добавляем метаданные
        output_data = {
            "metadata": {
                "total_tracks": len(tracks_data),
                "generated_at": __import__('datetime').datetime.now().isoformat(),
                "source": "Yandex Music API"
            },
            "tracks": tracks_data
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Данные сохранены в {output_file}")
        
        # Статистика по жанрам
        genres = {}
        for track in tracks_data:
            genre = track.get('genre', 'unknown')
            genres[genre] = genres.get(genre, 0) + 1
        
        print("\n📊 Статистика по жанрам:")
        for genre, count in sorted(genres.items(), key=lambda x: x[1], reverse=True):
            print(f"  {genre}: {count} треков")
    
    except Exception as e:
        print(f"❌ Ошибка сохранения: {e}")
        sys.exit(1)


def get_output_directory() -> str:
    """Получает папку для сохранения от пользователя"""
    print("\n📁 ВЫБОР ПАПКИ ДЛЯ СОХРАНЕНИЯ:")
    print("Где сохранить вашу музыкальную коллекцию?")
    print("1. В текущей папке (./music_collection)")
    print("2. Указать свой путь")
    
    choice = input("Выберите вариант (1/2): ").strip()
    
    if choice == "1" or choice == "":
        output_dir = os.path.join(os.getcwd(), "music_collection")
        print(f"📂 Выбрана папка: {output_dir}")
        return output_dir
    elif choice == "2":
        custom_path = input("Введите путь к папке: ").strip()
        if not custom_path:
            print("❌ Путь не может быть пустым!")
            return get_output_directory()
        
        # Проверяем, что путь валидный
        try:
            os.makedirs(custom_path, exist_ok=True)
            print(f"📂 Выбрана папка: {custom_path}")
            return custom_path
        except Exception as e:
            print(f"❌ Ошибка создания папки: {e}")
            return get_output_directory()
    else:
        print("❌ Неверный выбор!")
        return get_output_directory()


def ask_download_preference() -> bool:
    """Спрашивает пользователя, нужно ли скачивать аудиофайлы"""
    print("\n🎵 СКАЧИВАНИЕ АУДИОФАЙЛОВ:")
    print("Скачать полные аудиофайлы треков?")
    print("✅ Да - полная функциональность (займет больше времени и места)")
    print("❌ Нет - только метаданные (быстрее, но без воспроизведения)")
    
    choice = input("Скачивать аудио? (y/n): ").strip().lower()
    
    if choice in ['y', 'yes', 'да', '']:
        print("🎵 Будут скачаны полные аудиофайлы")
        return True
    else:
        print("📄 Будут сохранены только метаданные")
        return False


def main():
    """Основная функция"""
    print("🎵 Сборщик данных Яндекс.Музыки для Music Galaxy 3D")
    print("=" * 60)
    print("Создает готовую структуру папок для локального использования")
    print("=" * 60)
    
    # Проверяем установку библиотек
    try:
        import yandex_music
        print("✅ Библиотека yandex-music найдена")
    except ImportError:
        print("❌ Библиотека yandex-music не установлена!")
        print("💡 Установите её командой: pip install yandex-music")
        sys.exit(1)
    
    try:
        import requests
        print("✅ Библиотека requests найдена")
    except ImportError:
        print("❌ Библиотека requests не установлена!")
        print("💡 Установите её командой: pip install requests")
        sys.exit(1)
    
    # Получаем настройки от пользователя
    token = get_token_from_user()
    output_dir = get_output_directory()
    download_audio = ask_download_preference()
    
    # Собираем данные и скачиваем треки
    print(f"\n🚀 Начинаем сбор данных...")
    tracks_data = collect_liked_tracks(token, output_dir, download_audio)
    
    if not tracks_data:
        print("❌ Не удалось собрать данные о треках")
        sys.exit(1)
    
    # Сохраняем метаданные в правильном месте
    metadata_file = os.path.join(output_dir, "metadata.json")
    
    # Создаем структуру данных для metadata.json
    metadata = {
        "metadata": {
            "total_tracks": len(tracks_data),
            "generated_at": datetime.datetime.now().isoformat(),
            "source": "Yandex Music API with Local Files"
        },
        "tracks": tracks_data
    }
    
    # Сохраняем metadata.json
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Метаданные сохранены: {metadata_file}")
    
    # Статистика по жанрам
    genres = {}
    for track in tracks_data:
        genre = track.get('genre', 'unknown')
        genres[genre] = genres.get(genre, 0) + 1
    
    print("\n📊 Статистика по жанрам:")
    for genre, count in sorted(genres.items(), key=lambda x: x[1], reverse=True):
        print(f"  {genre}: {count} треков")
    
    # Финальная информация
    available_tracks = sum(1 for track in tracks_data if track.get('available', False))
    
    print("\n" + "=" * 60)
    print("🎉 ГОТОВО!")
    print("=" * 60)
    print(f"📂 Папка с коллекцией: {output_dir}")
    print(f"📄 Файл метаданных: metadata.json")
    if download_audio:
        print(f"📁 Папка с аудио: audio/")
        print(f"🎵 Скачано треков: {available_tracks}")
    print(f"📊 Всего треков в коллекции: {len(tracks_data)}")
    print("\n💡 Теперь можно использовать эту папку в Music Galaxy 3D!")
    print("   Просто выберите её в веб-приложении.")


if __name__ == "__main__":
    main()