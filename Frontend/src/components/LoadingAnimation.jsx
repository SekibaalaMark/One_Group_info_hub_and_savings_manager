import React, { useEffect, useState } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 3000); // Animation will last for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="aits-animation">
        <span className="letter pulse">M</span>
        <span className="letter pulse">o</span>
        <span className="letter pulse">b</span>
        <span className="letter pulse">i</span>
        <span className="letter pulse">l</span>
        <span className="letter pulse">e</span>
        <span className="letter pulse">C</span>
        <span className="letter pulse">D</span>
        <span className="letter pulse">O</span>
        <span className="letter pulse">-</span>
        <span className="letter pulse">H</span>
        <span className="letter pulse">e</span>
        <span className="letter pulse">a</span>
        <span className="letter pulse">l</span>
        <span className="letter pulse">t</span>
        <span className="letter pulse">h</span>
      </div>
      <div className="subtitle">
        MobileCDO-Health
      </div>
    </div>
  );
};

export default LoadingAnimation; 