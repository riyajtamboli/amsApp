package com.example.attendance.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ex_employees")
public class ExEmployee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private String department;
    private String fingerprintId;
    private String deletedDate;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getFingerprintId() { return fingerprintId; }
    public void setFingerprintId(String fingerprintId) { this.fingerprintId = fingerprintId; }
    public String getDeletedDate() { return deletedDate; }
    public void setDeletedDate(String deletedDate) { this.deletedDate = deletedDate; }
}
