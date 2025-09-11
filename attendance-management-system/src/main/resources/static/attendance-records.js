// ========================= API Endpoints =========================
const apiEmployees = "/api/employees";
const apiRecords = "/api/attendance/records";

// ========================= Fetch Functions =========================
async function fetchEmployees() {
  const res = await fetch(apiEmployees);
  return res.json();
}

async function fetchRecords(params = {}) {
  let url = apiRecords;
  const query = new URLSearchParams(params).toString();
  if (query) url += "?" + query;

  console.log("Fetching records from:", url);

  const res = await fetch(url);
  return res.json();
}

// ========================= Status Normalization =========================
function getStatus(record) {
  if (record.status) return record.status.toUpperCase();
  if (record.checkIn || record.time) return "PRESENT";
  return "ABSENT";
}

// ========================= Render Functions =========================

// Stats
function renderStats(records, employees) {
  const today = new Date().toISOString().split("T")[0];
  const presentToday = records.filter(
    r => r.date === today && getStatus(r) === "PRESENT"
  ).length;
  const totalEmployees = employees.length;
  const rate =
    totalEmployees > 0
      ? Math.round((presentToday / totalEmployees) * 100)
      : 0;

  document.getElementById("totalRecords").textContent = records.length;
  document.getElementById("presentToday").textContent = presentToday;
  document.getElementById("totalEmployees").textContent = totalEmployees;
  document.getElementById("attendanceRate").textContent = rate + "%";
}

// Absent Employees
function renderAbsentList(employees, records, dateSet = null, filterMode = false) {
  const today = new Date().toISOString().split("T")[0];
  const targetDates = dateSet || new Set([today]);

  const presentFps = records
    .filter(r => targetDates.has(r.date) && getStatus(r) === "PRESENT")
    .map(r => r.fingerprintId || r.employee?.fingerprintId);

  const absent = employees.filter(e => !presentFps.includes(e.fingerprintId));

  document.getElementById("absentCount").textContent = filterMode
    ? `${absent.length} employees absent in filtered data`
    : `${absent.length} employees absent on ${today}`;

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
      const emp =
        employees.find(
          e => e.fingerprintId === (r.fingerprintId || r.employee?.fingerprintId)
        ) || r.employee || {};

      const statusFinal = getStatus(r);

      return `
        <tr>
          <td>${r.date}</td>
          <td>${r.time || r.checkIn || "-"}</td>
          <td>${emp.name || "Unknown"}</td>
          <td>${r.fingerprintId || r.employee?.fingerprintId || "-"}</td>
          <td>${emp.department || "-"}</td>
          <td style="font-weight:bold; color:${statusFinal === "PRESENT" ? "green" : "red"}">
            ${statusFinal}
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
      employees
        .map(
          e =>
            `<option value="${e.fingerprintId}">${e.name} (${e.fingerprintId})</option>`
        )
        .join("");
  }

  renderStats(records, employees);
  let absentList = renderAbsentList(employees, records);
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

    filtered = filtered.filter(r => {
      const recordEmpId = r.fingerprintId || r.employee?.fingerprintId;
      const statusComputed = getStatus(r);

      return (
        (!empId || recordEmpId === empId) &&
        (!status || statusComputed === status.toUpperCase())
      );
    });

    console.log("Filtered records:", filtered);

    if (empId || fromDate || toDate || status) {
      renderRecords(filtered, employees);

      const dateSet = fromDate || toDate ? new Set([fromDate || toDate]) : null;
      const filteredEmployees = empId
        ? employees.filter(e => e.fingerprintId === empId)
        : employees;

      absentList = renderAbsentList(filteredEmployees, filtered, dateSet, true);
    } else {
      loadData(); // fallback if no filters
    }
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

// ========================= WhatsApp API Calls =========================
const apiWhatsApp = "/api/whatsapp";

async function sendDailyReport() {
  const phone = document.getElementById("reportPhoneNumber").value;
  if (!phone) {
    alert("⚠️ Please enter a WhatsApp number");
    return;
  }

  const res = await fetch(`${apiWhatsApp}/send-daily-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: phone }),
  });
  const data = await res.json();

  document.getElementById("whatsappStatus").style.display = "block";
  document.getElementById("whatsappStatus").textContent =
    data.success ? "✅ WhatsApp service working fine" : "❌ WhatsApp service failed";
}

async function sendAbsentAlerts() {
  const phone = document.getElementById("managerPhoneNumber").value;
  if (!phone) {
    alert("⚠️ Please enter a manager WhatsApp number");
    return;
  }

  const res = await fetch(`${apiWhatsApp}/send-absent-alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ managerPhone: phone }),
  });
  const data = await res.json();

  document.getElementById("whatsappStatus").style.display = "block";
  document.getElementById("whatsappStatus").textContent =
    data.success ? "✅ WhatsApp service working fine" : "❌ WhatsApp service failed";
}

// Attach events
document.getElementById("dailyReportBtn").onclick = sendDailyReport;
document.getElementById("absentAlertsBtn").onclick = sendAbsentAlerts;
