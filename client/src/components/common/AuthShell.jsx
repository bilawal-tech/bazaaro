import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';

// Login aur Register dono ka common frame: beech mein safed card.
function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-surface px-4 py-10 sm:py-14">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to="/" aria-label="Bazaaro home">
            <LogoMark size={44} />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>

        <div className="card p-6 sm:p-8">{children}</div>

        {footer && <p className="mt-5 text-center text-sm text-ink-soft">{footer}</p>}
      </div>
    </div>
  );
}

export default AuthShell;
