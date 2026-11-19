import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Page badalne par (route ka path badle) scroll upar le jao. React Router khud
// scroll reset nahi karta, isliye naya page pichle page ki scroll position par khulta tha.
// Sirf pathname par chalta hai: /shop par filter/search badalne se page upar nahi uchhalta.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
