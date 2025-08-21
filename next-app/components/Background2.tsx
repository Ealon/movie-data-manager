"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";

export default function Background() {
  const [idx, setIdx] = useState<number>(1);

  const paginate = (offset: number) => {
    setIdx((prev) => {
      const newIdx = prev + offset;
      if (newIdx < 1) return 83;
      if (newIdx > 83) return 1;
      return newIdx;
    });
  };
  const str = idx.toString().padStart(4, "0");
  const filename = `Tenet.2020.2160p.4K.BluRay.x265.10bit.AAC5.1-[YTS.MX]-${str}.jpg`; // 19
  // const filename = `The.Dark.Knight.2008.2160p.4K.BluRay.x265.10bit.AAC5.1-[YTS.MX]-${str}.jpg`; // 68

  return (
    <>
      <div className="absolute z-[999] top-6 right-6 flex gap-2">
        <Button variant="outline" size="icon" onClick={() => paginate(-1)}>
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => paginate(1)}>
          <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </div>
      <p className="absolute z-[999] top-16 right-6 text-white">{filename}</p>
      <img
        className="fixed w-screen h-screen object-cover object-center"
        src={`/bg/screenshots/${filename}`}
        alt={filename}
      />
      <div className="fixed w-screen h-screen bg-gradient-to-t from-black/60 from-5% via-black/30 via-15% to-black/15" />
    </>
  );
}
