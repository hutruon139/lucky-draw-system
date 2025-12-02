import React from "react";
import { zeroPad } from "../logic/utils";

export default function WinnerScreen({ winner, prizeType, onNext }) {
  if (!winner) {
    return (
      <div className="card p-6 text-center text-slate-300">
        <p>No winner selected yet.</p>
      </div>
    );
  }

  const badgeColor = {
    first: "bg-amber-400 text-amber-950",
    second: "bg-sky-400 text-sky-950",
    third: "bg-lime-400 text-lime-950",
    special: "bg-fuchsia-400 text-fuchsia-950",
  }[prizeType];

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-4 text-center text-amber-100">
      <p className="text-5xl font-[ReelDisplayB] tracking-wide text-white drop-shadow">
        Xin chúc mừng
      </p>
      <div className="rounded-[24px]  px-6 py-4 ">
        <div className="text-9xl font-[ReelDisplayB] tracking-widest  text-[#f0d4a1] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
          {zeroPad(winner.number, 3)}
        </div>
      </div>
      <div className="text-7xl font-[ReelDisplayB] uppercase tracking-wide text-[#f0d4a1]  drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
        {winner.name}
      </div>
      <div className=" text-4xl font-[ReelDisplayB] !text-white drop-shadow">
        {winner.company}
      </div>
      <div className="mt-10">
        <button
          type="button"
          onClick={onNext}
          className="
    rounded-full
     
    px-10 py-3
    text-3xl font-semibold tracking-wide uppercase
    text-[#134A46]               /* dark teal text */

    bg-[linear-gradient(90deg,#c69c6b,#f0d4a1,#c69c6b)]   /* gold gradient */

    shadow-[0_0_20px_rgba(44,166,169,0.35),inset_0_2px_6px_rgba(255,255,255,0.35),inset_0_-4px_10px_rgba(0,0,0,0.35)]

    drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]
    border-8
    border-[#299b93]
    transition-transform
    duration-150
    hover:scale-[1.03]Í
    active:scale-[0.98]
  "
        >
          Lượt tiếp theo
        </button>
      </div>
    </div>
  );
}
