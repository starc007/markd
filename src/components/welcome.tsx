import { HugeiconsIcon } from "@hugeicons/react";
import {
  EditIcon,
  CommandIcon,
  FileEditIcon,
} from "@hugeicons/core-free-icons";
import { useNoteStore } from "../stores/noteStore";
import { useUIStore } from "../stores/uiStore";
import { Button } from "./ui";

const Welcome = () => {
  const { createNote, loadNote } = useNoteStore();
  const { toggleCommandPalette } = useUIStore();

  const handleNewNote = async () => {
    const note = await createNote("Untitled");
    if (note) {
      loadNote(note.id);
    }
  };

  const shortcuts = [
    { keys: ["⌘", "N"], description: "Create a new note" },
    { keys: ["⌘", "⇧", "N"], description: "Create a sticky note" },
    { keys: ["⌘", "K"], description: "Open command palette" },
    { keys: ["⌘", "⇧", "T"], description: "Open settings" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-background">
      <div className="max-w-2xl w-full px-8 py-12">
        {/* Main Welcome Section */}
        <div className="text-center mb-12">
          <div className="mb-6 flex items-center justify-center">
            <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center shadow-sm">
              <div className="w-5 h-5 bg-white rounded-[4px]"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Welcome to Draft
          </h1>
          <p className="text-muted-foreground mb-2">
            Not a workspace. Not a second brain.
          </p>
          <p className="text-muted-foreground mb-8 font-bold text-lg">
            Just a fast, private place to write.
          </p>
          <Button onClick={handleNewNote}>
            <HugeiconsIcon
              icon={EditIcon}
              size={20}
              color="currentColor"
              strokeWidth={1.5}
            />
            Create your first note
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={handleNewNote}
            className="p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <HugeiconsIcon
                  icon={EditIcon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>
              <h3 className="font-semibold text-foreground">New Note</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Start writing a new note
            </p>
          </button>

          <button
            onClick={toggleCommandPalette}
            className="p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <HugeiconsIcon
                  icon={CommandIcon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>
              <h3 className="font-semibold text-foreground">Command Palette</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Quick actions and navigation
            </p>
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t border-border pt-8">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
              >
                <span className="text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <kbd
                      key={keyIndex}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium text-muted-foreground bg-secondary border border-border rounded"
                    >
                      {key === "⌘" ? (
                        <HugeiconsIcon
                          icon={CommandIcon}
                          size={14}
                          color="currentColor"
                          strokeWidth={1.5}
                        />
                      ) : (
                        key
                      )}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
