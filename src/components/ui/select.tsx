"use client";

import * as React from "react";

/* ------------------------------------------------------------------ */
/*  Context so Trigger / Content / Item can share value + onChange    */
/* ------------------------------------------------------------------ */

type SelectContextValue = {
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  placeholder?: string;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within <Select>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Root                                                              */
/* ------------------------------------------------------------------ */

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
};

function Select({ value = "", onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const handleChange = React.useCallback(
    (v: string) => {
      onValueChange?.(v);
      setOpen(false);
    },
    [onValueChange]
  );

  return (
    <SelectContext.Provider
      value={{ value, onValueChange: handleChange, open, setOpen }}
    >
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Trigger                                                           */
/* ------------------------------------------------------------------ */

type SelectTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
};

function SelectTrigger({ className = "", children, ...props }: SelectTriggerProps) {
  const { open, setOpen } = useSelectContext();
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={[
        "flex h-10 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
      <svg
        className="ml-2 h-4 w-4 shrink-0 opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Value (shows current selection or placeholder)                    */
/* ------------------------------------------------------------------ */

type SelectValueProps = {
  placeholder?: string;
};

function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelectContext();
  return (
    <span className={value ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>
      {value || placeholder || "Select…"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Content (dropdown list)                                           */
/* ------------------------------------------------------------------ */

type SelectContentProps = {
  children: React.ReactNode;
  className?: string;
};

function SelectContent({ children, className = "" }: SelectContentProps) {
  const { open, setOpen } = useSelectContext();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="listbox"
      className={[
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Item                                                              */
/* ------------------------------------------------------------------ */

type SelectItemProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

function SelectItem({ value, children, className = "" }: SelectItemProps) {
  const { value: selected, onValueChange } = useSelectContext();
  const isSelected = selected === value;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => onValueChange(value)}
      className={[
        "relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none",
        "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        isSelected ? "bg-[var(--secondary)] font-medium" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
