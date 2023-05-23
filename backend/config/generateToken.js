const jwt=require('jsonwebtoken');



const generateToken =(id)=>{

return jwt.sign({id},process.env.JWT_SECRET,{
expiresIn:"30d"
});//sign a new token with new id


}



module.exports=generateToken;