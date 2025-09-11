package com.example.attendance.controller;

import com.example.attendance.model.Attendance;
import com.example.attendance.service.AttendanceService;

import jakarta.servlet.http.HttpSession;

import com.example.attendance.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
    public List<Map<String, Object>> getAttendanceRecords(
            @RequestParam String dateFrom,
            @RequestParam String dateTo,
            @RequestParam(defaultValue = "ALL") String status) {

        LocalDate from = LocalDate.parse(dateFrom);
        LocalDate to = LocalDate.parse(dateTo);

        return svc.getAttendanceWithAbsentees(from, to, status);
    }
}
