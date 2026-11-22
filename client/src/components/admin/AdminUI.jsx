// Admin pages ka shared look: saaf white/slate, kam rang, data par focus.

export function AdminPage({ children, narrow = false }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`mx-auto px-4 py-8 sm:px-6 ${narrow ? 'max-w-5xl' : 'max-w-6xl'}`}>{children}</div>
    </div>
  );
}

export function AdminHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-sm text-slate-500">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

export function Panel({ title, action, children, flush = false }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

export function DataTable({ columns, children, minWidth = 640 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth: minWidth || undefined }}>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
            {columns.map((c, i) => (
              <th key={c.label || i} className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''} ${c.hideOnMobile ? 'hidden sm:table-cell' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ cols, text }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-sm text-slate-500">{text}</td>
    </tr>
  );
}
