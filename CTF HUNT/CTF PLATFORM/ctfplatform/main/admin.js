const express = require("express");
const fs = require("fs");
const securityManager = require("./security.js");
const jwt = require("jsonwebtoken");
const Router = express.Router();

// Admin middleware to verify admin privileges
const verifyAdmin = (req, res, next) => {
  try {
    const clientIP = securityManager.getClientIP(req);
    securityManager.logSecurityEvent('info', `Admin access attempt from ${clientIP}`);

    // 1) Check Authorization header for Bearer token
    const authHeader = req.get('Authorization') || req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const secret = process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret';
        const payload = jwt.verify(token, secret);
        if (payload && payload.role === 'admin') {
          securityManager.logSecurityEvent('success', `Admin JWT validated for ${clientIP}`);
          return next();
        }
      } catch (err) {
        // fallthrough to other checks
        securityManager.logSecurityEvent('warning', `Invalid admin JWT: ${err.message}`);
      }
    }

    // 2) Check cookie header for adminToken (simple parse)
    const cookieHeader = req.get('Cookie') || req.headers['cookie'] || '';
    if (cookieHeader) {
      const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('adminToken='));
      if (match) {
        const token = match.split('=')[1];
        try {
          const secret = process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret';
          const payload = jwt.verify(token, secret);
          if (payload && payload.role === 'admin') {
            securityManager.logSecurityEvent('success', `Admin cookie JWT validated for ${clientIP}`);
            return next();
          }
        } catch (err) {
          securityManager.logSecurityEvent('warning', `Invalid admin cookie JWT: ${err.message}`);
        }
      }
    }

    // 3) Fallback: legacy adminKey in body (keeps demo/backwards-compatible flows)
    const { adminKey } = req.body || {};
    if (adminKey && securityManager.validateAdminCredentials(adminKey)) {
      securityManager.logSecurityEvent('success', `Admin access granted to ${clientIP} via adminKey`);
      return next();
    }

    securityManager.logSecurityEvent('warning', `Failed admin access attempt from ${clientIP}`);
    return res.status(403).json({ message: "Unauthorized admin access" });
  } catch (error) {
    securityManager.logSecurityEvent('error', `Admin authentication error: ${error.message}`);
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
};

// Get all users for admin panel
Router.post("/users", verifyAdmin, (req, res) => {
  try {
    const userDataArray = JSON.parse(fs.readFileSync(`${__dirname}/userData.json`));
    
    // Remove sensitive information (passwords)
    const safeUsers = userDataArray.map(user => ({
      username: user.username,
      email: user.email,
      ranking: user.ranking,
      score: user.score,
      solved: user.solved,
      challengeCategorySolved: user.challengeCategorySolved,
      aiHintsUsed: user.aiHintsUsed || 0,
      status: "active", // Default status
      role: user.username.includes("admin") ? "admin" : "user", // Simple role detection
      lastActive: "Recently" // Placeholder for last active time
    }));
    
    res.json({ users: safeUsers, total: safeUsers.length });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get system statistics
Router.post("/stats", verifyAdmin, (req, res) => {
  try {
    const userDataArray = JSON.parse(fs.readFileSync(`${__dirname}/userData.json`));
    const challengeDataArray = JSON.parse(fs.readFileSync(`${__dirname}/courseData.json`));
    
    const stats = {
      totalUsers: userDataArray.length,
      activeSessions: Math.floor(Math.random() * 50) + 10, // Simulated
      totalChallenges: challengeDataArray.length,
      securityThreats: Math.floor(Math.random() * 3), // Simulated
      totalScore: userDataArray.reduce((sum, user) => sum + (user.score > 0 ? user.score : 0), 0),
      averageScore: Math.round(userDataArray.reduce((sum, user) => sum + (user.score > 0 ? user.score : 0), 0) / userDataArray.length),
      topPerformers: userDataArray
        .filter(user => user.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(user => ({ username: user.username, score: user.score }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

// Get challenges for admin management
Router.post("/challenges", verifyAdmin, (req, res) => {
  try {
    const challengeDataArray = JSON.parse(fs.readFileSync(`${__dirname}/courseData.json`));
    
    // Add admin-specific properties
    const adminChallenges = challengeDataArray.map((challenge, index) => ({
      id: index + 1,
      ...challenge,
      status: "active", // Default status
      createdBy: "System",
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }));
    
    res.json({ challenges: adminChallenges });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
});

// Update challenge status (enable/disable)
Router.post("/challenges/toggle", verifyAdmin, (req, res) => {
  try {
    const { challengeId, status } = req.body;
    
    // In a real implementation, you'd update the database
    // For now, we'll just return success
    res.json({ 
      message: `Challenge ${challengeId} ${status === 'active' ? 'enabled' : 'disabled'} successfully`,
      challengeId,
      newStatus: status
    });
    
  } catch (error) {
    console.error("Error toggling challenge:", error);
    res.status(500).json({ message: "Failed to update challenge status" });
  }
});

// Suspend/Ban user
Router.post("/users/action", verifyAdmin, (req, res) => {
  try {
    const { username, action } = req.body;
    
    // Read current user data
    const userDataArray = JSON.parse(fs.readFileSync(`${__dirname}/userData.json`));
    let userFound = false;
    
    // Update user status
    for (let i = 0; i < userDataArray.length; i++) {
      if (userDataArray[i].username === username) {
        userFound = true;
        
        // Add status field if it doesn't exist
        if (!userDataArray[i].status) {
          userDataArray[i].status = "active";
        }
        
        // Update status based on action
        switch (action) {
          case "suspend":
            userDataArray[i].status = "suspended";
            userDataArray[i].suspendedAt = new Date().toISOString();
            break;
          case "ban":
            userDataArray[i].status = "banned";
            userDataArray[i].bannedAt = new Date().toISOString();
            break;
          case "activate":
            userDataArray[i].status = "active";
            delete userDataArray[i].suspendedAt;
            delete userDataArray[i].bannedAt;
            break;
        }
        
        break;
      }
    }
    
    if (!userFound) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Write updated data back to file
    fs.writeFileSync(`${__dirname}/userData.json`, JSON.stringify(userDataArray, null, 2));
    
    // Log the admin action
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: `User ${action}`,
      target: username,
      adminUser: "Admin",
      ip: securityManager.getClientIP(req)
    };
    
    console.log("Admin Action:", logEntry);
    securityManager.logSecurityEvent('warning', `User ${username} ${action} by admin`);
    
    res.json({ 
      message: `User ${username} ${action} successfully`,
      action,
      username,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error performing user action:", error);
    securityManager.logSecurityEvent('error', `Failed to ${req.body.action} user ${req.body.username}: ${error.message}`);
    res.status(500).json({ message: "Failed to perform user action" });
  }
});

// Get security logs
Router.post("/security-logs", verifyAdmin, (req, res) => {
  try {
    // In production, these would come from actual log files or database
    const securityLogs = [
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Admin panel accessed",
        ip: req.ip || "127.0.0.1",
        userAgent: req.get('User-Agent') || "Unknown"
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: "warning",
        message: "Multiple login attempts detected",
        ip: "192.168.1.100",
        userAgent: "Chrome/120.0"
      },
      {
        timestamp: new Date(Date.now() - 600000).toISOString(),
        level: "error",
        message: "Suspicious API request blocked",
        ip: "10.0.0.50",
        userAgent: "curl/7.68.0"
      },
      {
        timestamp: new Date(Date.now() - 900000).toISOString(),
        level: "success",
        message: "User password changed successfully",
        ip: "192.168.1.10",
        userAgent: "Firefox/119.0"
      }
    ];
    
    res.json({ logs: securityLogs });
  } catch (error) {
    console.error("Error fetching security logs:", error);
    res.status(500).json({ message: "Failed to fetch security logs" });
  }
});

// Block IP address
Router.post("/security/block-ip", verifyAdmin, (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ message: "IP address is required" });
    }
    
    // In production, add to firewall rules or IP blacklist
    console.log(`IP ${ip} blocked by admin`);
    
    res.json({ 
      message: `IP ${ip} has been blocked successfully`,
      blockedIp: ip,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error blocking IP:", error);
    res.status(500).json({ message: "Failed to block IP address" });
  }
});

// Update security settings
Router.post("/security/settings", verifyAdmin, (req, res) => {
  try {
    const { loginLimit, apiLimit } = req.body;
    
    // In production, update configuration files or database
    const securityConfig = {
      maxLoginAttempts: parseInt(loginLimit) || 5,
      apiRequestsPerMinute: parseInt(apiLimit) || 60,
      lastUpdated: new Date().toISOString(),
      updatedBy: "Admin"
    };
    
    console.log("Security settings updated:", securityConfig);
    
    res.json({ 
      message: "Security settings updated successfully",
      config: securityConfig
    });
    
  } catch (error) {
    console.error("Error updating security settings:", error);
    res.status(500).json({ message: "Failed to update security settings" });
  }
});

// Competition settings management
Router.post("/competition/settings", verifyAdmin, (req, res) => {
  try {
    const { status, maxParticipants, endTime } = req.body;
    
    const competitionConfig = {
      status: status || "active",
      maxParticipants: parseInt(maxParticipants) || 1000,
      endTime: endTime || null,
      lastUpdated: new Date().toISOString(),
      updatedBy: "Admin"
    };
    
    console.log("Competition settings updated:", competitionConfig);
    
    res.json({ 
      message: "Competition settings updated successfully",
      config: competitionConfig
    });
    
  } catch (error) {
    console.error("Error updating competition settings:", error);
    res.status(500).json({ message: "Failed to update competition settings" });
  }
});

// System maintenance operations
Router.post("/system/maintenance", verifyAdmin, (req, res) => {
  try {
    const { operation } = req.body;
    
    let message = "";
    
    switch (operation) {
      case "clear-cache":
        // In production, clear actual cache
        message = "System cache cleared successfully";
        break;
      case "backup-database":
        // In production, trigger database backup
        message = "Database backup initiated";
        break;
      case "restart-server":
        // In production, gracefully restart server
        message = "Server restart scheduled";
        break;
      case "maintenance-mode":
        // In production, enable maintenance mode
        message = "Maintenance mode enabled";
        break;
      default:
        return res.status(400).json({ message: "Invalid maintenance operation" });
    }
    
    console.log(`Maintenance operation: ${operation} by admin`);
    
    res.json({ 
      message,
      operation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error performing maintenance:", error);
    res.status(500).json({ message: "Failed to perform maintenance operation" });
  }
});

// Get real-time metrics
Router.post("/metrics/realtime", verifyAdmin, (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      activeUsers: Math.floor(Math.random() * 20) + 5,
      serverLoad: (Math.random() * 100).toFixed(1),
      memoryUsage: (Math.random() * 80 + 20).toFixed(1),
      networkTraffic: Math.floor(Math.random() * 1000) + 100,
      responseTime: (Math.random() * 200 + 50).toFixed(0),
      errorRate: (Math.random() * 5).toFixed(2)
    };
    
    res.json({ metrics });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ message: "Failed to fetch real-time metrics" });
  }
});

// Export data (users/logs)
Router.post("/export", verifyAdmin, (req, res) => {
  try {
    const { type } = req.body;
    
    let exportData = {};
    
    if (type === "users") {
      const userDataArray = JSON.parse(fs.readFileSync(`${__dirname}/userData.json`));
      exportData = {
        type: "users",
        exported: new Date().toISOString(),
        count: userDataArray.length,
        data: userDataArray.map(user => ({
          username: user.username,
          email: user.email,
          score: user.score,
          solved: user.solved,
          ranking: user.ranking
        }))
      };
    } else if (type === "logs") {
      exportData = {
        type: "security_logs",
        exported: new Date().toISOString(),
        message: "Log export feature would be implemented here"
      };
    }
    
    res.json({
      message: `${type} export completed`,
      export: exportData
    });
    
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ message: "Failed to export data" });
  }
});

// Get real-time security statistics
Router.post("/security/stats", verifyAdmin, (req, res) => {
  try {
    const stats = securityManager.getSecurityStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching security stats:", error);
    res.status(500).json({ message: "Failed to fetch security statistics" });
  }
});

// Unblock IP address
Router.post("/security/unblock-ip", verifyAdmin, (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ message: "IP address is required" });
    }
    
    securityManager.unblockIP(ip);
    
    res.json({ 
      message: `IP ${ip} has been unblocked successfully`,
      unblockedIp: ip,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error unblocking IP:", error);
    res.status(500).json({ message: "Failed to unblock IP address" });
  }
});

// Emergency security lockdown
Router.post("/security/emergency-lockdown", verifyAdmin, (req, res) => {
  try {
    securityManager.emergencyLockdown();
    
    res.json({ 
      message: "Emergency security lockdown activated",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error activating lockdown:", error);
    res.status(500).json({ message: "Failed to activate emergency lockdown" });
  }
});

// Release emergency lockdown
Router.post("/security/release-lockdown", verifyAdmin, (req, res) => {
  try {
    securityManager.releaseLockdown();
    
    res.json({ 
      message: "Emergency lockdown released",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error releasing lockdown:", error);
    res.status(500).json({ message: "Failed to release emergency lockdown" });
  }
});

// Clear security logs
Router.post("/security/clear-logs", verifyAdmin, (req, res) => {
  try {
    const clearedCount = securityManager.clearLogs();
    
    res.json({ 
      message: `Security logs cleared successfully`,
      clearedEntries: clearedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error clearing logs:", error);
    res.status(500).json({ message: "Failed to clear security logs" });
  }
});

// Note: Admin authentication is handled by `login.js` under the /authentication route.
// The duplicate /admin/auth endpoint was removed to keep a single authentication source.

module.exports = Router;