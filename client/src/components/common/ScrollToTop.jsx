import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Page badalne par (route ka path badle) scroll upar le jao. React Router khud
// scroll reset nahi karta, isliye naya page pichle page ki scroll position par khulta tha.
// Sirf pathname par chalta hai: /shop par filter/search badalne se page upar nahi uchhalta.
//
// index.css mein html par scroll-behavior: smooth hai, is liye plain scrollTo(0, 0) aahista
// oopar jata tha aur naya page neeche se shuru hota nazar aata tha. behavior: 'instant' us
// ko override karta hai, aur useLayoutEffect paint se pehle chalta hai, to purani jagah
// ek frame ke liye bhi nahi dikhti.
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default ScrollToTop;
