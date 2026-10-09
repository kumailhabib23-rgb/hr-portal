import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock3,
  CalendarDays,
  WalletCards,
  Building2,
  ChartNoAxesCombined,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {

  const menuGroups = [
    {
      label: "MAIN",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },

    {
      label: "PEOPLE",
      items: [
        {
          name: "All Employees",
          path: "/employees",
          icon: Users,
        },
        {
          name: "Add Employee",
          path: "/employees/add",
          icon: UserPlus,
        },
        {
          name: "Attendance",
          path: "/attendance",
          icon: Clock3,
        },
        {
          name: "Leave Management",
          path: "/leave",
          icon: CalendarDays,
        },
      ],
    },

    {
      label: "COMPANY",
      items: [
        {
          name: "Payroll",
          path: "/payroll",
          icon: WalletCards,
        },
        {
          name: "Departments",
          path: "/departments",
          icon: Building2,
        },
        {
          name: "Performance",
          path: "/performance",
          icon: ChartNoAxesCombined,
        },
        {
          name: "Documents",
          path: "/documents",
          icon: FileText,
        },
      ],
    },

    {
      label: "SYSTEM",
      items: [
        {
          name: "Reports",
          path: "/reports",
          icon: BarChart3,
        },
        {
          name: "Settings",
          path: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE BUTTON */}

      <button
        onClick={() => setMobileOpen(true)}
        className="
          fixed
          left-4
          top-4
          z-30
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-slate-200
          bg-white
          text-slate-700
          shadow-lg
          lg:hidden
        "
      >
        <LayoutDashboard size={19} />
      </button>

      {/* SIDEBAR */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          flex-col
          overflow-hidden
          border-r
          border-white/10
          bg-[#0b1120]
          dark:bg-black
          text-white
          shadow-2xl
          transition-all
          duration-300
          ease-out

          ${collapsed ? "w-[82px]" : "w-[270px]"}

          max-lg:w-[270px]
          max-lg:-translate-x-full

          ${mobileOpen ? "max-lg:translate-x-0" : ""}
        `}
      >

        {/* BACKGROUND GLOW */}

        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

        {/* LOGO */}

        <div className="relative flex h-[82px] shrink-0 items-center border-b border-white/[0.06] px-5">

          <img
            src="/logo/logo.png"
            alt="Nexora HR logo"
            className="h-12 w-12 shrink-0 rounded-xl object-cover object-[50%_22%] transition-all duration-300"
          />

          {!collapsed && (
            <div className="ml-3 animate-fade-in">

              <h1 className="text-[15px] font-bold tracking-tight">
                NEXORA HR
              </h1>

              <p className="mt-0.5 text-[10px] text-slate-500">
                DIGITAL HR SYSTEM
              </p>

            </div>
          )}

        </div>


        {/* NAVIGATION */}

        <nav className="sidebar-nav relative flex-1 overflow-y-auto px-3 py-5">

          {menuGroups.map((group) => (

            <div key={group.label} className="mb-6">

              {!collapsed && (
                <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-slate-600">
                  {group.label}
                </p>
              )}

              {group.items.map((item) => {

                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      group
                      relative
                      mb-1
                      flex
                      h-11
                      items-center
                      rounded-xl
                      px-3
                      transition-all
                      duration-300

                      ${
                        isActive
                          ? `
                            bg-gradient-to-r
                            from-indigo-500/20
                            to-violet-500/10
                            text-white
                            shadow-lg
                            shadow-indigo-950/20
                          `
                          : `
                            text-slate-400
                            hover:bg-white/[0.05]
                            hover:text-white
                          `
                      }

                      ${collapsed ? "justify-center" : ""}
                    `}
                  >

                    {({ isActive }) => (
                      <>
                        {/* ACTIVE LINE */}

                        {isActive && (
                          <span
                            className="
                              absolute
                              left-0
                              top-1/2
                              h-6
                              w-1
                              -translate-y-1/2
                              rounded-r-full
                              bg-gradient-to-b
                              from-indigo-400
                              to-violet-500
                              shadow-lg
                              shadow-indigo-500/70
                            "
                          />
                        )}

                        {/* ICON */}

                        <span
                          className={`
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            transition-all
                            duration-300

                            ${
                              isActive
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                                : "bg-white/[0.035] text-slate-500 group-hover:bg-white/[0.08] group-hover:text-indigo-300"
                            }
                          `}
                        >
                          <Icon size={16} strokeWidth={1.9} />
                        </span>

                        {!collapsed && (
                          <span className="ml-3 truncate text-[12px] font-medium">
                            {item.name}
                          </span>
                        )}

                        {!collapsed && isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/80" />
                        )}
                      </>
                    )}

                  </NavLink>
                );
              })}

            </div>

          ))}

        </nav>


        {/* PRO CARD */}

        {!collapsed && (
          <div className="relative mx-3 mb-3 overflow-hidden rounded-2xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-4">

            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/10 blur-xl" />

            <div className="relative">

              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <Sparkles size={15} />
              </div>

              <p className="text-[11px] font-semibold text-white">
                HR Analytics
              </p>

              <p className="mt-1 text-[9px] leading-4 text-slate-500">
                Track your workforce performance.
              </p>

            </div>

          </div>
        )}


        {/* USER */}

        <div className="relative border-t border-white/[0.06] p-3">

          <div
            className={`
              flex
              items-center
              rounded-xl
              bg-white/[0.035]
              p-2
              ${collapsed ? "justify-center" : ""}
            `}
          >

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold shadow-lg">
              A
            </div>

            {!collapsed && (
              <div className="ml-3 min-w-0">
                <p className="truncate text-[11px] font-semibold text-white">
                  HR Admin
                </p>

                <p className="mt-0.5 text-[9px] text-slate-500">
                  Administrator
                </p>
              </div>
            )}

          </div>

        </div>


        {/* COLLAPSE */}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="
            absolute
            -right-3
            top-[72px]
            hidden
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            border
            border-indigo-500
            bg-indigo-600
            text-white
            shadow-xl
            transition-all
            hover:border-indigo-400
            hover:bg-indigo-700
            hover:text-white
            lg:flex
          "
        >
          {collapsed ? (
            <ChevronRight size={13} />
          ) : (
            <ChevronLeft size={13} />
          )}
        </button>

      </aside>
    </>
  );
}

export default Sidebar;