// Pagination: 1 … 4 5 6 … 20 (saare page numbers nahi dikhata)
function getPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('gap-start');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('gap-end');
  pages.push(total);
  return pages;
}

function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5 border-t border-line pt-6">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} className="btn-secondary btn-sm">
        Previous
      </button>

      {getPageList(page, totalPages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="px-1 text-ink-faint">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`h-9 min-w-[36px] rounded-lg px-2 text-sm font-medium transition ${
              p === page ? 'bg-brand-800 text-white' : 'border border-line bg-white text-ink hover:border-brand-700'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} className="btn-secondary btn-sm">
        Next
      </button>
    </nav>
  );
}

export default Pagination;
