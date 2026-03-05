"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";

type Slide = {
  id: number;
  image: string;
};

const slides: Slide[] = [
  { id: 1, image: "/dashboard_promotion_banners/image_1.png" },
  { id: 2, image: "/dashboard_promotion_banners/image_2.png" },
  { id: 3, image: "/dashboard_promotion_banners/image_3.png" },
  { id: 4, image: "/dashboard_promotion_banners/image_4.png" },
];

const ForexAdBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[160px] md:h-full rounded-[20px] overflow-hidden">
      <motion.div
        className="flex h-full"
        animate={{ x: `-${currentSlide * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative min-w-full h-full shrink-0">
            <Image
              src={slide.image}
              alt={`Promotion Banner ${slide.id}`}
              fill
              className="object-cover select-none"
              priority
            />
          </div>
        ))}
      </motion.div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white w-4" : "bg-white/40 w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ForexAdBanner;
