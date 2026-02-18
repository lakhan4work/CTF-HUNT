const nodemailer=require("nodemailer")
const truck=nodemailer.createTransport({
   service:"gmail",
   auth:{
    user:"ashutoshdas1001@gmail.com",
    pass:""
   } 
})
const cargo={
    from:"ashutoshdas1001@gmail.com",
    to:`ashutoshdas1001@gmail.com`,
    subject:"testing otp",
    html:`<h1>Hi here is your 4 digit otp ${Math.floor(Math.random()*9999)}</h1>`
}
truck.sendMail(cargo,(data,err)=>{
    if(err) console.log(err)
    else console.log(data)
})