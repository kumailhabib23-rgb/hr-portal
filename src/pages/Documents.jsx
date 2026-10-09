import { useMemo, useState } from "react";
import {
  Search,
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Users,
  FolderOpen,
  Clock3,
  CheckCircle2,
  HardDrive,
  ChevronDown,
  X,
} from "lucide-react";

const departments = [
  { name: "All Departments", count: 48 },
  { name: "Engineering", count: 12 },
  { name: "Human Resources", count: 6 },
  { name: "Marketing", count: 8 },
  { name: "Finance", count: 7 },
  { name: "Operations", count: 9 },
  { name: "Design", count: 6 },
];

const categories = [
  "All Documents",
  "Personal",
  "Contracts",
  "Payroll",
  "Attendance",
  "Performance",
  "Other",
];

const initialDocuments = [
  {
    id: "DOC-001",
    name: "Ahmed_Khan_Contract.pdf",
    employee: "Ahmed Khan",
    employeeId: "EMP-001",
    initials: "AK",
    department: "Engineering",
    category: "Contracts",
    type: "PDF",
    size: "2.4 MB",
    uploaded: "28 Aug 2026",
    status: "Verified",
  },
  {
    id: "DOC-002",
    name: "Bilal_CNIC.pdf",
    employee: "Bilal Shah",
    employeeId: "EMP-007",
    initials: "BS",
    department: "Engineering",
    category: "Personal",
    type: "PDF",
    size: "1.8 MB",
    uploaded: "27 Aug 2026",
    status: "Verified",
  },
  {
    id: "DOC-003",
    name: "Sara_Employment_Letter.docx",
    employee: "Sara Hassan",
    employeeId: "EMP-002",
    initials: "SH",
    department: "Human Resources",
    category: "Contracts",
    type: "DOCX",
    size: "845 KB",
    uploaded: "26 Aug 2026",
    status: "Verified",
  },
  {
    id: "DOC-004",
    name: "Fatima_Salary_Slip.pdf",
    employee: "Fatima Noor",
    employeeId: "EMP-008",
    initials: "FN",
    department: "Human Resources",
    category: "Payroll",
    type: "PDF",
    size: "620 KB",
    uploaded: "25 Aug 2026",
    status: "Pending",
  },
  {
    id: "DOC-005",
    name: "Muhammad_Performance.xlsx",
    employee: "Muhammad Ali",
    employeeId: "EMP-003",
    initials: "MA",
    department: "Marketing",
    category: "Performance",
    type: "XLSX",
    size: "1.2 MB",
    uploaded: "24 Aug 2026",
    status: "Verified",
  },
  {
    id: "DOC-006",
    name: "Ayesha_CNIC.pdf",
    employee: "Ayesha Malik",
    employeeId: "EMP-004",
    initials: "AM",
    department: "Finance",
    category: "Personal",
    type: "PDF",
    size: "1.5 MB",
    uploaded: "23 Aug 2026",
    status: "Verified",
  },
  {
    id: "DOC-007",
    name: "Usman_Attendance_August.xlsx",
    employee: "Usman Ahmed",
    employeeId: "EMP-005",
    initials: "UA",
    department: "Operations",
    category: "Attendance",
    type: "XLSX",
    size: "920 KB",
    uploaded: "22 Aug 2026",
    status: "Verified",
  },
  {
    id: "DOC-008",
    name: "Hina_Portfolio.pdf",
    employee: "Hina Raza",
    employeeId: "EMP-006",
    initials: "HR",
    department: "Design",
    category: "Other",
    type: "PDF",
    size: "4.7 MB",
    uploaded: "21 Aug 2026",
    status: "Pending",
  },
];

const getFileIcon = (type) => {
  if (type === "PDF") return FileText;
  if (type === "XLSX") return FileSpreadsheet;
  if (type === "DOCX") return FileText;
  if (type === "JPG" || type === "PNG") return FileImage;
  if (type === "ZIP") return FileArchive;

  return File;
};

const getFileColor = (type) => {
  if (type === "PDF") {
    return "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400";
  }

  if (type === "XLSX") {
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
  }

  if (type === "DOCX") {
    return "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
  }

  return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
};

function StatusBadge({ status }) {
  if (status === "Verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 size={13} />
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
      <Clock3 size={13} />
      Pending
    </span>
  );
}

function Documents() {
  const [documents, setDocuments] = useState(initialDocuments);

  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");

  const [selectedCategory, setSelectedCategory] =
    useState("All Documents");

  const [search, setSearch] = useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("All");

  const [showUpload, setShowUpload] = useState(false);

  const [uploadData, setUploadData] = useState({
    employee: "",
    category: "Personal",
    file: null,
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const departmentMatch =
        selectedDepartment === "All Departments" ||
        document.department === selectedDepartment;

      const categoryMatch =
        selectedCategory === "All Documents" ||
        document.category === selectedCategory;

      const statusMatch =
        selectedStatus === "All" ||
        document.status === selectedStatus;

      const searchMatch =
        document.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        document.employee
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        document.employeeId
          .toLowerCase()
          .includes(search.toLowerCase());

      return (
        departmentMatch &&
        categoryMatch &&
        statusMatch &&
        searchMatch
      );
    });
  }, [
    documents,
    selectedDepartment,
    selectedCategory,
    selectedStatus,
    search,
  ]);

  const verifiedCount = documents.filter(
    (document) => document.status === "Verified"
  ).length;

  const pendingCount = documents.filter(
    (document) => document.status === "Pending"
  ).length;

  const totalSize = "14.0 MB";

  const deleteDocument = (id) => {
    setDocuments((current) =>
      current.filter((document) => document.id !== id)
    );
  };

  const handleUpload = () => {
    if (!uploadData.employee || !uploadData.file) {
      return;
    }

    const file = uploadData.file;

    const extension =
      file.name.split(".").pop()?.toUpperCase() || "FILE";

    const newDocument = {
      id: `DOC-${String(documents.length + 1).padStart(
        3,
        "0"
      )}`,
      name: file.name,
      employee: uploadData.employee,
      employeeId: "NEW-EMP",
      initials: uploadData.employee
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      department: "Engineering",
      category: uploadData.category,
      type: extension,
      size: `${Math.max(
        1,
        Math.round(file.size / 1024)
      )} KB`,
      uploaded: "07 Sep 2026",
      status: "Pending",
    };

    setDocuments((current) => [
      newDocument,
      ...current,
    ]);

    setUploadData({
      employee: "",
      category: "Personal",
      file: null,
    });

    setShowUpload(false);
  };

  return (
    <div className="documents-page min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8 dark:bg-black dark:text-slate-100">

      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>HR Portal</span>
            <span>/</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Documents
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Documents
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage employee documents, contracts and HR records.
          </p>
        </div>

        <button
          onClick={() => setShowUpload(true)}
          className="shared-page-action-button flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          <Upload size={17} />
          Upload Document
        </button>

      </div>

      {/* STATISTICS */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <FolderOpen size={21} />
          </div>

          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Total Documents
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {documents.length}
          </h2>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={21} />
            </div>

            <span className="text-xs font-semibold text-emerald-600">
              Complete
            </span>

          </div>

          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Verified
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {verifiedCount}
          </h2>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock3 size={21} />
            </div>

            <span className="text-xs font-semibold text-amber-600">
              Review
            </span>

          </div>

          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Pending Verification
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {pendingCount}
          </h2>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <HardDrive size={21} />
            </div>

            <span className="text-xs font-semibold text-purple-600">
              Storage
            </span>

          </div>

          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Documents Size
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {totalSize}
          </h2>

        </div>

      </div>

      {/* DEPARTMENT FILTER */}
      <div className="mb-6">

        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Documents by Department
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select a department to manage employee documents.
          </p>
        </div>

        <div className="documents-scroll flex gap-3 overflow-x-auto pb-2">

          {departments.map((department) => (

            <button
              key={department.name}
              onClick={() =>
                setSelectedDepartment(department.name)
              }
              className={`flex min-w-fit items-center gap-3 rounded-xl border px-4 py-3 transition ${
                selectedDepartment === department.name
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              }`}
            >

              <Users size={16} />

              <span className="text-sm font-semibold">
                {department.name}
              </span>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  selectedDepartment === department.name
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {department.count}
              </span>

            </button>

          ))}

        </div>

      </div>

      {/* DOCUMENT CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        {/* TOOLBAR */}
        <div className="border-b border-slate-200 p-5 sm:p-6 dark:border-slate-800">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedDepartment === "All Departments"
                  ? "All Employee Documents"
                  : `${selectedDepartment} Documents`}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filteredDocuments.length} documents found
              </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* SEARCH */}
              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-indigo-400 focus-within:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus-within:bg-slate-800">

                <Search
                  size={17}
                  className="mr-2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search documents..."
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400 sm:w-56"
                />

              </div>

              {/* CATEGORY */}
              <div className="relative">

                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value)
                  }
                  className="h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-600 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {categories.map((category) => (
                    <option key={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            </div>

          </div>

          {/* STATUS */}
          <div className="documents-scroll mt-5 flex gap-2 overflow-x-auto">

            {["All", "Verified", "Pending"].map(
              (status) => {

                const count =
                  status === "All"
                    ? documents.length
                    : documents.filter(
                        (document) =>
                          document.status === status
                      ).length;

                return (
                  <button
                    key={status}
                    onClick={() =>
                      setSelectedStatus(status)
                    }
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      selectedStatus === status
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    }`}
                  >
                    {status}

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        selectedStatus === status
                          ? "bg-white/15 text-white"
                          : "bg-white text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {count}
                    </span>

                  </button>
                );
              }
            )}

          </div>

        </div>

        {/* DESKTOP TABLE */}
        <div className="documents-table-scroll hidden overflow-x-auto lg:block">

          <table className="w-full">

            <thead className="bg-slate-50 dark:bg-slate-800/70">

              <tr className="border-b border-slate-200 dark:border-slate-800">

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Document
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Employee
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Department
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Size
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredDocuments.map((document) => {

                const Icon = getFileIcon(document.type);

                return (
                  <tr
                    key={document.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                  >

                    {/* DOCUMENT */}
                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getFileColor(
                            document.type
                          )}`}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0">

                          <p className="max-w-[260px] truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {document.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {document.id} • {document.type}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* EMPLOYEE */}
                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                          {document.initials}
                        </div>

                        <div>

                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {document.employee}
                          </p>

                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {document.employeeId}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* DEPARTMENT */}
                    <td className="px-6 py-5">

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {document.department}
                      </span>

                    </td>

                    {/* CATEGORY */}
                    <td className="px-6 py-5">

                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {document.category}
                      </span>

                    </td>

                    {/* SIZE */}
                    <td className="px-6 py-5">

                      <div>

                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {document.size}
                        </p>

                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {document.uploaded}
                        </p>

                      </div>

                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-5">
                      <StatusBadge status={document.status} />
                    </td>

                    {/* ACTION */}
                    <td className="px-6 py-5">

                      <div className="flex justify-end gap-2">

                        <button
                          title="View"
                          className="shared-icon-button flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          title="Download"
                          className="shared-icon-button flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Download size={16} />
                        </button>

                        <button
                          title="Delete"
                          onClick={() =>
                            deleteDocument(document.id)
                          }
                          className="shared-icon-button flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:hover:bg-red-950/40"
                        >
                          <Trash2 size={16} />
                        </button>

                        <button
                          title="More"
                          className="shared-icon-button flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <MoreVertical size={16} />
                        </button>

                      </div>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

        {/* MOBILE */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">

          {filteredDocuments.map((document) => {

            const Icon = getFileIcon(document.type);

            return (
              <div
                key={document.id}
                className="p-5"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getFileColor(
                        document.type
                      )}`}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0">

                      <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {document.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {document.employee}
                      </p>

                    </div>

                  </div>

                  <StatusBadge status={document.status} />

                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">

                    <p className="text-[10px] uppercase text-slate-400">
                      Department
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {document.department}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">

                    <p className="text-[10px] uppercase text-slate-400">
                      Category
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {document.category}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">

                    <p className="text-[10px] uppercase text-slate-400">
                      File Size
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {document.size}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">

                    <p className="text-[10px] uppercase text-slate-400">
                      Uploaded
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {document.uploaded}
                    </p>

                  </div>

                </div>

                <div className="mt-4 flex gap-2">

                  <button className="documents-mobile-action-button flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    <Eye size={15} />
                    View
                  </button>

                  <button className="documents-mobile-action-button flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    <Download size={15} />
                    Download
                  </button>

                  <button
                    onClick={() =>
                      deleteDocument(document.id)
                    }
                    className="documents-mobile-delete-button flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={15} />
                  </button>

                </div>

              </div>
            );
          })}

        </div>

        {/* EMPTY */}
        {filteredDocuments.length === 0 && (
          <div className="p-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <FolderOpen size={25} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
              No documents found
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try another department, category or search term.
            </p>

          </div>
        )}

      </div>

      {/* STORAGE INFO */}
      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">

        <div className="flex gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
            <HardDrive size={19} />
          </div>

          <div className="flex-1">

            <div className="flex flex-col justify-between gap-3 sm:flex-row">

              <div>

                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  Document Storage
                </h3>

                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                  Employee documents will be securely stored
                  when the Node.js backend is connected.
                </p>

              </div>

              <div className="text-left sm:text-right">

                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Current Usage
                </p>

                <p className="text-lg font-bold text-blue-900 dark:text-blue-200">
                  {totalSize}
                </p>

              </div>

            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">

              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: "28%" }}
              />

            </div>

            <p className="mt-2 text-[10px] text-blue-600 dark:text-blue-300">
              28% of available storage used
            </p>

          </div>

        </div>

      </div>

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">

              <div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Upload Document
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add an employee document to the HR portal.
                </p>

              </div>

              <button
                onClick={() => setShowUpload(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>

            </div>

            {/* MODAL BODY */}
            <div className="space-y-5 p-5">

              {/* Employee */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Employee
                </label>

                <input
                  value={uploadData.employee}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      employee: e.target.value,
                    })
                  }
                  placeholder="Enter employee name"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />

              </div>

              {/* Category */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Document Category
                </label>

                <div className="relative">

                  <select
                    value={uploadData.category}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        category: e.target.value,
                      })
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {categories
                      .filter(
                        (category) =>
                          category !== "All Documents"
                      )
                      .map((category) => (
                        <option key={category}>
                          {category}
                        </option>
                      ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>

              {/* FILE */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Document File
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-emerald-950/30">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400">
                    <Upload size={21} />
                  </div>

                  {uploadData.file ? (
                    <>
                      <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {uploadData.file.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        File selected
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Click to upload
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        PDF, DOCX, XLSX, JPG, PNG up to 10MB
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        file: e.target.files?.[0] || null,
                      })
                    }
                  />

                </label>

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex gap-3 border-t border-slate-200 p-5 dark:border-slate-800">

              <button
                onClick={() => setShowUpload(false)}
                className="page-secondary-button flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={handleUpload}
                disabled={
                  !uploadData.employee ||
                  !uploadData.file
                }
                className="shared-page-action-button flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload Document
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Documents;