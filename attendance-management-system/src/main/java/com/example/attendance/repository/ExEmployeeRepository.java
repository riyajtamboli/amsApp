package com.example.attendance.repository;

import com.example.attendance.model.ExEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExEmployeeRepository extends JpaRepository<ExEmployee, Long> {
}
