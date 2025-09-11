package com.example.attendance.controller;

import com.example.attendance.model.Attendance;
import com.example.attendance.service.AttendanceService;

import jakarta.servlet.http.HttpSession;

import com.example.attendance.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public List<Attendance> getAllAttendanceRecords(@RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        System.out.println("Received dateFrom parameter: " + dateFrom);
        System.out.println("Received dateTo parameter: " + dateTo);
        if (dateFrom != null && !dateFrom.isEmpty() && dateTo != null && !dateTo.isEmpty()) {
            java.time.LocalDate from = java.time.LocalDate.parse(dateFrom);
            java.time.LocalDate to = java.time.LocalDate.parse(dateTo);
            List<Attendance> records = attendanceRepository.findByDateBetween(from, to);
            System.out.println("Number of attendance records found: " + records.size());
            return records;
        } else if (dateFrom != null && !dateFrom.isEmpty()) {
            List<Attendance> records = attendanceRepository.findByDate(java.time.LocalDate.parse(dateFrom));
            System.out.println("Number of attendance records found: " + records.size());
            return records;
        } else {
            return attendanceRepository.findAllByOrderByDateDescCheckInDesc();
        }
    }

}
