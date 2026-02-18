const fs = require('fs');
const path = require('path');

// Security middleware for the CTF HUNT platform
class SecurityManager {
  constructor() {
    this.blockedIPs = new Set();
    this.loginAttempts = new Map(); // Track failed login attempts
    this.rateLimits = new Map(); // Track API rate limits
    this.securityLogs = [];
    
    // Security configuration
    this.config = {
      maxLoginAttempts: 5,
      loginBlockDuration: 15 * 60 * 1000, // 15 minutes
      apiRequestsPerMinute: 60,
      suspiciousActivityThreshold: 10,
      adminPasswords: ['admin123', 'secureAdmin2025'], // In production, hash these
      blockedUserAgents: ['bot', 'crawler', 'spider', 'scraper'],
      allowedOrigins: ['localhost', '127.0.0.1']
    };
  }

  // Initialize security middleware
  init(app) {
    // Trust proxy for proper IP detection
    app.set('trust proxy', true);
    
    // Security headers middleware
    app.use(this.securityHeaders.bind(this));
    
    // IP blocking middleware
    app.use(this.ipBlockingMiddleware.bind(this));
    
    // Rate limiting middleware
    app.use(this.rateLimitingMiddleware.bind(this));
    
    // Request logging middleware
    app.use(this.requestLoggingMiddleware.bind(this));
    
    // Bot detection middleware
    app.use(this.botDetectionMiddleware.bind(this));
    
    console.log('🛡️ Security middleware initialized');
  }

  // Add security headers
  securityHeaders(req, res, next) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    // Content Security Policy (Botpress compatible)
res.setHeader(
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.botpress.cloud https://files.bpcontent.cloud",
    "script-src-elem 'self' 'unsafe-inline' https://cdn.botpress.cloud https://files.bpcontent.cloud",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://cdn.botpress.cloud",
    "connect-src 'self' http://localhost:8000 https://cdn.botpress.cloud https://files.bpcontent.cloud wss://*.botpress.cloud",
    "frame-src https://cdn.botpress.cloud https://files.bpcontent.cloud"
  ].join('; ')
);

    
    next();
  }

  // Block malicious IPs
  ipBlockingMiddleware(req, res, next) {
    const clientIP = this.getClientIP(req);
    
    if (this.blockedIPs.has(clientIP)) {
      this.logSecurityEvent('error', `Blocked IP ${clientIP} attempted access`, req);
      return res.status(403).json({ 
        message: 'Access denied. IP address blocked.',
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  }

  // Rate limiting middleware
  rateLimitingMiddleware(req, res, next) {
    const clientIP = this.getClientIP(req);
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    // Clean old entries
    if (!this.rateLimits.has(clientIP)) {
      this.rateLimits.set(clientIP, []);
    }
    
    const requests = this.rateLimits.get(clientIP);
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.config.apiRequestsPerMinute) {
      this.logSecurityEvent('warning', `Rate limit exceeded for IP ${clientIP}`, req);
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter: 60,
        timestamp: new Date().toISOString()
      });
    }
    
    recentRequests.push(now);
    this.rateLimits.set(clientIP, recentRequests);
    
    next();
  }

  // Log all requests for security monitoring
  requestLoggingMiddleware(req, res, next) {
    const clientIP = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    // Log suspicious patterns
    if (this.isSuspiciousRequest(req)) {
      this.logSecurityEvent('warning', `Suspicious request detected: ${req.method} ${req.path}`, req);
    }
    
    // Log all authentication attempts
    if (req.path.includes('login') || req.path.includes('sign-up') || req.path.includes('admin')) {
      this.logSecurityEvent('info', `Authentication attempt: ${req.method} ${req.path}`, req);
    }
    
    next();
  }

  // Detect and block bots
  botDetectionMiddleware(req, res, next) {
    const userAgent = (req.get('User-Agent') || '').toLowerCase();
    
    for (const blockedAgent of this.config.blockedUserAgents) {
      if (userAgent.includes(blockedAgent)) {
        const clientIP = this.getClientIP(req);
        this.logSecurityEvent('warning', `Bot detected and blocked: ${userAgent}`, req);
        this.blockIP(clientIP, `Automated bot detection: ${blockedAgent}`);
        
        return res.status(403).json({
          message: 'Automated requests not allowed',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    next();
  }

  // Track failed login attempts
  trackLoginAttempt(ip, username, success) {
    const key = `${ip}:${username}`;
    const now = Date.now();
    
    if (!this.loginAttempts.has(key)) {
      this.loginAttempts.set(key, { count: 0, lastAttempt: now, blocked: false });
    }
    
    const attempt = this.loginAttempts.get(key);
    
    if (success) {
      // Reset on successful login
      this.loginAttempts.delete(key);
      this.logSecurityEvent('success', `Successful login: ${username}`, { ip });
    } else {
      attempt.count++;
      attempt.lastAttempt = now;
      
      this.logSecurityEvent('warning', `Failed login attempt ${attempt.count} for ${username}`, { ip });
      
      // Block after max attempts
      if (attempt.count >= this.config.maxLoginAttempts) {
        attempt.blocked = true;
        this.blockIP(ip, `Exceeded login attempts for ${username}`);
        this.logSecurityEvent('error', `IP ${ip} blocked due to excessive login failures`, { ip });
      }
    }
  }

  // Block an IP address
  blockIP(ip, reason = 'Security violation') {
    this.blockedIPs.add(ip);
    this.logSecurityEvent('error', `IP ${ip} blocked: ${reason}`, { ip });
    
    // In production, you might want to save blocked IPs to a database
    console.log(`🚫 IP ${ip} has been blocked: ${reason}`);
  }

  // Unblock an IP address
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.logSecurityEvent('info', `IP ${ip} unblocked by admin`, { ip });
    console.log(`✅ IP ${ip} has been unblocked`);
  }

  // Check if request is suspicious
  isSuspiciousRequest(req) {
    try {
      const suspiciousPatterns = [
        /\.\./,  // Directory traversal
        /<script/i,  // XSS attempts
        /union.*select/i,  // SQL injection
        /javascript:/i,  // JavaScript injection
        /eval\(/i,  // Code injection
        /exec\(/i,  // Command injection
        /system\(/i  // System command attempts
      ];
      
      const path = req.path || '';
      const query = req.query ? JSON.stringify(req.query) : '';
      const body = req.body ? JSON.stringify(req.body) : '';
      const checkString = `${path} ${query} ${body}`;
      
      return suspiciousPatterns.some(pattern => pattern.test(checkString));
    } catch (error) {
      console.error('Error in suspicious request check:', error);
      return false;
    }
  }

  // Get real client IP
  getClientIP(req) {
    if (!req) return '127.0.0.1';
    
    return req.ip || 
           (req.connection && req.connection.remoteAddress) || 
           (req.socket && req.socket.remoteAddress) ||
           (req.headers && req.headers['x-forwarded-for']) ||
           '127.0.0.1';
  }

  // Log security events
  logSecurityEvent(level, message, req = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      ip: req.ip || this.getClientIP(req) || 'Unknown',
      userAgent: req.get ? req.get('User-Agent') : 'Unknown',
      path: req.path || 'Unknown',
      method: req.method || 'Unknown'
    };
    
    this.securityLogs.unshift(logEntry);
    
    // Keep only last 1000 logs in memory
    if (this.securityLogs.length > 1000) {
      this.securityLogs = this.securityLogs.slice(0, 1000);
    }
    
    // In production, write to proper log files
    console.log(`[SECURITY ${level.toUpperCase()}] ${message} (IP: ${logEntry.ip})`);
  }

  // Get security statistics
  getSecurityStats() {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    
    const recentLogs = this.securityLogs.filter(log => 
      new Date(log.timestamp).getTime() > hourAgo
    );
    
    return {
      blockedIPs: Array.from(this.blockedIPs),
      totalBlockedIPs: this.blockedIPs.size,
      recentEvents: recentLogs.slice(0, 50),
      eventCounts: {
        errors: recentLogs.filter(log => log.level === 'error').length,
        warnings: recentLogs.filter(log => log.level === 'warning').length,
        info: recentLogs.filter(log => log.level === 'info').length
      },
      activeLoginAttempts: this.loginAttempts.size,
      rateLimitedIPs: this.rateLimits.size
    };
  }

  // Validate admin credentials
  validateAdminCredentials(password) {
    return this.config.adminPasswords.includes(password);
  }

  // Update security configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logSecurityEvent('info', 'Security configuration updated');
  }

  // Export security logs
  exportLogs(format = 'json') {
    const exportData = {
      exported: new Date().toISOString(),
      totalLogs: this.securityLogs.length,
      logs: this.securityLogs
    };
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }
    
    // CSV format
    const csvHeader = 'Timestamp,Level,Message,IP,User-Agent,Path,Method\n';
    const csvData = this.securityLogs.map(log => 
      `${log.timestamp},${log.level},${log.message},${log.ip},"${log.userAgent}",${log.path},${log.method}`
    ).join('\n');
    
    return csvHeader + csvData;
  }

  // Clear security logs
  clearLogs() {
    const clearedCount = this.securityLogs.length;
    this.securityLogs = [];
    this.logSecurityEvent('info', `Security logs cleared (${clearedCount} entries)`);
    return clearedCount;
  }

  // Emergency security lockdown
  emergencyLockdown() {
    this.config.apiRequestsPerMinute = 10; // Severely limit requests
    this.config.maxLoginAttempts = 1; // Almost no login attempts allowed
    
    this.logSecurityEvent('error', 'EMERGENCY LOCKDOWN ACTIVATED');
    console.log('🚨 EMERGENCY SECURITY LOCKDOWN ACTIVATED');
    
    // In production, notify administrators immediately
  }

  // Release emergency lockdown
  releaseLockdown() {
    this.config.apiRequestsPerMinute = 60;
    this.config.maxLoginAttempts = 5;
    
    this.logSecurityEvent('info', 'Emergency lockdown released');
    console.log('✅ Emergency security lockdown released');
  }
}

// Create singleton instance
const securityManager = new SecurityManager();

module.exports = securityManager;