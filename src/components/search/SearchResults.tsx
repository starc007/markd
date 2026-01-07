import type { SearchResult } from "../../lib/tauri/commands";

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (id: string) => void;
  selectedIndex?: number;
}

export function SearchResults({
  results,
  onSelect,
  selectedIndex = -1,
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="search-results-empty">
        <p>No results found</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      {results.map((result, index) => (
        <button
          key={result.id}
          onClick={() => onSelect(result.id)}
          className={`search-result-item ${
            index === selectedIndex ? "selected" : ""
          }`}
        >
          <div className="search-result-title">{result.title}</div>
          {result.snippet && (
            <div
              className="search-result-snippet"
              dangerouslySetInnerHTML={{ __html: result.snippet }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
