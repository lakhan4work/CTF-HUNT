// Quick test of CTF file access
const path = require("path");
const fs = require("fs");

const CTF_BASE_PATH = path.join(__dirname, "..", "PROJECT_CTFSss", "PROJECT_CTFS");

console.log("Testing CTF file system...");
console.log("Base path:", CTF_BASE_PATH);
console.log("Exists:", fs.existsSync(CTF_BASE_PATH));

if (fs.existsSync(CTF_BASE_PATH)) {
    const types = fs.readdirSync(CTF_BASE_PATH);
    console.log("Challenge types:", types);
    
    // Test reading a specific file
    const testFile = path.join(CTF_BASE_PATH, "WEB_type", "Category_1", "index.html");
    console.log("\nTest file path:", testFile);
    console.log("Test file exists:", fs.existsSync(testFile));
    
    if (fs.existsSync(testFile)) {
        const content = fs.readFileSync(testFile, 'utf8');
        console.log("File content length:", content.length);
        console.log("First 100 chars:", content.substring(0, 100));
    }
}

console.log("\n✅ Test completed successfully!");
