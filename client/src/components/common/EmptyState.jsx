// Khali halat: icon, saaf title, ek line wazahat aur agla qadam (button/link).
// fullPage: poora page khali ho (cart, orders). Warna chhota dabba jo kisi section ke andar baithe.
function EmptyState({ icon, title, text, children, fullPage = false }) {
  const body = (
    <>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-800">
        {icon}
      </span>
      <h2 className={`mt-5 font-semibold text-ink ${fullPage ? 'text-2xl' : 'text-lg'}`}>{title}</h2>
      {text && <p className="mt-2 max-w-sm text-ink-soft">{text}</p>}
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </>
  );

  if (fullPage) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        {body}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-xl border border-line bg-surface px-4 py-14 text-center">
      {body}
    </div>
  );
}

export default EmptyState;
