const express=require("express")
const Router=express.Router()
const fs=require("fs")
const jwt=require("jsonwebtoken")
Router.get("/allCourses",async(req,res)=>{
    let coursesArray=JSON.parse(fs.readFileSync(`${__dirname}/courseData.json`))
    res.json({courses:coursesArray})
})
Router.post("/solveChallenge",(req,res)=>{
    const {points,challenge,username,flag}=req.body
    
    console.log("=== FLAG VALIDATION DEBUG ===");
    console.log("Received flag:", flag);
    console.log("Challenge:", challenge);
    console.log("Username:", username);
    
    // Validate required fields
    if(!flag || !challenge || !username){
        console.log("Missing required fields");
        return res.status(400).json({message:"Missing required fields", success: false})
    }

    let userArray=JSON.parse(fs.readFileSync(`${__dirname}/userData.json`))
    let challengeArray=JSON.parse(fs.readFileSync(`${__dirname}/courseData.json`))
    
    // Find the challenge and validate flag
    let challengeFound = false;
    let flagCorrect = false;
    let challengeData = null;
    
    for(let i=0;i<challengeArray.length;i++){
        if(challengeArray[i].challenge===challenge){
            challengeFound = true;
            challengeData = challengeArray[i];
            
            console.log("Expected flag:", challengeData.flag);
            console.log("Received flag (trimmed):", flag.toLowerCase().trim());
            console.log("Expected flag (trimmed):", challengeData.flag.toLowerCase().trim());
            
            // Validate flag (case-insensitive comparison)
            if(challengeData.flag && flag.toLowerCase().trim() === challengeData.flag.toLowerCase().trim()){
                flagCorrect = true;
                challengeArray[i].solved+=1;
                console.log("✅ FLAG CORRECT!");
            } else {
                console.log("❌ FLAG INCORRECT!");
            }
            break;
        }
    }
    
    if(!challengeFound){
        console.log("Challenge not found");
        return res.status(404).json({message:"Challenge not found", success: false})
    }
    
    if(!flagCorrect){
        console.log("Returning error: Incorrect flag");
        return res.status(400).json({message:"Incorrect flag. Try again!", success: false})
    }
    
    console.log("Flag is correct, updating database...");
    
    // Update challenge solved count
    fs.writeFileSync(`${__dirname}/courseData.json`,JSON.stringify(challengeArray))
    
    // Update user score and solved challenges
    let userFound = false;
    for(let i=0;i<userArray.length;i++){
        if(userArray[i].username===username){
            userFound = true;
            userArray[i].score+=points;
            userArray[i].solved = (userArray[i].solved || 0) + 1;
            
            // Update category-wise solved count
            const category = challengeData.category;
            for(let j=0;j<userArray[i].challengeCategorySolved.length;j++){
                const categoryObj = userArray[i].challengeCategorySolved[j];
                if(categoryObj[category] !== undefined){
                    categoryObj[category] = categoryObj[category] + 1;
                }
            }
            break;
        }
    }
    
    if(!userFound){
        console.log("User not found");
        return res.status(404).json({message:"User not found", success: false})
    }
    
    fs.writeFileSync(`${__dirname}/userData.json`,JSON.stringify(userArray))
    console.log("✅ Challenge solved successfully!");
    console.log("=============================\n");
    
    return res.json({
        message:"Correct flag! Challenge solved!",
        points: points,
        success: true
    })

})
Router.get("/getFilteredCourses",async(req,res)=>{
    const {courseCategory}=req.body
    let filterArray=[]
    const coursesArray=JSON.parse(fs.readFileSync(`${__dirname}/courseData.json`))
    for(let i=0;i<coursesArray.length;i++){
        if(coursesArray[i].courseCategory===courseCategory) filterArray.push(coursesArray[i])
    }
    if(filterArray.length===0) return res.status(404).json({Message:"Course not found"})
    res.json(filterArray)
})
module.exports=Router