package com.example.attendance.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "whatsapp")
public class WhatsAppConfig {
    
    private Account account = new Account();
    private String fromNumber;
    private boolean enabled = false;
    
    public static class Account {
        private String sid;
        private String token;
        
        public String getSid() {
            return sid;
        }
        
        public void setSid(String sid) {
            this.sid = sid;
        }
        
        public String getToken() {
            return token;
        }
        
        public void setToken(String token) {
            this.token = token;
        }
    }
    
    public Account getAccount() {
        return account;
    }
    
    public void setAccount(Account account) {
        this.account = account;
    }
    
    public String getFromNumber() {
        return fromNumber;
    }
    
    public void setFromNumber(String fromNumber) {
        this.fromNumber = fromNumber;
    }
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
