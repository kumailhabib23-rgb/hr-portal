import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  ClipboardCheck,
  CalendarDays,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Clock3,
  Building2,
  FileBarChart,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  UserRound,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  /*
  ============================================================
  GET AUTH TOKEN
  ============================================================
  */

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  /*
  ============================================================
  FETCH DASHBOARD
  ============================================================
  */

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/dashboard/summary`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        throw new Error(
          data.message || "Failed to load dashboard"
        );
      }

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load dashboard"
        );
      }

      setDashboard(data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);

      setError(
        err.message ||
          "Unable to connect to the dashboard server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
  ============================================================
  INITIAL LOAD
  ============================================================
  */

  useEffect(() => {
    fetchDashboard();
  }, []);

  /*
  ============================================================
  NAVIGATION
  ============================================================
  */

  const goToAddEmployee = () => {
    window.location.href = "/employees/add";
  };

  const goToEmployees = () => {
    window.location.href = "/employees";
  };

  const goToAttendance = () => {
    window.location.href = "/attendance";
  };

  const goToReports = () => {
    window.location.href = "/reports";
  };

  /*
  ============================================================
  DEFAULT VALUES
  ============================================================
  */

  const statsData = dashboard?.stats || {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    newEmployees: 0,
  };

  const attendance = dashboard?.attendance || {
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0,
    weekly: [],
  };

  const employees = dashboard?.recentEmployees || [];

  /*
  ============================================================
  STAT CARDS
  ============================================================
  */

  const stats = [
    {
      title: "Total Employees",
      value: statsData.totalEmployees,
      change: "Live",
      text: "from database",
      icon: Users,
      color: "blue",
      up: true,
    },
    {
      title: "Active Employees",
      value: statsData.activeEmployees,
      change:
        statsData.totalEmployees > 0
          ? `${Math.round(
              (statsData.activeEmployees /
                statsData.totalEmployees) *
                100
            )}%`
          : "0%",
      text: "of total employees",
      icon: UserCheck,
      color: "emerald",
      up: true,
    },
    {
      title: "On Leave",
      value: statsData.onLeave,
      change:
        statsData.totalEmployees > 0
          ? `${Math.round(
              (statsData.onLeave /
                statsData.totalEmployees) *
                100
            )}%`
          : "0%",
      text: "of total employees",
      icon: CalendarDays,
      color: "amber",
      up: false,
    },
    {
      title: "New Employees",
      value: statsData.newEmployees,
      change: "This month",
      text: "recently joined",
      icon: UserPlus,
      color: "violet",
      up: true,
    },
  ];

  /*
  ============================================================
  COLOR MAP
  ============================================================
  */

  const colorMap = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      glow: "bg-blue-500",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      glow: "bg-emerald-500",
    },

    amber: {
      icon: "bg-amber-50 text-amber-600",
      glow: "bg-amber-500",
    },

    violet: {
      icon: "bg-violet-50 text-violet-600",
      glow: "bg-violet-500",
    },
  };

  /*
  ============================================================
  WEEKLY CHART
  ============================================================
  */

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weeklyChart = useMemo(() => {
    const result = days.map((day) => ({
      day,
      present: 0,
      absent: 0,
      leave: 0,
    }));

    attendance.weekly?.forEach((item) => {
      const dayIndex = days.findIndex(
        (day) =>
          day.toLowerCase() ===
          String(item.day || "")
            .slice(0, 3)
            .toLowerCase()
      );

      if (dayIndex !== -1) {
        result[dayIndex] = {
          day: days[dayIndex],
          present: Number(item.present || 0),
          absent: Number(item.absent || 0),
          leave: Number(item.leaveCount || 0),
        };
      }
    });

    return result;
  }, [attendance.weekly]);

  const maxAttendance = Math.max(
    statsData.totalEmployees,
    ...weeklyChart.map(
      (item) => item.present + item.absent + item.leave
    ),
    10
  );

  /*
  ============================================================
  WORKFORCE
  ============================================================
  */

  const workforce = dashboard?.workforce || {
    fullTime: 0,
    partTime: 0,
    interns: 0,
  };

  const workforceTotal =
    workforce.fullTime +
    workforce.partTime +
    workforce.interns;

  const fullTimeDegree =
    workforceTotal > 0
      ? (workforce.fullTime / workforceTotal) * 360
      : 0;

  const partTimeDegree =
    workforceTotal > 0
      ? (workforce.partTime / workforceTotal) * 360
      : 0;

  const internStart = fullTimeDegree + partTimeDegree;

  /*
  ============================================================
  LOADING SCREEN
  ============================================================
  */

  if (loading) {
    return (
      <div className="dashboard-page min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-[#080d18]">
        <div className="animate-pulse space-y-5">
          <div className="h-20 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div className="h-[450px] rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
            <div className="h-[450px] rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          </div>
        </div>
      </div>
    );
  }

  /*
  ============================================================
  MAIN DASHBOARD
  ============================================================
  */

  return (
    <div className="dashboard-page min-h-full bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8 dark:bg-[#080d18] dark:text-slate-100">
      <div className="mx-auto max-w-[1600px]">

        {/* PAGE TITLE */}

        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
              Workforce overview
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Overview of your organization's workforce and performance.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="group flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : "transition-transform group-hover:rotate-180"
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={goToAddEmployee}
              className="group flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              <UserPlus
                size={16}
                className="transition-transform group-hover:rotate-12"
              />

              Add Employee
            </button>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <div className="flex-1">

              <p className="text-sm font-bold text-red-700">
                Dashboard could not load
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>

            </div>

            <button
              onClick={() => fetchDashboard()}
              className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-200"
            >
              Retry
            </button>

          </div>
        )}

        {/* STATS */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {stats.map((stat, index) => {

            const Icon = stat.icon;

            const colors = colorMap[stat.color];

            return (
              <div
                key={stat.title}
                className="portal-card group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md animate-fade-up dark:border-slate-800 dark:bg-slate-900"
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
              >

                <div className="relative">

                  <div className="mb-5 flex items-center justify-between">

                    <div
                      className={`
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-xl
                        ${colors.icon}
                        transition-all
                        duration-300
                        group-hover:scale-110
                        group-hover:rotate-3
                      `}
                    >
                      <Icon size={20} />
                    </div>

                  </div>

                  <p className="text-xs font-medium text-slate-400">
                    {stat.title}
                  </p>

                  <div className="mt-1 flex items-center gap-2">

                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                      {stat.value}
                    </h2>

                    <span
                      className={`
                        flex
                        items-center
                        gap-0.5
                        rounded-md
                        px-1.5
                        py-1
                        text-[11px]
                        font-bold
                        ${
                          stat.up
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }
                      `}
                    >
                      {stat.up ? (
                        <ArrowUpRight size={10} />
                      ) : (
                        <ArrowDownRight size={10} />
                      )}

                      {stat.change}
                    </span>

                  </div>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {stat.text}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

        {/* MINI STATS */}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

          {[
            [
              "Departments",
              dashboard?.departments || 0,
              Building2,
              "blue",
            ],

            [
              "Present Today",
              attendance.presentToday,
              CheckCircle2,
              "emerald",
            ],

            [
              "Late Today",
              String(attendance.lateToday).padStart(2, "0"),
              Clock3,
              "amber",
            ],

            [
              "Attendance Rate",
              `${attendance.attendanceRate}%`,
              TrendingUp,
              "violet",
            ],
          ].map(([label, value, Icon, color]) => (

            <div
              key={label}
              className="
                group
                portal-card
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-slate-200/80
                bg-white
                p-4
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-lg
              "
            >

              <div
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg

                  ${
                    color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : color === "emerald"
                      ? "bg-emerald-50 text-emerald-600"
                      : color === "amber"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-violet-50 text-violet-600"
                  }
                `}
              >
                <Icon size={16} />
              </div>

              <div>

                <p className="text-[11px] text-slate-400">
                  {label}
                </p>

                <strong className="text-sm font-bold text-slate-800">
                  {value}
                </strong>

              </div>

            </div>

          ))}

        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">

          {/* ATTENDANCE */}

          <div
            className="
              rounded-2xl
              portal-card
              border
              border-slate-200/80
              bg-white
              p-5
              shadow-sm
            "
          >

            <div className="flex items-start justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <h3 className="text-sm font-bold text-slate-800">
                    Attendance Overview
                  </h3>

                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">

                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                    LIVE

                  </span>

                </div>

                <p className="mt-1 text-[11px] text-slate-400">
                  Employee attendance this week
                </p>

              </div>

              <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Last 7 days
              </span>

            </div>

            {/* SUMMARY */}

            <div className="mt-5 flex flex-wrap gap-5">

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">

                <span className="h-2 w-2 rounded-full bg-indigo-500" />

                Present

                <strong className="text-slate-700">
                  {attendance.presentToday}
                </strong>

              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">

                <span className="h-2 w-2 rounded-full bg-red-400" />

                Absent

                <strong className="text-slate-700">
                  {attendance.absentToday}
                </strong>

              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">

                <span className="h-2 w-2 rounded-full bg-amber-400" />

                Leave

                <strong className="text-slate-700">
                  {statsData.onLeave}
                </strong>

              </div>

            </div>

            {/* CHART */}

            <div className="mt-6 flex h-60">

              <div className="flex flex-col justify-between pb-5 pr-3 text-[10px] text-slate-300">

                <span>{maxAttendance}</span>
                <span>{Math.round(maxAttendance * 0.8)}</span>
                <span>{Math.round(maxAttendance * 0.6)}</span>
                <span>{Math.round(maxAttendance * 0.4)}</span>
                <span>{Math.round(maxAttendance * 0.2)}</span>
                <span>0</span>

              </div>

              <div className="relative flex-1">

                <div className="absolute inset-0 flex flex-col justify-between pb-5">

                  {[1, 2, 3, 4, 5, 6].map((line) => (
                    <div
                      key={line}
                      className="border-t border-dashed border-slate-100"
                    />
                  ))}

                </div>

                <div className="relative flex h-full items-end justify-around gap-2 px-2 pb-5">

                  {weeklyChart.map((item) => {
                    const total =
                      item.present + item.absent + item.leave;
                    const height =
                      maxAttendance > 0
                        ? (total / maxAttendance) * 100
                        : 0;

                    return (
                      <div
                        key={item.day}
                        className="group relative flex h-full flex-1 items-end justify-center"
                      >

                        <div className="absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
                          {item.present} present · {item.absent} absent · {item.leave} leave
                        </div>

                        <div
                          className="flex w-7 flex-col-reverse overflow-hidden rounded-t-md transition-[height] duration-500"
                          style={{
                            height: `${height}%`,
                          }}
                        >
                          <div
                            className="bg-indigo-600"
                            style={{
                              height: `${total ? (item.present / total) * 100 : 0}%`,
                            }}
                          />
                          <div
                            className="bg-rose-400"
                            style={{
                              height: `${total ? (item.absent / total) * 100 : 0}%`,
                            }}
                          />
                          <div
                            className="bg-amber-400"
                            style={{
                              height: `${total ? (item.leave / total) * 100 : 0}%`,
                            }}
                          />
                        </div>

                      </div>
                    );
                  })}

                </div>

              </div>

            </div>

            <div className="ml-8 flex justify-around text-[10px] text-slate-400">

              {weeklyChart.map((item) => (
                <span key={item.day}>
                  {item.day}
                </span>
              ))}

            </div>

          </div>

          {/* RECENT EMPLOYEES */}

          <div
            className="
              rounded-2xl
              portal-card
              border
              border-slate-200/80
              bg-white
              p-5
              shadow-sm
            "
          >

            <div className="flex items-start justify-between">

              <div>

                <h3 className="text-sm font-bold text-slate-800">
                  Recent Employees
                </h3>

                <p className="mt-1 text-[11px] text-slate-400">
                  Recently added employees
                </p>

              </div>

              <button
                onClick={goToEmployees}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                View All
                <ArrowUpRight size={12} />
              </button>

            </div>

            <div className="mt-4 divide-y divide-slate-100">

              {employees.length === 0 ? (

                <div className="py-10 text-center">

                  <UserRound
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    No employees found
                  </p>

                </div>

              ) : (

                employees.map((employee, index) => {

                  const firstName =
                    employee.first_name || "";

                  const lastName =
                    employee.last_name || "";

                  const name =
                    `${firstName} ${lastName}`.trim() ||
                    "Unnamed Employee";

                  const initials =
                    `${firstName.charAt(0)}${lastName.charAt(0)}`
                      .toUpperCase() || "EM";

                  const gradients = [
                    "from-blue-500 to-indigo-600",
                    "from-violet-500 to-purple-600",
                    "from-emerald-500 to-teal-600",
                    "from-orange-500 to-amber-500",
                    "from-cyan-500 to-blue-600",
                  ];

                  let time = "";

                  if (employee.joining_date) {
                    const date = new Date(
                      employee.joining_date
                    );

                    if (!Number.isNaN(date.getTime())) {
                      const diff =
                        Math.floor(
                          (Date.now() - date.getTime()) /
                            86400000
                        );

                      if (diff <= 0) {
                        time = "Today";
                      } else if (diff === 1) {
                        time = "Yesterday";
                      } else {
                        time = `${diff} days ago`;
                      }
                    }
                  }

                  return (
                    <div
                      key={employee.id}
                      className="
                        group
                        flex
                        items-center
                        gap-3
                        py-3.5
                        transition-all
                        duration-300
                        hover:translate-x-1
                      "
                    >

                      <div
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-gradient-to-br
                          ${
                            gradients[
                              index % gradients.length
                            ]
                          }
                          text-[11px]
                          font-bold
                          text-white
                          shadow-md
                          transition-transform
                          group-hover:scale-110
                        `}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">

                        <strong className="block truncate text-xs font-bold text-slate-700">
                          {name}
                        </strong>

                        <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                          {employee.position ||
                            employee.department ||
                            "Employee"}
                        </span>

                      </div>

                      <span className="text-[10px] text-slate-400">
                        {time}
                      </span>

                    </div>
                  );
                })
              )}

            </div>

          </div>

        </div>

        {/* BOTTOM */}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* WORKFORCE */}

          <div className="portal-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <h3 className="text-sm font-bold text-slate-800">
              Workforce Summary
            </h3>

            <p className="mt-1 text-[11px] text-slate-400">
              Current employee distribution
            </p>

            <div className="mt-5 flex items-center gap-8">

              <div
                className="
                  relative
                  flex
                  h-28
                  w-28
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                "
                style={{
                  background:
                    workforceTotal > 0
                      ? `conic-gradient(
                          #6366f1 0deg ${fullTimeDegree}deg,
                          #8b5cf6 ${fullTimeDegree}deg ${internStart}deg,
                          #f59e0b ${internStart}deg 360deg
                        )`
                      : "#e2e8f0",
                }}
              >

                <div className="absolute inset-[13px] flex flex-col items-center justify-center rounded-full bg-white">

                  <strong className="text-xl font-black text-slate-800">
                    {workforceTotal}
                  </strong>

                  <span className="text-[9px] text-slate-400">
                    Employees
                  </span>

                </div>

              </div>

              <div className="space-y-3">

                {[
                  [
                    "Full Time",
                    workforce.fullTime,
                    "bg-indigo-500",
                  ],
                  [
                    "Part Time",
                    workforce.partTime,
                    "bg-violet-500",
                  ],
                  [
                    "Interns",
                    workforce.interns,
                    "bg-amber-400",
                  ],
                ].map(([label, value, dot]) => (

                  <div
                    key={label}
                    className="flex items-center gap-2"
                  >

                    <span
                      className={`h-2 w-2 rounded-full ${dot}`}
                    />

                    <span className="text-[11px] text-slate-500">
                      {label}
                    </span>

                    <strong className="text-[11px] text-slate-800">
                      {value}
                    </strong>

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* QUICK ACTIONS */}
          <section className="portal-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Quick actions
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Common workforce tasks
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
              {[
                {
                  label: "Add employee",
                  detail: "Create a staff record",
                  Icon: UserPlus,
                  action: goToAddEmployee,
                },
                {
                  label: "Attendance",
                  detail: "Review today's status",
                  Icon: ClipboardCheck,
                  action: goToAttendance,
                },
                {
                  label: "Reports",
                  detail: "Open workforce reports",
                  Icon: FileBarChart,
                  action: goToReports,
                },
              ].map(({ label, detail, Icon, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {label}
                    </span>
                    <span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {detail}
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;