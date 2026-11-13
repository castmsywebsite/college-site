import React, { useEffect, useState } from "react";
import { Mail, Phone, User, Award, GraduationCap } from "lucide-react";

type GroupedFaculty = {
  [departmentName: string]: StaffItem[];
};

// The updated StaffItem type, which now includes the departmentName from our API
type StaffItem = {
  id?: string;
  name: string;
  position: string;
  qualification: string | null;
  experience: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  achievements: string[] | null;
  category?: string;
  departmentName?: string | null;
  department?: string | null;
};

const AdministrationSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("principal");

  const categories = [
    { id: "principal", label: "Principal" },
    { id: "hods", label: "Heads of Departments" },
    { id: "faculty", label: "Teaching faculty" },
    { id: "non-teaching", label: "Non-Teaching Faculty" },
  ];

  const [staffData, setStaffData] = useState<{
    principal: StaffItem[];
    hods: StaffItem[];
    faculty: GroupedFaculty;
    nonTeaching: StaffItem[];
  }>({
    principal: [],
    hods: [],
    faculty: {},
    nonTeaching: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/administration", {
          method: "GET",
        });
        if (!res.ok) {
          throw new Error(`${res.status}`);
        }
        const rows: StaffItem[] = await res.json();
        if (isCancelled) return;

        // Prepare the new data structure
        const nextData = {
          principal: [] as StaffItem[],
          hods: [] as StaffItem[],
          faculty: {} as GroupedFaculty,
          nonTeaching: [] as StaffItem[],
        };

        // Sort the fetched rows into the correct categories
        for (const row of rows) {
          const category = (row.category || "").toLowerCase();
          switch (category) {
            case "principal":
              nextData.principal.push(row);
              break;
            case "hod":
              nextData.hods.push(row);
              break;
            case "faculty": {
              let deptName = "Others";
              const rawDept = (row.department || row.departmentName || "").trim().toLowerCase();
              if (rawDept.includes("computer")) {
                deptName = "Department of Computer Science";
              } else if (rawDept.includes("english")) {
                deptName = "Department of English";
              } else if (rawDept.includes("commerce")) {
                deptName = "Department of Commerce";
              } else {
                deptName = "Others";
              }

              if (!nextData.faculty[deptName]) {
                nextData.faculty[deptName] = [];
              }
              nextData.faculty[deptName].push(row);
              break;
            }
            case "non-teaching":
              nextData.nonTeaching.push(row);
              break;
          }
        }
        setStaffData(nextData);
      } catch (e: any) {
        console.error("Error fetching administration data:", e);
        if (isCancelled) return;
        setError(e?.message || "Failed to load data");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // A reusable function to render a single staff member's card
  const StaffCard = ({
    person,
    index,
  }: {
    person: StaffItem;
    index: number;
  }) => (
    <div
      key={index}
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative">
        <img
          src={person.image || "/favicon.svg"}
          alt={person.name}
          className="w-full object-cover object-top aspect-square"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{person.name}</h3>
        <p className="text-blue-600 font-semibold mb-3">{person.position}</p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <GraduationCap className="h-4 w-4 mr-2" />
            <span>{person.qualification || "-"}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <User className="h-4 w-4 mr-2" />
            <span>Experience: {person.experience || "-"}</span>
          </div>
        </div>
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center text-gray-600 text-sm">
            <Mail className="h-4 w-4 mr-2" />
            {person.email ? (
              <a
                href={`mailto:${person.email}`}
                className="hover:text-blue-600"
              >
                {person.email}
              </a>
            ) : (
              <span>-</span>
            )}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Phone className="h-4 w-4 mr-2" />
            <span>{person.phone || "-"}</span>
          </div>
        </div>
        {person.achievements && person.achievements.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Key Achievements
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {person.achievements.map((achievement, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // Renders the content based on the selected category
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <p>Loading administration data…</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-12 text-red-600">
          <p>
            {error === "401"
              ? "Please log in to view administration data."
              : "An error occurred while fetching data."}
          </p>
        </div>
      );
    }

    switch (selectedCategory) {
      case "principal":
      case "hods":
      case "non-teaching":
        const data =
          selectedCategory === "principal"
            ? staffData.principal
            : selectedCategory === "hods"
            ? staffData.hods
            : staffData.nonTeaching;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((person, index) => (
              <StaffCard person={person} index={index} />
            ))}
          </div>
        );
      case "faculty": {
        const canonicalOrder = [
          "Department of Computer Science",
          "Department of English",
          "Department of Commerce",
          "Others",
        ];
        const departments = Object.keys(staffData.faculty).sort((a, b) => {
          const idxA = canonicalOrder.indexOf(a);
          const idxB = canonicalOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        });

        return (
          <div className="space-y-12">
            {departments.map((deptName) => (
              <section key={deptName}>
                <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2 mb-6">
                  {deptName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staffData.faculty[deptName].map((person, index) => (
                    <StaffCard key={person.id || index} person={person} index={index} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-8">
            <h1 className="text-3xl font-bold mb-2">Administration</h1>
            <p className="text-blue-100">
              Meet our dedicated team of administrators, faculty, and support
              staff
            </p>
          </div>
          <div className="border-b border-gray-200">
            <div className="px-6">
              <div className="flex flex-wrap -mb-px">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedCategory === category.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default AdministrationSection;
