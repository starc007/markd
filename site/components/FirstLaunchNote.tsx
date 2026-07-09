"use client";

export function FirstLaunchNote() {
  return (
    <details className="group mx-auto mt-5 max-w-md text-left">
      <summary className="cursor-pointer list-none text-center font-mono text-[11.5px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-muted-foreground">
        Opening Markd on macOS
        <span className="ml-1 inline-block transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="mt-4 rounded-xl border border-border bg-card/60 p-4 text-[13px] leading-6 text-muted-foreground">
        <p>
          Markd is signed but not yet notarized, so macOS asks to verify it on the
          first launch. Open it once, either way:
        </p>
        <p className="mt-3 font-medium text-foreground">Terminal</p>
        <pre className="mt-1.5 overflow-x-auto rounded-lg bg-background px-3 py-2 font-mono text-[12px] text-fg-soft">
          xattr -dr com.apple.quarantine /Applications/Markd.app
        </pre>
        <p className="mt-3 font-medium text-foreground">Or in Settings</p>
        <p className="mt-1">
          Double-click Markd → click <span className="text-foreground">Done</span> →{" "}
          <span className="text-foreground">System Settings → Privacy &amp; Security</span>{" "}
          → <span className="text-foreground">Open Anyway</span>. macOS remembers it after that.
        </p>
      </div>
    </details>
  );
}
