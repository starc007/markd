import { useCallback, useState } from "react";
import { useNoteStore } from "../stores/noteStore";

export function useSearch() {
  const { searchResults, searchQuery, search, clearSearch } = useNoteStore();
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(
    async (query: string) => {
      setIsSearching(true);
      try {
        await search(query);
      } finally {
        setIsSearching(false);
      }
    },
    [search]
  );

  return {
    searchResults,
    searchQuery,
    isSearching,
    search: performSearch,
    clearSearch,
  };
}
