package com.example.attendance.service;

import com.example.attendance.config.WhatsAppConfigV2;
import com.example.attendance.model.Employee;
import com.example.attendance.model.Attendance;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class WhatsAppService {

    @Autowired
    private WhatsAppConfigV2 whatsAppConfig;

    private boolean initialized = false;

    private void initializeTwilio() {
        if (!initialized && whatsAppConfig.isEnabled()) {
            try {
                System.out.println("🔧 DEBUG: Account SID: " + whatsAppConfig.getAccountSid());
                System.out.println("🔧 DEBUG: From Number: " + whatsAppConfig.getFromNumber());
                System.out.println("🔧 DEBUG: Enabled: " + whatsAppConfig.isEnabled());
                
                Twilio.init(whatsAppConfig.getAccountSid(), whatsAppConfig.getAccountToken());
                initialized = true;
                System.out.println("✅ WhatsApp Service initialized successfully");
            } catch (Exception e) {
                System.err.println("❌ Failed to initialize WhatsApp Service: " + e.getMessage());
            }
        }
    }

    public boolean sendAttendanceConfirmation(Employee employee, Attendance attendance) {
        if (!whatsAppConfig.isEnabled()) {
            System.out.println("📱 WhatsApp is disabled in configuration");
            return false;
        }

        initializeTwilio();
        
        if (!initialized) {
            System.err.println("❌ WhatsApp service not initialized");
            return false;
        }

        try {
            // Manually set manager's WhatsApp number here
            String managerNumber = "+919999999999"; // <-- Change this to your manager's WhatsApp number
            String phoneNumber = formatPhoneNumber(managerNumber);
            String messageBody = createAttendanceMessage(employee, attendance);

            Message message = Message.creator(
                new PhoneNumber("whatsapp:" + phoneNumber),
                new PhoneNumber(whatsAppConfig.getFromNumber()),
                messageBody
            ).create();

            System.out.println("✅ WhatsApp message sent to MANAGER: " + message.getSid());
            return true;
        } catch (Exception e) {
            System.err.println("❌ Failed to send WhatsApp message: " + e.getMessage());
            return false;
        }
    }

    public boolean sendDailyAttendanceReport(String phoneNumber, String reportData) {
        if (!whatsAppConfig.isEnabled()) return false;
        
        initializeTwilio();
        if (!initialized) return false;

        try {
            String messageBody = createDailyReportMessage(reportData);
            
            Message message = Message.creator(
                new PhoneNumber("whatsapp:" + formatPhoneNumber(phoneNumber)),
                new PhoneNumber(whatsAppConfig.getFromNumber()),
                messageBody
            ).create();

            System.out.println("✅ Daily report sent via WhatsApp: " + message.getSid());
            return true;
        } catch (Exception e) {
            System.err.println("❌ Failed to send daily report: " + e.getMessage());
            return false;
        }
    }

    public boolean sendLateArrivalAlert(Employee employee) {
        if (!whatsAppConfig.isEnabled()) return false;
        
        initializeTwilio();
        if (!initialized) return false;

        try {
            String phoneNumber = formatPhoneNumber(employee.getPhone());
            String messageBody = createLateArrivalMessage(employee);
            
            Message message = Message.creator(
                new PhoneNumber("whatsapp:" + phoneNumber),
                new PhoneNumber(whatsAppConfig.getFromNumber()),
                messageBody
            ).create();

            System.out.println("✅ Late arrival alert sent: " + message.getSid());
            return true;
        } catch (Exception e) {
            System.err.println("❌ Failed to send late arrival alert: " + e.getMessage());
            return false;
        }
    }

    public boolean sendAbsentAlert(String managerPhone, Employee employee) {
        if (!whatsAppConfig.isEnabled()) return false;
        
        initializeTwilio();
        if (!initialized) return false;

        try {
            String messageBody = createAbsentAlertMessage(employee);
            
            Message message = Message.creator(
                new PhoneNumber("whatsapp:" + formatPhoneNumber(managerPhone)),
                new PhoneNumber(whatsAppConfig.getFromNumber()),
                messageBody
            ).create();

            System.out.println("✅ Absent alert sent to manager: " + message.getSid());
            return true;
        } catch (Exception e) {
            System.err.println("❌ Failed to send absent alert: " + e.getMessage());
            return false;
        }
    }

    private String createAttendanceMessage(Employee employee, Attendance attendance) {
        return String.format(
            "🎉 *Attendance Confirmed!*\n\n" +
            "👤 *Employee:* %s\n" +
            "📅 *Date:* %s\n" +
            "🕐 *Check-in Time:* %s\n" +
            "🏢 *Department:* %s\n\n" +
            "✅ Your attendance has been successfully recorded.\n\n" +
            "_Attendance Management System_",
            employee.getName(),
            attendance.getDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")),
            attendance.getCheckIn() != null ? attendance.getCheckIn().toString() : "N/A",
            employee.getDepartment() != null ? employee.getDepartment() : "Not specified"
        );
    }

    private String createDailyReportMessage(String reportData) {
        return String.format(
            "📊 *Daily Attendance Report*\n\n" +
            "📅 *Date:* %s\n\n" +
            "%s\n\n" +
            "📱 _Generated by Attendance Management System_",
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy")),
            reportData
        );
    }

    private String createLateArrivalMessage(Employee employee) {
        return String.format(
            "⚠️ *Late Arrival Notice*\n\n" +
            "👤 *Employee:* %s\n" +
            "📅 *Date:* %s\n" +
            "🕐 *Time:* %s\n\n" +
            "You have been marked as late today. Please ensure to arrive on time.\n\n" +
            "_Attendance Management System_",
            employee.getName(),
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy")),
            java.time.LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
        );
    }

    private String createAbsentAlertMessage(Employee employee) {
        return String.format(
            "🚨 *Absence Alert*\n\n" +
            "👤 *Employee:* %s\n" +
            "🏢 *Department:* %s\n" +
            "📅 *Date:* %s\n\n" +
            "This employee has not marked attendance today.\n\n" +
            "_Attendance Management System_",
            employee.getName(),
            employee.getDepartment() != null ? employee.getDepartment() : "Not specified",
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
        );
    }

    private String formatPhoneNumber(String input) {
        // Return the phone number as is if it's already in correct format
        if (input != null && !input.trim().isEmpty()) {
            // Remove any spaces and ensure it starts with +
            String cleaned = input.replaceAll("\\s+", "");
            if (!cleaned.startsWith("+")) {
                // If it's an Indian number without +, add +91
                if (cleaned.startsWith("91") && cleaned.length() == 12) {
                    cleaned = "+" + cleaned;
                } else if (cleaned.length() == 10) {
                    cleaned = "+91" + cleaned;
                }
            }
            return cleaned;
        }
        return "+919370868842"; // Default to your number if no phone provided
    }
}
