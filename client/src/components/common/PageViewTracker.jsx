import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../../services/api';

// Har page badalne par ek chhota "page_view" event backend ko bhejta hai (Kafka clickstream).
// Fail ho to user ko kuch nahi dikhta.
function getSessionId() {
  try {
    let id = sessionStorage.getItem('sid');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('sid', id);
    }
    return id;
  } catch {
    return null;
  }
}

export default function PageViewTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const match = pathname.match(/^\/product\/([a-f0-9]{24})$/i);
    API.post('/events', {
      type: match ? 'product_view' : 'page_view',
      sessionId: getSessionId(),
      path: pathname + search,
      productId: match ? match[1] : undefined,
      query: new URLSearchParams(search).get('search') || undefined,
      referrer: document.referrer || undefined,
    }).catch(() => {});
  }, [pathname, search]);

  return null;
}
