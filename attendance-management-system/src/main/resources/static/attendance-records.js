// API Endpoints
const apiEmployees = "/api/employees";
const apiRecords = "/api/attendance/records";

// Fetch Employees
async function fetchEmployees() {
  const res = await fetch(apiEmployees);
  return res.json();
}

// Fetch Attendance Records
async function fetchRecords() {
  const res = await fetch(apiRecords);
  return res.json();
}

// ========================= Existing Functions =========================

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

// Filters
function applyFilters(records) {
  const empId = document.getElementById("employeeFilter").value;
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;
  const status = document.getElementById("statusFilter").value;

  return records.filter(r => {
    return (
      (!empId || r.fingerprintId === empId) &&
      (!fromDate || r.date >= fromDate) &&
      (!toDate || r.date <= toDate) &&
      (!status || r.status === status)
    );
  });
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

// Main Loader
async function loadData() {
  const employees = await fetchEmployees();
  const records = await fetchRecords();

  // Populate employee filter dropdown
  const empSelect = document.getElementById("employeeFilter");
  empSelect.innerHTML =
    `<option value="">All Employees</option>` +
    employees.map(e => `<option value="${e.fingerprintId}">${e.name}</option>`).join("");

  renderStats(records, employees);
  let absentList = renderAbsent(employees, records);
  renderRecords(records, employees);

  // Filters
  document.getElementById("applyFilters").onclick = () => {
    const filtered = applyFilters(records);
    renderRecords(filtered, employees);
    renderAbsent(employees, records); // always today's absent
  };

  document.getElementById("resetFilters").onclick = () => {
    document.getElementById("employeeFilter").value = "";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    document.getElementById("statusFilter").value = "";
    renderRecords(records, employees);
    absentList = renderAbsent(employees, records);
  };

  document.getElementById("refreshData").onclick = loadData;

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
