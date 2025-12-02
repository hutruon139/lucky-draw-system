import React, { useState, useEffect, useRef } from "react";

const REPEAT = 20; // build a longer strip for smooth looping
const DIGITS = Array.from({ length: REPEAT * 10 }, (_, i) => i % 10);

export default function Reel({ targetDigit = 0, spinning, delay = 0 }) {
  const stripRef = useRef(null);
  const tickTimerRef = useRef(null);
  const wasSpinningRef = useRef(false);
  const isInitializedRef = useRef(false);
  const [itemHeight, setItemHeight] = useState(270);
  const cachedHeightRef = useRef(null); // Cache để tránh đọc DOM liên tục (để tránh layout thrashing)

  // Đọc kích thước động từ DOM thay vì hardcode (với caching)
  const getItemHeight = (useCache = true) => {
    // Dùng cache nếu có và được phép
    if (useCache && cachedHeightRef.current) {
      return cachedHeightRef.current;
    }

    if (!stripRef.current) return itemHeight || 270; // fallback
    const firstItem = stripRef.current.querySelector(".reel-item");
    if (!firstItem) return itemHeight || 270;

    // Đọc offsetHeight thay vì getBoundingClientRect để tránh subpixel issues
    const height = firstItem.offsetHeight;

    // Cache lại
    cachedHeightRef.current = height;

    return height;
  };

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
        // Force reflow để đảm bảo browser nhận diện được thay đổi
        node.style.transition = "none";
        node.style.animation = "";
        node.style.transform = "translateY(0px)";
        // Trigger reflow
        void node.offsetHeight;
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

      // Đọc vị trí trong requestAnimationFrame để đảm bảo đọc được khi animation đang chạy
      requestAnimationFrame(() => {
        // ĐỌC kích thước NGAY TẠI ĐÂY từ DOM thực tế (dùng cache)
        const ITEM_HEIGHT = getItemHeight(true);

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

        // Forward-only steps; add loops for smoother stop
        let stepsRemaining = target - currentDigit;
        if (stepsRemaining < 0) stepsRemaining += 10;
        const extraLoops = 2; // fewer extra loops to slow the stop
        stepsRemaining += extraLoops * 10;

        // Slow-down timing (increase values to slow the stop)
        let stepDelay = 60; // ms start speed
        let slowStep = 10;
        const maxDelay = 500;

        // Hàm tick để quay về target
        const tick = () => {
          // ĐỌC lại kích thước mỗi tick (sử dụng cache để tránh layout thrashing)
          const CURRENT_ITEM_HEIGHT = getItemHeight(true);

          // DỪNG animation chỉ khi tick BẮT ĐẦU (không phải ngay khi stopSpin được gọi)
          // Để animation tiếp tục chạy cho đến khi tick bắt đầu
          // chỗ này gây giật lắm
          if (node.classList.contains("reel-spin")) {
            node.classList.remove("reel-spin");
            node.style.animation = "none";
            node.style.transition = "none";
            // Đọc lại vị trí hiện tại sau khi dừng animation
            const cs = getComputedStyle(node);
            if (cs.transform && cs.transform !== "none") {
              try {
                const matrix = new DOMMatrixReadOnly(cs.transform);
                const newOffset = matrix.m42;
                if (newOffset !== 0 && newOffset < -CURRENT_ITEM_HEIGHT) {
                  finalOffset = newOffset;
                  workingIndex = Math.round(-finalOffset / CURRENT_ITEM_HEIGHT);
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
              -displayIndex * CURRENT_ITEM_HEIGHT
            }px)`;
            wasSpinningRef.current = false;
            return;
          }

          workingIndex += 1;
          stepsRemaining -= 1;

          const displayIndex =
            ((workingIndex % DIGITS.length) + DIGITS.length) % DIGITS.length;
          const offset = -displayIndex * CURRENT_ITEM_HEIGHT;

          node.style.transition = `transform ${stepDelay}ms linear`;
          node.style.transform = `translateY(${offset}px)`;

          stepDelay = Math.min(stepDelay + slowStep, maxDelay);
          if (stepDelay > 180) slowStep = 16;
          if (stepDelay > 300) slowStep = 24;

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

  // Cập nhật itemHeight khi component mount và khi resize
  useEffect(() => {
    const updateHeight = () => {
      // Clear cache và force đọc lại
      cachedHeightRef.current = null;
      const height = getItemHeight(false);

      // Chỉ update nếu thực sự thay đổi
      if (height !== itemHeight) {
        setItemHeight(height);
        console.log("🎰 Item height updated:", height);
      }
    };

    // Update ngay lập tức
    updateHeight();

    // Update lại sau một chút để đảm bảo CSS đã apply
    const timeoutId = setTimeout(updateHeight, 100);

    // Debounced resize handler để tránh spam
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateHeight();
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className="reel-window border-[8px] border-[#86d3cc] h-[290px] xl:h-[400px] w-[200px] xl:w-[250px] relative overflow-hidden rounded-[18px] bg-gradient-to-b from-white to-slate-100 shadow-[inset_0_6px_12px_rgba(255,255,255,0.6),inset_0_-10px_16px_rgba(0,0,0,0.18)] "
      style={{
        "--reel-item-height": `${itemHeight}px`,
        "--reel-strip-length": DIGITS.length,
      }}
    >
      <div ref={stripRef} className="reel-strip font-[ReelDisplayA]">
        {DIGITS.map((d, idx) => (
          <div
            key={`${d}-${idx}`}
            className="
  reel-item h-[270px] xl:h-[400px]
  flex items-center justify-center
  text-[153px] xl:text-[280px] font-black leading-none
  text-transparent bg-clip-text
  bg-[linear-gradient(to_bottom,#f0d4a1,#c69c6b)]
  drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]
"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/55 via-transparent to-slate-900/10" />
    </div>
  );
}
