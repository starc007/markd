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
      <div className="py-6 text-center text-[13px] text-gray-400 dark:text-gray-500">
        No results found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {results.map((result, index) => (
        <button
          key={result.id}
          onClick={() => onSelect(result.id)}
          className={`flex flex-col gap-1 p-3 text-left rounded-xl transition-colors ${
            index === selectedIndex
              ? "bg-gray-100 dark:bg-zinc-800"
              : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <div className="text-[13px] font-medium text-gray-900 dark:text-white">
            {result.title}
          </div>
          {result.snippet && (
            <div
              className="text-[12px] text-gray-400 dark:text-gray-500 truncate"
              dangerouslySetInnerHTML={{ __html: result.snippet }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
