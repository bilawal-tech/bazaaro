// Brand spinner. Poori screen ke bajaye 50vh leta hai taake page ke andar (e.g. products grid) bhi theek lage.
function Loader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700" />
    </div>
  );
}

export default Loader;
