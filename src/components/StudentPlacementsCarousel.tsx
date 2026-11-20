import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Student {
  name: string;
  company: string;
  position: string;
  year: string;
  image: string;
}

const StudentPlacementsCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const students: Student[] = [
    {
      name: "Neeraj",
      company: "Wipro",
      position: "",
      year: "2022 - 23",
      image: "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/sign/placements/WhatsApp%20Image%202025-11-21%20at%2014.31.14_f47e4f4c.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84NzUyZWZjOS1mZGY0LTRhMzctODA3My1kYTUzYWNhNmVhZGUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwbGFjZW1lbnRzL1doYXRzQXBwIEltYWdlIDIwMjUtMTEtMjEgYXQgMTQuMzEuMTRfZjQ3ZTRmNGMuanBnIiwiaWF0IjoxNzYzODk3MzE4LCJleHAiOjE3OTU0MzMzMTh9.iwOmP0Jru-B3ATOedokfTwlGzJ52yLZsG9GkqB8cB2E",
    },
    {
      name: "Ajith dolichan",
      company: "Acabes international",
      position: "",
      year: "2022 - 23",
      image: "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/sign/placements/WhatsApp%20Image%202025-11-21%20at%2014.31.14_78f7ae73.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84NzUyZWZjOS1mZGY0LTRhMzctODA3My1kYTUzYWNhNmVhZGUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwbGFjZW1lbnRzL1doYXRzQXBwIEltYWdlIDIwMjUtMTEtMjEgYXQgMTQuMzEuMTRfNzhmN2FlNzMuanBnIiwiaWF0IjoxNzYzODk3OTUxLCJleHAiOjE3OTU0MzM5NTF9.A9zfSr6GJUxKoDgqNex6qmdrS3r7KlXT7mtKTs2-B4g",
    },
    {
      name: "Rahul V P",
      company: "XENO",
      position: "Software support executive",
      year: "2023",
      image:
        "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/sign/placements/WhatsApp%20Image%202025-11-21%20at%2014.31.15_1f9fdb2d.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84NzUyZWZjOS1mZGY0LTRhMzctODA3My1kYTUzYWNhNmVhZGUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwbGFjZW1lbnRzL1doYXRzQXBwIEltYWdlIDIwMjUtMTEtMjEgYXQgMTQuMzEuMTVfMWY5ZmRiMmQuanBnIiwiaWF0IjoxNzYzODk3NTExLCJleHAiOjE3OTU0MzM1MTF9.eRGmQXLFI0ELZ1DHn1SVozV9V0SpfsXk436M-y9g5tY",
    },
    {
      name: "Abhinav p",
      company: "Orivios technologyes",
      position: "",
      year: "2022 - 25",
      image:
        "",
    },
     {
      name: "Abhinand T",
      company: "Tata Consultancy Services",
      position: "Support Cloud Engineer",
      year: "2021 - 24",
      image:
        "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/sign/placements/IMG_20251012_224608366%20(1)%20-%20ABHINAND.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84NzUyZWZjOS1mZGY0LTRhMzctODA3My1kYTUzYWNhNmVhZGUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwbGFjZW1lbnRzL0lNR18yMDI1MTAxMl8yMjQ2MDgzNjYgKDEpIC0gQUJISU5BTkQuanBnIiwiaWF0IjoxNzY0MTc3NzI1LCJleHAiOjE3OTU3MTM3MjV9._N91wUx8HVRNxTErsMO4_wkw2VZasVUjyNVqjFS8KPM",
    },
  ];

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentSlide]);

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
          <button
            onClick={() => {
              prevSlide();
              pauseAutoPlay();
            }}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-all duration-200 hover:scale-110"
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-gray-700" />
          </button>

          <button
            onClick={() => {
              nextSlide();
              pauseAutoPlay();
            }}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-lg transition-all duration-200 hover:scale-110"
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-gray-700" />
          </button>

          {/* Carousel Track */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="w-full flex-shrink-0 px-2 sm:px-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {slide.map((student, slideIndex) => (
                      <div
                        key={slideIndex}
                        className="relative h-64 sm:h-72 lg:h-80 overflow-hidden rounded-lg hover:shadow-lg transition-shadow bg-gray-100"
                      >
                        <img
                          src={student.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                          alt={student.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 transition-all hover:bg-black/60 flex flex-col justify-end p-4 sm:p-6">
                          <h4 className="text-base sm:text-lg font-semibold text-white mb-1 shadow-black drop-shadow-md">
                            {student.name}
                          </h4>
                          {student.position && (
                            <p className="text-white text-xs sm:text-sm mb-1 shadow-black drop-shadow-md">
                              {student.position}
                            </p>
                          )}
                          {student.company && (
                            <p className="text-white text-xs sm:text-sm mb-1 shadow-black drop-shadow-md">
                              {student.company}
                            </p>
                          )}
                          <p className="text-gray-200 text-xs shadow-black drop-shadow-md">
                            Graduated: {student.year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
            {Array.from({ length: slides.length }, (_, index) => (
              <button
                key={index}
                onClick={() => {
                  goToSlide(index);
                  pauseAutoPlay();
                }}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${currentSlide === index
                  ? "bg-blue-600 scale-110"
                  : "bg-gray-300 hover:bg-gray-400"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPlacementsCarousel;
