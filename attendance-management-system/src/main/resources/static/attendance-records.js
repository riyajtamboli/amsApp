// API Endpoints
const apiEmployees = "/api/employees";
const apiRecords = "/api/attendance/records";

// Fetch Employees
async function fetchEmployees() {
  const res = await fetch(apiEmployees);
  return res.json();
}

// Fetch Attendance Records with optional query params
async function fetchRecords(params = {}) {
  let url = apiRecords;
  const query = new URLSearchParams(params).toString();
  if (query) url += "?" + query;

  console.log("Fetching records from:", url);

  const res = await fetch(url);
  return res.json();
}

// ========================= Render Functions =========================

// Stats
function renderStats(records, employees) {
  const today = new Date().toISOString().split("T")[0];
  const presentToday = records.filter(r => r.date === today && r.status === "PRESENT").length;
  const totalEmployees = employees.length;
  const rate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  document.getElementById("totalRecords").textContent = records.length;
  document.getElementById("presentToday").textContent = presentToday;
  document.getElementById("totalEmployees").textContent = totalEmployees;
  document.getElementById("attendanceRate").textContent = rate + "%";
}

// Absent
function renderAbsent(employees, records) {
  const today = new Date().toISOString().split("T")[0];
  const presentFps = records
    .filter(r => r.date === today && r.status === "PRESENT")
    .map(r => r.fingerprintId);

  const absent = employees.filter(e => !presentFps.includes(e.fingerprintId));

  document.getElementById("absentCount").textContent =
    `${absent.length} employees absent on ${today}`;

  const tbody = document.querySelector("#absentTable tbody");
  tbody.innerHTML = absent
    .map(
      e => `
      <tr>
        <td>${e.fingerprintId}</td>
        <td>${e.name}</td>
        <td>${e.department || "-"}</td>
        <td style="color:red;font-weight:bold">ABSENT</td>
      </tr>`
    )
    .join("");

  return absent;
}

// Records Table
function renderRecords(records, employees) {
  const tbody = document.getElementById("recordsBody");
  tbody.innerHTML = records
    .map(r => {
      const emp = employees.find(e => e.fingerprintId === r.fingerprintId) || {};
      return `
        <tr>
          <td>${r.date}</td>
          <td>${r.time}</td>
          <td>${emp.name || "Unknown"}</td>
          <td>${r.fingerprintId}</td>
          <td>${emp.department || "-"}</td>
          <td style="font-weight:bold; color:${r.status === "PRESENT" ? "green" : "red"}">
            ${r.status}
          </td>
        </tr>
      `;
    })
    .join("");
}

// CSV Export
function exportCsvFile(data, filename) {
  if (!data || data.length === 0) return;
  let csv = Object.keys(data[0]).join(",") + "\n";
  csv += data.map(row => Object.values(row).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// ========================= Main Loader =========================
async function loadData(params = {}) {
  const employees = await fetchEmployees();
  const records = await fetchRecords(params);

  console.log("Loaded employees:", employees.length);
  console.log("Loaded records:", records.length);

  // Populate employee filter dropdown once
  const empSelect = document.getElementById("employeeFilter");
  if (empSelect.options.length <= 1) {
    empSelect.innerHTML =
      `<option value="">All Employees</option>` +
      employees.map(e => `<option value="${e.fingerprintId}">${e.name} (${e.fingerprintId})</option>`).join("");
  }

  renderStats(records, employees);
  let absentList = renderAbsent(employees, records);
  renderRecords(records, employees);

  // Filters
  document.getElementById("applyFilters").onclick = async () => {
    const empId = document.getElementById("employeeFilter").value;
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;
    const status = document.getElementById("statusFilter").value;

    console.log("Applying filters:", { empId, fromDate, toDate, status });

    const params = {};
    if (fromDate) params.dateFrom = fromDate;
    if (toDate) params.dateTo = toDate;

    let filtered = await fetchRecords(params);

    // Local filter for emp + status
    filtered = filtered.filter(r =>
      (!empId || r.fingerprintId === empId) &&
      (!status || r.status === status)
    );

    console.log("Filtered records:", filtered.length);

    renderRecords(filtered, employees);
    renderAbsent(employees, filtered);
  };

  document.getElementById("resetFilters").onclick = async () => {
    console.log("Resetting filters...");
    document.getElementById("employeeFilter").value = "";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    document.getElementById("statusFilter").value = "";
    loadData(); // reload all
  };

  document.getElementById("refreshData").onclick = () => loadData();

  // Export CSV
  document.getElementById("exportCsv").onclick = () => {
    exportCsvFile(records, "attendance_records.csv");
  };

  document.getElementById("exportAbsentCsv").onclick = () => {
    const absentData = absentList.map(e => ({
      fingerprintId: e.fingerprintId,
      name: e.name,
      department: e.department,
      status: "ABSENT"
    }));
    exportCsvFile(absentData, "absent_employees.csv");
  };
}

loadData();
