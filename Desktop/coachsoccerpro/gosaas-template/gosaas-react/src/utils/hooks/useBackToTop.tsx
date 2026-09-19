import { useEffect, useState, useCallback, useRef } from "react";

export const useBackToTop = (threshold = 300, delay = 200) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef<number>(0);
  const isThrottled = useRef<boolean>(false);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    lastScrollY.current = currentScrollY;

    if (!isThrottled.current) {
      setIsVisible(currentScrollY > threshold);
      isThrottled.current = true;

      timeoutRef.current = setTimeout(() => {
        isThrottled.current = false;
        // Check again after delay to catch any missed scrolls
        if (lastScrollY.current !== currentScrollY) {
          setIsVisible(lastScrollY.current > threshold);
        }
      }, delay);
    }
  }, [threshold, delay]);

  useEffect(() => {
    // Initial check
    setIsVisible(window.scrollY > threshold);
    
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll, threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { isVisible, scrollToTop };
};