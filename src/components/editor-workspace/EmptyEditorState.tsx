import { FileEditIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui";
import { Board } from "./Board";

export function EmptyEditorState({ onCreateNote }: { onCreateNote: () => void }) {
  return (
    <Board title="No file selected" icon={FileEditIcon}>
      <div className="grid gap-3">
        <p>Create a note to start writing in the file-first workspace.</p>
        <Button variant="primary" onClick={onCreateNote}>
          New note
        </Button>
      </div>
    </Board>
  );
}
