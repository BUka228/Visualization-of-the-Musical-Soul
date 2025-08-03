#!/usr/bin/env python3
"""
Test script to verify the collect_yandex_music_data.py functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from collect_yandex_music_data import extract_genre, get_cover_url

# Mock track object for testing
class MockTrack:
    def __init__(self):
        self.id = "test_id"
        self.title = "Test Track"
        self.duration_ms = 180000
        self.available = True
        self.cover_uri = "avatars.yandex.net/get-music-content/%%/test"
        
        # Mock artists
        self.artists = [MockArtist()]
        
        # Mock albums
        self.albums = [MockAlbum()]

class MockArtist:
    def __init__(self):
        self.name = "Test Artist"
        self.genres = ["rock"]

class MockAlbum:
    def __init__(self):
        self.title = "Test Album"
        self.genre = "rock"
        self.cover_uri = "avatars.yandex.net/get-music-content/%%/album"

def test_extract_genre():
    """Test genre extraction"""
    track = MockTrack()
    genre = extract_genre(track)
    print(f"✅ Genre extraction test: {genre}")
    assert genre == "rock", f"Expected 'rock', got '{genre}'"

def test_get_cover_url():
    """Test cover URL generation"""
    track = MockTrack()
    cover_url = get_cover_url(track)
    print(f"✅ Cover URL test: {cover_url}")
    expected = "https://avatars.yandex.net/get-music-content/400x400/test"
    assert cover_url == expected, f"Expected '{expected}', got '{cover_url}'"

def test_imports():
    """Test that all required modules can be imported"""
    try:
        import yandex_music
        print("✅ yandex_music import successful")
        
        import json
        print("✅ json import successful")
        
        import os
        print("✅ os import successful")
        
        from yandex_music import Client
        print("✅ Client import successful")
        
        from yandex_music.exceptions import YandexMusicError
        print("✅ YandexMusicError import successful")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🧪 Testing collect_yandex_music_data.py functionality...")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        sys.exit(1)
    
    print()
    
    # Test functions
    try:
        test_extract_genre()
        test_get_cover_url()
        
        print("\n🎉 All tests passed!")
        print("✅ The Python script is ready to collect Yandex Music data")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)