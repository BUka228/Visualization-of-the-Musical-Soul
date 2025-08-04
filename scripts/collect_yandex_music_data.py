#!/usr/bin/env python3
"""
Скрипт для сбора данных из Яндекс.Музыки
Использует неофициальное API через библиотеку yandex-music
"""

import json
import os
import sys
import datetime
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
    print("1. Откройте music.yandex.ru в браузере")
    print("2. Войдите в свой аккаунт Яндекс")
    print("3. Откройте DevTools (F12)")
    print("4. Перейдите: Application → Cookies → music.yandex.ru")
    print("5. Найдите cookie с именем 'Session_id'")
    print("6. Скопируйте его значение (длинная строка)")
    print("-" * 60)
    
    token = input("Введите токен Session_id: ").strip()
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


def get_preview_url(client: Client, track) -> Optional[str]:
    """Получает URL 30-секундного превью трека.
    
    Это более простой и надежный метод.
    """
    try:
        # Запрашиваем информацию о загрузке, включая прямые ссылки
        # Метод на объекте track более надежен, чем client.tracks_download_info
        download_info_list = track.get_download_info(get_direct_links=True)
        
        # Превью обычно представляют собой MP3 с низким битрейтом (<= 192 kbps)
        # Ищем первый подходящий вариант, этого достаточно.
        for info in download_info_list:
            if info.codec == 'mp3' and info.bitrate_in_kbps <= 192:
                # Прямая ссылка уже получена благодаря get_direct_links=True
                print(f"  ✅ Превью найдено для '{track.title}' ({info.bitrate_in_kbps}kbps)")
                return info.direct_link
        
        # Если в цикле ничего не нашлось
        print(f"  ⚠️  Превью для трека '{track.title}' недоступно в download_info.")
        return None
        
    except YandexMusicError as e:
        print(f"  ❌ Ошибка API при получении превью для '{track.title}': {e}")
        return None
    except Exception as e:
        print(f"  ❌ Непредвиденная ошибка при получении превью для '{track.title}': {e}")
        return None


def process_track(client: Client, track) -> Dict[str, Any]:
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
            "preview_url": None,  # Будем получать отдельно
            "available": track.available if hasattr(track, 'available') else True
        }
        
        # Получаем превью только для доступных треков
        if track_data["available"]:
            preview_url = get_preview_url(client, track)
            if preview_url:
                track_data["preview_url"] = preview_url
                print(f"  ✅ Превью получено: {track.title}")
            else:
                print(f"  ⚠️  Превью недоступно: {track.title}")
        
        return track_data
    
    except Exception as e:
        print(f"❌ Ошибка обработки трека: {e}")
        return None


def collect_liked_tracks(token: str) -> List[Dict[str, Any]]:
    """Собирает данные о лайкнутых треках"""
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
        
        tracks_data = []
        total_tracks = len(liked_tracks.tracks)
        
        print(f"📊 Найдено {total_tracks} лайкнутых треков")
        print("🔄 Обработка треков...")
        
        for i, track_short in enumerate(liked_tracks.tracks, 1):
            try:
                # Получаем полную информацию о треке
                track = client.tracks([track_short.id])[0]
                
                print(f"[{i}/{total_tracks}] Обработка: {track.title} - {track.artists[0].name if track.artists else 'Unknown'}")
                
                track_data = process_track(client, track)
                if track_data:
                    tracks_data.append(track_data)
                
            except Exception as e:
                print(f"⚠️  Пропуск трека {i}: {e}")
                continue
        
        # Статистика по превью
        tracks_with_preview = sum(1 for track in tracks_data if track.get('preview_url'))
        preview_percentage = (tracks_with_preview / len(tracks_data) * 100) if tracks_data else 0
        
        print(f"✅ Успешно обработано {len(tracks_data)} треков")
        print(f"🎵 Превью доступно для {tracks_with_preview} треков ({preview_percentage:.1f}%)")
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


def main():
    """Основная функция"""
    print("🎵 Сборщик данных Яндекс.Музыки для Music Galaxy 3D")
    print("=" * 60)
    
    # Проверяем установку библиотеки
    try:
        import yandex_music
        print("✅ Библиотека yandex-music найдена")
    except ImportError:
        print("❌ Библиотека yandex-music не установлена!")
        print("💡 Установите её командой: pip install yandex-music")
        sys.exit(1)
    
    # Получаем токен
    token = get_token_from_user()
    
    # Собираем данные
    tracks_data = collect_liked_tracks(token)
    
    if not tracks_data:
        print("❌ Не удалось собрать данные о треках")
        sys.exit(1)
    
    # Сохраняем в JSON
    output_file = "src/data/music_data.json"
    save_data_to_json(tracks_data, output_file)
    
    print("\n🎉 Готово! Теперь можно запускать веб-приложение")
    print(f"📁 Данные сохранены в: {output_file}")


if __name__ == "__main__":
    main()