import Image from "next/image";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    image: "/dashboard_promotion_banners/image_1.png",
  },
  {
    id: 2,
    image: "/dashboard_promotion_banners/image_2.png",
  },
  {
    id: 3,
    image: "/dashboard_promotion_banners/image_3.png",
  },
  {
    id: 4,
    image: "/dashboard_promotion_banners/image_4.png",
  },
];

const ForexAdBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (info.offset.x > threshold) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  return (
    <div className="relative w-full h-full rounded-[20px] overflow-hidden group/banner cursor-grab active:cursor-grabbing">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0"
        >
          {/* Full Banner Image */}
          <Image
            src={slide.image}
            alt={`Promotion Banner ${slide.id}`}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-white w-4" : "bg-white/30"
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ForexAdBanner;
