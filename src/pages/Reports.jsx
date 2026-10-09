import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileBarChart,
  FileText,
  Filter,
  FolderOpen,
  LayoutDashboard,
  MoreVertical,
  Search,
  TrendingUp,
  Users,
  X,
  ChevronDown,
  Eye,
  Trash2,
  Plus,
  PieChart,
  WalletCards,
  UserCheck,
  UserX,
  ClipboardList,
} from "lucide-react";

const departments = [
  "All Departments",
  "Engineering",
  "Human Resources",
  "Marketing",
  "Finance",
  "Operations",
  "Design",
];

const reportTypes = [
  "All Reports",
  "Employee Report",
  "Attendance Report",
  "Leave Report",
  "Payroll Report",
  "Performance Report",
  "Document Report",
];

const initialReports = [
  {
    id: 1,
    name: "Monthly Employee Report",
    type: "Employee Report",
    department: "All Departments",
    period: "September 2026",
    generatedBy: "Admin",
    generatedAt: "09 Sep 2026",
    status: "Ready",
    format: "PDF",
    size: "1.8 MB",
  },
  {
    id: 2,
    name: "Attendance Summary",
    type: "Attendance Report",
    department: "Engineering",
    period: "01 Sep - 09 Sep 2026",
    generatedBy: "HR Manager",
    generatedAt: "09 Sep 2026",
    status: "Ready",
    format: "Excel",
    size: "2.4 MB",
  },
  {
    id: 3,
    name: "Leave Management Report",
    type: "Leave Report",
    department: "Human Resources",
    period: "September 2026",
    generatedBy: "Admin",
    generatedAt: "08 Sep 2026",
    status: "Ready",
    format: "PDF",
    size: "980 KB",
  },
  {
    id: 4,
    name: "Monthly Payroll Report",
    type: "Payroll Report",
    department: "All Departments",
    period: "August 2026",
    generatedBy: "Finance Manager",
    generatedAt: "05 Sep 2026",
    status: "Ready",
    format: "Excel",
    size: "3.1 MB",
  },
  {
    id: 5,
    name: "Employee Performance Review",
    type: "Performance Report",
    department: "Engineering",
    period: "Q3 2026",
    generatedBy: "HR Manager",
    generatedAt: "01 Sep 2026",
    status: "Ready",
    format: "PDF",
    size: "1.2 MB",
  },
  {
    id: 6,
    name: "Document Verification Report",
    type: "Document Report",
    department: "All Departments",
    period: "August 2026",
    generatedBy: "Admin",
    generatedAt: "31 Aug 2026",
    status: "Ready",
    format: "PDF",
    size: "760 KB",
  },
];

const reportCards = [
  {
    title: "Employee Report",
    description: "Employee information and department details",
    icon: Users,
    color: "emerald",
  },
  {
    title: "Attendance Report",
    description: "Attendance, absences and working hours",
    icon: Clock3,
    color: "blue",
  },
  {
    title: "Leave Report",
    description: "Leave requests, approvals and balances",
    icon: CalendarDays,
    color: "amber",
  },
  {
    title: "Payroll Report",
    description: "Salary, deductions and payroll summary",
    icon: WalletCards,
    color: "violet",
  },
  {
    title: "Performance Report",
    description: "Employee performance and evaluations",
    icon: TrendingUp,
    color: "rose",
  },
  {
    title: "Document Report",
    description: "Employee documents and verification status",
    icon: FolderOpen,
    color: "cyan",
  },
];

const colorClasses = {
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    button: "bg-violet-600 hover:bg-violet-700",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
    button: "bg-rose-600 hover:bg-rose-700",
  },
  cyan: {
    bg: "bg-cyan-50",
    icon: "text-cyan-600",
    button: "bg-cyan-600 hover:bg-cyan-700",
  },
};

function StatusBadge({ status }) {
  const isReady = status === "Ready";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isReady
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {isReady ? (
        <CheckCircle2 size={13} />
      ) : (
        <Clock3 size={13} />
      )}
      {status}
    </span>
  );
}

function ReportTypeIcon({ type }) {
  if (type === "Employee Report") {
    return <Users size={20} />;
  }

  if (type === "Attendance Report") {
    return <Clock3 size={20} />;
  }

  if (type === "Leave Report") {
    return <CalendarDays size={20} />;
  }

  if (type === "Payroll Report") {
    return <WalletCards size={20} />;
  }

  if (type === "Performance Report") {
    return <TrendingUp size={20} />;
  }

  return <FileText size={20} />;
}

export default function Reports() {
  const [reports, setReports] = useState(initialReports);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [type, setType] = useState("All Reports");
  const [showGenerate, setShowGenerate] = useState(false);

  const [generateData, setGenerateData] = useState({
    name: "",
    type: "Employee Report",
    department: "All Departments",
    from: "",
    to: "",
    format: "PDF",
  });

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.name.toLowerCase().includes(search.toLowerCase()) ||
        report.type.toLowerCase().includes(search.toLowerCase()) ||
        report.department.toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        department === "All Departments" ||
        report.department === department ||
        report.department === "All Departments";

      const matchesType =
        type === "All Reports" || report.type === type;

      return matchesSearch && matchesDepartment && matchesType;
    });
  }, [reports, search, department, type]);

  const deleteReport = (id) => {
    setReports((prev) => prev.filter((report) => report.id !== id));
  };

  const generateReport = () => {
    if (!generateData.name || !generateData.from || !generateData.to) {
      alert("Please fill all required fields.");
      return;
    }

    const newReport = {
      id: Date.now(),
      name: generateData.name,
      type: generateData.type,
      department: generateData.department,
      period: `${generateData.from} - ${generateData.to}`,
      generatedBy: "Admin",
      generatedAt: "09 Sep 2026",
      status: "Ready",
      format: generateData.format,
      size: "1.0 MB",
    };

    setReports((prev) => [newReport, ...prev]);

    setGenerateData({
      name: "",
      type: "Employee Report",
      department: "All Departments",
      from: "",
      to: "",
      format: "PDF",
    });

    setShowGenerate(false);
  };

  const totalReports = reports.length;
  const readyReports = reports.filter(
    (report) => report.status === "Ready"
  ).length;

  return (
    <div className="reports-page min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-slate-700">Reports</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Generate, manage and download HR reports.
          </p>
        </div>

        <button
          onClick={() => setShowGenerate(true)}
          className="shared-page-action-button flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Generate Report
        </button>
      </div>

      {/* Stats */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Reports
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {totalReports}
              </h3>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <FileBarChart size={22} />
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            All generated reports
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Ready Reports
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {readyReports}
              </h3>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <p className="mt-4 text-xs text-emerald-600">
            Available for download
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Departments
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {departments.length - 1}
              </h3>
            </div>

            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <FolderOpen size={22} />
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Covered in reports
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Report Types
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {reportTypes.length - 1}
              </h3>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <PieChart size={22} />
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Available report categories
          </p>
        </div>
      </div>

      {/* Report Types */}
      <div className="mb-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Generate Reports
            </h2>
            <p className="text-sm text-slate-500">
              Choose a report category to get started.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reportCards.map((card) => {
            const Icon = card.icon;
            const colors = colorClasses[card.color];

            return (
              <div
                key={card.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-xl p-3 ${colors.bg} ${colors.icon}`}
                  >
                    <Icon size={22} />
                  </div>

                  <button
                    onClick={() => {
                      setGenerateData((prev) => ({
                        ...prev,
                        name: card.title,
                        type: card.title,
                      }));
                      setShowGenerate(true);
                    }}
                    className="report-card-primary-button rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-slate-50"
                  >
                    Generate
                  </button>
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {card.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {card.description}
                </p>

                <button
                  onClick={() => {
                    setGenerateData((prev) => ({
                      ...prev,
                      name: card.title,
                      type: card.title,
                    }));
                    setShowGenerate(true);
                  }}
                  className="report-card-create-button mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Create Report
                  <span>→</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table Header */}
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Recent Reports
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and manage your generated reports.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              {/* Search */}
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search reports..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white md:w-64"
                />
              </div>

              {/* Department */}
              <div className="relative">
                <Filter
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-indigo-500"
                >
                  {departments.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* Type */}
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-9 text-sm outline-none focus:border-indigo-500"
                >
                  {reportTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="reports-table-scroll hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Report
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Department
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Period
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Generated
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                        <ReportTypeIcon type={report.type} />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {report.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {report.type} • {report.format} • {report.size}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {report.department}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {report.period}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-700">
                      {report.generatedAt}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      by {report.generatedBy}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={report.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        title="View"
                        className="shared-icon-button rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        title="Download"
                        className="shared-icon-button rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Download size={17} />
                      </button>

                      <button
                        title="Delete"
                        onClick={() => deleteReport(report.id)}
                        className="shared-icon-button rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>

                      <button
                        title="More"
                        className="shared-icon-button rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                      >
                        <MoreVertical size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 lg:hidden">
          {filteredReports.map((report) => (
            <div key={report.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <ReportTypeIcon type={report.type} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {report.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {report.type}
                    </p>
                  </div>
                </div>

                <StatusBadge status={report.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-xs text-slate-400">
                    Department
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {report.department}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Period
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {report.period}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Format
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {report.format}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Size
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {report.size}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <Eye size={16} />
                  View
                </button>

                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  <Download size={16} />
                  Download
                </button>

                <button
                  onClick={() => deleteReport(report.id)}
                  className="rounded-xl border border-red-100 p-2.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileBarChart size={25} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No reports found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Generate Report
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure your report details.
                </p>
              </div>

              <button
                onClick={() => setShowGenerate(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Report Name *
                </label>

                <input
                  type="text"
                  value={generateData.name}
                  onChange={(e) =>
                    setGenerateData({
                      ...generateData,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. September Attendance Report"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Report Type *
                  </label>

                  <select
                    value={generateData.type}
                    onChange={(e) =>
                      setGenerateData({
                        ...generateData,
                        type: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  >
                    {reportTypes
                      .filter((item) => item !== "All Reports")
                      .map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Department
                  </label>

                  <select
                    value={generateData.department}
                    onChange={(e) =>
                      setGenerateData({
                        ...generateData,
                        department: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  >
                    {departments.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    From Date *
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={generateData.from}
                      onChange={(e) =>
                        setGenerateData({
                          ...generateData,
                          from: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    To Date *
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={generateData.to}
                      onChange={(e) =>
                        setGenerateData({
                          ...generateData,
                          to: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Export Format
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {["PDF", "Excel"].map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() =>
                        setGenerateData({
                          ...generateData,
                          format,
                        })
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        generateData.format === format
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowGenerate(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={generateReport}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <FileBarChart size={17} />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}