// utils/hooks/useAosInit.ts
import { useEffect } from "react";
import Aos from "aos";

export const useAosInit = (
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  useEffect(() => {
    // Initialize AOS
    Aos.init({ once: true });

    // Fake loading timer
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setIsLoading, Aos]);
};
