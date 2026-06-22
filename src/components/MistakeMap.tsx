export interface MistakeArea {
  domain: string;
  skill: string;
  missed: number;
}

interface MistakeMapProps {
  areas: MistakeArea[];
  title: string;
  description: string;
  emptyMessage: string;
}

export function MistakeMap({ areas, title, description, emptyMessage }: MistakeMapProps) {
  const groups = new Map<string, MistakeArea[]>();
  areas.forEach((area) => groups.set(area.domain, [...(groups.get(area.domain) || []), area]));
  const grouped = [...groups.entries()]
    .map(([domain, skills]) => ({ domain, skills: [...skills].sort((a, b) => b.missed - a.missed), total: skills.reduce((sum, skill) => sum + skill.missed, 0) }))
    .sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...grouped.map((group) => group.total));

  return (
    <section className="analytics-panel rounded-lg border border-slate-200 p-5 dark:border-slate-800">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Category / subcategory</span>
      </div>

      {grouped.length ? (
        <div className="mt-6 space-y-6">
          {grouped.map((group) => (
            <div key={group.domain} className="mistake-category">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold">{group.domain}</p>
                <span className="rounded-md border border-rose-400/25 bg-rose-950/20 px-2 py-1 text-xs font-semibold text-rose-200">{group.total} missed</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-rose-400" style={{ width: `${(group.total / max) * 100}%` }} /></div>
              <div className="mt-4 space-y-3 border-l border-slate-700 pl-4">
                {group.skills.map((skill) => (
                  <div key={skill.skill} className="grid grid-cols-[minmax(0,1fr)_96px_28px] items-center gap-3 text-sm">
                    <span className="truncate text-slate-300" title={skill.skill}>{skill.skill}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-teal-400" style={{ width: `${(skill.missed / max) * 100}%` }} /></div>
                    <span className="text-right text-xs font-semibold text-teal-300">{skill.missed}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="mt-6 rounded-md border border-teal-400/20 bg-teal-950/20 p-4 text-sm text-teal-100">{emptyMessage}</p>}
    </section>
  );
}
