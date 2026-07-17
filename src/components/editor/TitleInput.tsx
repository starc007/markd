import { useEffect, useRef } from "react";

export function TitleInput({
  title,
  focusNonce,
  onEnter,
  onRename,
}: {
  title: string;
  focusNonce?: number;
  onEnter: () => void;
  onRename: (name: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusNonce === undefined) return;
    ref.current?.focus();
    ref.current?.select();
  }, [focusNonce]);

  const submit = () => {
    const value = ref.current?.value.trim();
    if (value && value !== title) onRename(value);
    else if (ref.current) ref.current.value = title;
  };

  return (
    <input
      ref={ref}
      defaultValue={title}
      placeholder="Untitled"
      className="w-full bg-transparent text-[30px] font-[680] tracking-[-0.025em] text-ink outline-none placeholder:text-faint"
      onBlur={submit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
          onEnter();
        } else if (event.key === "Escape") {
          event.preventDefault();
          if (ref.current) ref.current.value = title;
          event.currentTarget.blur();
        }
      }}
    />
  );
}
