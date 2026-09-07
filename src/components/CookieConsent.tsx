import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('kalmat-cookie-consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('kalmat-cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('kalmat-cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-line bg-charcoal p-5 sm:p-6">
      <div className="kx-container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs font-light leading-relaxed text-ivory sm:max-w-2xl">
          We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies. Read our{' '}
          <Link to="/privacy-policy" className="text-gold-light underline hover:text-gold">
            Privacy Policy
          </Link>{' '}
          to learn more.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
  onClick={decline}
  className="border border-ivory px-5 py-2.5 text-[10px] uppercase text-ivory transition-colors hover:text-gold-light"
  style={{ letterSpacing: '0.2em' }}
>
  Decline
</button>
          <button
            onClick={accept}
            className="bg-gold px-5 py-2.5 text-[10px] uppercase text-charcoal transition-colors hover:bg-gold-light"
            style={{ letterSpacing: '0.2em' }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
