"use client";

import { useEffect } from "react";

/**
 * Reports this page's document height to a parent window via postMessage
 * whenever it changes, so a WordPress page embedding this app in an
 * <iframe> can auto-resize the iframe instead of showing scrollbars.
 * Pair with /public/embed-resize.js on the WordPress side.
 */
export function IframeHeightReporter() {
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;

    const post = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "oz-railing-visualizer:height", height }, "*");
    };

    post();
    const observer = new ResizeObserver(() => post());
    observer.observe(document.body);
    window.addEventListener("load", post);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", post);
    };
  }, []);

  return null;
}
