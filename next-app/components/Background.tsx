"use client";

import { useEffect, useState } from "react";

const NUMBER_OF_BG = 28;

// 生成打乱数组的函数
function generateShuffledArray(length: number) {
  // 创建初始数组 [1, 2, 3, ..., length]
  const array = Array.from({ length }, (_, i) => i + 1);

  // Fisher-Yates 洗牌算法
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

const shuffledArray = generateShuffledArray(NUMBER_OF_BG);

export default function Background() {
  const [idx, setIdx] = useState<number>(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIdx((prev) => {
        const newIdx = prev + 1;
        if (newIdx > NUMBER_OF_BG - 1) return 0;
        return newIdx;
      });
    }, 15_000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <img
        className="fixed w-screen h-screen object-cover object-center"
        src={`/bg/selected/${shuffledArray[idx]}.webp`}
      />
      <div className="fixed w-screen h-screen bg-gradient-to-t from-black/60 from-5% via-black/30 via-15% to-black/15" />
    </>
  );
}
