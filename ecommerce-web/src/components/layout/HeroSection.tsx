import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Flame,
  Sparkles,
} from "lucide-react";

import hero1 from "../../assets/dexora-hero-1.png";
import hero2 from "../../assets/dexora-hero-2.png";
import hero3 from "../../assets/dexora-hero-3.png";

interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  primaryButton: string;
  secondaryButton: string;
  badge?: string;
}

const slides: HeroSlide[] = [
  {
    image: hero1,
    eyebrow: "DEXORA GAMING",
    title: "LEVEL UP",
    highlight: "YOUR GAME",
    description:
      "Premium gaming gear built for faster reactions, better control and an immersive experience.",
    primaryButton: "Shop Gaming",
    secondaryButton: "Explore Products",
    badge: "GAMING COLLECTION",
  },
  {
    image: hero2,
    eyebrow: "BUILD WITHOUT LIMITS",
    title: "POWER YOUR",
    highlight: "PERFORMANCE",
    description:
      "Discover high-performance laptops, desktops, monitors and accessories designed for modern creators and gamers.",
    primaryButton: "Explore PCs",
    secondaryButton: "View Components",
    badge: "PERFORMANCE SERIES",
  },
  {
    image: hero3,
    eyebrow: "DEXORA TECHNOLOGIES",
    title: "TECH FOR",
    highlight: "EVERY MOMENT",
    description:
      "From everyday essentials to premium technology, find everything you need in one place.",
    primaryButton: "Shop Now",
    secondaryButton: "Browse Categories",
    badge: "NEW COLLECTION",
  },
];

export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  /* =========================================================
     AUTO SLIDER
  ========================================================= */

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setActiveSlide((previous) =>
        previous === slides.length - 1 ? 0 : previous + 1
      );
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const nextSlide = () => {
    setActiveSlide((previous) =>
      previous === slides.length - 1 ? 0 : previous + 1
    );
  };

  const previousSlide = () => {
    setActiveSlide((previous) =>
      previous === 0 ? slides.length - 1 : previous - 1
    );
  };

  return (
    <section
      className="relative mx-auto w-full max-w-[1440px] px-3 pt-4 sm:px-4 md:px-6 md:pt-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="group relative h-[430px] overflow-hidden rounded-2xl bg-[#07111f] shadow-[0_12px_40px_rgba(15,23,42,0.12)] sm:h-[480px] lg:h-[510px]">

        {/* =====================================================
            SLIDES
        ===================================================== */}

        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-700 ${
              activeSlide === index
                ? "z-10 opacity-100"
                : "z-0 opacity-0"
            }`}
          >
            {/* Background Image */}

            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Dark gradient for text readability */}

            <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/95 via-[#020817]/65 to-transparent" />

            {/* Bottom subtle gradient */}

            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/35 to-transparent" />

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="relative z-20 flex h-full max-w-[650px] items-center px-6 sm:px-10 lg:px-14">

              <div className="max-w-[560px]">

                {/* Badge */}

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-white backdrop-blur-md">

                  {index === 0 ? (
                    <Flame className="h-3.5 w-3.5 text-[#ff6b00]" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-[#ff6b00]" />
                  )}

                  <span>{slide.badge}</span>

                </div>

                {/* Eyebrow */}

                <p className="mb-3 text-[11px] font-bold tracking-[0.24em] text-[#ff7a1a] sm:text-xs">
                  {slide.eyebrow}
                </p>

                {/* Main Heading */}

                <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-[64px]">

                  {slide.title}

                  <br />

                  <span className="text-[#ff6b00]">
                    {slide.highlight}
                  </span>

                </h1>

                {/* Description */}

                <p className="mt-5 max-w-[500px] text-sm leading-6 text-white/75 sm:text-[15px]">
                  {slide.description}
                </p>

                {/* Buttons */}

                <div className="mt-7 flex flex-wrap items-center gap-3">

                  <button className="group/button inline-flex h-12 items-center gap-2 rounded-xl bg-[#ff6b00] px-5 text-[13px] font-bold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e96000] hover:shadow-xl">

                    {slide.primaryButton}

                    <ChevronRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />

                  </button>

                  <button className="inline-flex h-12 items-center rounded-xl border border-white/25 bg-white/10 px-5 text-[13px] font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/15">

                    {slide.secondaryButton}

                  </button>

                </div>

              </div>

            </div>
          </div>
        ))}

        {/* =====================================================
            PREVIOUS BUTTON
        ===================================================== */}

        <button
          onClick={previousSlide}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white opacity-0 backdrop-blur-md transition-all duration-200 hover:bg-white/15 group-hover:opacity-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* =====================================================
            NEXT BUTTON
        ===================================================== */}

        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white opacity-0 backdrop-blur-md transition-all duration-200 hover:bg-white/15 group-hover:opacity-100"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* =====================================================
            SLIDER CONTROLS
        ===================================================== */}

        <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-md">

          {slides.map((slide, index) => (
            <button
              key={slide.image}
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeSlide === index
                  ? "w-8 bg-[#ff6b00]"
                  : "w-1.5 bg-white/50 hover:bg-white"
              }`}
            />
          ))}

        </div>

        {/* =====================================================
            SLIDE COUNTER
        ===================================================== */}

        <div className="absolute bottom-6 right-6 z-30 hidden rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-medium text-white/70 backdrop-blur-md sm:block">

          <span className="font-bold text-white">
            {String(activeSlide + 1).padStart(2, "0")}
          </span>

          <span className="mx-1.5 text-white/30">
            /
          </span>

          {String(slides.length).padStart(2, "0")}

        </div>

      </div>
    </section>
  );
}