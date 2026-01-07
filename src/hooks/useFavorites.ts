import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "draft-favorite-notes";

type FavoriteNotes = Set<string>;

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteNotes>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error("Failed to save favorite notes:", error);
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (noteId: string): boolean => {
      return favorites.has(noteId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback((noteId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  }, []);

  const addFavorite = useCallback((noteId: string) => {
    setFavorites((prev) => new Set(prev).add(noteId));
  }, []);

  const removeFavorite = useCallback((noteId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite };
}
