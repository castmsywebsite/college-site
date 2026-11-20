import React, { useState, useEffect } from "react";
import { Calendar, Users } from "lucide-react";

interface EventItem {
  title: string;
  date: string;
  description: string;
  image: string;
  participants: string;
  type: string;
}

const initialEvents: EventItem[] = [
  {
    title: "Best NSS Award 2024",
    date: "March 15-17, 2024",
    description:
      "Three-day national conference featuring research presentations, keynote speeches, and networking sessions.",
    image:
      "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/public/Events/WhatsApp%20Image%202025-10-11%20at%2021.52.13_3c6c115f.jpg",
    participants: "",
    type: "",
  },
  {
    title: "Freshers Day celebration -- Coming Soon...",
    date: "December 4th 2025",
    description: "",
    image:
      "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/public/Events/WhatsApp%20Image%202025-11-26%20at%2020.11.32_5a803d6c.jpg",
    participants: "",
    type: "Cultural",
  },
];

const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);

  // Fetch live published events dynamically from database API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setEvents(
            data.map((item: any) => ({
              title: item.title,
              date: item.eventDate || item.date || "",
              description: item.description || "",
              image: item.imageUrl || item.image || "",
              participants: item.participants || "",
              type: item.eventType || item.type || "",
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("Using default event records:", err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Events</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 overflow-hidden bg-slate-900 flex items-center justify-center">
                  {/* Ambient Blurred Backdrop to gracefully fill any card aspect ratio */}
                  {event.image && (
                    <img
                      src={event.image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-40 select-none pointer-events-none"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />

                  {/* Main Foreground Image - Fully preserved with object-contain, never cropped */}
                  <img
                    src={event.image || "/favicon.svg"}
                    alt={event.title}
                    className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain mx-auto transition-transform duration-500 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h4 className="text-lg font-semibold text-gray-900 leading-snug">
                      {event.title}
                    </h4>
                    {event.type && (
                      <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                        {event.type}
                      </span>
                    )}
                  </div>

                  {event.date && (
                    <div className="flex items-center text-gray-600 mb-3 text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-indigo-600 flex-shrink-0" />
                      <span>{event.date}</span>
                    </div>
                  )}

                  {event.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {event.participants && (
                    <div className="mt-auto flex items-center text-gray-500 text-sm">
                      <Users className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{event.participants}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsSection;
