document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://amsapplication.up.railway.app"; // ✅ adjust if backend URL changes

  const recordsBody = document.getElementById("recordsBody");
  const employeeFilter = document.getElementById("employeeFilter");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const statusFilter = document.getElementById("statusFilter");

  const applyFiltersBtn = document.getElementById("applyFilters");
  const resetFiltersBtn = document.getElementById("resetFilters");
  const refreshBtn = document.getElementById("refreshData");

  // 🔹 Load employees into dropdown
  async function loadEmployees() {
    try {
      let res = await fetch(`${API_BASE}/api/employees`);
      if (!res.ok) throw new Error(`Failed to fetch employees: ${res.status}`);
      let employees = await res.json();

      console.log("✅ Employees from backend:", employees);

      if (!Array.isArray(employees)) {
        console.error("Unexpected employees format:", employees);
        return;
      }

      employees.forEach(emp => {
        if (!emp.fingerprintId || !emp.name) return;
        let option = document.createElement("option");
        option.value = emp.fingerprintId;
        option.textContent = `${emp.name} (${emp.fingerprintId})`;
        employeeFilter.appendChild(option);
      });
    } catch (err) {
      console.error("❌ Error loading employees:", err);
    }
  }

  // 🔹 Fetch attendance records
  async function fetchRecords() {
    let url = `${API_BASE}/api/attendance/records`;
    if (fromDate.value && toDate.value) {
      url += `?dateFrom=${fromDate.value}&dateTo=${toDate.value}`;
    } else if (fromDate.value) {
      url += `?dateFrom=${fromDate.value}`;
    }

    console.log("📡 Fetching records from:", url);

    try {
      let res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch records: ${res.status}`);
      let records = await res.json();

      console.log("✅ Raw records from backend:", records);
      return Array.isArray(records) ? records : [];
    } catch (err) {
      console.error("❌ Error fetching records:", err);
      return [];
    }
  }

  // 🔹 Render records into table
  function renderRecords(records) {
    recordsBody.innerHTML = "";

    if (!records || records.length === 0) {
      recordsBody.innerHTML = `<tr><td colspan="6">No records found</td></tr>`;
      return;
    }

    records.forEach(r => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date || "-"}</td>
        <td>${r.checkIn || "-"}</td>
        <td>${r.employee?.name || r.employeeName || "-"}</td>
        <td>${r.employee?.fingerprintId || r.fingerprintId || "-"}</td>
        <td>${r.employee?.department || r.department || "-"}</td>
        <td style="font-weight:bold; color:${r.status?.toUpperCase() === "PRESENT" ? "green" : "red"}">
          ${r.status || "-"}
        </td>
      `;
      recordsBody.appendChild(tr);
    });
  }

  // 🔹 Apply filters (frontend filtering after fetch)
  async function applyFilters() {
    let records = await fetchRecords();

    let empId = employeeFilter.value;
    let status = statusFilter.value;

    let filtered = records.filter(r => {
      let matchEmp =
        !empId ||
        r.fingerprintId === empId ||
        r.employee?.fingerprintId === empId;
      let matchStatus =
        !status ||
        (r.status && r.status.toUpperCase() === status.toUpperCase());
      return matchEmp && matchStatus;
    });

    console.log("✅ Filtered records:", filtered);
    renderRecords(filtered);
  }

  // 🔹 Reset filters
  function resetFilters() {
    employeeFilter.value = "";
    fromDate.value = "";
    toDate.value = "";
    statusFilter.value = "";
    applyFilters();
  }

  // 🔹 Event listeners
  applyFiltersBtn.addEventListener("click", applyFilters);
  resetFiltersBtn.addEventListener("click", resetFilters);
  refreshBtn.addEventListener("click", applyFilters);

  // 🔹 Initial load
  loadEmployees().then(applyFilters);
});
