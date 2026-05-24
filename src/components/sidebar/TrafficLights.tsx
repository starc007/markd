export function TrafficLights() {
  return (
    <div
      className="relative mb-7 flex h-[38px] items-center gap-3.5"
      data-tauri-drag-region
    >
      <span className="h-[17px] w-[17px] rounded-full bg-[#ff5f57]" />
      <span className="h-[17px] w-[17px] rounded-full bg-[#febc2e]" />
      <span className="h-[17px] w-[17px] rounded-full bg-[#28c840]" />
    </div>
  );
}
