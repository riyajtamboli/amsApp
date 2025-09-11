package com.example.attendance.service;

import com.example.attendance.model.Attendance;
import com.example.attendance.model.Employee;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;

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

            LocalTime currentTime = LocalTime.now();
            LocalTime lateThreshold = LocalTime.of(9, 30);

            if (currentTime.isAfter(lateThreshold)) {
                whatsAppService.sendLateArrivalAlert(emp);
            }
        } else {
            att.setCheckOut(LocalTime.now());
        }

        Attendance savedAttendance = attRepo.save(att);

        if (isFirstCheckIn) {
            whatsAppService.sendAttendanceConfirmation(emp, savedAttendance);
        }

        return savedAttendance;
    }
}
