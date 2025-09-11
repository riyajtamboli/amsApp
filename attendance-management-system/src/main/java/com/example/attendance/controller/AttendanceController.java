package com.example.attendance.controller;

import com.example.attendance.model.Attendance;
import com.example.attendance.model.Employee;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.EmployeeRepository;
import com.example.attendance.service.AttendanceService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceService svc;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmployeeRepository empRepo;

    @PostMapping("/mark")
    public ResponseEntity<?> mark(@RequestBody Map<String, String> body) {
        Attendance result = svc.markAttendance(body.get("fingerprintId"));
        if (result == null)
            return ResponseEntity.status(404).body("Employee not found");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/markByFace")
    public ResponseEntity<?> markByFace(@RequestBody Map<String, Integer> body) {
        Integer faceLabel = body.get("faceLabel");
        Attendance result = svc.markAttendanceByFaceLabel(faceLabel);
        if (result == null)
            return ResponseEntity.status(404).body("Employee not found");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/records")
    public Map<String, Object> getAllAttendanceRecords(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String status) {

        LocalDate from = (dateFrom != null && !dateFrom.isEmpty()) ? LocalDate.parse(dateFrom) : null;
        LocalDate to = (dateTo != null && !dateTo.isEmpty()) ? LocalDate.parse(dateTo) : null;

        // 1. Fetch attendance records
        List<Attendance> presentRecords;
        if (from != null && to != null) {
            presentRecords = attendanceRepository.findByDateBetween(from, to);
        } else if (from != null) {
            presentRecords = attendanceRepository.findByDate(from);
        } else {
            presentRecords = attendanceRepository.findAllByOrderByDateDescCheckInDesc();
        }

        // Filter by employee
        if (employeeId != null) {
            presentRecords = presentRecords.stream()
                    .filter(r -> r.getEmployee().getId().equals(employeeId))
                    .toList();
        }

        // Filter by status
        if (status != null && !status.equalsIgnoreCase("All")) {
            if (status.equalsIgnoreCase("Present")) {
                presentRecords = presentRecords.stream()
                        .filter(r -> r.getCheckIn() != null)
                        .toList();
            } else if (status.equalsIgnoreCase("Absent")) {
                presentRecords = presentRecords.stream()
                        .filter(r -> r.getCheckIn() == null)
                        .toList();
            }
        }

        // 2. Find absent employees
        List<Employee> allEmployees = empRepo.findAll();
        List<Employee> absentEmployees = allEmployees.stream()
                .filter(emp -> presentRecords.stream()
                        .noneMatch(att -> att.getEmployee().getId().equals(emp.getId())))
                .toList();

        // 3. Return combined response
        Map<String, Object> response = new HashMap<>();
        response.put("presentRecords", presentRecords);
        response.put("absentEmployees", absentEmployees);

        return response;
    }
}
