import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  Award,
  Users,
  FileText,
  Download,
} from "lucide-react";

const AboutSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },

    { id: "vision", label: "Vision & Mission" },
    { id: "principal", label: "Principal's Message" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  About Our Institution
                </h3>
                <p className="text-gray-600 mb-4">
                  Established in 1995, the College of Applied Science,
                  Thamarassery stands as a beacon of quality education in the
                  Malabar region. Under the aegis of the Institute of Human
                  Resources Development (IHRD) and affiliated to Calicut
                  University, we have been committed to excellence in applied
                  sciences education.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-3 text-blue-600" />
                    <span>Established: 1995</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                    <span>Location: Thamarassery, Kozhikode, Kerala</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Award className="h-5 w-5 mr-3 text-blue-600" />
                    <span>Affiliated to: Calicut University</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Users className="h-5 w-5 mr-3 text-blue-600" />
                    <span>Under: IHRD Kerala</span>
                  </div>
                </div>
              </div>
              <div>
                <img
                  src="https://grvnijrdyyevvtlcssoo.supabase.co/storage/v1/object/public/gallery-images/college.jpg"
                  alt="College Campus"
                  className="rounded-lg shadow-lg w-full h-64 object-cover"
                />
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Campus Location
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Nestled in the scenic hills of Thamarassery, our campus
                    provides an ideal environment for learning and research.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "vision":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Vision</h3>
                <p className="text-blue-800">
                  To be a center of excellence in applied sciences education,
                  fostering innovative thinking, research, and holistic
                  development of students to meet global challenges.
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-green-900 mb-4">
                  Mission
                </h3>
                <p className="text-green-800">
                  To provide quality education in applied sciences, promote
                  research and innovation, and develop competent professionals
                  with ethical values and social responsibility.
                </p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-orange-900 mb-4">
                  Motto
                </h3>
                <p className="text-orange-800 font-semibold text-lg">
                  "Knowledge, Integrity, Excellence"
                </p>
                <p className="text-orange-700 mt-2 text-sm">
                  Embodying our commitment to comprehensive education and
                  character building.
                </p>
              </div>
            </div>
          </div>
        );

      case "principal":
        return (
          <div className="bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <img
                  src="/assets/images/princi.jpeg"
                  alt="Principal"
                  className="rounded-lg shadow-lg w-full h-80 object-cover object-top"
                />
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    Dr.Radhika KM
                  </h3>
                  <p className="text-gray-600">Principal</p>
                </div>
              </div>
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Principal's Message
                </h3>
                <div className="prose prose-lg text-gray-700 space-y-4">
                  <p>Dear Students, Faculty, and Stakeholders,</p>
                  <p>
                    It gives me immense pleasure to welcome you to the College
                    of Applied Science, Thamarassery. Our institution has been
                    at the forefront of quality education in applied sciences
                    for over two decades.
                  </p>
                  <p>
                    We are committed to providing an environment that nurtures
                    creativity, critical thinking, and innovation. Our dedicated
                    faculty, state-of-the-art facilities, and comprehensive
                    curriculum ensure that our students are well-prepared to
                    face the challenges of the modern world.
                  </p>
                  <p>
                    I encourage all our students to make the most of the
                    opportunities available here and to strive for excellence in
                    all their endeavors.
                  </p>
                  <p className="font-semibold">
                    Best wishes for a successful academic journey!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Content for {activeTab} section will be available soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-8">
            <h1 className="text-3xl font-bold mb-2">About Institution</h1>
            <p className="text-blue-100">
              Learn about our history, mission, and commitment to excellence
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <div className="px-6">
              <div className="flex flex-wrap -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
