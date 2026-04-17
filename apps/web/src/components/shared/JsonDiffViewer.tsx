interface JsonDiffViewerProps {
  changes: Record<string, { old: unknown; new: unknown }> | null | undefined;
  className?: string;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

export function JsonDiffViewer({ changes, className }: JsonDiffViewerProps) {
  if (!changes || Object.keys(changes).length === 0) {
    return (
      <div className={`bg-slate-900 rounded-xl p-5 ${className ?? ''}`}>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">Degisiklik detayi bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 rounded-xl overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700">
        <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400 select-none leading-none">
          data_object
        </span>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Teknik Degisiklik Detayi (JSON Diff)
        </h4>
      </div>

      {/* Content */}
      <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto">
        <div className="text-slate-400 dark:text-slate-500">{'{'}</div>
        {Object.entries(changes).map(([field, diff], index) => (
          <div key={field} className="ml-4">
            {/* Field name */}
            <span className="text-blue-400">&quot;{field}&quot;</span>
            <span className="text-slate-500 dark:text-slate-400">: {'{'}</span>

            {/* Old value */}
            <div className="ml-4">
              <span className="text-slate-500 dark:text-slate-400">&quot;old&quot;: </span>
              <span className="text-red-400 bg-red-500/10 px-1 rounded">
                {formatValue(diff.old)}
              </span>
              <span className="text-slate-600 dark:text-slate-300">,</span>
            </div>

            {/* New value */}
            <div className="ml-4">
              <span className="text-slate-500 dark:text-slate-400">&quot;new&quot;: </span>
              <span className="text-emerald-400 bg-emerald-500/10 px-1 rounded">
                {formatValue(diff.new)}
              </span>
            </div>

            <span className="text-slate-500 dark:text-slate-400">
              {'}'}
              {index < Object.keys(changes).length - 1 ? ',' : ''}
            </span>
          </div>
        ))}
        <div className="text-slate-400 dark:text-slate-500">{'}'}</div>
      </div>
    </div>
  );
}
