"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const slides = [
  {
    emoji: "🌀",
    title: "everything disappears",
    sub: "drops last 10-60 minutes. rooms dissolve. nothing is permanent.",
    bg: "from-indigo-50 to-white",
  },
  {
    emoji: "👻",
    title: "ghost match",
    sub: "get anonymously matched with someone nearby. 10 minutes, then it vanishes.",
    bg: "from-purple-50 to-white",
  },
  {
    emoji: "⚡",
    title: "send signals",
    sub: "vibe with someone in a room? signal them. accept = 24h connection. then gone.",
    bg: "from-pink-50 to-white",
  },
  {
    emoji: "🔥",
    title: "be real. be now.",
    sub: "no followers. no likes saved. just this moment, these people, right now.",
    bg: "from-orange-50 to-white",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      localStorage.setItem("onboarded", "true");
      router.push("/register");
    }
  };

  const slide = slides[current];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${slide.bg} flex flex-col items-center justify-between px-8 py-16 transition-all duration-500`}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-8xl mb-8 animate-bounce">{slide.emoji}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">{slide.title}</h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-xs">{slide.sub}</p>
      </div>

      {/* dots */}
      <div className="flex gap-2 mb-8">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-indigo-600" : "w-2 bg-gray-200"
            }`}
          />
        ))}
      </div>

      <button
        onClick={next}
        className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-base font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
      >
        {current < slides.length - 1 ? "next →" : "let's go 🚀"}
      </button>

      {current < slides.length - 1 && (
        <button
          onClick={() => {
            localStorage.setItem("onboarded", "true");
            router.push("/register");
          }}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600"
        >
          skip
        </button>
      )}
    </div>
  );
}