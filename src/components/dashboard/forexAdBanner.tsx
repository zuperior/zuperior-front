import Image from "next/image";
import React, { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    title: "Zuperior: A Modern Forex Trading Platform",
    subtitle: "Think Superior. Trade Zuperior",
    brandText: "Zuperior",
    buttonText: "Learn more",
    backgroundColor: "#944B93",
    image: "/dashboard_promotion_banners/image_1.avif",
    imageStyle: "absolute right-[-20px] md:right-[-40px] top-1/2 -translate-y-1/2 w-[280px] md:w-[450px] aspect-video rotate-[-9deg]",
  },

  {
    id: 2,
    title: "Introducing Broker Program",
    subtitle: "Refer traders, grow your network, and earn commissions",
    brandText: "Affiliate",
    buttonText: "Learn more",
    backgroundColor: "#000000",
    image: "/dashboard_promotion_banners/image2.avif",
    imageStyle: "absolute right-[-40px] md:right-[-60px] top-1/2 -translate-y-1/2 w-[300px] md:w-[500px] aspect-video",
  },
  {
    id: 3,
    title: "Free Forex Education",
    subtitle: "Learn Forex the Way Professionals Do",
    brandText: "ZuperLearn",
    buttonText: "Learn more",
    backgroundColor: "#4B2C96",
    image: "/dashboard_promotion_banners/image3.avif",
    imageStyle: "absolute right-[-40px] md:right-[-60px] top-1/2 -translate-y-1/2 w-[300px] md:w-[500px] aspect-video",
  },
];

const StarBackground = () => (
  <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          width: Math.random() * 2 + 1 + "px",
          height: Math.random() * 2 + 1 + "px",
          top: Math.random() * 100 + "%",
          left: Math.random() * 100 + "%",
          opacity: Math.random() * 0.7 + 0.3,
          boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)",
        }}
      />
    ))}
  </div>
);

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
    <div
      className="relative w-full h-[160px] md:h-[190px] rounded-[20px] overflow-hidden group/banner cursor-grab active:cursor-grabbing"
    >
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
          className="absolute inset-0 flex items-center px-6 md:px-12 touch-none"
          style={{ backgroundColor: slide.backgroundColor }}
        >
          {/* Starry Background for Dark Slides */}
          {slide.backgroundColor === "#000000" && <StarBackground />}

          {/* Brand Header */}
          <div className="absolute top-4 left-4 md:top-2 md:left-6 z-20 flex items-center gap-2">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#2E5CFF] flex items-center justify-center border-2 border-white/10 shrink-0">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />
            </div>
            <span
              className="text-white font-semibold text-sm md:text-lg tracking-tight"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {slide.brandText}
            </span>
          </div>
          {/* Content Section */}
          <div className="flex flex-col gap-3 md:gap-4 z-10 max-w-[65%] md:max-w-[70%]">
            <div className="space-y-1">
              <h2
                className="text-white font-semibold text-xl md:text-[28px] leading-[1.1em] tracking-[-0.05em]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {slide.title}
              </h2>
              <p
                className="text-white/50 font-medium text-xs md:text-[14px] leading-[18px] tracking-[-0.02em]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {slide.subtitle}
              </p>
            </div>

            <div>
              <button className="group relative flex items-center gap-2 px-6 py-2.5 rounded-full overflow-hidden transition-all duration-300 pointer-events-auto">
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-full" />

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                <span className="relative text-white font-medium text-sm md:text-[14px] tracking-[-0.02em]">
                  {slide.buttonText}
                </span>
                <ArrowUpRight className="relative text-white w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Decorative Image Section */}
          <div className={`${slide.imageStyle} pointer-events-none select-none`}>
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Subtle Overlay for texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
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
