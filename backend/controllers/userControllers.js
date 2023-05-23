const asyncHandler=require( 'express-async-handler');
const User =require('../models/userModel');
const generateToken=require('../config/generateToken')


const registerUser=asyncHandler(async(req,res)=>{

const {name,email,password,pic}=req.body;

if(!name||!email||!password)
{
res.status(400);
throw new Error("Please Enter All The Fields")

}


const userExist=await User.findOne({email});

if(userExist)
{
    res.status(400)
    throw new Error("User Alrady Exists")
}

//below will create new user fields, basically create new user
const user=await User.create({
    name,
    email,
    password,
    pic
});

//if user exits then it will send to user, create jwt token send to user
if(user)
{

    res.status(201).json(({
        _id:user._id,
        name: user.name,
        email: user.email,
        pic: user.pic,
        token:generateToken(user._id)
    }))
}
else{
    res.status(400);
    throw new Error("Failed to create user");
}


})

const authUser=asyncHandler(async(req,res)=>{
    const {email,password}=req.body;
    const user=await User.findOne({email})
    if(user && (await user.matchPassword(password)))
    {
        res.json(({
        _id:user._id,
        name: user.name,
        email: user.email,
        pic: user.pic,
        token:generateToken(user._id)
    }))
    }else{
        res.status(401);
        throw new Error("Invalid email or password")
    }
})

// /api/user?search=piyush
const allUsers=asyncHandler(async(req,res)=>{
const keyword = req.query.search
  ? {
      $or: [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ],
      
    }
  : {};
 
//console.log("kw-->", req.query.search); 
  


const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });//it will return all user except the user who currently logged in,$ne is not equalto
//console.log("ri",req.user._id);
res.send(users);

})

module.exports = { registerUser, authUser, allUsers };

