package com.example.attendance.repository;

import com.example.attendance.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Optional: if you're using fingerprintId lookup
    Employee findByFingerprintId(String fingerprintId);
}
