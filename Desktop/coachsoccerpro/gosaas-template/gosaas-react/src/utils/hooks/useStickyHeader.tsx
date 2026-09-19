import { useEffect, useState, useMemo } from "react";

export const useStickyHeader = (threshold = 100, delay = 100) => {
  const [isSticky, setIsSticky] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  const throttledHandleScroll = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let inThrottle = false;

    return () => {
      const currentScrollY = window.scrollY;
      setLastScrollY(currentScrollY);

      if (!inThrottle) {
        setIsSticky(currentScrollY > threshold);
        inThrottle = true;

        timeoutId = setTimeout(() => {
          inThrottle = false;
          // Final check after throttle delay
          setIsSticky(window.scrollY > threshold);
        }, delay);
      }
    };
  }, [threshold, delay]);

  useEffect(() => {
    // Initial check
    setIsSticky(window.scrollY > threshold);
    
    window.addEventListener("scroll", throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
    };
  }, [throttledHandleScroll, threshold]);

  return { isSticky };
};