import { useState, useEffect } from "react";

/**
 * Custom hook to dynamically determine preview count based on screen width.
 * - < 1536px (including lg: 1024px and xl: 1280px): 5 items
 * - >= 1536px (2xl: 1536px, 3xl: 1920px, 4xl: 2560px): 6 items
 */
export const usePreviewCount = () => {
  const [previewCount, setPreviewCount] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1536 ? 6 : 5;
    }
    return 5;
  });

  useEffect(() => {
    const handleResize = () => {
      setPreviewCount(window.innerWidth >= 1536 ? 6 : 5);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return previewCount;
};

export default usePreviewCount;
