import { Link } from 'react-router-dom';
import { LogoMark } from '../components/common/Logo';

function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <LogoMark size={48} />
      <p className="mt-6 text-sm font-semibold text-brand-700">Error 404</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Go to home</Link>
        <Link to="/shop" className="btn-secondary">Browse the shop</Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
