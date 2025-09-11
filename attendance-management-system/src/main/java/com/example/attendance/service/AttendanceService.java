package com.example.attendance.service;

import com.example.attendance.model.Attendance;
import com.example.attendance.model.Employee;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
public class AttendanceService {
    @Autowired private EmployeeRepository empRepo;
    @Autowired private AttendanceRepository attRepo;
    @Autowired private WhatsAppService whatsAppService;

    public Attendance markAttendance(String fingerprintId) {
        Employee emp = empRepo.findByFingerprintId(fingerprintId);
        if (emp == null) return null;
        return markAttendanceForEmployee(emp);
    }

    // New method for face recognition attendance
    public Attendance markAttendanceByFaceLabel(Integer label) {
        // For demo, assume label maps to employee ID
        Employee emp = empRepo.findById(Long.valueOf(label)).orElse(null);
        if (emp == null) return null;
        return markAttendanceForEmployee(emp);
    }

    // Common logic for marking attendance
    private Attendance markAttendanceForEmployee(Employee emp) {
        LocalDate today = LocalDate.now();
        Attendance att = attRepo.findByEmployeeIdAndDate(emp.getId(), today)
            .orElseGet(() -> {
                Attendance a = new Attendance();
                a.setEmployee(emp);
                a.setDate(today);
                return a;
            });

        boolean isFirstCheckIn = att.getCheckIn() == null;

        if (att.getCheckIn() == null) {
            att.setCheckIn(LocalTime.now());

            // Check if employee is late (after 9:30 AM)
            LocalTime currentTime = LocalTime.now();
            LocalTime lateThreshold = LocalTime.of(9, 30);

            if (currentTime.isAfter(lateThreshold)) {
                // Send late arrival notification
                whatsAppService.sendLateArrivalAlert(emp);
            }
        } else {
            att.setCheckOut(LocalTime.now());
        }

        Attendance savedAttendance = attRepo.save(att);

        // Send WhatsApp confirmation for first check-in only
        if (isFirstCheckIn) {
            whatsAppService.sendAttendanceConfirmation(emp, savedAttendance);
        }

        return savedAttendance;
    }

    // ✅ NEW METHOD: Fetch Present + Absent employees with filter
    public List<Map<String, Object>> getAttendanceWithAbsentees(LocalDate from, LocalDate to, String status) {
        List<Employee> allEmployees = empRepo.findAll();
        List<Attendance> attendanceRecords = attRepo.findByDateBetween(from, to);

        List<Map<String, Object>> results = new ArrayList<>();

        // Handle PRESENT employees
        if (!"ABSENT".equalsIgnoreCase(status)) {
            for (Attendance att : attendanceRecords) {
                Map<String, Object> record = new HashMap<>();
                record.put("employeeId", att.getEmployee().getId());
                record.put("name", att.getEmployee().getName());
                record.put("department", att.getEmployee().getDepartment());
                record.put("date", att.getDate());
                record.put("status", "PRESENT");
                results.add(record);
            }
        }

        // Handle ABSENT employees
        if (!"PRESENT".equalsIgnoreCase(status)) {
            for (Employee emp : allEmployees) {
                boolean hasAttendance = attendanceRecords.stream()
                        .anyMatch(att -> att.getEmployee().getId().equals(emp.getId()));
                if (!hasAttendance) {
                    Map<String, Object> record = new HashMap<>();
                    record.put("employeeId", emp.getId());
                    record.put("name", emp.getName());
                    record.put("department", emp.getDepartment());
                    record.put("date", from + " - " + to);
                    record.put("status", "ABSENT");
                    results.add(record);
                }
            }
        }

        return results;
    }
}
