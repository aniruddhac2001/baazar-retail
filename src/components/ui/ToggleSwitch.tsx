interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex h-8 w-14 items-center rounded-full p-1 transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
    >
      <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}
