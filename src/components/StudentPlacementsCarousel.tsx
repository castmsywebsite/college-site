import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Student {
  name: string;
  company: string;
  position: string;
  year: string;
  image: string;
}

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
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group"
                      >
                        {/* Photograph Container - Uses object-contain with neutral ambient backdrop */}
                        <div className="relative w-full h-60 sm:h-64 bg-slate-100 flex items-center justify-center p-3 overflow-hidden">
                          {/* Ambient soft backdrop to fill card frame seamlessly */}
                          {student.image && (
                            <img
                              src={student.image}
                              alt=""
                              aria-hidden="true"
                              className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-25 select-none pointer-events-none"
                              loading="lazy"
                            />
                          )}
                          <img
                            src={
                              student.image ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                student.name
                              )}&background=random`
                            }
                            alt={student.name}
                            className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                student.name
                              )}&background=random`;
                            }}
                          />
                        </div>

                        {/* Placement Information - Positioned below photograph to prevent overlapping faces */}
                        <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white border-t border-gray-100">
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                              {student.name}
                            </h4>
                            {student.position && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">
                                {student.position}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-blue-600 mt-1 line-clamp-1">
                              {student.company}
                            </p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                            <span className="font-medium text-gray-400">Graduated:</span>
                            <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {student.year}
                            </span>
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
