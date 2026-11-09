import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const quickLinks = [
  { label: 'Home',    path: '/'        },
  { label: 'Shop',    path: '/shop'    },
  { label: 'Cart',    path: '/cart'    },
  { label: 'Orders',  path: '/orders'  },
];

const socialLinks = [
  { icon: <FiGithub size={18} />,    href: 'https://github.com'    },
  { icon: <FiTwitter size={18} />,   href: 'https://twitter.com'    },
  { icon: <FiInstagram size={18} />, href: 'https://instagram.com' },
];

const contactInfo = [
  { icon: <FiMail size={14} />,   text: 'support@zillionmall.com' },
  { icon: <FiPhone size={14} />,  text: '+92 300 1234567'      },
  { icon: <FiMapPin size={14} />, text: 'Lahore, Pakistan'     },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1B4332] text-slate-200 mt-auto border-t border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* ── Brand Unit ── */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-black tracking-tight inline-flex items-center gap-2 select-none">
              <span className="text-2xl">🛍️</span>
              <span className="font-extrabold tracking-tight text-white">ZillionMall</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-300 font-medium max-w-sm">
              Pakistan ka best online ecommerce store. Quality products — fast delivery.
            </p>

            {/* Social Links — Hovering state turns into premium Coral/Orange (#F4A261) */}
            <div className="flex gap-3 pt-1">
              {socialLinks.map((social, index) => (
                <a 
                  key={index} 
                  href={social.href} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-9 h-9 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center transition duration-300 text-slate-300 hover:text-white hover:bg-[#F4A261] hover:border-[#F4A261] shadow-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 border-l-2 border-[#F4A261] pl-3">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path} 
                    className="text-sm font-bold text-slate-300 hover:text-[#F4A261] hover:translate-x-1.5 transform transition duration-200 inline-block"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 border-l-2 border-[#F4A261] pl-3">
              Contact Us
            </h3>
            <ul className="space-y-3.5">
              {contactInfo.map((info, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-slate-300 font-bold">
                  <span className="text-[#F4A261] p-1.5 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                    {info.icon}
                  </span>
                  {info.text}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar credits styling */}
      <div className="border-t border-white/10 bg-black/20 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-wide">© {currentYear} ZillionMall — All rights reserved</p>
          <p className="text-xs font-black text-slate-200 tracking-wide">Built with ❤️ by Bilawal Azeem</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;