package com.example.attendance.repository;

import com.example.attendance.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndDate(Long employeeId, LocalDate date);

    List<Attendance> findByDateBetween(LocalDate from, LocalDate to);

    List<Attendance> findAllByOrderByDateDescCheckInDesc();

    List<Attendance> findByDate(LocalDate date);
    // List<Attendance> findByDateBetween(LocalDate startDate, LocalDate endDate);
}