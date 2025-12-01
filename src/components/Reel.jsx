import React, { useState, useEffect, useRef } from "react";

let ITEM_HEIGHT = 270;
const REPEAT = 20; // build a longer strip for smooth looping
const DIGITS = Array.from({ length: REPEAT * 10 }, (_, i) => i % 10);

export default function Reel({ targetDigit = 0, spinning, delay = 0 }) {
  const stripRef = useRef(null);
  const tickTimerRef = useRef(null);
  const wasSpinningRef = useRef(false);
  const isInitializedRef = useRef(false);

  function useScreenSize() {
    const [isLG, setIsLG] = useState(false);
    const [isXL, setIsXL] = useState(false);
  
    useEffect(() => {
      const lgQuery = window.matchMedia("(min-width: 1024px)");
      const xlQuery = window.matchMedia("(min-width: 1280px)");
  
      const update = () => {
        setIsLG(lgQuery.matches);
        setIsXL(xlQuery.matches);
      };
  
      update(); // initial
      lgQuery.addEventListener("change", update);
      xlQuery.addEventListener("change", update);
  
      return () => {
        lgQuery.removeEventListener("change", update);
        xlQuery.removeEventListener("change", update);
      };
    }, []);
  
    return { isLG, isXL };
  }

  const { isLG, isXL } = useScreenSize();

  console.log(isXL)

  if (isLG) {
    ITEM_HEIGHT = 270
  } else {
    ITEM_HEIGHT = 400
  }

  useEffect(() => {
    const node = stripRef.current;
    if (!node) return undefined;

    const clearTick = () => {
      if (tickTimerRef.current) {
        clearTimeout(tickTimerRef.current);
        tickTimerRef.current = null;
      }
    };

    const startSpin = () => {
      clearTick();
      // Only reset transform if we're not already spinning (avoid resetting mid-spin)
      if (!wasSpinningRef.current) {
        node.style.transition = "none";
        node.style.animation = "";
        node.style.transform = "translateY(0px)";
      }
      node.classList.add("reel-spin");
      wasSpinningRef.current = true;
      isInitializedRef.current = true;
    };

    const stopSpin = () => {
      // BUG FIX 1: Chỉ chạy stopSpin nếu đã từng được initialized (đã từng spin)
      if (!isInitializedRef.current) {
        return;
      }

      clearTick();

      // Đọc vị trí trong requestAnimationFrame để đảm bảo đọc được khi animation đang chạy :::: đọc được chỗ này
      requestAnimationFrame(() => {
        // Đọc vị trí hiện tại CHÍNH XÁC trong frame này (animation vẫn đang chạy)
        const cs = getComputedStyle(node);
        let currentOffset = 0;

        if (cs.transform && cs.transform !== "none") {
          try {
            const matrix = new DOMMatrixReadOnly(cs.transform);
            currentOffset = matrix.m42;
          } catch (e) {
            const match = cs.transform.match(/translateY\(([^)]+)\)/);
            if (match) {
              currentOffset = parseFloat(match[1]) || 0;
            }
          }
        }

        // Fix chỗ này nè :::: KHÔNG dừng animation ngay, kệ moẹ nó chạy típ
        // Để animation tiếp tục chạy cho đến khi tick bắt đầu
        // chỗ này gây giật lắm

        // Calculate vị trí làm việc từ offset hiện tại
        let finalOffset = currentOffset;

        // Nếu offset = 0 (animation mới bắt đầu hoặc vừa loop), chọn vị trí an toàn
        if (finalOffset === 0 || finalOffset > -ITEM_HEIGHT) {
          const safeIdx = 20 + Math.floor(Math.random() * 20);
          finalOffset = -safeIdx * ITEM_HEIGHT;
        }

        // Calculate current working index từ finalOffset
        let workingIndex = Math.round(-finalOffset / ITEM_HEIGHT);
        while (workingIndex < 0) {
          workingIndex += DIGITS.length;
        }
        workingIndex = workingIndex % DIGITS.length;

        const currentDigit = DIGITS[workingIndex];
        const target = targetDigit % 10;

        // Forward-only steps; add a couple loops for smoother stop
        let stepsRemaining = target - currentDigit;
        if (stepsRemaining < 0) stepsRemaining += 10;
        const extraLoops = 2; // full loops before landing
        stepsRemaining += extraLoops * 10;

        let stepDelay = 60; // start speed
        let slowStep = 8;
        const maxDelay = 320;

        // Hàm tick để quay về target
        const tick = () => {
          // DỪNG animation chỉ khi tick BẮT ĐẦU (không phải ngay khi stopSpin được gọi)
          if (node.classList.contains('reel-spin')) {
            node.classList.remove("reel-spin");
            node.style.animation = "none";
            node.style.transition = "none";
            // Đọc lại vị trí hiện tại sau khi dừng animation
            const cs = getComputedStyle(node);
            if (cs.transform && cs.transform !== "none") {
              try {
                const matrix = new DOMMatrixReadOnly(cs.transform);
                const newOffset = matrix.m42;
                if (newOffset !== 0 && newOffset < -ITEM_HEIGHT) {
                  finalOffset = newOffset;
                  workingIndex = Math.round(-finalOffset / ITEM_HEIGHT);
                  while (workingIndex < 0) {
                    workingIndex += DIGITS.length;
                  }
                  workingIndex = workingIndex % DIGITS.length;
                  // Recalculate stepsRemaining từ vị trí mới
                  const newCurrentDigit = DIGITS[workingIndex];
                  stepsRemaining = target - newCurrentDigit;
                  if (stepsRemaining < 0) stepsRemaining += 10;
                  stepsRemaining += extraLoops * 10;
                }
              } catch (e) {}
            }
            // Freeze tại vị trí hiện tại
            node.style.transform = `translateY(${finalOffset}px)`;
          }

          if (stepsRemaining <= 0) {
            // Tìm chính xác index hiển thị targetDigit
            let targetIndex = workingIndex;
            while (DIGITS[targetIndex % DIGITS.length] !== target) {
              targetIndex += 1;
              if (targetIndex - workingIndex > DIGITS.length) {
                break;
              }
            }

            const displayIndex =
              ((targetIndex % DIGITS.length) + DIGITS.length) % DIGITS.length;

            node.style.transition =
              "transform 380ms cubic-bezier(0.22,1,0.36,1)";
            node.style.transform = `translateY(${
              -displayIndex * ITEM_HEIGHT
            }px)`;
            wasSpinningRef.current = false;
            return;
          }

          workingIndex += 1;
          stepsRemaining -= 1;

          const displayIndex =
            ((workingIndex % DIGITS.length) + DIGITS.length) % DIGITS.length;
          const offset = -displayIndex * ITEM_HEIGHT;

          node.style.transition = `transform ${stepDelay}ms linear`;
          node.style.transform = `translateY(${offset}px)`;

          stepDelay = Math.min(stepDelay + slowStep, maxDelay);
          if (stepDelay > 140) slowStep = 14;
          if (stepDelay > 240) slowStep = 20;

          tickTimerRef.current = setTimeout(tick, stepDelay);
        };

        // Chờ delay trước khi bắt đầu tick (animation CSS vẫn chạy trong thời gian này)
        if (delay > 0) {
          tickTimerRef.current = setTimeout(tick, delay);
        } else {
          tick();
        }
      });
    };

    if (spinning) {
      startSpin();
    } else {
      // Chỉ gọi stopSpin, KHÔNG reset wasSpinningRef ở đây
      stopSpin();
    }

    return clearTick;
  }, [spinning, targetDigit, delay]);


  return (
    <div
      className="reel-window border-[8px] border-[#86d3cc] h-[270px] xl:h-[400px] w-[200px] xl:w-[250px] relative overflow-hidden rounded-[18px] bg-gradient-to-b from-white to-slate-100 shadow-[inset_0_6px_12px_rgba(255,255,255,0.6),inset_0_-10px_16px_rgba(0,0,0,0.18)] "
      style={{
        "--reel-item-height": `${ITEM_HEIGHT}px`,
        "--reel-strip-length": DIGITS.length,
      }}
    >
      <div ref={stripRef} className="reel-strip font-[ReelDisplayA]">
        {DIGITS.map((d, idx) => (
          <div
            key={`${d}-${idx}`}
            className="reel-item h-[270px] xl:h-[400px] flex items-center justify-center text-[240px] font-black text-amber-500"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/55 via-transparent to-slate-900/10" />
    </div>
  );
}
