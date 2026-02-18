const express=require("express")
const Router=express.Router()
const fs=require("fs")
// const cookieParser=require("cookie-parser")
// Router.use(cookieParser())
module.exports=Router.post("/",(req,res)=>{
let userDataArray=JSON.parse(fs.readFileSync(`${__dirname}/userData.json`))
// console.log(req.cookies)
for(let i=0;i<userDataArray.length;i++){
    if(userDataArray[i].email===req.body.email){
        console.log(userDataArray[i].solved)
        return res.status(200).json({username:userDataArray[i].username,email:userDataArray[i].email,rank:userDataArray[i].rank,score:userDataArray[i].score,challengeCategorySolved:userDataArray[i].challengeCategorySolved,rank:userDataArray[i].ranking,solved:userDataArray[i].solved})
    }

}

})