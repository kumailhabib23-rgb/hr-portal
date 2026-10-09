import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, logout } from "../utils/auth";
import {
  Bell,
  ChevronDown,
  Command,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";

import { useTheme } from "../context/useTheme";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const notificationTone = {
  Info: "bg-blue-500",
  Success: "bg-emerald-500",
  Warning: "bg-amber-500",
  Error: "bg-rose-500",
};

const formatNotificationTime = (value) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";

  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

function Header({ onMenuClick }) {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      const token = getToken();
      if (!token) {
        setNotificationsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load notifications");
        }

        if (active) {
          setNotifications(data.notifications || []);
          setUnreadCount(Number(data.unreadCount || 0));
        }
      } catch (error) {
        console.error("Notification loading error:", error);
      } finally {
        if (active) setNotificationsLoading(false);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const markNotificationRead = async (notification) => {
    if (notification.is_read) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notification.id}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      if (!response.ok) throw new Error("Failed to update notification");

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: 1 } : item
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Notification update error:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!response.ok) throw new Error("Failed to update notifications");

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: 1 }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Notification update error:", error);
    }
  };

  /* =====================================
     CLOSE PROFILE WHEN CLICKING OUTSIDE
  ===================================== */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =====================================
     HEADER
  ===================================== */

  return (
    <header className="sticky top-0 z-50">

      {/* =================================
          ANIMATED TOP LINE
      ================================= */}

      <div className="h-[2px] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <div
          className="
            h-full
            w-1/3
            animate-[headerGlow_4s_linear_infinite]
            bg-gradient-to-r
            from-blue-500
            via-indigo-500
            to-violet-500
          "
        />
      </div>

      {/* =================================
          HEADER CONTAINER
      ================================= */}

      <div
        className="
          relative
          border-b
          border-slate-200/70
          bg-white/85
          backdrop-blur-2xl

          transition-colors
          duration-300

          dark:border-slate-800
          dark:bg-black
        "
      >

        {/* =================================
            BACKGROUND GLOW
        ================================= */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div
            className="
              absolute
              -right-20
              -top-24
              h-48
              w-48
              animate-pulse
              rounded-full
              bg-blue-400/10
              blur-3xl
              dark:bg-blue-600/10
            "
          />

          <div
            className="
              absolute
              right-1/3
              top-0
              h-32
              w-32
              rounded-full
              bg-violet-400/5
              blur-3xl
              dark:bg-violet-600/10
            "
          />

        </div>

        {/* =================================
            MAIN HEADER
        ================================= */}

        <div
          className="
            relative
            flex
            h-[78px]
            items-center
            justify-between
            px-4
            sm:px-6
            lg:px-8
          "
        >

          {/* =================================
              LEFT SIDE
          ================================= */}

          <div className="flex items-center gap-4">

            {/* MOBILE MENU */}

            <button
              onClick={onMenuClick}
              aria-label="Open menu"
              className="
                group
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl

                border
                border-slate-200
                bg-white

                text-slate-600

                shadow-sm

                transition-all
                duration-300

                hover:-translate-y-0.5
                hover:border-blue-300
                hover:bg-blue-50
                hover:text-blue-600
                hover:shadow-lg
                hover:shadow-blue-100

                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-300

                dark:hover:border-blue-700
                dark:hover:bg-blue-950/50
                dark:hover:text-blue-400

                lg:hidden
              "
            >
              <Menu
                className="
                  h-5
                  w-5
                  transition-transform
                  duration-300
                  group-hover:rotate-90
                "
              />
            </button>

            {/* PAGE TITLE */}

            <div>

              <div className="flex items-center gap-2">

                <h1
                  className="
                    text-xl
                    font-bold
                    tracking-tight

                    text-slate-800

                    sm:text-2xl

                    dark:text-white
                  "
                >
                  HR Dashboard
                </h1>

                {/* LIVE BADGE */}

                <span
                  className="
                    hidden
                    items-center
                    gap-1

                    rounded-full
                    border
                    border-blue-100
                    bg-blue-50

                    px-2
                    py-1

                    text-[9px]
                    font-bold
                    text-blue-600

                    sm:flex

                    dark:border-blue-900
                    dark:bg-blue-950/50
                    dark:text-blue-400
                  "
                >
                  <Sparkles className="h-3 w-3" />

                  LIVE
                </span>

              </div>

              <p
                className="
                  mt-1
                  hidden
                  text-xs
                  text-slate-400

                  sm:block

                  dark:text-slate-500
                "
              >
                Manage your workforce efficiently
              </p>

            </div>

          </div>

          {/* =================================
              RIGHT SIDE
          ================================= */}

          <div className="flex items-center gap-2 sm:gap-3">

            {/* =================================
                DESKTOP SEARCH
            ================================= */}

            <div className="hidden md:block">

              <div
                className="
                  group
                  flex
                  h-11
                  w-56
                  items-center
                  gap-2

                  rounded-xl

                  border
                  border-slate-200

                  bg-slate-50/80

                  px-3

                  transition-all
                  duration-500

                  focus-within:w-72
                  focus-within:border-blue-300
                  focus-within:bg-white
                  focus-within:shadow-lg
                  focus-within:shadow-blue-100/50

                  dark:border-slate-700
                  dark:bg-slate-900/70

                  dark:focus-within:border-blue-600
                  dark:focus-within:bg-slate-900
                  dark:focus-within:shadow-blue-950/40
                "
              >

                <Search
                  className="
                    h-[18px]
                    w-[18px]

                    text-slate-400

                    transition-all
                    duration-300

                    group-focus-within:scale-110
                    group-focus-within:text-blue-500

                    dark:text-slate-500
                    dark:group-focus-within:text-blue-400
                  "
                />

                <input
                  type="text"
                  placeholder="Search employees..."
                  className="
                    w-full
                    bg-transparent

                    text-sm
                    text-slate-700

                    outline-none

                    placeholder:text-slate-400

                    dark:text-slate-200
                    dark:placeholder:text-slate-600
                  "
                />

                <div
                  className="
                    hidden
                    items-center
                    gap-1

                    rounded-md

                    border
                    border-slate-200
                    bg-white

                    px-1.5
                    py-1

                    text-[9px]
                    font-medium
                    text-slate-400

                    lg:flex

                    dark:border-slate-700
                    dark:bg-slate-800
                    dark:text-slate-500
                  "
                >
                  <Command className="h-3 w-3" />

                  K
                </div>

              </div>

            </div>

            {/* =================================
                MOBILE SEARCH BUTTON
            ================================= */}

            <button
              onClick={() => setMobileSearch(!mobileSearch)}
              aria-label="Search"
              className="
                group
                flex
                h-11
                w-11
                items-center
                justify-center

                rounded-xl

                border
                border-slate-200
                bg-white

                text-slate-500

                shadow-sm

                transition-all
                duration-300

                hover:-translate-y-1
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-600
                hover:shadow-lg

                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-400

                dark:hover:border-blue-700
                dark:hover:bg-blue-950/50
                dark:hover:text-blue-400

                md:hidden
              "
            >
              {mobileSearch ? (
                <X className="h-5 w-5" />
              ) : (
                <Search
                  className="
                    h-5
                    w-5
                    transition-transform
                    duration-300
                    group-hover:scale-110
                  "
                />
              )}
            </button>

            {/* =================================
                DARK / LIGHT MODE
            ================================= */}

            <button
              onClick={toggleTheme}
              title={
                darkMode
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
              aria-label="Toggle theme"
              className="
                group
                relative
                flex
                h-11
                w-11
                items-center
                justify-center

                overflow-hidden
                rounded-xl

                border
                border-slate-200
                bg-white

                text-slate-500

                shadow-sm

                transition-all
                duration-300

                hover:-translate-y-1
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-600
                hover:shadow-lg
                hover:shadow-blue-100

                dark:border-slate-700
                dark:bg-slate-900
                dark:text-yellow-400

                dark:hover:border-slate-600
                dark:hover:bg-slate-800
                dark:hover:text-yellow-300
                dark:hover:shadow-black/30
              "
            >

              {/* Glow */}

              <span
                className="
                  absolute
                  inset-0
                  rounded-xl

                  bg-gradient-to-br
                  from-blue-500/10
                  to-violet-500/10

                  opacity-0

                  transition-opacity
                  duration-300

                  group-hover:opacity-100
                "
              />

              {/* Icon */}

              <span
                key={darkMode ? "dark" : "light"}
                className="
                  relative
                  animate-[themePop_.3s_ease-out]
                "
              >
                {darkMode ? (
                  <Sun className="h-[19px] w-[19px]" />
                ) : (
                  <Moon className="h-[19px] w-[19px]" />
                )}
              </span>

            </button>

            {/* =================================
                NOTIFICATION
            ================================= */}

            <div ref={notificationRef} className="relative">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
                className="
                group
                relative
                flex
                h-11
                w-11
                items-center
                justify-center

                rounded-xl

                border
                border-slate-200
                bg-white

                text-slate-500

                shadow-sm

                transition-all
                duration-300

                hover:-translate-y-1
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-600
                hover:shadow-lg
                hover:shadow-blue-100

                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-400

                dark:hover:border-blue-700
                dark:hover:bg-blue-950/50
                dark:hover:text-blue-400
              "
              >

              <Bell
                className="
                  h-[19px]
                  w-[19px]

                  transition-all
                  duration-300

                  group-hover:rotate-12
                  group-hover:scale-110
                "
              />

              {/* Ping */}

              <span
                className="
                  absolute
                  right-2
                  top-2

                  flex
                  h-2.5
                  w-2.5
                  items-center
                  justify-center
                "
              >
                <span
                  className="
                    absolute
                    h-full
                    w-full
                    animate-ping
                    rounded-full
                    bg-red-400
                    opacity-75
                  "
                />

                <span
                  className="
                    relative
                    h-2
                    w-2
                    rounded-full
                    bg-red-500
                    ring-2
                    ring-white

                    dark:ring-slate-900
                  "
                />
              </span>

              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 top-[58px] z-50 w-[min(360px,calc(100vw-2rem))] origin-top-right animate-[profileDrop_.25s_ease-out] rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-300/30 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/50"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h2>
                      <p className="mt-0.5 text-[10px] text-slate-400">You have {notifications.length} new updates</p>
                    </div>
                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">NEW</span>
                  </div>

                  <div className="mt-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map((notification) => (
                      <button
                        type="button"
                        key={notification.title}
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      >
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.tone}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{notification.title}</span>
                          <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{notification.detail}</span>
                          <span className="mt-1.5 block text-[10px] text-slate-400">{notification.time}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="mt-1 w-full rounded-xl px-3 py-2.5 text-center text-[11px] font-bold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>

            {/* =================================
                PROFILE
            ================================= */}

            <div
              ref={profileRef}
              className="relative"
            >

              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="
                  group
                  flex
                  items-center
                  gap-2
                  rounded-2xl
                  p-1.5

                  transition-all
                  duration-300

                  hover:bg-slate-100

                  dark:hover:bg-slate-800
                "
              >

                {/* AVATAR */}

                <div
                  className="
                    relative
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center

                    overflow-hidden
                    rounded-xl

                    bg-gradient-to-br
                    from-blue-600
                    via-indigo-600
                    to-violet-600

                    text-sm
                    font-bold
                    text-white

                    shadow-lg
                    shadow-blue-200

                    transition-all
                    duration-300

                    group-hover:scale-105
                    group-hover:shadow-xl

                    dark:shadow-blue-950/40
                  "
                >

                  {/* SHINE */}

                  <div
                    className="
                      absolute
                      -left-10
                      top-0

                      h-full
                      w-8

                      rotate-12

                      bg-white/30
                      blur-sm

                      transition-all
                      duration-700

                      group-hover:left-14
                    "
                  />

                  A

                  {/* ONLINE */}

                  <span
                    className="
                      absolute
                      bottom-0
                      right-0

                      h-3
                      w-3

                      rounded-full

                      border-2
                      border-white

                      bg-emerald-500

                      dark:border-slate-900
                    "
                  />

                </div>

                {/* USER INFO */}

                <div className="hidden text-left sm:block">

                  <p
                    className="
                      text-xs
                      font-bold
                      text-slate-800

                      dark:text-slate-100
                    "
                  >
                    HR Admin
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-[10px]
                      text-slate-400

                      dark:text-slate-500
                    "
                  >
                    Administrator
                  </p>

                </div>

                {/* ARROW */}

                <ChevronDown
                  className={`
                    hidden
                    h-4
                    w-4
                    text-slate-400

                    transition-transform
                    duration-300

                    sm:block

                    ${
                      profileOpen
                        ? "rotate-180"
                        : ""
                    }

                    dark:text-slate-500
                  `}
                />

              </button>

              {/* =================================
                  PROFILE DROPDOWN
              ================================= */}

              {profileOpen && (

                <div
                  className="
                    absolute
                    right-0
                    top-[58px]

                    w-72

                    origin-top-right

                    animate-[profileDrop_.25s_ease-out]

                    rounded-2xl

                    border
                    border-slate-200

                    bg-white/95

                    p-2

                    shadow-2xl
                    shadow-slate-300/30

                    backdrop-blur-xl

                    dark:border-slate-700
                    dark:bg-slate-900/95
                    dark:shadow-black/50
                  "
                >

                  {/* PROFILE HEADER */}

                  <div
                    className="
                      relative
                      mb-2
                      overflow-hidden

                      rounded-xl

                      bg-gradient-to-br
                      from-blue-50
                      via-indigo-50
                      to-violet-50

                      p-4

                      dark:from-blue-950/50
                      dark:via-indigo-950/40
                      dark:to-violet-950/40
                    "
                  >

                    <div
                      className="
                        absolute
                        -right-8
                        -top-8

                        h-24
                        w-24

                        rounded-full

                        bg-blue-400/10

                        blur-2xl
                      "
                    />

                    <div className="relative flex items-center gap-3">

                      {/* Avatar */}

                      <div
                        className="
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center

                          rounded-xl

                          bg-gradient-to-br
                          from-blue-600
                          to-violet-600

                          font-bold
                          text-white

                          shadow-lg
                          shadow-blue-200

                          dark:shadow-blue-950/50
                        "
                      >
                        A
                      </div>

                      {/* Details */}

                      <div>

                        <p
                          className="
                            text-sm
                            font-bold
                            text-slate-800

                            dark:text-white
                          "
                        >
                          HR Admin
                        </p>

                        <p
                          className="
                            text-xs
                            text-slate-400

                            dark:text-slate-500
                          "
                        >
                          admin@hrportal.com
                        </p>

                        <div
                          className="
                            mt-1
                            flex
                            items-center
                            gap-1

                            text-[9px]
                            font-medium
                            text-emerald-600

                            dark:text-emerald-400
                          "
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                          Online
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* MY PROFILE */}

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/profile");
                    }}
                    className="
                      group
                      flex
                      w-full
                      items-center
                      gap-3

                      rounded-xl

                      px-3
                      py-3

                      text-sm
                      text-slate-600

                      transition-all
                      duration-200

                      hover:translate-x-1
                      hover:bg-blue-50
                      hover:text-blue-600

                      dark:text-slate-300
                      dark:hover:bg-blue-950/50
                      dark:hover:text-blue-400
                    "
                  >

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center

                        rounded-lg

                        bg-slate-100

                        transition

                        group-hover:bg-blue-100

                        dark:bg-slate-800
                        dark:group-hover:bg-blue-900/50
                      "
                    >
                      <User className="h-4 w-4" />
                    </span>

                    <span className="font-medium">
                      My Profile
                    </span>

                  </button>

                  {/* SETTINGS */}

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/settings");
                    }}
                    className="
                      group
                      flex
                      w-full
                      items-center
                      gap-3

                      rounded-xl

                      px-3
                      py-3

                      text-sm
                      text-slate-600

                      transition-all
                      duration-200

                      hover:translate-x-1
                      hover:bg-blue-50
                      hover:text-blue-600

                      dark:text-slate-300
                      dark:hover:bg-blue-950/50
                      dark:hover:text-blue-400
                    "
                  >

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center

                        rounded-lg

                        bg-slate-100

                        transition

                        group-hover:bg-blue-100

                        dark:bg-slate-800
                        dark:group-hover:bg-blue-900/50
                      "
                    >
                      <Settings className="h-4 w-4" />
                    </span>

                    <span className="font-medium">
                      Settings
                    </span>

                  </button>

                  {/* DIVIDER */}

                  <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                  {/* LOGOUT */}

                  <button
                 type="button"
  onClick={logout}
  className="
                      group
                      flex
                      w-full
                      items-center
                      gap-3

                      rounded-xl

                      px-3
                      py-3

                      text-sm
                      text-red-500

                      transition-all
                      duration-200

                      hover:translate-x-1
                      hover:bg-red-50

                      dark:hover:bg-red-950/30
                    "
                  >

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center

                        rounded-lg

                        bg-red-50

                        dark:bg-red-950/30
                      "
                    >
                      <LogOut className="h-4 w-4" />
                    </span>

                    <span className="font-medium">
                      Logout
                    </span>

                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

        {/* =================================
            MOBILE SEARCH
        ================================= */}

        {mobileSearch && (

          <div
            className="
              border-t
              border-slate-100

              px-4
              py-3

              animate-[searchDrop_.2s_ease-out]

              dark:border-slate-800

              md:hidden
            "
          >

            <div
              className="
                group
                flex
                h-11
                items-center
                gap-2

                rounded-xl

                border
                border-slate-200

                bg-slate-50

                px-3

                shadow-sm

                focus-within:border-blue-300
                focus-within:bg-white
                focus-within:shadow-blue-100

                dark:border-slate-700
                dark:bg-slate-900

                dark:focus-within:border-blue-600
              "
            >

              <Search
                className="
                  h-4
                  w-4

                  text-slate-400

                  group-focus-within:text-blue-500
                "
              />

              <input
                autoFocus
                type="text"
                placeholder="Search employees..."
                className="
                  w-full
                  bg-transparent

                  text-sm
                  text-slate-700

                  outline-none

                  placeholder:text-slate-400

                  dark:text-slate-200
                  dark:placeholder:text-slate-600
                "
              />

            </div>

          </div>

        )}

      </div>

    </header>
  );
}

export default Header;