import { useNoteStore } from "../../stores/noteStore";

export function TitleBar() {
  const { currentNote, isSaving, ui, toggleSidebar, toggleFocusMode } =
    useNoteStore();

  return (
    <header className="title-bar" data-tauri-drag-region>
      {/* Traffic lights spacer (macOS) */}
      <div className="traffic-lights-spacer" />

      {/* Left section */}
      <div className="title-bar-left">
        <button
          onClick={toggleSidebar}
          className="title-bar-button"
          title="Toggle sidebar (⌘\\)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Center section - Note title */}
      <div className="title-bar-center">
        {currentNote ? (
          <div className="title-bar-title">
            <span className="title-text">
              {currentNote.title || "Untitled"}
            </span>
            {isSaving && <span className="save-status">Saving...</span>}
          </div>
        ) : (
          <span className="title-placeholder">Draft</span>
        )}
      </div>

      {/* Right section */}
      <div className="title-bar-right">
        <button
          onClick={toggleFocusMode}
          className={`title-bar-button ${ui.focusMode ? "active" : ""}`}
          title="Focus mode (⌘⇧F)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
