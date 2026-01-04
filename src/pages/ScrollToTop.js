import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const key = location.key || location.pathname;
    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(`scroll:${key}`);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!Number.isNaN(y)) {
          window.scrollTo(0, y);
          return;
        }
      }
    }
    window.scrollTo(0, 0);
  }, [location.key, location.pathname, navigationType]);

  useEffect(() => {
    const handleScroll = () => {
      const key = location.key || location.pathname;
      const y = window.scrollY || window.pageYOffset || 0;
      sessionStorage.setItem(`scroll:${key}`, String(y));
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key, location.pathname]);

  return null;
}
