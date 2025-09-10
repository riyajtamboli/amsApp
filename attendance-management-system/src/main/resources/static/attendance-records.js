document.addEventListener("DOMContentLoaded", () => {
  const recordsBody = document.getElementById("recordsBody");
  const employeeFilter = document.getElementById("employeeFilter");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const statusFilter = document.getElementById("statusFilter");

  const applyFiltersBtn = document.getElementById("applyFilters");
  const resetFiltersBtn = document.getElementById("resetFilters");
  const refreshBtn = document.getElementById("refreshData");

  // ✅ Load employees into dropdown
  async function loadEmployees() {
    try {
      let res = await fetch("/api/employees");
      let employees = await res.json();
      employees.forEach(emp => {
        let option = document.createElement("option");
        option.value = emp.fingerprintId;
        option.textContent = `${emp.name} (${emp.fingerprintId})`;
        employeeFilter.appendChild(option);
      });
    } catch (err) {
      console.error("Error loading employees:", err);
    }
  }

  // ✅ Fetch attendance records from backend
  async function fetchRecords() {
    let url = "/api/attendance/records";
    if (fromDate.value && toDate.value) {
      url += `?dateFrom=${fromDate.value}&dateTo=${toDate.value}`;
    } else if (fromDate.value) {
      url += `?dateFrom=${fromDate.value}`;
    }

    console.log("Fetching records from:", url);

    try {
      let res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      let records = await res.json();
      console.log("Raw records from backend:", records);
      return records;
    } catch (err) {
      console.error("Error fetching records:", err);
      return [];
    }
  }

  // ✅ Render records into table
  function renderRecords(records) {
    recordsBody.innerHTML = "";

    if (!records || records.length === 0) {
      recordsBody.innerHTML = `<tr><td colspan="6">No records found</td></tr>`;
      return;
    }

    records.forEach(r => {
      let empName = r.employee?.name || r.employeeName || "-";
      let empId = r.employee?.fingerprintId || r.fingerprintId || "-";
      let dept = r.employee?.department || r.department || "-";
      let status = r.status || "-";

      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date || "-"}</td>
        <td>${r.checkIn || "-"}</td>
        <td>${empName}</td>
        <td>${empId}</td>
        <td>${dept}</td>
        <td style="font-weight:bold; color:${status.toUpperCase() === "PRESENT" ? "green" : "red"}">
          ${status}
        </td>
      `;
      recordsBody.appendChild(tr);
    });
  }

  // ✅ Apply filters (frontend filtering after backend fetch)
  async function applyFilters() {
    let records = await fetchRecords();

    let empId = employeeFilter.value;
    let status = statusFilter.value;

    let filtered = records.filter(r => {
      let recordId = r.employee?.fingerprintId || r.fingerprintId;
      let matchEmp = !empId || recordId === empId;

      let matchStatus = !status || (r.status && r.status.toUpperCase() === status.toUpperCase());

      return matchEmp && matchStatus;
    });

    console.log("Filtered records:", filtered);
    renderRecords(filtered);
  }

  // ✅ Reset filters
  function resetFilters() {
    employeeFilter.value = "";
    fromDate.value = "";
    toDate.value = "";
    statusFilter.value = "";
    applyFilters();
  }

  // ✅ Event listeners
  applyFiltersBtn.addEventListener("click", applyFilters);
  resetFiltersBtn.addEventListener("click", resetFilters);
  refreshBtn.addEventListener("click", applyFilters);

  // ✅ Initial load
  loadEmployees().then(applyFilters);
});
