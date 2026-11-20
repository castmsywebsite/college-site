import React from "react";
import { Calendar, Users } from "lucide-react";

const EventsSection: React.FC = () => {
  const events = [
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
      description:
        "",
      image:
        "https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/public/Events/WhatsApp%20Image%202025-11-26%20at%2020.11.32_5a803d6c.jpg",
      participants: "",
      type: "Cultural",
    },
  ];

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
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:h-72 overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
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
