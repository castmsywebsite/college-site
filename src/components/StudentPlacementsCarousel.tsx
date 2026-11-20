import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Student {
  name: string;
  company: string;
  position: string;
  year: string;
  image: string;
}

const getInitials = (name: string): string => {
  if (!name) return "🎓";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const initialStudents: Student[] = [
  {
    name: "Neeraj",
    company: "Wipro",
    position: "",
    year: "2022 - 23",
    image: "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/public/placements/WhatsApp%20Image%202025-11-21%20at%2014.31.14_f47e4f4c.jpg",
  },
  {
    name: "Ajith dolichan",
    company: "Acabes international",
    position: "",
    year: "2022 - 23",
    image: "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/public/placements/WhatsApp%20Image%202025-11-21%20at%2014.31.14_78f7ae73.jpg",
  },
  {
    name: "Rahul V P",
    company: "XENO",
    position: "Software support executive",
    year: "2023",
    image:
      "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/public/placements/WhatsApp%20Image%202025-11-21%20at%2014.31.15_1f9fdb2d.jpg",
  },
  {
    name: "Abhinav p",
    company: "Orivios technologyes",
    position: "",
    year: "2022 - 25",
    image: "",
  },
  {
    name: "Abhinand T",
    company: "Tata Consultancy Services",
    position: "Support Cloud Engineer",
    year: "2021 - 24",
    image:
      "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/public/placements/IMG_20251012_224608366%20(1)%20-%20ABHINAND.jpg",
  },
];

const StudentPlacementsCarousel: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fetch live placements dynamically from database API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/placements")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setStudents(
            data.map((item: any) => ({
              name: item.studentName || item.name,
              company: item.companyName || item.company,
              position: item.position || "",
              year: item.graduatedYear || item.year,
              image: item.imageUrl || item.image || "",
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("Using default placement records:", err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Create slides with responsive number of students per slide
  const getStudentsPerSlide = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 1; // Mobile: 1 student per slide
      if (window.innerWidth < 1024) return 2; // Tablet: 2 students per slide
      return 3; // Desktop: 3 students per slide
    }
    return 3; // Default fallback
  };

  const [studentsPerSlide, setStudentsPerSlide] = useState(
    getStudentsPerSlide()
  );

  // Update students per slide on window resize
  useEffect(() => {
    const handleResize = () => {
      setStudentsPerSlide(getStudentsPerSlide());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const slides: Student[][] = [];
  for (let i = 0; i < students.length; i += studentsPerSlide) {
    slides.push(students.slice(i, i + studentsPerSlide));
  }

  // Guard currentSlide index if slides shrink
  useEffect(() => {
    if (slides.length > 0 && currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentSlide, slides.length]);

  const pauseAutoPlay = () => setIsAutoPlaying(false);
  const resumeAutoPlay = () => setIsAutoPlaying(true);

  return (
    <div className="bg-white py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
          Student Placements
        </h2>

        {/* Carousel Container */}
        <div
          className="relative"
          onMouseEnter={pauseAutoPlay}
          onMouseLeave={resumeAutoPlay}
        >
          {/* Navigation Arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={() => {
                  prevSlide();
                  pauseAutoPlay();
                }}
                aria-label="Previous slide"
                className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 sm:p-2.5 shadow-md border border-gray-100 transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <button
                onClick={() => {
                  nextSlide();
                  pauseAutoPlay();
                }}
                aria-label="Next slide"
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 sm:p-2.5 shadow-md border border-gray-100 transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </>
          )}

          {/* Carousel Track */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="w-full flex-shrink-0 px-2 sm:px-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slide.map((student, slideIndex) => (
                      <div
                        key={slideIndex}
                        className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group"
                      >
                        {/* Photograph Container - Standard Studio Portrait Frame with Ambient Palette */}
                        <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-80 bg-slate-100 flex items-center justify-center p-3.5 sm:p-4 overflow-hidden border-b border-slate-100">
                          {student.image ? (
                            <>
                              {/* Ambient background glow derived from student photo */}
                              <img
                                src={student.image}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-40 brightness-95 select-none pointer-events-none"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-white/30 backdrop-blur-sm pointer-events-none" />
                              {/* Crisp foreground student photo with subtle studio border */}
                              <img
                                src={student.image}
                                alt={student.name}
                                className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-md border border-white/80 transition-transform duration-300 group-hover:scale-[1.03]"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            </>
                          ) : (
                            <>
                              {/* Institutional Monogram Backdrop for Students without photo */}
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-100" />
                              <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-2xl sm:text-3xl shadow-lg ring-4 ring-white flex items-center justify-center tracking-wider">
                                  {getInitials(student.name)}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                  CAS TMSY Alumni
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Placement Information Card Details */}
                        <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                Placed
                              </span>
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                Batch {student.year}
                              </span>
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {student.name}
                            </h4>
                            {student.position && (
                              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1">
                                {student.position}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-blue-700 mt-1.5 line-clamp-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block shrink-0"></span>
                              {student.company}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {slides.length > 1 && (
            <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
              {Array.from({ length: slides.length }, (_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    goToSlide(index);
                    pauseAutoPlay();
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                    currentSlide === index
                      ? "bg-blue-600 scale-110"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPlacementsCarousel;
