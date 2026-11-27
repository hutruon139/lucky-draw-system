import React, { useLayoutEffect, useRef } from "react";

// Single-line text that shrinks to fit maxWidth (design px) instead of overflowing its card.
export default function FitText({ text, size, maxWidth, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    let active = true;
    const fit = () => {
      const node = ref.current;
      if (!active || !node) return;
      node.style.fontSize = `${size}px`;
      node.style.fontSize = `${size * Math.min(1, maxWidth / node.offsetWidth)}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    return () => { active = false; };
  }, [text, size, maxWidth]);
  return <span ref={ref} className={`fit-text ${className}`}>{text}</span>;
}
