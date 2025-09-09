package com.example.attendance.controller;

import com.example.attendance.service.WhatsAppService;
import com.example.attendance.config.WhatsAppConfig;
import com.example.attendance.service.AttendanceService;
import com.example.attendance.repository.EmployeeRepository;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.model.Employee;
import com.example.attendance.model.Attendance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/whatsapp")
@CrossOrigin(origins = "*")
public class WhatsAppController {

    @Autowired
    private WhatsAppService whatsAppService;
    
    @Autowired
    private WhatsAppConfig whatsAppConfig;
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private AttendanceRepository attendanceRepository;

    @PostMapping("/send-daily-report")
    public ResponseEntity<Map<String, Object>> sendDailyReport(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String phoneNumber = request.get("phoneNumber");
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                response.put("success", false);
                response.put("message", "Phone number is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Generate daily report
            String reportData = generateDailyReport();
            
            boolean sent = whatsAppService.sendDailyAttendanceReport(phoneNumber, reportData);
            
            response.put("success", sent);
            response.put("message", sent ? "Daily report sent successfully!" : "Failed to send daily report");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/send-absent-alerts")
    public ResponseEntity<Map<String, Object>> sendAbsentAlerts(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String managerPhone = request.get("managerPhone");
            if (managerPhone == null || managerPhone.isEmpty()) {
                response.put("success", false);
                response.put("message", "Manager phone number is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            List<Employee> absentEmployees = findAbsentEmployees();
            int alertsSent = 0;
            
            for (Employee employee : absentEmployees) {
                if (whatsAppService.sendAbsentAlert(managerPhone, employee)) {
                    alertsSent++;
                }
            }
            
            response.put("success", true);
            response.put("message", String.format("Sent %d absent alerts out of %d absent employees", 
                                                alertsSent, absentEmployees.size()));
            response.put("absentCount", absentEmployees.size());
            response.put("alertsSent", alertsSent);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Test with a dummy employee for demonstration
            Employee testEmployee = new Employee();
            testEmployee.setName("Test Employee");
            testEmployee.setEmail("test@example.com");
            testEmployee.setDepartment("IT");
            
            Attendance testAttendance = new Attendance();
            testAttendance.setEmployee(testEmployee);
            testAttendance.setDate(LocalDate.now());
            testAttendance.setCheckIn(java.time.LocalTime.now());
            
            boolean sent = whatsAppService.sendAttendanceConfirmation(testEmployee, testAttendance);
            
            response.put("success", sent);
            response.put("message", sent ? "WhatsApp service is working!" : "WhatsApp service test failed");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "WhatsApp service error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    private String generateDailyReport() {
        LocalDate today = LocalDate.now();
        List<Attendance> todayAttendance = attendanceRepository.findByDate(today);
        List<Employee> allEmployees = employeeRepository.findAll();
        
        int presentCount = todayAttendance.size();
        int totalEmployees = allEmployees.size();
        int absentCount = totalEmployees - presentCount;
        
        StringBuilder report = new StringBuilder();
        report.append("📈 *Summary:*\n");
        report.append(String.format("👥 Total Employees: %d\n", totalEmployees));
        report.append(String.format("✅ Present: %d\n", presentCount));
        report.append(String.format("❌ Absent: %d\n", absentCount));
        
        if (presentCount > 0) {
            report.append("\n👥 *Present Employees:*\n");
            for (Attendance att : todayAttendance) {
                report.append(String.format("• %s (%s)\n", 
                    att.getEmployee().getName(),
                    att.getCheckIn().format(DateTimeFormatter.ofPattern("HH:mm"))
                ));
            }
        }
        
        List<Employee> absentEmployees = findAbsentEmployees();
        if (!absentEmployees.isEmpty()) {
            report.append("\n❌ *Absent Employees:*\n");
            for (Employee emp : absentEmployees) {
                report.append(String.format("• %s (%s)\n", 
                    emp.getName(), 
                    emp.getDepartment() != null ? emp.getDepartment() : "No Dept"
                ));
            }
        }
        
        return report.toString();
    }

    private List<Employee> findAbsentEmployees() {
        LocalDate today = LocalDate.now();
        List<Employee> allEmployees = employeeRepository.findAll();
        List<Attendance> todayAttendance = attendanceRepository.findByDate(today);
        
        // Remove employees who are present today
        allEmployees.removeIf(employee -> 
            todayAttendance.stream().anyMatch(att -> 
                att.getEmployee().getId().equals(employee.getId())
            )
        );
        
        return allEmployees;
    }
    
    @GetMapping("/debug")
    public ResponseEntity<Map<String, String>> getDebugInfo() {
        Map<String, String> debug = new HashMap<>();
        debug.put("enabled", String.valueOf(whatsAppConfig.isEnabled()));
        debug.put("account.sid", whatsAppConfig.getAccount().getSid());
        debug.put("account.token", whatsAppConfig.getAccount().getToken() != null ? "***SET***" : "NULL");
        debug.put("fromNumber", whatsAppConfig.getFromNumber());
        return ResponseEntity.ok(debug);
    }
}
