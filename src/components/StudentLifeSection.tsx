import React, { useState } from "react";
import {
  Trophy,
  Heart,
  Briefcase,
  MessageSquare,
  Users,
  Shield,
  Stethoscope,
} from "lucide-react";

const StudentLifeSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState("sports");

  const tabs = [
    // { id: "sports", label: "Sports" },
    { id: "ncc-nss", label: "NSS" },
    // { id: "placement", label: "Placement Cell" },
    // { id: "grievances", label: "Student Grievances" },
    { id: "clubs", label: "Clubs & Cells" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "sports":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Sports & Recreation
                </h3>
                <p className="text-gray-600 mb-6">
                  Our college promotes physical fitness and sportsmanship
                  through various sports facilities and regular competitions. We
                  believe in the holistic development of our students through
                  sports and recreational activities.
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Available Sports
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-blue-800 text-sm">
                      <div>• Cricket</div>
                      <div>• Football</div>
                      <div>• Basketball</div>
                      <div>• Volleyball</div>
                      <div>• Badminton</div>
                      <div>• Table Tennis</div>
                      <div>• Athletics</div>
                      <div>• Chess</div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Achievements 2023-24
                    </h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Inter-college Football Championship - Winners</li>
                      <li>• University Basketball Tournament - Runners-up</li>
                      <li>• State Level Chess Competition - 3rd Position</li>
                      <li>• District Athletics Meet - Multiple Medals</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <img
                  src="https://images.pexels.com/photos/163444/sport-treadmill-tor-trainer-163444.jpeg"
                  alt="Sports Facilities"
                  className="rounded-lg shadow-lg w-full h-64 object-cover mb-4"
                />

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">
                    Sports Facilities
                  </h4>
                  <ul className="text-orange-800 text-sm space-y-1">
                    <li>• Modern Gymnasium</li>
                    <li>• Indoor Sports Complex</li>
                    <li>• Outdoor Playing Fields</li>
                    <li>• Swimming Pool (Under Construction)</li>
                    <li>• Sports Equipment Library</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "ncc-nss":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                  <Shield className="h-6 w-6 mr-2" />
                  National Cadet Corps (NCC)
                </h3>
                <p className="text-green-800 mb-4">
                  Our NCC unit focuses on character building, discipline, and
                  national service. Cadets participate in various training
                  programs and social service activities.
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">
                      Activities
                    </h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Annual Training Camps</li>
                      <li>• Republic Day Parade Participation</li>
                      <li>• Social Service Projects</li>
                      <li>• Adventure Activities & Trekking</li>
                      <li>• Disaster Management Training</li>
                    </ul>
                  </div>

                  <div className="bg-green-200 p-3 rounded">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-900">
                        150+
                      </div>
                      <div className="text-green-800 text-sm">
                        Active Cadets
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                  <Heart className="h-6 w-6 mr-2" />
                  National Service Scheme (NSS)
                </h3>
                <p className="text-blue-800 mb-4">
                  NSS volunteers engage in community service and social
                  development activities, fostering a sense of social
                  responsibility and civic consciousness.
                </p>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Programs
                    </h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Village Adoption Programs</li>
                      <li>• Literacy Drives</li>
                      <li>• Environmental Conservation</li>
                      <li>• Health Awareness Campaigns</li>
                      <li>• Blood Donation Camps</li>
                    </ul>
                  </div>

                  <div className="bg-blue-200 p-3 rounded">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-900">
                        200+
                      </div>
                      <div className="text-blue-800 text-sm">
                        NSS Volunteers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "placement":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Placement Cell
                </h3>
                <p className="text-gray-600 mb-6">
                  Our dedicated Placement Cell works tirelessly to connect
                  students with leading companies and organizations, ensuring
                  excellent career opportunities for our graduates.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      Placement Statistics 2023-24
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-800">Students Placed:</span>
                        <span className="font-bold text-blue-900">320+</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Placement Rate:</span>
                        <span className="font-bold text-blue-900">95%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Highest Package:</span>
                        <span className="font-bold text-blue-900">₹18 LPA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Average Package:</span>
                        <span className="font-bold text-blue-900">
                          ₹6.5 LPA
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-3">
                      Top Recruiters
                    </h4>
                    <div className="space-y-2 text-green-800 text-sm">
                      <div>• Infosys</div>
                      <div>• TCS</div>
                      <div>• Wipro</div>
                      <div>• Cognizant</div>
                      <div>• Accenture</div>
                      <div>• HCL Technologies</div>
                      <div>• Tech Mahindra</div>
                      <div>• IBM</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-3">
                    Placement Activities
                  </h4>
                  <ul className="text-orange-800 text-sm space-y-1">
                    <li>• Resume Building Workshops</li>
                    <li>• Interview Preparation Sessions</li>
                    <li>• Soft Skills Development Programs</li>
                    <li>• Industry Expert Guest Lectures</li>
                    <li>• Mock Interviews and Group Discussions</li>
                    <li>• Career Counseling Sessions</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  Contact Placement Cell
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="font-medium text-gray-900">
                      Placement Officer:
                    </span>
                    <p className="text-gray-600">Dr. Meera Krishnan</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Email:</span>
                    <p className="text-gray-600">
                      placement@casthamarassery.ac.in
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Phone:</span>
                    <p className="text-gray-600">+91-495-2244580</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      Office Hours:
                    </span>
                    <p className="text-gray-600">Mon-Fri: 9:00 AM - 5:00 PM</p>
                  </div>
                </div>

                <div className="mt-4">
                  <img
                    src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg"
                    alt="Placement Activities"
                    className="rounded-lg shadow-md w-full h-56 sm:h-64 object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "clubs":
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Clubs & Cells
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "Women's Cell",
                  icon: Users,
                  description:
                    "Empowering women students through various programs and awareness sessions.",
                  activities: [
                    "Self-defense classes",
                    "Career guidance",
                    "Health awareness",
                    "Legal aid",
                  ],
                },
                {
                  name: "IT Club",
                  icon: Briefcase,
                  description:
                    "Promoting technical skills and innovation in information technology.",
                  activities: [
                    "Coding competitions",
                    "Tech workshops",
                    "Project showcases",
                    "Industry visits",
                  ],
                },
                {
                  name: "Music Club",
                  icon: Heart,
                  description:
                    "Nurturing musical talents and organizing cultural events.",
                  activities: [
                    "Music concerts",
                    "Talent shows",
                    "Music lessons",
                    "Festival celebrations",
                  ],
                },
                {
                  name: "Drama Society",
                  icon: Users,
                  description:
                    "Developing theatrical skills and organizing dramatic performances.",
                  activities: [
                    "Stage plays",
                    "Drama workshops",
                    "Script writing",
                    "Costume design",
                  ],
                },
                {
                  name: "Photography Club",
                  icon: Trophy,
                  description:
                    "Capturing memories and developing photography skills.",
                  activities: [
                    "Photo walks",
                    "Exhibitions",
                    "Workshops",
                    "Competitions",
                  ],
                },
                {
                  name: "Literary Society",
                  icon: MessageSquare,
                  description:
                    "Promoting literature, writing, and communication skills.",
                  activities: [
                    "Creative writing",
                    "Debates",
                    "Poetry sessions",
                    "Magazine publication",
                  ],
                },
              ].map((club, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <club.icon className="h-8 w-8 text-blue-600 mr-3" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      {club.name}
                    </h4>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">
                    {club.description}
                  </p>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Key Activities:
                    </h5>
                    <ul className="text-gray-600 text-sm space-y-1">
                      {club.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-center">
                          <span className="text-blue-600 mr-2">•</span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "health":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Stethoscope className="h-8 w-8 text-red-600 mr-3" />
                  Health Facility
                </h3>
                <p className="text-gray-600 mb-6">
                  Our college provides comprehensive health services to ensure
                  the well-being of all students and staff. We maintain a
                  well-equipped medical facility with qualified healthcare
                  professionals.
                </p>

                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">
                      Medical Services
                    </h4>
                    <ul className="text-red-800 text-sm space-y-1">
                      <li>• General Health Check-ups</li>
                      <li>• First Aid and Emergency Care</li>
                      <li>• Vaccination Programs</li>
                      <li>• Health Awareness Campaigns</li>
                      <li>• Mental Health Counseling</li>
                      <li>• Specialist Consultations</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Accessibility Features
                    </h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Wheelchair Accessible Ramps</li>
                      <li>• Braille Resources for Visually Impaired</li>
                      <li>• Sign Language Interpreters</li>
                      <li>• Special Needs Support Staff</li>
                      <li>• Adapted Sports Equipment</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <img
                  src="https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg"
                  alt="Health Facility"
                  className="rounded-lg shadow-lg w-full h-64 object-cover mb-6"
                />

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">
                    Medical Staff
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-green-800">
                        Dr. Sarah Thomas
                      </h5>
                      <p className="text-green-700 text-sm">
                        Chief Medical Officer
                      </p>
                      <p className="text-green-600 text-xs">
                        MBBS, MD (General Medicine)
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-green-800">
                        Ms. Priya Nair
                      </h5>
                      <p className="text-green-700 text-sm">
                        Counseling Psychologist
                      </p>
                      <p className="text-green-600 text-xs">
                        M.Phil Clinical Psychology
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-green-800">
                        Mr. Ravi Kumar
                      </h5>
                      <p className="text-green-700 text-sm">Physiotherapist</p>
                      <p className="text-green-600 text-xs">
                        BPT, MPT (Orthopedics)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    Emergency Contact
                  </h4>
                  <p className="text-yellow-800 text-sm">
                    📞 Medical Emergency: +91-495-2244599
                    <br />
                    🕐 24/7 Emergency Services Available
                    <br />
                    📧 health@casthamarassery.ac.in
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
            <h1 className="text-3xl font-bold mb-2">Student Life</h1>
            <p className="text-blue-100">
              Explore campus activities, sports, clubs, and support services for
              holistic development
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

export default StudentLifeSection;
