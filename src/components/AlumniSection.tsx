import React, { useState } from 'react';
import { Users, Calendar, DollarSign, Award, Briefcase, GraduationCap } from 'lucide-react';

const AlumniSection: React.FC = () => {
  const [activeView, setActiveView] = useState('overview');

  const views = [
    { id: 'overview', label: 'Overview' },
    { id: 'meetings', label: 'Alumni Meetings' },
    { id: 'donations', label: 'Donations & Contributions' },
    { id: 'profiles', label: 'Notable Alumni' }
  ];

  const notableAlumni = [
    {
      name: 'Arjun Krishnan',
      batch: '2015 - B.Sc Computer Science',
      position: 'Senior Software Engineer, Google',
      achievement: 'Leading AI/ML projects at Google DeepMind',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
    },
    {
      name: 'Dr. Priyanka Nair',
      batch: '2012 - B.Sc Physics',
      position: 'Research Scientist, ISRO',
      achievement: 'Contributing to Mars Orbiter Mission',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg'
    },
    {
      name: 'Ravi Menon',
      batch: '2018 - M.Sc Electronics',
      position: 'Founder, TechStart Solutions',
      achievement: 'Founded successful IoT startup',
      image: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg'
    },
    {
      name: 'Meera Sharma',
      batch: '2014 - B.Sc Mathematics',
      position: 'Data Scientist, Microsoft',
      achievement: 'Leading data analytics team',
      image: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg'
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Alumni Network</h3>
                <p className="text-gray-600 mb-6">
                  Our proud alumni network spans across the globe, with graduates making significant 
                  contributions in various fields including technology, research, entrepreneurship, 
                  education, and public service.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-900">5000+</div>
                    <div className="text-blue-700 text-sm">Total Alumni</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-900">28</div>
                    <div className="text-green-700 text-sm">Years of Excellence</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-900">35+</div>
                    <div className="text-purple-700 text-sm">Countries</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-900">200+</div>
                    <div className="text-orange-700 text-sm">Entrepreneurs</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Alumni in Key Sectors</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Information Technology</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Research & Academia</span>
                      <span className="font-medium">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Government Services</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entrepreneurship</span>
                      <span className="font-medium">12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Others</span>
                      <span className="font-medium">18%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <img
                  src="https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg"
                  alt="Alumni Gathering"
                  className="rounded-lg shadow-lg w-full h-64 object-cover mb-6"
                />

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Stay Connected</h4>
                  <p className="text-blue-800 mb-4 text-sm">
                    Join our alumni network to stay connected with your batch mates and 
                    contribute to the growth of our institution.
                  </p>
                  <div className="space-y-2 text-blue-700 text-sm">
                    <div>📧 alumni@casthamarassery.ac.in</div>
                    <div>📞 +91-495-2244590</div>
                    <div>🌐 LinkedIn: CAS Thamarassery Alumni</div>
                    <div>📱 WhatsApp Groups by Batch</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'meetings':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Alumni Meetings & Events</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                {
                  event: 'Annual Alumni Meet 2024',
                  date: 'December 15, 2024',
                  participants: '500+ Alumni',
                  highlights: ['Networking Session', 'Awards Ceremony', 'Cultural Programs', 'Campus Tour'],
                  status: 'upcoming'
                },
                {
                  event: 'Silver Jubilee Celebration',
                  date: 'March 20, 2024',
                  participants: '800+ Alumni',
                  highlights: ['25 Years Celebration', 'Distinguished Alumni Awards', 'Fund Raising', 'Reunion Dinner'],
                  status: 'completed'
                },
                {
                  event: 'Career Guidance Seminar',
                  date: 'September 10, 2024',
                  participants: '200+ Alumni & Students',
                  highlights: ['Industry Insights', 'Mentorship Program Launch', 'Job Opportunities', 'Networking'],
                  status: 'completed'
                },
                {
                  event: 'Tech Alumni Meetup',
                  date: 'January 25, 2025',
                  participants: '300+ Tech Alumni',
                  highlights: ['Tech Trends Discussion', 'Startup Showcase', 'Innovation Awards', 'Panel Discussions'],
                  status: 'upcoming'
                }
              ].map((meeting, index) => (
                <div key={index} className={`border-l-4 p-6 rounded-lg ${
                  meeting.status === 'upcoming' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-green-500 bg-green-50'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{meeting.event}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meeting.status === 'upcoming'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {meeting.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">{meeting.date}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">{meeting.participants}</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Key Highlights:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {meeting.highlights.map((highlight, hIndex) => (
                        <li key={hIndex} className="flex items-center">
                          <span className={`mr-2 ${
                            meeting.status === 'upcoming' ? 'text-blue-600' : 'text-green-600'
                          }`}>•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'donations':
        return (
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Alumni Donations & Contributions</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg mb-6">
                  <h4 className="text-xl font-bold mb-4">Total Contributions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-3xl font-bold">₹2.5 Crores</div>
                      <div className="text-green-100">Lifetime Donations</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">1500+</div>
                      <div className="text-green-100">Contributing Alumni</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Major Contributions</h4>
                  {[
                    {
                      donor: 'Batch of 2010',
                      amount: '₹25,00,000',
                      purpose: 'New Computer Lab Setup',
                      year: '2023'
                    },
                    {
                      donor: 'Mr. Rajesh Kumar (1998 Batch)',
                      amount: '₹15,00,000',
                      purpose: 'Library Modernization',
                      year: '2022'
                    },
                    {
                      donor: 'Dr. Priya Nair (2005 Batch)',
                      amount: '₹10,00,000',
                      purpose: 'Research Equipment',
                      year: '2024'
                    },
                    {
                      donor: 'Alumni Association',
                      amount: '₹20,00,000',
                      purpose: 'Scholarship Fund',
                      year: '2023'
                    }
                  ].map((donation, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold text-gray-900">{donation.donor}</h5>
                          <p className="text-sm text-gray-600 mt-1">{donation.purpose}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{donation.amount}</div>
                          <div className="text-xs text-gray-500">{donation.year}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <h4 className="font-semibold text-blue-900 mb-4">How to Contribute</h4>
                  <div className="space-y-3 text-sm text-blue-800">
                    <div>
                      <strong>Online Transfer:</strong><br/>
                      Account: 1234567890<br/>
                      IFSC: SBIN0001234<br/>
                      Bank: State Bank of India
                    </div>
                    <div>
                      <strong>Cheque/DD:</strong><br/>
                      Payable to "College of Applied Science Alumni Fund"
                    </div>
                    <div>
                      <strong>Contact:</strong><br/>
                      📞 +91-495-2244590<br/>
                      📧 donations@casthamarassery.ac.in
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-3">Current Needs</h4>
                  <ul className="text-sm text-orange-800 space-y-2">
                    <li>• Smart Classroom Equipment</li>
                    <li>• Student Scholarship Fund</li>
                    <li>• Research Lab Upgrades</li>
                    <li>• Sports Facility Enhancement</li>
                    <li>• Campus Infrastructure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'profiles':
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Notable Alumni Profiles</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notableAlumni.map((alumni, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={alumni.image}
                      alt={alumni.name}
                      className="w-full h-56 sm:h-64 object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{alumni.name}</h4>
                    <p className="text-blue-600 font-semibold mb-1">{alumni.position}</p>
                    <p className="text-gray-600 text-sm mb-3">{alumni.batch}</p>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-1 flex items-center">
                        <Award className="h-4 w-4 mr-2 text-yellow-600" />
                        Notable Achievement
                      </h5>
                      <p className="text-gray-700 text-sm">{alumni.achievement}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Nominate an Alumni</h4>
              <p className="text-blue-800 mb-4 text-sm">
                Know an alumni who has made significant contributions? Nominate them to be featured 
                in our notable alumni section.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                Submit Nomination
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Content will be available soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-8">
            <h1 className="text-3xl font-bold mb-2">Alumni</h1>
            <p className="text-blue-100">
              Connect with our proud alumni network and their achievements
            </p>
          </div>

          {/* Navigation */}
          <div className="border-b border-gray-200">
            <div className="px-6">
              <div className="flex flex-wrap -mb-px">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeView === view.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniSection;