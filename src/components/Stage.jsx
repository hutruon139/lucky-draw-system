import React, { useEffect, useState } from "react";

// Design size of every screen; the stage is scaled to fit the window without cropping.
export const STAGE_WIDTH = 2816;
export const STAGE_HEIGHT = 1536;
const fit = () => Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);

export default function Stage({ children, onClick }) {
  const [scale, setScale] = useState(fit);
  useEffect(() => {
    const onResize = () => setScale(fit());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black">
      <div className="relative" style={{ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }}>
        <div className="stage" onClick={onClick}
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
