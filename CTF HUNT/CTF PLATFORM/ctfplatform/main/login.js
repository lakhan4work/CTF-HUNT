const express=require("express")
const fs=require("fs")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const securityManager = require("./security.js")
const Router=express.Router()

// Admin login endpoint
Router.post("/admin", async (req, res) => {
    const { password } = req.body;
    const clientIP = securityManager.getClientIP(req);
    
    console.log(`Admin login attempt from ${clientIP}`);
    
    try {
        if (securityManager.validateAdminCredentials(password)) {
            securityManager.trackLoginAttempt(clientIP, "admin", true);

            // Issue a JWT token for admin sessions (24h)
            const secret = process.env.ADMIN_JWT_SECRET || 'admin_jwt_secret';
            const adminToken = jwt.sign({ role: 'admin', timestamp: Date.now(), ip: clientIP }, secret, { expiresIn: '24h' });

            // Set cookies: legacy adminAuth for compatibility and adminToken for auth
            res.cookie("adminAuth", "authenticated", {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 1000 * 60 * 60 * 24 // 24 hours
            });

            res.cookie("adminToken", adminToken, {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 1000 * 60 * 60 * 24 // 24 hours
            });

            securityManager.logSecurityEvent('success', `Admin logged in successfully from ${clientIP}`);
            return res.json({ message: "admin logged in successfully", isAdmin: true, token: adminToken });
        } else {
            securityManager.trackLoginAttempt(clientIP, "admin", false);
            securityManager.logSecurityEvent('warning', `Failed admin login attempt from ${clientIP}`);
            return res.status(401).json({ Message: "Invalid admin credentials" });
        }
    } catch (error) {
        console.error("Admin login error:", error);
        securityManager.logSecurityEvent('error', `Admin login system error: ${error.message}`);
        return res.status(500).json({ Message: "Admin login system error" });
    }
});

// Router.use(express.urlencoded({extended:true}))
Router.post("/login",async (req,res)=>{
    const {email,password}=req.body
    const clientIP = securityManager.getClientIP(req);
    
    console.log(`Login attempt from ${clientIP} for email: ${email}`);

    try {
        let userDataArray=JSON.parse(fs.readFileSync(`${__dirname}/userData.json`))
        let userFound = false;
        
        for(let i=0;i<userDataArray.length;i++){
            if(userDataArray[i].email===email){
                userFound = true;
                
                // Check if user is banned or suspended
                const userStatus = userDataArray[i].status || 'active';
                if (userStatus === 'banned') {
                    securityManager.trackLoginAttempt(clientIP, email, false);
                    securityManager.logSecurityEvent('warning', `Banned user ${email} attempted login`);
                    return res.status(403).json({Message: "Account has been banned. Contact administrator."});
                }
                
                if (userStatus === 'suspended') {
                    securityManager.trackLoginAttempt(clientIP, email, false);
                    securityManager.logSecurityEvent('warning', `Suspended user ${email} attempted login`);
                    return res.status(403).json({Message: "Account has been suspended. Contact administrator."});
                }
                
                let pw=await bcrypt.compare(password.toString(),userDataArray[i].password)
                console.log(`Password verification result: ${pw}`)
                
                if(pw){
                    // Track successful login
                    securityManager.trackLoginAttempt(clientIP, email, true);
                    
                    res.cookie("email",email, {
                        httpOnly: true,
                        secure: false, // Set to true in production with HTTPS
                        sameSite: "lax", 
                        maxAge: 1000 * 60 * 60 // 1 hour
                    });
                    
                    securityManager.logSecurityEvent('success', `User ${email} logged in successfully`);
                    return res.json({message:"user logged in succesfully"})
                } else {
                    // Track failed login attempt
                    securityManager.trackLoginAttempt(clientIP, email, false);
                }
                break;
            }
        }
        
        if (!userFound) {
            securityManager.trackLoginAttempt(clientIP, email, false);
            securityManager.logSecurityEvent('warning', `Login attempt with non-existent email: ${email}`);
        }
        
        return res.status(404).json({Message:"Invalid credentials"})
        
    } catch (error) {
        console.error("Login error:", error);
        securityManager.logSecurityEvent('error', `Login system error for ${email}: ${error.message}`);
        return res.status(500).json({Message:"Login system error"})
    }
});

module.exports = Router;

