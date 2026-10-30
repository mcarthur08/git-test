// The tab bar of the character editor. Only one group of options shows at a time, so the character stays in view
// while it is dressed. Arrow keys, Home and End move between the tabs.
export default function EditorTabs({ tabs, active, onChange }) {
  const onKey = e => {
    const i = tabs.findIndex(t => t.id === active);
    const next = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1
    }[e.key];
    if (next === undefined) {
      return;
    }
    e.preventDefault();
    onChange(tabs[next].id);
    document.getElementById("etab-" + tabs[next].id)?.focus();
  };
  return (
    <div className="etabs" role="tablist" aria-label="Customize your character" onKeyDown={onKey}>
      {tabs.map(t => (
        <button
          key={t.id}
          id={"etab-" + t.id}
          role="tab"
          aria-selected={active === t.id}
          aria-controls="epanel"
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
