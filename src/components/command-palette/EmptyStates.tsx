import { Command } from "cmdk";

interface EmptyStatesProps {
  shouldSearch: boolean;
  hasSearchResults: boolean;
  searchQuery: string;
  isCommandMode: boolean;
  shouldShowCommands: boolean;
  searchThreshold: number;
}

export function EmptyStates({
  shouldSearch,
  hasSearchResults,
  searchQuery,
  isCommandMode,
  shouldShowCommands,
  searchThreshold,
}: EmptyStatesProps) {
  return (
    <>
      {/* Empty State - No search results */}
      {shouldSearch &&
        !hasSearchResults &&
        searchQuery.length >= searchThreshold && (
          <Command.Empty className="py-8 text-center">
            <p className="text-[13px] text-muted-foreground mb-2">
              No results found for "{searchQuery}"
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              Try a different search term or type{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                {">"}
              </kbd>{" "}
              for commands
            </p>
          </Command.Empty>
        )}

      {/* Empty State - Command mode with no matches */}
      {isCommandMode &&
        searchQuery.length > 0 &&
        shouldShowCommands &&
        !hasSearchResults && (
          <Command.Empty className="py-8 text-center">
            <p className="text-[13px] text-muted-foreground mb-2">
              No commands match "{searchQuery}"
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              Remove{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                {">"}
              </kbd>{" "}
              to search content
            </p>
          </Command.Empty>
        )}
    </>
  );
}
