const API_BASE = "http://localhost:8080/api"; // change if deployed

// Fetch and populate employees in filter dropdown
async function loadEmployees() {
    try {
        const res = await fetch(`${API_BASE}/employees`);
        const employees = await res.json();
        const select = document.querySelector("#employeeFilter");
        employees.forEach(emp => {
            const opt = document.createElement("option");
            opt.value = emp.id;
            opt.textContent = `${emp.name} (${emp.fingerprintId})`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading employees:", err);
    }
}

// Fetch attendance + absent data
async function fetchAttendanceRecords(filters = {}) {
    try {
        let url = new URL(`${API_BASE}/attendance/records`);
        Object.keys(filters).forEach(key => {
            if (filters[key]) url.searchParams.append(key, filters[key]);
        });

        const res = await fetch(url);
        const data = await res.json();

        populateAttendanceTable(data.presentRecords);
        populateAbsentTable(data.absentEmployees);

        updateSummary(data.presentRecords, data.absentEmployees);

    } catch (err) {
        console.error("Error fetching attendance records:", err);
    }
}

// Update summary boxes
function updateSummary(presentRecords, absentEmployees) {
    document.querySelector("#totalRecordsBox").textContent =
        `${presentRecords.length} Total Records`;

    const today = new Date().toISOString().slice(0, 10);
    const presentToday = presentRecords.filter(r => r.date === today).length;
    document.querySelector("#presentTodayBox").textContent =
        `${presentToday} Present Today`;

    const totalEmployees = presentRecords.length + absentEmployees.length;
    document.querySelector("#totalEmployeesBox").textContent =
        `${totalEmployees} Total Employees`;

    const attendanceRate = totalEmployees > 0
        ? ((presentRecords.length / totalEmployees) * 100).toFixed(1)
        : 0;
    document.querySelector("#attendanceRateBox").textContent =
        `${attendanceRate}% Attendance Rate`;
}

// Fill Attendance Records Table
function populateAttendanceTable(records) {
    const tbody = document.querySelector("#attendance-table tbody");
    tbody.innerHTML = "";
    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No matching records found</td></tr>`;
        return;
    }
    records.forEach(r => {
        const row = `
            <tr>
                <td>${r.date}</td>
                <td>${r.checkIn || "-"}</td>
                <td>${r.employee.name}</td>
                <td>${r.employee.fingerprintId}</td>
                <td>${r.employee.department}</td>
                <td style="color:${r.checkIn ? 'green' : 'red'}">
                    ${r.checkIn ? "PRESENT" : "ABSENT"}
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

// Fill Absent Employees Table
function populateAbsentTable(absentList) {
    const tbody = document.querySelector("#absent-table tbody");
    tbody.innerHTML = "";
    if (!absentList || absentList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No absentees found</td></tr>`;
        return;
    }
    absentList.forEach(emp => {
        const row = `
            <tr>
                <td>${emp.fingerprintId}</td>
                <td>${emp.name}</td>
                <td>${emp.department}</td>
                <td style="color:red">ABSENT</td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

// Export to CSV helper
function exportToCSV(filename, rows, headers) {
    if (!rows || rows.length === 0) {
        alert("No data to export!");
        return;
    }

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.map(item => `"${item}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export Attendance Records CSV
document.querySelector("#exportCsvBtn").addEventListener("click", () => {
    const rows = [];
    document.querySelectorAll("#attendance-table tbody tr").forEach(tr => {
        const cols = tr.querySelectorAll("td");
        if (cols.length > 1) {
            rows.push([
                cols[0].textContent.trim(),
                cols[1].textContent.trim(),
                cols[2].textContent.trim(),
                cols[3].textContent.trim(),
                cols[4].textContent.trim(),
                cols[5].textContent.trim()
            ]);
        }
    });
    exportToCSV("attendance_records.csv", rows,
        ["Date", "Time", "Employee", "Fingerprint ID", "Department", "Status"]);
});

// Export Absent Employees CSV
document.querySelector("#exportAbsentCsvBtn").addEventListener("click", () => {
    const rows = [];
    document.querySelectorAll("#absent-table tbody tr").forEach(tr => {
        const cols = tr.querySelectorAll("td");
        if (cols.length > 1) {
            rows.push([
                cols[0].textContent.trim(),
                cols[1].textContent.trim(),
                cols[2].textContent.trim(),
                cols[3].textContent.trim()
            ]);
        }
    });
    exportToCSV("absent_employees.csv", rows,
        ["Employee ID", "Name", "Department", "Status"]);
});

// Apply filters button
document.querySelector("#applyFiltersBtn").addEventListener("click", () => {
    const empId = document.querySelector("#employeeFilter").value;
    const from = document.querySelector("#dateFrom").value;
    const to = document.querySelector("#dateTo").value;
    const status = document.querySelector("#statusFilter").value;

    fetchAttendanceRecords({
        employeeId: empId || null,
        dateFrom: from || null,
        dateTo: to || null,
        status: status || "All"
    });
});

// Reset filters
document.querySelector("#resetFiltersBtn").addEventListener("click", () => {
    document.querySelector("#employeeFilter").value = "";
    document.querySelector("#dateFrom").value = "";
    document.querySelector("#dateTo").value = "";
    document.querySelector("#statusFilter").value = "All";
    fetchAttendanceRecords();
});

// Refresh button
document.querySelector("#refreshBtn").addEventListener("click", () => {
    fetchAttendanceRecords();
});

// Initial load
loadEmployees();
fetchAttendanceRecords();
