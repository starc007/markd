import { LogoMark } from "./Logo";
import { GITHUB, VERSION } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-[13px] text-faint sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <LogoMark size={20} id="ft" />
          <span className="text-muted">Markd · v{VERSION}</span>
        </div>
        <div className="flex items-center gap-5">
          <a href={GITHUB} className="transition-colors hover:text-ink">
            GitHub
          </a>
          <a href={`${GITHUB}/blob/main/LICENSE`} className="transition-colors hover:text-ink">
            MIT License
          </a>
          <span>Your notes stay on your disk.</span>
        </div>
      </div>
    </footer>
  );
}
