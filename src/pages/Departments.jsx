import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  BriefcaseBusiness,
  UserPlus,
  UserCog,
  X,
  Loader2,
  UserRound,
  Mail,
  Phone,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken")
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        status === "Active"
          ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-red-100 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
      }`}
    >
      {status === "Active" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {status}
    </span>
  );
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className={`w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#101827]`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-70px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [viewDepartment, setViewDepartment] = useState(null);
  const [addEmployeeDepartment, setAddEmployeeDepartment] = useState(null);
  const [headDepartment, setHeadDepartment] = useState(null);
  const [editDepartment, setEditDepartment] = useState(null);
  const [showAddDepartment, setShowAddDepartment] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [departmentForm, setDepartmentForm] = useState({
    code: "",
    name: "",
    description: "",
    status: "Active",
  });

  const authFetch = useCallback(async (url, options = {}) => {
    const token = getToken();
    if (!token) throw new Error("Your login session has expired. Please login again.");

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authFetch(`${API_URL}/api/departments`);
      setDepartments(data.departments || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await authFetch(`${API_URL}/api/employees`);
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Employee loading error:", err);
    }
  }, [authFetch]);

  useEffect(() => {
    loadDepartments();
    loadEmployees();
  }, [loadDepartments, loadEmployees]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      const text = `${department.name || ""} ${department.id || ""} ${department.head || ""}`.toLowerCase();
      const searchMatch = text.includes(search.toLowerCase());
      const statusMatch = selectedStatus === "All" || department.status === selectedStatus;
      return searchMatch && statusMatch;
    });
  }, [departments, search, selectedStatus]);

  const totalEmployees = useMemo(
    () => departments.reduce((total, department) => total + Number(department.employees || 0), 0),
    [departments]
  );

  const totalPositions = useMemo(
    () => departments.reduce((total, department) => total + Number(department.positions || 0), 0),
    [departments]
  );

  const activeDepartments = departments.filter((department) => department.status === "Active").length;

  const refreshDepartmentView = async (departmentId) => {
    const data = await authFetch(`${API_URL}/api/departments/${departmentId}`);
    setViewDepartment(data);
  };

  const openView = async (department) => {
    try {
      setActionLoading(true);
      await refreshDepartmentView(department.database_id || department.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openAddEmployee = async (department) => {
    try {
      setActionLoading(true);
      await loadEmployees();
      setSelectedEmployee("");
      setAddEmployeeDepartment(department);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const addEmployee = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      await authFetch(`${API_URL}/api/departments/${addEmployeeDepartment.database_id}/employees`, {
        method: "POST",
        body: JSON.stringify({ employee_id: Number(selectedEmployee) }),
      });

      setAddEmployeeDepartment(null);
      setSelectedEmployee("");
      await loadDepartments();
      showSuccess("Employee added to department successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const makeHead = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      await authFetch(`${API_URL}/api/departments/${headDepartment.database_id}/head`, {
        method: "PUT",
        body: JSON.stringify({ employee_id: Number(selectedEmployee) }),
      });

      setHeadDepartment(null);
      setSelectedEmployee("");
      await loadDepartments();
      showSuccess("Department head updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteDepartment = async (department) => {
    const confirmed = window.confirm(`Delete ${department.name}? This can only be done when no employees are assigned.`);
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      await authFetch(`${API_URL}/api/departments/${department.database_id || department.id}`, { method: "DELETE" });
      await loadDepartments();
      showSuccess("Department deleted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const saveDepartment = async () => {
    if (!departmentForm.name.trim()) {
      setError("Department name is required.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      if (editDepartment) {
        await authFetch(`${API_URL}/api/departments/${editDepartment.database_id || editDepartment.id}`, {
          method: "PUT",
          body: JSON.stringify(departmentForm),
        });
        showSuccess("Department updated successfully.");
      } else {
        if (!departmentForm.code.trim()) {
          setError("Department code is required.");
          return;
        }
        await authFetch(`${API_URL}/api/departments`, {
          method: "POST",
          body: JSON.stringify(departmentForm),
        });
        showSuccess("Department created successfully.");
      }

      setEditDepartment(null);
      setShowAddDepartment(false);
      setDepartmentForm({ code: "", name: "", description: "", status: "Active" });
      await loadDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (department) => {
    setEditDepartment(department);
    setDepartmentForm({
      code: department.code || department.id || "",
      name: department.name || "",
      description: department.description || "",
      status: department.status || "Active",
    });
  };

  const departmentEmployeesForHead = useMemo(() => {
    if (!headDepartment) return [];
    return employees.filter(
      (employee) => Number(employee.department_id) === Number(headDepartment.database_id)
    );
  }, [employees, headDepartment]);

  const availableEmployees = useMemo(() => {
    if (!addEmployeeDepartment) return employees;
    return employees.filter(
      (employee) => Number(employee.department_id) !== Number(addEmployeeDepartment.database_id)
    );
  }, [employees, addEmployeeDepartment]);

  return (
    <div className="departments-page min-h-screen overflow-x-hidden bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#080d18] dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <span>Nexora HR</span><span>/</span><span className="font-medium text-slate-700 dark:text-slate-300">Departments</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Departments</h1>
          <p className="mt-2 text-sm text-slate-500">Manage departments, department heads and employee allocation.</p>
        </div>
        <button onClick={() => { setEditDepartment(null); setDepartmentForm({ code: "", name: "", description: "", status: "Active" }); setShowAddDepartment(true); }} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">
          <Plus size={18} /> Add Department
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}
      {success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="portal-card portal-card-interactive group p-5">
          <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Building2 size={21} /></div><span className="text-xs font-semibold text-indigo-600">Organization</span></div>
          <p className="mt-5 text-sm text-slate-500">Total Departments</p><h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{departments.length}</h2>
        </div>
        <div className="portal-card portal-card-interactive group p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users size={21} /></div>
          <p className="mt-5 text-sm text-slate-500">Total Employees</p><h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{totalEmployees}</h2>
        </div>
        <div className="portal-card portal-card-interactive group p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><BriefcaseBusiness size={21} /></div>
          <p className="mt-5 text-sm text-slate-500">Total Positions</p><h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{totalPositions}</h2>
        </div>
        <div className="portal-card portal-card-interactive group p-5">
          <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={21} /></div><span className="text-xs font-semibold text-emerald-600">Active</span></div>
          <p className="mt-5 text-sm text-slate-500">Active Departments</p><h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{activeDepartments}</h2>
        </div>
      </div>

      <div className="portal-card overflow-hidden">
        <div className="border-b border-slate-200 p-5 sm:p-6 dark:border-slate-700">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">All Departments</h2><p className="mt-1 text-sm text-slate-500">{filteredDepartments.length} departments found</p></div>
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-indigo-400 focus-within:bg-white dark:border-slate-700 dark:bg-slate-900">
              <Search size={17} className="mr-2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search department..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100 sm:w-60" />
            </div>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {["All", "Active", "Inactive"].map((status) => {
              const count = status === "All" ? departments.length : departments.filter((d) => d.status === status).length;
              return <button key={status} onClick={() => setSelectedStatus(status)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${selectedStatus === status ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}>{status}<span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedStatus === status ? "bg-white/15 text-white" : "bg-white text-slate-500"}`}>{count}</span></button>;
            })}
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900"><tr className="border-b border-slate-200 dark:border-slate-700">
              {['Department','Department Head','Employees','Positions','Status','Actions'].map((h) => <th key={h} className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${h === 'Employees' || h === 'Positions' ? 'text-center' : ''} ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="px-6 py-16 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 animate-spin" size={24} />Loading departments...</td></tr> : filteredDepartments.map((department) => (
                <tr key={department.database_id || department.id} className="border-b border-slate-100 transition hover:bg-indigo-50/30 dark:border-slate-800">
                  <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Building2 size={20} /></div><div><p className="text-sm font-semibold text-slate-900 dark:text-white">{department.name}</p><p className="mt-0.5 max-w-sm truncate text-xs text-slate-500">{department.description}</p><p className="mt-1 text-[10px] font-medium text-slate-400">{department.id}</p></div></div></td>
                  <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{department.headInitials}</div><div><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{department.head}</p><p className="text-xs text-slate-400">Department Head</p></div></div></td>
                  <td className="px-6 py-5 text-center"><span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"><Users size={13} />{department.employees}</span></td>
                  <td className="px-6 py-5 text-center"><span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><BriefcaseBusiness size={13} />{department.positions}</span></td>
                  <td className="px-6 py-5"><StatusBadge status={department.status} /></td>
                  <td className="px-6 py-5"><div className="flex justify-end gap-2">
                    <button title="View Department" onClick={() => openView(department)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><Eye size={16} /></button>
                    <button title="Add Employee" onClick={() => openAddEmployee(department)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"><UserPlus size={16} /></button>
                    <button title="Make Department Head" onClick={() => { setHeadDepartment(department); setSelectedEmployee(""); setError(""); }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"><UserCog size={16} /></button>
                    <button title="Edit Department" onClick={() => openEdit(department)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><Pencil size={16} /></button>
                    <button title="Delete Department" onClick={() => deleteDepartment(department)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
          {!loading && filteredDepartments.map((department) => <div key={department.database_id || department.id} className="p-5">
            <div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Building2 size={20} /></div><div><h3 className="font-semibold text-slate-900 dark:text-white">{department.name}</h3><p className="text-xs text-slate-500">{department.id}</p></div></div><StatusBadge status={department.status} /></div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{department.description}</p>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-600">{department.headInitials}</div><div><p className="text-xs text-slate-400">Department Head</p><p className="text-sm font-semibold text-slate-700">{department.head}</p></div></div>
            <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] uppercase text-blue-500">Employees</p><p className="mt-1 text-lg font-bold text-blue-700">{department.employees}</p></div><div className="rounded-xl bg-indigo-50 p-3"><p className="text-[10px] uppercase text-indigo-500">Positions</p><p className="mt-1 text-lg font-bold text-indigo-700">{department.positions}</p></div></div>
            <div className="mt-4 grid grid-cols-3 gap-2"><button onClick={() => openView(department)} className="flex items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-semibold text-slate-600"><Eye size={15} />View</button><button onClick={() => openAddEmployee(department)} className="flex items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-semibold text-blue-600"><UserPlus size={15} />Add</button><button onClick={() => { setHeadDepartment(department); setSelectedEmployee(""); }} className="flex items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-semibold text-emerald-600"><UserCog size={15} />Head</button></div>
          </div>)}
        </div>

        {!loading && filteredDepartments.length === 0 && <div className="p-16 text-center"><Building2 className="mx-auto text-indigo-400" size={30} /><h3 className="mt-4 font-semibold text-slate-900 dark:text-white">No departments found</h3><p className="mt-1 text-sm text-slate-500">Try another search or status filter.</p></div>}
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><Building2 size={19} /></div><div><h3 className="text-sm font-bold text-indigo-900">Department Management</h3><p className="mt-1 text-xs leading-5 text-indigo-700">Create and manage organizational departments, assign department heads and monitor employee distribution across the organization.</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-medium text-indigo-700">Department Heads</span><span className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-medium text-indigo-700">Employee Allocation</span><span className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-medium text-indigo-700">Positions</span><span className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-medium text-indigo-700">Department Status</span></div></div></div></div>

      {viewDepartment && <Modal title={`${viewDepartment.department.name} Details`} wide onClose={() => setViewDepartment(null)}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-indigo-50 p-4"><p className="text-xs text-indigo-500">Department</p><p className="mt-1 font-bold text-indigo-900">{viewDepartment.department.name}</p><p className="text-xs text-indigo-600">{viewDepartment.department.code}</p></div>
          <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-500">Department Head</p><p className="mt-1 font-bold text-emerald-900">{viewDepartment.department.head ? `${viewDepartment.department.head.first_name} ${viewDepartment.department.head.last_name}` : "Not Assigned"}</p></div>
          <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs text-blue-500">Employees</p><p className="mt-1 text-2xl font-bold text-blue-900">{viewDepartment.employees.length}</p></div>
        </div>
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{viewDepartment.department.description || "No department description available."}</p>
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200"><div className="border-b bg-slate-50 px-4 py-3 font-semibold text-slate-800">Employees in Department</div><div className="divide-y">{viewDepartment.employees.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No employees assigned.</p> : viewDepartment.employees.map((employee) => <div key={employee.id} className="flex items-center justify-between gap-3 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><UserRound size={17} /></div><div><p className="font-semibold text-slate-800">{employee.name}</p><p className="text-xs text-slate-400">{employee.employee_code} · {employee.position || "No position"}</p></div></div><StatusBadge status={employee.status} /></div>)}</div></div>
      </Modal>}

      {addEmployeeDepartment && <Modal title={`Add Employee — ${addEmployeeDepartment.name}`} onClose={() => setAddEmployeeDepartment(null)}>
        <p className="mb-4 text-sm text-slate-500">Select an employee to assign to this department.</p>
        <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500">
          <option value="">Select employee</option>
          {availableEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employee_code} — {employee.first_name} {employee.last_name} {employee.position ? `(${employee.position})` : ""}</option>)}
        </select>
        <div className="mt-5 flex justify-end gap-3"><button onClick={() => setAddEmployeeDepartment(null)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={actionLoading} onClick={addEmployee} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{actionLoading && <Loader2 size={16} className="animate-spin" />}Add Employee</button></div>
      </Modal>}

      {headDepartment && <Modal title={`Department Head — ${headDepartment.name}`} onClose={() => setHeadDepartment(null)}>
        <p className="mb-4 text-sm text-slate-500">Select an employee already assigned to this department.</p>
        <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500">
          <option value="">Select department head</option>
          {departmentEmployeesForHead.map((employee) => <option key={employee.id} value={employee.id}>{employee.employee_code} — {employee.first_name} {employee.last_name} {employee.position ? `(${employee.position})` : ""}</option>)}
        </select>
        <div className="mt-5 flex justify-end gap-3"><button onClick={() => setHeadDepartment(null)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={actionLoading} onClick={makeHead} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{actionLoading && <Loader2 size={16} className="animate-spin" />}Make Department Head</button></div>
      </Modal>}

      {(showAddDepartment || editDepartment) && <Modal title={editDepartment ? "Edit Department" : "Add Department"} onClose={() => { setShowAddDepartment(false); setEditDepartment(null); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Department Code</label><input disabled={!!editDepartment} value={departmentForm.code} onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })} placeholder="DEP-007" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Department Name</label><input value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} placeholder="Engineering" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" /></div>
          <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-slate-600">Description</label><textarea rows="3" value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label><select value={departmentForm.status} onChange={(e) => setDepartmentForm({ ...departmentForm, status: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"><option>Active</option><option>Inactive</option></select></div>
        </div>
        <div className="mt-5 flex justify-end gap-3"><button onClick={() => { setShowAddDepartment(false); setEditDepartment(null); }} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={actionLoading} onClick={saveDepartment} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{actionLoading && <Loader2 size={16} className="animate-spin" />}{editDepartment ? "Save Changes" : "Create Department"}</button></div>
      </Modal>}
    </div>
  );
}

export default Departments;
  