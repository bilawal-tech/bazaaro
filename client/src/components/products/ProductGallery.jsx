import { useCallback, useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiZoomIn } from 'react-icons/fi';

// Product ki images: bari image, neeche thumbnails.
// - Mouse ke saath chalne wala hover zoom (desktop)
// - Image par click/tap karo to poori screen wala viewer (arrow keys, Esc, swipe ke bajaye buttons)
// Parent isay `key` deta hai (product + color + size), taake variant badalte hi
// gallery dobara shuru ho aur pehli image us variant ki dikhe.
function ProductGallery({ images, name, toUrl }) {
  // Images {url} object bhi ho sakti hain aur string bhi. Same URL dobara na dikhe.
  const list = [];
  const seen = new Set();
  for (const img of images) {
    const src = toUrl(img);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    list.push(src);
  }
  if (list.length === 0) list.push('/placeholder.png');

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const current = Math.min(active, list.length - 1);
  const count = list.length;

  const step = useCallback(
    (dir) => setActive((i) => (Math.min(i, count - 1) + dir + count) % count),
    [count]
  );

  // Viewer khula ho to: Esc band kare, arrows se aage peeche, peeche ka scroll band
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, step]);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  const onError = (e) => {
    e.target.onerror = null;
    e.target.src = '/placeholder.png';
  };

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseMove={onMove}
        aria-label="Open image viewer"
        className="group relative flex aspect-square w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-xl border border-line bg-surface"
      >
        <img
          src={list[current]}
          alt={name}
          onError={onError}
          style={{ transformOrigin: origin }}
          className={`h-full w-full object-contain transition-transform duration-150 ${
            hover ? 'md:scale-[2]' : 'scale-100'
          }`}
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink-soft shadow-sm md:hidden">
          <FiZoomIn size={14} /> Tap to zoom
        </span>
      </button>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {list.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Image ${idx + 1} of ${count}`}
              aria-current={idx === current}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                idx === current ? 'border-brand-700' : 'border-line hover:border-brand-400'
              }`}
            >
              <img src={src} alt="" onError={onError} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} images`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"
          >
            <FiX size={22} />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                aria-label="Previous image"
                className="absolute left-3 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25 sm:left-6"
              >
                <FiChevronLeft size={26} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                aria-label="Next image"
                className="absolute right-3 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25 sm:right-6"
              >
                <FiChevronRight size={26} />
              </button>
            </>
          )}

          <img
            src={list[current]}
            alt={name}
            onError={onError}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />

          {count > 1 && (
            <span className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {current + 1} / {count}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
