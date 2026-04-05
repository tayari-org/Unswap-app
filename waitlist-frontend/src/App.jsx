import React, { useState, useEffect } from 'react';
import Waitlist from './pages/Waitlist.jsx';

import SharePage from './pages/SharePage.jsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);



  if (currentPath === '/share' || currentPath === '/share/') {
    return <SharePage />;
  }

  return <Waitlist />;
}
