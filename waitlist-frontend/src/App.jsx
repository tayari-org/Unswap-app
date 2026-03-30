import React, { useState, useEffect } from 'react';
import Waitlist from './pages/Waitlist.jsx';
import PartnerPropertyForm from './pages/PartnerPropertyForm.jsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (currentPath === '/partner') {
    return <PartnerPropertyForm />;
  }

  return <Waitlist />;
}
