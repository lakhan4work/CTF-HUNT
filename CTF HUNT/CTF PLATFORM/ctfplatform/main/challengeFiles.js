const express = require("express");
const Router = express.Router();
const path = require("path");
const fs = require("fs");

// Path to the actual CTF challenge files
const CTF_BASE_PATH = path.join(__dirname, "..", "PROJECT_CTFSss", "PROJECT_CTFS");

// Verify path exists at startup
if (!fs.existsSync(CTF_BASE_PATH)) {
    console.error("❌ CTF files directory not found:", CTF_BASE_PATH);
} else {
    console.log("✅ CTF files loaded from:", CTF_BASE_PATH);
}

// Challenge file mappings - maps challenge names to their file locations
const CHALLENGE_MAP = {
    // Cryptography Challenges
    "Ceasar Cipher Twist": {
        type: "Crypto_type",
        category: "Category_1",
        files: ["encrypted.txt"],
        description: "ROT13 cipher with a twist. Decode the encrypted message.",
        hints: ["It's not exactly ROT13...", "Try different rotation values"]
    },
    "Hex Decoder": {
        type: "Crypto_type",
        category: "Category_2",
        files: ["hex_code.txt"],
        description: "Decode this hexadecimal message to find the flag.",
        hints: ["Hex to ASCII conversion needed"]
    },
    "Base64 Mystery": {
        type: "Crypto_type",
        category: "Category_3",
        files: ["msz.txt"],
        description: "Multiple layers of Base64 encoding hide the secret.",
        hints: ["Decode multiple times", "The message will tell you when to stop"]
    },
    "Decimal Decoder": {
        type: "Crypto_type",
        category: "Category_4",
        files: ["decimal.txt"],
        description: "Convert decimal values to reveal the hidden message.",
        hints: ["ASCII decimal values"]
    },
    "Two-Stage Crypto": {
        type: "Crypto_type",
        category: "Category_5",
        files: ["clue.txt", "text.txt"],
        description: "Use the clue to decode the text file.",
        hints: ["The clue file contains the decoding method", "Apply the method to text.txt"]
    },

    // Web Security Challenges
    "SQL injection basics": {
        type: "WEB_type",
        category: "Category_1",
        files: ["index.html"],
        description: "Find the flag hidden in this vulnerable login form. The flag is in the HTML source!",
        hints: ["View page source", "Check HTML comments", "Look at all elements"]
    },
    "Hidden Admin Panel": {
        type: "WEB_type",
        category: "Category_2",
        files: ["admin.html", "Clue.txt"],
        description: "Find the hidden admin panel and retrieve the flag.",
        hints: ["Check the clue file", "Look for hidden links or paths"]
    },
    "Cookie Manipulation": {
        type: "WEB_type",
        category: "Category_3",
        files: ["welcome.txt", "secret.txt"],
        description: "Manipulate cookies to access the secret content.",
        hints: ["Read welcome.txt first", "Modify session data"]
    },
    "Image Steganography": {
        type: "WEB_type",
        category: "Category_4",
        files: ["flag_inage.txt"],
        description: "Extract hidden data from this image file.",
        hints: ["The 'image' might not be what it seems", "Check file contents"]
    },
    "Login Bypass": {
        type: "WEB_type",
        category: "Category_5",
        files: ["login.html"],
        description: "Bypass the login mechanism to capture the flag.",
        hints: ["Check JavaScript validation", "Look at form handling"]
    },

    // Reverse Engineering & PWN Challenges
    "Binary Analysis": {
        type: "pwnreversing_type",
        category: "Category_1",
        files: ["check.py"],
        description: "Analyze this Python script to find what input produces the flag.",
        hints: ["Run the script", "Reverse the logic", "What input makes it succeed?"]
    },
    "Math Challenge": {
        type: "pwnreversing_type",
        category: "Category_2",
        files: ["math.py"],
        description: "Solve the mathematical challenge to reveal the flag.",
        hints: ["Understand the algorithm", "Find the pattern"]
    },
    "Program Analysis": {
        type: "pwnreversing_type",
        category: "Category_3",
        files: ["secret_program.c", "program_output.txt"],
        description: "Analyze the C program and its output to find the flag.",
        hints: ["Read the C code carefully", "Compare with the output"]
    },
    "Character Shift": {
        type: "pwnreversing_type",
        category: "Category_4",
        files: ["char_shift.py"],
        description: "Reverse engineer this character shifting algorithm.",
        hints: ["Run the script", "Reverse the shift operation"]
    },
    "Conditional Bypass": {
        type: "pwnreversing_type",
        category: "Category_5",
        files: ["conditional_bypass.py"],
        description: "Bypass the conditional checks to reveal the flag.",
        hints: ["Understand the conditions", "What input satisfies all checks?"]
    },

    // General/Forensics Challenges
    "Memory Dump Investigation": {
        type: "general_type",
        category: "Category_1",
        files: ["encode.txt"],
        description: "Investigate this encoded memory dump.",
        hints: ["What encoding is used?", "Multiple decoding steps needed"]
    },
    "File Carving": {
        type: "general_type",
        category: "Category_3",
        files: ["decode_script.sh"],
        description: "Use this decode script to find hidden data.",
        hints: ["Run the bash script", "Check what it decodes"]
    },
    "Deep Directory Hunt": {
        type: "general_type",
        category: "Category_4",
        files: ["clue.txt"],
        description: "Navigate through nested directories to find the real flag.",
        hints: ["Start with the clue", "The flag is deep in Category_5", "Path: flag.txt/real_flag.txt/flag_is_here/legit/you_find_it/not_here.txt/final.txt"]
    },
    "Social Media Intel": {
        type: "general_type",
        category: "Category_5",
        files: ["final.txt"],
        description: "The ultimate flag hidden in the deepest location.",
        hints: ["This is at the end of the directory maze", "Check Category_5/flag.txt/real_flag.txt/flag_is_here/legit/you_find_it/not_here.txt/final.txt"]
    }
};

// Get list of all available challenges with file info
Router.get("/list", (req, res) => {
    console.log("📋 CTF list endpoint called");
    try {
        const challenges = Object.keys(CHALLENGE_MAP).map(name => ({
            name: name,
            ...CHALLENGE_MAP[name]
        }));
        console.log(`✅ Returning ${challenges.length} challenges`);
        res.json({ challenges });
    } catch (error) {
        console.error("❌ Error in /ctf/list:", error);
        res.status(500).json({ error: "Failed to list challenges", message: error.message });
    }
});

// Get a specific challenge's details and files
Router.get("/challenge/:challengeName", (req, res) => {
    const challengeName = decodeURIComponent(req.params.challengeName);
    const challenge = CHALLENGE_MAP[challengeName];

    if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
    }

    try {
        const challengePath = path.join(CTF_BASE_PATH, challenge.type, challenge.category);
        const fileContents = {};

        // Read all files for this challenge
        challenge.files.forEach(filename => {
            const filePath = path.join(challengePath, filename);
            if (fs.existsSync(filePath)) {
                try {
                    fileContents[filename] = fs.readFileSync(filePath, 'utf8');
                } catch (err) {
                    fileContents[filename] = `Error reading file: ${err.message}`;
                }
            } else {
                fileContents[filename] = "File not found";
            }
        });

        res.json({
            name: challengeName,
            type: challenge.type,
            category: challenge.category,
            description: challenge.description,
            hints: challenge.hints,
            files: fileContents
        });

    } catch (error) {
        console.error("Error loading challenge:", error);
        res.status(500).json({ error: "Failed to load challenge files" });
    }
});

// Download a specific file from a challenge
Router.get("/download/:challengeName/:filename", (req, res) => {
    const challengeName = decodeURIComponent(req.params.challengeName);
    const filename = req.params.filename;
    const challenge = CHALLENGE_MAP[challengeName];

    if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
    }

    if (!challenge.files.includes(filename)) {
        return res.status(404).json({ error: "File not found in challenge" });
    }

    try {
        const filePath = path.join(CTF_BASE_PATH, challenge.type, challenge.category, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File does not exist" });
        }

        res.download(filePath, filename);
    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: "Failed to download file" });
    }
});

// Serve static CTF files directly
Router.use("/files", express.static(CTF_BASE_PATH));

module.exports = Router;
