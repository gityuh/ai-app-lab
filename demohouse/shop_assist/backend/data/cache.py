from collections import OrderedDict
from typing import Generic, Optional, TypeVar

T = TypeVar("T")  # Generic type for cache values


class LRUCache(Generic[T]):
    """Generic LRU Cache implementation"""

    def __init__(self, capacity: int = 1000):
        self.capacity = capacity
        self.cache: OrderedDict[str, T] = OrderedDict()

    def get(self, key: str) -> Optional[T]:
        """
        Get value from cache and move to end if exists

        Args:
            key: Cache key to look up

        Returns:
            Cached value if found, None otherwise
        """
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: str, value: T) -> None:
        """
        Put value in cache, evict least recently used if at capacity

        Args:
            key: Cache key
            value: Value to cache
        """
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
