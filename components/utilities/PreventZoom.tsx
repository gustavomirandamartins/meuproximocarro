'use client';

import { useEffect } from 'react';

export function PreventZoom() {
  useEffect(() => {
    // Prevent iOS Safari pinch gesture
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    // Prevent multi-touch pinch to zoom
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('gesturestart', handleGestureStart, { passive: false });
    document.addEventListener('gesturechange', handleGestureStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('gesturechange', handleGestureStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return null;
}
