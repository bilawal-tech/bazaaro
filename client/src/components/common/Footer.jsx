import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiTwitter, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import Logo from './Logo';

const shopLinks = [
  { label: 'Shop all',    path: '/shop' },
  { label: 'New Arrivals', path: '/shop?sort=-createdAt' },
  { label: 'Cart',        path: '/cart' },
  { label: 'My orders',   path: '/orders' },
];

// Social links env se aate hain (client/.env, dekho .env.example).
// Jo set nahi hota wo dikhai nahi deta, taake nakli ya generic link customers ko na dikhe.
const socialLinks = [
  { label: 'Instagram', icon: <FiInstagram size={18} />, href: import.meta.env.VITE_INSTAGRAM_URL },
  { label: 'Facebook',  icon: <FiFacebook size={18} />,  href: import.meta.env.VITE_FACEBOOK_URL },
  { label: 'X',         icon: <FiTwitter size={18} />,   href: import.meta.env.VITE_X_URL },
].filter((s) => s.href);

// Contact details bhi env se (VITE_SUPPORT_EMAIL, VITE_SUPPORT_PHONE).
const contactInfo = [
  import.meta.env.VITE_SUPPORT_EMAIL && { icon: <FiMail size={16} />,  text: import.meta.env.VITE_SUPPORT_EMAIL },
  import.meta.env.VITE_SUPPORT_PHONE && { icon: <FiPhone size={16} />, text: import.meta.env.VITE_SUPPORT_PHONE },
  { icon: <FiMapPin size={16} />, text: 'Lahore, Pakistan' },
].filter(Boolean);

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-brand-900 text-brand-100">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">

          {/* Brand */}
          <div className="space-y-4">
            <Logo tone="dark" />
            <p className="max-w-sm text-sm leading-relaxed text-brand-200">
              An online general store for everyday products. Cash on delivery available.
            </p>

            {socialLinks.length > 0 && (
              <div className="flex gap-2 pt-1">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-brand-100 transition hover:border-accent-400 hover:bg-accent-400 hover:text-brand-950"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Shop</h3>
            <ul className="space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-brand-200 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Contact</h3>
            <ul className="space-y-3">
              {contactInfo.map((info) => (
                <li key={info.text} className="flex items-center gap-3 text-sm text-brand-200">
                  <span className="text-accent-400">{info.icon}</span>
                  {info.text}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-brand-300 md:flex-row">
          <p>© {currentYear} Bazaaro. All rights reserved.</p>
          <p>Built by Bilawal Azeem</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
