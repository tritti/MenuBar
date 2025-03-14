import os
import json
import time
import gzip
from functools import wraps
import pickle

# Cache directory
CACHE_DIR = 'cache'
CACHE_DURATION = 86400  # 24 hours in seconds
USE_MEMORY_CACHE = True  # Enable in-memory caching for faster responses

# Large sections that need special optimization
LARGE_SECTIONS = ['pranzo', 'cena']  # Sections that are typically larger and need optimization

# In-memory cache storage
_memory_cache = {}

# Ensure cache directory exists
def ensure_cache_dir():
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

# Memory caching wrapper
def cache_response(cache_key, duration=CACHE_DURATION):
    """
    A decorator that caches the response of a function in memory first,
    then falls back to file-based caching for persistence.
    
    Args:
        cache_key (str): A unique key for the cache
        duration (int): Cache duration in seconds (default: 24 hours)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # First try memory cache for fastest performance
            if USE_MEMORY_CACHE and cache_key in _memory_cache:
                cache_entry = _memory_cache[cache_key]
                if time.time() - cache_entry['timestamp'] < duration:
                    return cache_entry['data']
            
            # Then try file cache
            ensure_cache_dir()
            cache_file = os.path.join(CACHE_DIR, f"{cache_key}.gz")
            
            # Check if cache file exists and is not expired
            if os.path.exists(cache_file):
                file_time = os.path.getmtime(cache_file)
                if time.time() - file_time < duration:
                    try:
                        with gzip.open(cache_file, 'rb') as f:
                            data = pickle.load(f)
                            # Update memory cache
                            if USE_MEMORY_CACHE:
                                _memory_cache[cache_key] = {
                                    'timestamp': file_time,
                                    'data': data
                                }
                            return data
                    except (pickle.PickleError, IOError):
                        # If there's an error reading the cache, ignore and regenerate
                        pass
            
            # Generate fresh data
            result = func(*args, **kwargs)
            
            # Update memory cache
            if USE_MEMORY_CACHE:
                _memory_cache[cache_key] = {
                    'timestamp': time.time(),
                    'data': result
                }
            
            # Save to file cache (compressed for efficiency)
            try:
                with gzip.open(cache_file, 'wb') as f:
                    pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
            except IOError:
                # If we can't write to cache, just return the result
                pass
                
            return result
        return wrapper
    return decorator

# Function to invalidate specific cache
def invalidate_cache(cache_key):
    """
    Invalidate a specific cache file and its memory cache
    
    Args:
        cache_key (str): The cache key to invalidate
    """
    # Clear memory cache
    if USE_MEMORY_CACHE and cache_key in _memory_cache:
        del _memory_cache[cache_key]
    
    # Clear file cache
    ensure_cache_dir()
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.gz")
    if os.path.exists(cache_file):
        try:
            os.remove(cache_file)
            return True
        except OSError:
            return False
    return False

# Function to invalidate all caches
def invalidate_all_caches():
    """
    Invalidate all cache files and memory cache
    """
    # Clear memory cache
    if USE_MEMORY_CACHE:
        _memory_cache.clear()
    
    # Clear file caches
    ensure_cache_dir()
    try:
        for filename in os.listdir(CACHE_DIR):
            if filename.endswith('.gz') or filename.endswith('.json'):
                os.remove(os.path.join(CACHE_DIR, filename))
        return True
    except OSError:
        return False