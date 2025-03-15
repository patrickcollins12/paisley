import React, { useState, useEffect, useRef } from 'react';

export function ScrollableSidebar({ children, className = "" }) {
  const divRef = useRef(null);
  const [divHeight, setDivHeight] = useState(0);

  const updateHeight = () => {
    if (divRef.current) {
      const topPosition = divRef.current.getBoundingClientRect().top;
      setDivHeight(window.innerHeight - topPosition - 50);
    }
  };

  useEffect(() => {
    updateHeight(); // Update height on initial render
    const handleResize = () => {
      updateHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={divRef}
      style={{ height: `${divHeight}px` }}
      className="overflow-auto inner-scroll-area overscroll-contain pr-1"
    >
      <div className={`flex justify-end mb-5 ${className}`}>

        {children}
      </div>
    </div>
  );
}

