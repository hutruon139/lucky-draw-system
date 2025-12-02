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
      <p className="text-5xl font-semibold tracking-wide text-white drop-shadow">
        Xin chúc mừng
      </p>
      <div className="rounded-[24px]  px-6 py-4 ">
        <div className="text-8xl font-black tracking-widest text-amber-100 drop-shadow">
          {zeroPad(winner.number, 3)}
        </div>
      </div>
      <div className="text-7xl font-extrabold uppercase tracking-wide text-amber-100 drop-shadow-lg">
        {winner.name}
      </div>
      <div className="text-2xl font-semibold !text-white drop-shadow">
        {winner.company}
      </div>
      {/* <div className="mt-6">
        <span className={`rounded-full px-5 py-2 text-sm font-semibold ${badgeColor} shadow-lg shadow-teal-900/30`}>
          {prizeType?.toUpperCase()} PRIZE
        </span>
      </div> */}
      <div className="mt-10">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 px-8 py-3 text-lg font-semibold uppercase tracking-wide text-teal-800 shadow-lg shadow-teal-900/30 transition hover:scale-[1.02]"
        >
          Lượt tiếp theo
        </button>
      </div>
    </div>
  );
}
