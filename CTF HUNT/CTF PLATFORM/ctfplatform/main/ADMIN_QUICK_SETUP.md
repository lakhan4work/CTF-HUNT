# CTF HUNT Admin Panel - Quick Setup Guide

## 🚀 Quick Start

### 1. Access the Admin Panel
```
URL: http://localhost:8000/admin.html
Default Passwords: admin123 or secureAdmin2025
```

### 2. First Login Steps
1. Navigate to the admin panel URL
2. Enter the admin password
3. You'll see the security dashboard with live statistics

### 3. Key Features Overview

#### 📊 Dashboard Tab
- **System Statistics**: Users, sessions, challenges, threats
- **Real-time Monitoring**: Live security events and user activity
- **Quick Actions**: Access to common administrative tasks

#### 👥 User Management Tab
- **Search Users**: Find users by username or email
- **User Actions**: View, suspend, or ban users
- **Filter Options**: Filter by status (active/banned) and role

#### 🔒 Security Monitor Tab
- **IP Blocking**: Block/unblock IP addresses in real-time
- **Rate Limiting**: Configure login and API request limits
- **Threat Analytics**: View security event timeline

#### 🧩 Challenge Control Tab
- **Challenge Status**: Enable/disable challenges
- **Challenge Management**: Edit, delete, or add new challenges
- **Analytics**: View solve statistics and difficulty metrics

#### ⚙️ System Settings Tab
- **Competition Control**: Start/pause/end competitions
- **Maintenance**: Cache clearing, backups, server restart
- **Configuration**: Update system settings

#### 📋 Activity Logs Tab
- **Security Logs**: View all security events with filtering
- **Export Options**: Download logs in JSON or CSV format
- **Real-time Updates**: Live log streaming

## 🛡️ Security Features

### Automatic Protection
- **IP Blocking**: Automatically blocks suspicious IPs
- **Rate Limiting**: Prevents brute force attacks
- **Bot Detection**: Identifies and blocks automated requests
- **Input Validation**: Prevents injection attacks

### Manual Controls
- **Emergency Lockdown**: Immediately secure the platform
- **Selective Blocking**: Block specific users or IP ranges
- **Security Settings**: Adjust protection thresholds
- **Audit Trail**: Complete logging of all admin actions

## 🚨 Emergency Procedures

### If Platform is Under Attack
1. **Immediate Response**: Click "Emergency Lockdown" in System Settings
2. **Identify Threat**: Check Security Monitor for attack patterns
3. **Block IPs**: Use IP blocking feature to stop malicious traffic
4. **Review Logs**: Analyze security logs for threat assessment

### System Recovery
1. **Release Lockdown**: Use "Release Lockdown" when threat is contained
2. **Unblock IPs**: Remove legitimate IPs that were blocked
3. **System Check**: Verify all systems are functioning normally
4. **Documentation**: Log the incident and response actions

## 📈 Daily Admin Tasks

### Morning Checklist
- [ ] Check dashboard for overnight security events
- [ ] Review new user registrations
- [ ] Monitor system performance metrics
- [ ] Verify challenge availability and status

### Ongoing Monitoring
- [ ] Watch for security alerts and unusual activity
- [ ] Monitor user behavior and competition progress
- [ ] Respond to user issues and complaints
- [ ] Update challenge content as needed

### Evening Tasks
- [ ] Review daily security logs
- [ ] Backup important data
- [ ] Plan maintenance activities
- [ ] Prepare reports for stakeholders

## ⚡ Quick Actions

### Common Admin Tasks
```javascript
// Block an IP address
IP Blocking → Enter IP → Block IP

// Suspend a user
User Management → Search User → Suspend

// Enable/Disable a challenge
Challenge Control → Find Challenge → Toggle Status

// Clear system cache
System Settings → Maintenance → Clear Cache

// Export security logs
Activity Logs → Filter logs → Export
```

### Keyboard Shortcuts (if implemented)
- `Ctrl + D`: Go to Dashboard
- `Ctrl + U`: Go to User Management  
- `Ctrl + S`: Go to Security Monitor
- `Ctrl + L`: Go to Activity Logs

## 🔧 Troubleshooting

### Common Issues

#### Cannot Access Admin Panel
- Check if server is running: `http://localhost:8000`
- Verify admin password is correct
- Check if IP is not blocked
- Clear browser cache and cookies

#### Users Cannot Login
- Check rate limiting settings
- Verify user is not suspended/banned
- Check for IP blocks affecting users
- Review security logs for errors

#### Performance Issues
- Monitor system resources in dashboard
- Clear cache if necessary
- Check for DDoS attacks or high traffic
- Review rate limiting effectiveness

#### Security Alerts
- Investigate immediately in Security Monitor
- Check recent logs for attack patterns
- Block malicious IPs if confirmed
- Document and report serious incidents

## 📞 Contact & Support

### For Technical Issues
- Check documentation: `ADMIN_PANEL_DOCUMENTATION.md`
- Review security logs for error details
- Contact system administrator
- Report bugs to development team

### For Security Incidents
- **Immediate**: Use emergency lockdown if critical
- **Document**: Log all details in security system
- **Report**: Contact security team immediately
- **Follow-up**: Conduct post-incident review

---

**Important**: This admin panel provides powerful control over the CTF HUNT platform. Always test changes in a safe environment and maintain regular backups of important data.

**Security Reminder**: Keep admin passwords secure, use HTTPS in production, and regularly review security logs for suspicious activity.