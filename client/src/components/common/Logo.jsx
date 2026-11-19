import { Link } from 'react-router-dom';

// Bazaaro ka logo: monogram "B" (gehre hare square mein) + orange nuqta.
// Favicon (public/favicon.svg) bhi yehi shakal hai.
//
// Props:
//   variant  'full' (monogram + naam) ya 'mark' (sirf monogram)
//   tone     'light' (safed background par) ya 'dark' (gehre background par, naam safed)
//   size     monogram ki chaudai px mein
export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Bazaaro"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#1B4332" />
      <path
        d="M11.5 8V24M11.5 8H17A4 4 0 0 1 17 16H11.5M11.5 16H18A4 4 0 0 1 18 24H11.5"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.5" cy="7.5" r="2.2" fill="#F4A261" />
    </svg>
  );
}

function Logo({ variant = 'full', tone = 'light', size = 32, to = '/', onClick }) {
  const nameColor = tone === 'dark' ? 'text-white' : 'text-brand-800';

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label="Bazaaro home"
      className="inline-flex select-none items-center gap-2.5"
    >
      {/* Gehre background par monogram ke gird halka safed ring, taake gum na ho */}
      <span className={tone === 'dark' ? 'rounded-lg ring-1 ring-white/20' : ''}>
        <LogoMark size={size} />
      </span>
      {variant === 'full' && (
        <span className={`text-xl font-bold tracking-tight ${nameColor}`}>Bazaaro</span>
      )}
    </Link>
  );
}

export default Logo;
