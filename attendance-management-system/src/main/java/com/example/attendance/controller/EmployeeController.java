package com.example.attendance.controller;

import com.example.attendance.model.Employee;
import com.example.attendance.model.ExEmployee;
import com.example.attendance.repository.EmployeeRepository;
import com.example.attendance.repository.ExEmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class EmployeeController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ExEmployeeRepository exEmployeeRepository;

    // POST - Add employee
    @PostMapping(value = "/employees", consumes = { "multipart/form-data" })
    public ResponseEntity<?> addEmployee(@RequestParam("name") String name,
                                         @RequestParam(value = "fingerprintId", required = false) String fingerprintId,
                                         @RequestParam(value = "email", required = false) String email,
                                         @RequestParam(value = "department", required = false) String department,
                                         @RequestParam("phone") String phone) {
        try {
            // Check for duplicate fingerprintId
            if (fingerprintId != null && employeeRepository.findByFingerprintId(fingerprintId) != null) {
                return ResponseEntity.badRequest()
                        .body("Employee with fingerprintId '" + fingerprintId + "' already exists.");
            }
            // Check for duplicate email
            if (email != null && employeeRepository.findAll().stream()
                    .anyMatch(e -> e.getEmail() != null && e.getEmail().equals(email))) {
                return ResponseEntity.badRequest().body("Employee with email '" + email + "' already exists.");
            }

            Employee employee = new Employee();
            employee.setName(name);
            employee.setFingerprintId(fingerprintId);
            employee.setEmail(email);
            employee.setDepartment(department);
            employee.setPhone(phone);

            Employee savedEmployee = employeeRepository.save(employee);
            return ResponseEntity.ok(savedEmployee);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error saving employee: " + e.getMessage());
        }
    }

    // Test endpoint to return hardcoded employees list
    @GetMapping("/employees/test")
    public List<Employee> getTestEmployees() {
        Employee e1 = new Employee("Test User 1", "FP100", "test1@example.com", "IT");
        Employee e2 = new Employee("Test User 2", "FP101", "test2@example.com", "HR");
        return List.of(e1, e2);
    }

    // ✅ GET - View all employees
    @GetMapping("/employees")
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    // GET - Get employee by fingerprint ID
    @GetMapping("/employees/fingerprint/{fingerprintId}")
    public ResponseEntity<Employee> getEmployeeByFingerprintId(@PathVariable String fingerprintId) {
        Employee employee = employeeRepository.findByFingerprintId(fingerprintId);
        if (employee != null) {
            return ResponseEntity.ok(employee);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE - Delete employee by ID
    @DeleteMapping("/employees/{id}")
    @Transactional
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        try {
            Employee employee = employeeRepository.findById(id).orElse(null);
            if (employee != null) {
                // Move to ex_employees table
                ExEmployee exEmployee = new ExEmployee();
                exEmployee.setName(employee.getName());
                exEmployee.setEmail(employee.getEmail());
                exEmployee.setPhone(employee.getPhone());
                exEmployee.setDepartment(employee.getDepartment());
                exEmployee.setFingerprintId(employee.getFingerprintId());
                exEmployee.setDeletedDate(java.time.LocalDate.now().toString());
                try {
                    exEmployeeRepository.save(exEmployee);
                } catch (DataIntegrityViolationException dive) {
                    return ResponseEntity.badRequest().body("Employee already in archive");
                }

                employeeRepository.deleteById(id);
                return ResponseEntity.ok().body("Employee deleted and archived successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting employee: " + e.getMessage());
        }
    }

    // GET - Generate next sequential fingerprint ID
    @GetMapping("/employees/next-fingerprint")
    public ResponseEntity<String> getNextFingerprintId() {
        long count = employeeRepository.count();
        String nextId = String.format("FP%03d", count + 1);
        return ResponseEntity.ok(nextId);
    }

    // GET - View all ex-employees
    @GetMapping("/ex-employees")
    public ResponseEntity<List<ExEmployee>> getAllExEmployees() {
        return ResponseEntity.ok(exEmployeeRepository.findAll());
    }

    // DELETE - Delete ex-employee by ID (used when restoring)
    @DeleteMapping("/ex-employees/{id}")
    @Transactional
    public ResponseEntity<?> deleteExEmployee(@PathVariable Long id) {
        try {
            System.out.println("Attempting to delete ex-employee with id: " + id);
            if (exEmployeeRepository.existsById(id)) {
                exEmployeeRepository.deleteById(id);
                System.out.println("Ex-employee deleted successfully");
                return ResponseEntity.ok().body("Ex-Employee deleted successfully");
            } else {
                System.out.println("Ex-employee not found with id: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.out.println("Error deleting ex-employee: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error deleting ex-employee: " + e.getMessage());
        }
    }

    // ✅ Restore ex-employee back to active employees
    @PostMapping("/ex-employees/restore/{id}")
    @Transactional
    public ResponseEntity<?> restoreExEmployee(@PathVariable Long id) {
        ExEmployee exEmployee = exEmployeeRepository.findById(id).orElse(null);
        if (exEmployee == null) {
            return ResponseEntity.notFound().build();
        }

        // Check for duplicate fingerprintId
        if (exEmployee.getFingerprintId() != null &&
            employeeRepository.findByFingerprintId(exEmployee.getFingerprintId()) != null) {
            return ResponseEntity.badRequest()
                    .body("Cannot restore. FingerprintId already exists in active employees.");
        }

        // Check for duplicate email
        if (exEmployee.getEmail() != null &&
            employeeRepository.findAll().stream()
                    .anyMatch(e -> e.getEmail() != null && e.getEmail().equals(exEmployee.getEmail()))) {
            return ResponseEntity.badRequest()
                    .body("Cannot restore. Email already exists in active employees.");
        }

        // Move back to employees
        Employee restored = new Employee();
        restored.setName(exEmployee.getName());
        restored.setEmail(exEmployee.getEmail());
        restored.setPhone(exEmployee.getPhone());
        restored.setDepartment(exEmployee.getDepartment());
        restored.setFingerprintId(exEmployee.getFingerprintId());

        employeeRepository.save(restored);

        // Remove from ex-employees
        exEmployeeRepository.deleteById(id);

        return ResponseEntity.ok("Employee restored successfully");
    }
}
