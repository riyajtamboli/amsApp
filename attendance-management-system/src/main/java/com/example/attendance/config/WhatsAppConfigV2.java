package com.example.attendance.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WhatsAppConfigV2 {
    
    @Value("${whatsapp.account.sid}")
    private String accountSid;
    
    @Value("${whatsapp.account.token}")
    private String accountToken;
    
    @Value("${whatsapp.from-number}")
    private String fromNumber;
    
    @Value("${whatsapp.enabled}")
    private boolean enabled;
    
    public String getAccountSid() {
        return accountSid;
    }
    
    public String getAccountToken() {
        return accountToken;
    }
    
    public String getFromNumber() {
        return fromNumber;
    }
    
    public boolean isEnabled() {
        return enabled;
    }
}
