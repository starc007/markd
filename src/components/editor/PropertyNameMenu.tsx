import {
  CalendarDays,
  CaseSensitive,
  Check,
  CheckSquare,
  ChevronDown,
  Hash,
  Link2,
  List,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";
import {
  MorphPopover,
  MorphPopoverContent,
  MorphPopoverTrigger,
} from "@/components/motion/popover-morph";
import type { PropertyType } from "@/lib/frontmatter";

const PROPERTY_TYPES = [
  { type: "text", label: "Text", icon: CaseSensitive },
  { type: "number", label: "Number", icon: Hash },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "date", label: "Date", icon: CalendarDays },
  { type: "url", label: "URL", icon: Link2 },
  { type: "list", label: "List", icon: List },
] satisfies Array<{
  type: PropertyType;
  label: string;
  icon: LucideIcon;
}>;

export function PropertyNameMenu({
  name,
  type,
  open,
  invalid,
  errorMessage,
  onOpenChange,
  onNameChange,
  onNameSubmit,
  onTypeChange,
}: {
  name: string;
  type: PropertyType;
  open: boolean;
  invalid: boolean;
  errorMessage: string;
  onOpenChange: (open: boolean) => void;
  onNameChange: (name: string) => void;
  onNameSubmit: () => void;
  onTypeChange: (type: PropertyType) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const TypeIcon =
    PROPERTY_TYPES.find((option) => option.type === type)?.icon ?? CaseSensitive;

  return (
    <MorphPopover open={open} onOpenChange={onOpenChange} className="w-40 shrink-0">
      <MorphPopoverTrigger>
        <button
          ref={triggerRef}
          type="button"
          aria-label={name ? `Edit ${name} property` : "Name property"}
          className="flex h-9 w-full items-center gap-2 rounded-md bg-transparent px-2 text-left text-[12.5px] text-faint outline-none transition-[color,box-shadow,scale] duration-100 hover:text-ink focus-visible:ring-1 focus-visible:ring-line active:scale-[0.96]"
        >
          <TypeIcon size={14} strokeWidth={1.8} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {name || "Property name"}
          </span>
          <ChevronDown
            size={11}
            strokeWidth={2}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </button>
      </MorphPopoverTrigger>
      <MorphPopoverContent
        align="start"
        sideOffset={4}
        radius={10}
        className="w-56 bg-bg p-1.5"
      >
        <div className="pb-1.5">
          <input
            ref={nameRef}
            data-autofocus
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onNameSubmit();
              }
            }}
            aria-invalid={invalid || undefined}
            aria-label="Property name"
            placeholder="Property name"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            title={invalid ? errorMessage : undefined}
            className="h-9 w-full rounded-lg bg-sunken px-2.5 text-[12.5px] text-ink outline-none transition-[box-shadow,background-color] placeholder:text-faint focus:bg-panel focus:ring-1 focus:ring-line aria-invalid:ring-danger"
          />
        </div>
        <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
          Type
        </p>
        <div className="grid grid-cols-2 gap-0.5">
          {PROPERTY_TYPES.map((option) => (
            <button
              key={option.type}
              type="button"
              role="menuitem"
              onClick={() => {
                onTypeChange(option.type);
                if (!name.trim()) {
                  nameRef.current?.focus();
                  return;
                }
                triggerRef.current?.focus();
                onOpenChange(false);
              }}
              className="flex h-8 items-center gap-2 rounded-md px-2 text-left text-[12px] text-muted transition-colors duration-100 hover:bg-hover hover:text-ink focus-visible:bg-hover focus-visible:text-ink focus-visible:outline-none"
            >
              <option.icon size={13} strokeWidth={1.8} className="shrink-0" />
              <span className="flex-1">{option.label}</span>
              {type === option.type && (
                <Check size={11} strokeWidth={2.2} className="shrink-0" />
              )}
            </button>
          ))}
        </div>
      </MorphPopoverContent>
    </MorphPopover>
  );
}
