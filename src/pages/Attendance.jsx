import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Navigation,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* =========================================================
   HELPERS
========================================================= */

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
};

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
};

const formatTime = (value) => {
  if (!value) return "-";

  // Handles MySQL TIME values like 09:15:00
  if (
    typeof value === "string" &&
    /^\d{2}:\d{2}(:\d{2})?$/.test(value)
  ) {
    const [hours, minutes] = value.split(":");

    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEmployeeId = (employee) => {
  return Number(employee.id || employee.employee_id);
};

const getEmployeeName = (employee) => {
  if (employee.name) return employee.name;
  if (employee.full_name) return employee.full_name;

  return `${employee.first_name || ""} ${
    employee.last_name || ""
  }`.trim() || "Unknown Employee";
};

const getEmployeeCode = (employee) => {
  return (
    employee.employee_code ||
    employee.employeeCode ||
    "-"
  );
};

const getDepartment = (employee) => {
  return (
    employee.department_name ||
    employee.department ||
    "Unassigned"
  );
};

const getInitials = (employee) => {
  const first =
    employee.first_name ||
    employee.firstName ||
    "";

  const last =
    employee.last_name ||
    employee.lastName ||
    "";

  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  return getEmployeeName(employee)
    .split(" ")
    .slice(0, 2)
    .map((x) => x.charAt(0))
    .join("")
    .toUpperCase();
};

/* =========================================================
   API
========================================================= */

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed (${response.status})`
    );
  }

  return data;
};

/* =========================================================
   STATUS
========================================================= */

const statusStyles = {
  Present: {
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },

  Late: {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },

  Absent: {
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },

  "Not Marked": {
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-white/5",
    border: "border-slate-200 dark:border-white/10",
    dot: "bg-slate-500",
  },
};

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  title,
  value,
  type,
}) {
  const config = {
    present: "from-emerald-500 to-teal-500",
    late: "from-amber-500 to-orange-500",
    absent: "from-red-500 to-rose-500",
    marked: "from-blue-500 to-indigo-600",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-white/[0.045]">
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${config[type]} opacity-10 blur-2xl`}
      />

      <div className="relative">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${config[type]} text-white`}
        >
          <Icon size={20} />
        </div>

        <p className="mt-5 text-xs text-slate-500 dark:text-slate-500">
          {title}
        </p>

        <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
          {value}
        </h2>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function Attendance() {
  const today = getToday();

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");

  const [locationModal, setLocationModal] =
    useState(null);

  /* =====================================================
     LOAD EMPLOYEES
  ===================================================== */

  const loadEmployees = useCallback(async () => {
    const response = await apiRequest(
      "/employees"
    );

    const list =
      response.employees ||
      response.data ||
      response.results ||
      (Array.isArray(response)
        ? response
        : []);

    setEmployees(list);
  }, []);

  /* =====================================================
     LOAD ATTENDANCE
  ===================================================== */

  const loadAttendance = useCallback(async () => {
    const response = await apiRequest(
      `/attendance?date=${today}`
    );

    const list =
      response.attendance ||
      response.data ||
      response.results ||
      (Array.isArray(response)
        ? response
        : []);

    setAttendance(list);
  }, [today]);

  /* =====================================================
     LOAD ALL
  ===================================================== */

  const loadData = useCallback(
    async (refresh = false) => {
      try {
        setError("");

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        await Promise.all([
          loadEmployees(),
          loadAttendance(),
        ]);
      } catch (err) {
        console.error(
          "Attendance loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load attendance."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadEmployees, loadAttendance]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =====================================================
     DEPARTMENTS
  ===================================================== */

  const departments = useMemo(() => {
    const unique = [
      ...new Set(
        employees.map((employee) =>
          getDepartment(employee)
        )
      ),
    ];

    return [
      "All Departments",
      ...unique,
    ];
  }, [employees]);

  /* =====================================================
     ATTENDANCE MAP
  ===================================================== */

  const attendanceMap = useMemo(() => {
    const map = new Map();

    attendance.forEach((record) => {
      map.set(
        Number(record.employee_id),
        record
      );
    });

    return map;
  }, [attendance]);

  /* =====================================================
     EMPLOYEE ROWS
  ===================================================== */

  const employeeRows = useMemo(() => {
    return employees.map((employee) => {
      const id = getEmployeeId(employee);

      const record = attendanceMap.get(id);

      return {
        ...employee,

        databaseId: id,

        name: getEmployeeName(employee),

        employeeCode:
          getEmployeeCode(employee),

        department:
          getDepartment(employee),

        position:
          employee.position || "-",

        initials:
          getInitials(employee),

        status:
          record?.status || "Not Marked",

        checkIn:
          record
            ? formatTime(record.check_in)
            : "-",

        checkOut:
          record
            ? formatTime(record.check_out)
            : "-",

        location:
          record?.location_address ||
          (record?.check_in_latitude
            ? "GPS Location"
            : "-"),

        latitude:
          record?.check_in_latitude ?? null,

        longitude:
          record?.check_in_longitude ?? null,

        checkOutLatitude:
          record?.check_out_latitude ?? null,

        checkOutLongitude:
          record?.check_out_longitude ?? null,

        attendanceId:
          record?.id ?? null,

        workingHours:
          record?.working_hours ?? null,

        record,
      };
    });
  }, [employees, attendanceMap]);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredEmployees = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return employeeRows.filter(
      (employee) => {
        const departmentMatch =
          selectedDepartment ===
            "All Departments" ||
          employee.department ===
            selectedDepartment;

        const searchMatch =
          !query ||
          employee.name
            .toLowerCase()
            .includes(query) ||
          employee.employeeCode
            .toLowerCase()
            .includes(query) ||
          employee.department
            .toLowerCase()
            .includes(query);

        return (
          departmentMatch &&
          searchMatch
        );
      }
    );
  }, [
    employeeRows,
    selectedDepartment,
    search,
  ]);

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(() => {
    const total = employeeRows.length;

    const present = employeeRows.filter(
      (x) => x.status === "Present"
    ).length;

    const late = employeeRows.filter(
      (x) => x.status === "Late"
    ).length;

    const absent = employeeRows.filter(
      (x) => x.status === "Absent"
    ).length;

    const notMarked = employeeRows.filter(
      (x) => x.status === "Not Marked"
    ).length;

    return {
      total,
      present,
      late,
      absent,
      notMarked,
    };
  }, [employeeRows]);

  /* =====================================================
     GPS
  ===================================================== */

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          latitude: null,
          longitude: null,
        });

        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,
          });
        },
        () => {
          // GPS is optional.
          resolve({
            latitude: null,
            longitude: null,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  /* =====================================================
     CHECK IN
  ===================================================== */

  const handleCheckIn = async (employee) => {
    try {
      setActionLoading(employee.databaseId);
      setError("");

      const location =
        await getLocation();

      await apiRequest(
        "/attendance/check-in",
        {
          method: "POST",

          body: JSON.stringify({
            employee_id:
              employee.databaseId,

            latitude:
              location.latitude,

            longitude:
              location.longitude,

            location_address:
              location.latitude !== null
                ? `GPS: ${location.latitude.toFixed(
                    6
                  )}, ${location.longitude.toFixed(
                    6
                  )}`
                : null,
          }),
        }
      );

      await loadAttendance();
    } catch (err) {
      console.error(
        "Check-in error:",
        err
      );

      setError(
        err.message ||
          "Unable to check in."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =====================================================
     CHECK OUT
  ===================================================== */

  const handleCheckOut = async (employee) => {
    if (!employee.attendanceId) {
      setError(
        "Attendance record not found."
      );

      return;
    }

    try {
      setActionLoading(employee.databaseId);
      setError("");

      const location =
        await getLocation();

      await apiRequest(
        `/attendance/${employee.attendanceId}/check-out`,
        {
          method: "PUT",

          body: JSON.stringify({
            latitude:
              location.latitude,

            longitude:
              location.longitude,

            location_address:
              location.latitude !== null
                ? `GPS: ${location.latitude.toFixed(
                    6
                  )}, ${location.longitude.toFixed(
                    6
                  )}`
                : null,
          }),
        }
      );

      await loadAttendance();
    } catch (err) {
      console.error(
        "Check-out error:",
        err
      );

      setError(
        err.message ||
          "Unable to check out."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =====================================================
     ACTION
  ===================================================== */

  const handleAttendanceAction = async (
    employee
  ) => {
    if (
      employee.status === "Present" ||
      employee.status === "Late"
    ) {
      await handleCheckOut(employee);
    } else {
      await handleCheckIn(employee);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-[#070b14] dark:text-white">
        <div className="text-center">
          <Loader2
            size={35}
            className="mx-auto animate-spin text-blue-400"
          />

          <p className="mt-4 text-sm font-semibold">
            Loading attendance...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-[#070b14] dark:text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-600">
              <span>HR Portal</span>
              <ChevronRight size={13} />
              <span className="text-slate-700 dark:text-slate-400">
                Attendance
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600">
                <CalendarDays size={22} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Attendance
                  </h1>

                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-400">
                    LIVE
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-500">
                  Monitor employee attendance,
                  check-ins and locations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.045]">
            <CalendarDays
              size={18}
              className="text-blue-400"
            />

            <div>
              <p className="text-[9px] uppercase text-slate-500 dark:text-slate-600">
                Today
              </p>

              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {formatDate(today)}
              </p>
            </div>

            <button
              onClick={() =>
                loadData(true)
              }
              disabled={refreshing}
              className="ml-3 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={17} />

            <span>{error}</span>

            <button
              className="ml-auto text-lg"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* STATS */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={CheckCircle2}
            title="Present Today"
            value={stats.present}
            type="present"
          />

          <StatCard
            icon={Clock3}
            title="Late Arrivals"
            value={stats.late}
            type="late"
          />

          <StatCard
            icon={XCircle}
            title="Absent"
            value={stats.absent}
            type="absent"
          />

          <StatCard
            icon={AlertCircle}
            title="Not Marked"
            value={stats.notMarked}
            type="marked"
          />
        </div>

        {/* DEPARTMENTS */}

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-bold">
            Attendance by Department
          </h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {departments.map(
              (department) => (
                <button
                  key={department}
                  onClick={() =>
                    setSelectedDepartment(
                      department
                    )
                  }
                  className={`whitespace-nowrap rounded-xl border px-4 py-3 text-xs font-semibold transition ${
                    selectedDepartment ===
                    department
                      ? "border-blue-500/30 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                  }`}
                >
                  <Users
                    size={14}
                    className="mr-2 inline"
                  />

                  {department}
                </button>
              )
            )}
          </div>
        </div>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.035]">

          {/* TABLE HEADER */}

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {selectedDepartment}
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-600">
                {filteredEmployees.length} employees
              </p>
            </div>

            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-white/10 dark:bg-white/[0.035]">
              <Search
                size={16}
                className="mr-2 text-slate-500 dark:text-slate-600"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search employee..."
                className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-600 sm:w-64"
              />
            </div>
          </div>

          {/* DESKTOP */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-white/10">
                  <th className="px-6 py-4 text-[9px] uppercase text-slate-600">
                    Employee
                  </th>

                  <th className="px-6 py-4 text-[9px] uppercase text-slate-600">
                    Department
                  </th>

                  <th className="px-6 py-4 text-[9px] uppercase text-slate-600">
                    Check In
                  </th>

                  <th className="px-6 py-4 text-[9px] uppercase text-slate-600">
                    Check Out
                  </th>

                  <th className="px-6 py-4 text-[9px] uppercase text-slate-600">
                    Location
                  </th>

                  <th className="px-6 py-4 text-[9px] uppercase text-slate-600">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-[9px] uppercase text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map(
                  (employee) => {
                    const status =
                      statusStyles[
                        employee.status
                      ] ||
                      statusStyles[
                        "Not Marked"
                      ];

                    const isLoading =
                      actionLoading ===
                      employee.databaseId;

                    return (
                      <tr
                        key={
                          employee.databaseId
                        }
                        className="border-b border-white/5 hover:bg-white/[0.025]"
                      >
                        {/* EMPLOYEE */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-300">
                              {
                                employee.initials
                              }
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-200">
                                {
                                  employee.name
                                }
                              </p>

                              <p className="text-[10px] text-slate-600">
                                {
                                  employee.employeeCode
                                }{" "}
                                ·{" "}
                                {
                                  employee.position
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* DEPARTMENT */}

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-white/5 px-3 py-1.5 text-[10px] text-slate-400">
                            {
                              employee.department
                            }
                          </span>
                        </td>

                        {/* CHECK IN */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock3
                              size={14}
                            />

                            {
                              employee.checkIn
                            }
                          </div>
                        </td>

                        {/* CHECK OUT */}

                        <td className="px-6 py-4 text-xs text-slate-400">
                          {
                            employee.checkOut
                          }
                        </td>

                        {/* LOCATION */}

                        <td className="px-6 py-4">
                          {employee.location !==
                          "-" ? (
                            <button
                              onClick={() =>
                                setLocationModal(
                                  employee
                                )
                              }
                              className="flex items-center gap-2 rounded-lg bg-blue-500/5 px-3 py-2 text-[10px] font-semibold text-blue-400"
                            >
                              <MapPin
                                size={13}
                              />

                              View Location
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-700">
                              Not available
                            </span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${status.bg} ${status.border} ${status.text}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                            />

                            {
                              employee.status
                            }
                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                handleAttendanceAction(
                                  employee
                                )
                              }
                              disabled={
                                isLoading ||
                                employee.status ===
                                  "Absent"
                              }
                              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isLoading ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : employee.status ===
                                  "Present" ||
                                employee.status ===
                                  "Late" ? (
                                <LogOut
                                  size={13}
                                />
                              ) : (
                                <LogIn
                                  size={13}
                                />
                              )}

                              {isLoading
                                ? "Processing..."
                                : employee.status ===
                                    "Present" ||
                                  employee.status ===
                                    "Late"
                                ? "Check Out"
                                : "Check In"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}

          <div className="lg:hidden">
            {filteredEmployees.map(
              (employee) => {
                const status =
                  statusStyles[
                    employee.status
                  ] ||
                  statusStyles[
                    "Not Marked"
                  ];

                const isLoading =
                  actionLoading ===
                  employee.databaseId;

                return (
                  <div
                    key={
                      employee.databaseId
                    }
                    className="border-b border-white/5 p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-300">
                          {
                            employee.initials
                          }
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {
                              employee.name
                            }
                          </p>

                          <p className="text-[10px] text-slate-600">
                            {
                              employee.employeeCode
                            }
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] ${status.bg} ${status.border} ${status.text}`}
                      >
                        {
                          employee.status
                        }
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/[0.025] p-3">
                        <p className="text-[9px] uppercase text-slate-700">
                          Check In
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            employee.checkIn
                          }
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.025] p-3">
                        <p className="text-[9px] uppercase text-slate-700">
                          Check Out
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            employee.checkOut
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {employee.location !==
                        "-" && (
                        <button
                          onClick={() =>
                            setLocationModal(
                              employee
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500/5 py-3 text-xs text-blue-400"
                        >
                          <Navigation
                            size={14}
                          />
                          Location
                        </button>
                      )}

                      <button
                        onClick={() =>
                          handleAttendanceAction(
                            employee
                          )
                        }
                        disabled={
                          isLoading ||
                          employee.status ===
                            "Absent"
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        ) : employee.status ===
                            "Present" ||
                          employee.status ===
                            "Late" ? (
                          <LogOut
                            size={14}
                          />
                        ) : (
                          <LogIn
                            size={14}
                          />
                        )}

                        {employee.status ===
                            "Present" ||
                          employee.status ===
                            "Late"
                          ? "Check Out"
                          : "Check In"}
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* EMPTY */}

          {filteredEmployees.length ===
            0 && (
            <div className="p-16 text-center">
              <Search
                size={28}
                className="mx-auto text-slate-700"
              />

              <p className="mt-4 text-sm font-semibold text-slate-400">
                No employees found
              </p>
            </div>
          )}
        </section>

        {/* LOCATION INFO */}

        <div className="mt-6 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Navigation size={19} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-blue-200">
                Location-Based Attendance
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Employee check-in and check-out
                can capture the device GPS
                coordinates and save them in
                the HR Portal database.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-center gap-2 py-6 text-[9px] text-slate-700">
          <ShieldCheck size={13} />
          Attendance records are securely
          managed by HR Portal
        </div>
      </div>

      {/* LOCATION MODAL */}

      {locationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() =>
            setLocationModal(null)
          }
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101621] p-6 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Attendance Location
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {
                    locationModal.name
                  }
                </p>
              </div>

              <button
                onClick={() =>
                  setLocationModal(null)
                }
                className="text-xl text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-[9px] uppercase text-slate-500">
                  Location
                </p>

                <p className="mt-1 text-sm text-white">
                  {
                    locationModal.location
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-[9px] uppercase text-slate-500">
                    Latitude
                  </p>

                  <p className="mt-1 text-xs text-slate-300">
                    {
                      locationModal.latitude ??
                      "-"
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-[9px] uppercase text-slate-500">
                    Longitude
                  </p>

                  <p className="mt-1 text-xs text-slate-300">
                    {
                      locationModal.longitude ??
                      "-"
                    }
                  </p>
                </div>
              </div>

              {locationModal.latitude !==
                null &&
                locationModal.longitude !==
                  null && (
                  <a
                    href={`https://www.google.com/maps?q=${locationModal.latitude},${locationModal.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white"
                  >
                    <MapPin
                      size={15}
                    />
                    Open in Google Maps
                  </a>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}