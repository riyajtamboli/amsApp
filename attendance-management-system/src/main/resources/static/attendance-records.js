// ================= API Endpoints =================
const apiEmployees = "/api/employees";
const apiRecords = "/api/attendance/records";

// ================= Fetch Functions =================
async function fetchEmployees() {
  try {
    const res = await fetch(apiEmployees);
    if (!res.ok) throw new Error("Failed to fetch employees");
    return await res.json();
  } catch (err) {
    console.error("❌ Employee fetch error:", err);
    return [];
  }
}

async function fetchRecords() {
  try {
    const res = await fetch(apiRecords);
    if (!res.ok) throw new Error("Failed to fetch records");
    return await res.json();
  } catch (err) {
    console.error("❌ Records fetch error:", err);
    return [];
  }
}

// ================= Render Stats =================
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

// ================= Render Absent =================
function renderAbsent(employees, records) {
  const today = new Date().toISOString().split("T")[0];
  const presentIds = records
    .filter(r => r.date === today && r.status === "PRESENT")
    .map(r => r.employeeId);

  const absent = employees.filter(e => !presentIds.includes(e.id));

  document.getElementById("absentCount").textContent =
    `${absent.length} employees absent on ${today}`;

  const tbody = document.querySelector("#absentTable tbody");
  tbody.innerHTML = absent
    .map(
      e => `
      <tr>
        <td>${e.id}</td>
        <td>${e.name}</td>
        <td>${e.department}</td>
        <td style="color:red;font-weight:bold">ABSENT</td>
      </tr>`
    )
    .join("");

  return absent;
}

// ================= Render Records =================
function renderRecords(records, employees) {
  const tbody = document.getElementById("recordsBody");
  tbody.innerHTML = records
    .map(r => {
      const emp = employees.find(e => e.id === r.employeeId) || {};
      return `
        <tr>
          <td>${r.date}</td>
          <td>${r.time}</td>
          <td>${emp.name || "Unknown"}</td>
          <td>${r.employeeId}</td>
          <td>${emp.department || "-"}</td>
          <td style="font-weight:bold; color:${
            r.status === "PRESENT" ? "green" : "red"
          }">${r.status}</td>
        </tr>
      `;
    })
    .join("");
}

// ================= Apply Filters =================
function applyFilters(records) {
  const empId = document.getElementById("employeeFilter").value;
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;
  const status = document.getElementById("statusFilter").value;

  const filtered = records.filter(r => {
    return (
      (!empId || r.employeeId == empId) &&
      (!fromDate || r.date >= fromDate) &&
      (!toDate || r.date <= toDate) &&
      (!status || r.status === status)
    );
  });

  console.log("✅ Filter Applied:", {
    empId,
    fromDate,
    toDate,
    status,
    resultCount: filtered.length
  });

  return filtered;
}

// ================= Export CSV =================
function exportCsvFile(data, filename) {
  if (!data || data.length === 0) {
    alert("⚠️ No data to export.");
    return;
  }
  let csv = Object.keys(data[0]).join(",") + "\n";
  csv += data.map(row => Object.values(row).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// ================= Load Data =================
async function loadData() {
  console.log("🔄 Loading data...");
  const employees = await fetchEmployees();
  const records = await fetchRecords();

  // Populate employee filter dropdown
  const empSelect = document.getElementById("employeeFilter");
  empSelect.innerHTML =
    `<option value="">All Employees</option>` +
    employees.map(e => `<option value="${e.id}">${e.name}</option>`).join("");

  renderStats(records, employees);
  let absentList = renderAbsent(employees, records);
  renderRecords(records, employees);

  // ✅ Attach Filter Logic
  document.getElementById("applyFilters").onclick = () => {
    console.log("📌 Apply Filters button clicked");
    const filtered = applyFilters(records);
    renderRecords(filtered, employees);
    renderAbsent(employees, records); // always today
  };

  document.getElementById("resetFilters").onclick = () => {
    console.log("🔄 Reset Filters clicked");
    document.getElementById("employeeFilter").value = "";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    document.getElementById("statusFilter").value = "";
    renderRecords(records, employees);
    absentList = renderAbsent(employees, records);
  };

  document.getElementById("refreshData").onclick = loadData;

  // Export All Records
  document.getElementById("exportCsv").onclick = () => {
    exportCsvFile(records, "attendance_records.csv");
  };

  // Export Absent Only
  document.getElementById("exportAbsentCsv").onclick = () => {
    const absentData = absentList.map(e => ({
      id: e.id,
      name: e.name,
      department: e.department,
      status: "ABSENT"
    }));
    exportCsvFile(absentData, "absent_employees.csv");
  };
}

// ================= Run =================
loadData();

