import { useState } from "react";
import { Route, Routes } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import SplashScreen from "./pages/SplashScreen";
import Profile from "./pages/profile";
import Settings from "./pages/Settings";
import AllEmployees from "./pages/Employees/AllEmployees";
import AddEmployee from "./pages/Employees/AddEmployee";
import Attendance from "./pages/Attendance";
import LeaveManagement from "./pages/LeaveManagement";
import Payroll from "./pages/Payroll";
import Departments from "./pages/Departments";
import Performance from "./pages/Performance";
import Documents from   "./pages/Documents";
import Reports from "./pages/Reports";


function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <div className="portal min-h-screen bg-[#f6f8fc] dark:bg-black">
            <Sidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
            />
            <main className={`min-h-screen transition-all duration-300 ${collapsed ? "lg:ml-[82px]" : "lg:ml-[270px]"}`}>
              <Header onMenuClick={() => setMobileOpen(true)} />
              <div className="content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/employees" element={<AllEmployees />} />
                  <Route path="/employees/add" element={<AddEmployee />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/leave" element={<LeaveManagement />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/documents" element={<Documents />} />
                </Routes>
              </div>
            </main>
          </div>
        }
      />
    </Routes>
  );
}

export default App;