"use client";

type Tab = "map" | "places";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  onSave: () => void;
  saving: boolean;
}

export default function BottomNav({ active, onChange, onSave, saving }: Props) {
  return (
    <nav
      className="flex items-center border-t border-zinc-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <NavButton
        label="Karta"
        active={active === "map"}
        onClick={() => onChange("map")}
        icon={<MapIcon />}
      />

      {/* Center save button */}
      <div className="flex flex-1 flex-col items-center gap-1 py-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
          aria-label="Spara plats"
        >
          {saving ? <SpinnerIcon /> : <PlusIcon />}
        </button>
        <span className="text-[10px] font-medium text-zinc-400">Spara</span>
      </div>

      <NavButton
        label="Mina platser"
        active={active === "places"}
        onClick={() => onChange("places")}
        icon={<ListIcon />}
      />
    </nav>
  );
}

function NavButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
        active ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MapIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
