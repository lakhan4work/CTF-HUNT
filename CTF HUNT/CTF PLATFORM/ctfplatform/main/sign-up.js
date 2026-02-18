const express=require("express")
const fs=require("fs")
const bcrypt=require("bcrypt")
const Router=express.Router()
Router.use(express.urlencoded({extended:true}))

module.exports=Router.post("/sign-up",async(req,res)=>{
    const {username,email,password}=req.body
    let userDataArray=JSON.parse(fs.readFileSync(`${__dirname.replace("/authenticaton","")}/userData.json`))
    console.log(userDataArray)
    for(let i=0;i<userDataArray.length;i++){
        if(userDataArray[i].username===username) return res.status(400).json({message:"User name already registered"})
        
        if(userDataArray[i].email===email) return res.status(400).json({message:"email already registered"})
        
    }
    let newUser={
        username:username,
        email:email,
        password:await bcrypt.hash(password,10),
        challengeCategorySolved:[
            {"WebSecurity":0},
            {"Cryptography":0},
            {"ReverseEngineering":0},
            {"Forensics":0}
        ],
        aiHintsUsed:0,
        ranking:userDataArray.length+1,
        otp:-1,
        score:0,
        totalChallenges:19,
        solved:0
    }
    userDataArray.push(newUser)

    fs.writeFileSync(`${__dirname.replace("/authenticaton","")}/userData.json`,JSON.stringify(userDataArray))
    // console.log(userDataArray)
    res.json({message:"User created succesfully"})
})
