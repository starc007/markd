import { useNoteStore } from "../../stores/noteStore";

export function TitleBar() {
  const {
    currentNote,
    isSaving,
    ui,
    toggleSidebar,
    toggleFocusMode,
    toggleCommandPalette,
  } = useNoteStore();

  return (
    <header
      className="flex items-center h-[52px] px-5 bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800"
      data-tauri-drag-region
    >
      {/* Traffic lights spacer (macOS) */}
      <div className="w-[78px] shrink-0" />

      {/* Left section */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent hover:bg-gray-200/60 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors [-webkit-app-region:no-drag]"
          title="Toggle sidebar (⌘\\)"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-[18px] h-[18px]"
          >
            {ui.sidebarCollapsed ? (
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Center section */}
      <div className="flex-1 flex justify-center items-center min-w-0">
        {currentNote ? (
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
              {currentNote.title || "Untitled"}
            </span>
            {isSaving && (
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                Saving
              </span>
            )}
          </div>
        ) : (
          <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
            Draft
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleCommandPalette}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent hover:bg-gray-200/60 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors [-webkit-app-region:no-drag]"
          title="Command palette (⌘K)"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-[18px] h-[18px]"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          onClick={toggleFocusMode}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors [-webkit-app-region:no-drag] ${
            ui.focusMode
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              : "bg-transparent hover:bg-gray-200/60 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
          title="Focus mode (⌘⇧F)"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-[18px] h-[18px]"
          >
            {ui.focusMode ? (
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            ) : (
              <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
