# Admin Login Instructions

## 🔑 Admin Credentials

**Available Admin Passwords:**
- `admin123`
- `secureAdmin2025`

## 📋 How to Login as Admin

1. Go to the login page: `http://localhost:8000`
2. ✅ **Check the "Admin Login" checkbox** at the bottom of the form
3. **Leave the email field empty** (not needed for admin)
4. Enter any admin password from above in the password field
5. Click "Login"

**Important**: When admin checkbox is checked, only the password field is required!

## 🛡️ Admin Panel Features

Once logged in as admin, you'll have access to:

- **User Management**: Ban, suspend, or activate users
- **Security Monitoring**: View security logs and block IPs
- **System Statistics**: Monitor server performance
- **Challenge Management**: Enable/disable challenges
- **Export Tools**: Download user data and logs

## 🌐 Access URLs

- **Login Page**: `http://localhost:8000`
- **Admin Panel**: `http://localhost:8000/frontend/admin.html` (after admin login)
- **User Dashboard**: `http://localhost:8000/frontend/index.html` (after user login)

## 🚨 Security Notes

- Admin passwords are stored in `security.js` (line 18)
- In production, these should be hashed and stored securely
- Admin sessions last 24 hours
- All admin actions are logged for security audit

---
*The server is running on port 8000 and CORS is configured to work with your frontend.*