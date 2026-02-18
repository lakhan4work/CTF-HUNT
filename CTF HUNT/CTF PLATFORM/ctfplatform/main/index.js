const express = require("express");
const path = require("path");
const cors = require("cors");

// Import security middleware
const securityManager = require("./security.js");

const authentication = require("./login.js");
const signUp = require("./sign-up.js");
const challenges = require("./courses.js");
const challengeFiles = require("./challengeFiles.js");
const dashboard = require("./dashboard.js");
const admin = require("./admin.js");

const app = express();

// Initialize security middleware first
securityManager.init(app);

app.use(cors({
  origin: [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:5502',
    'http://127.0.0.1:5502'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// ✅ IMPORTANT: disable index.html auto-loading
app.use(express.static(
  path.join(__dirname, "frontend"),
  { index: false }
));

// ✅ API routes
app.use("/authentication", authentication);
app.use("/sign-up", signUp);
app.use("/dashboard", dashboard);
app.use("/challenges", challenges);
app.use("/ctf", challengeFiles);
app.use("/admin", admin);

// ✅ Landing page (ROOT)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "landing.html"));
});

// ✅ Signup page
app.get("/sign-up.html", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "sign-up.html"));
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
