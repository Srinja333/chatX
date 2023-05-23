const express=require('express');
const router=express.Router();
const {registerUser,authUser,allUsers} =require( "../controllers/userControllers");
const {protect}=require("../middleware/authMiddleware")

 router.post("/",registerUser);
 router.get("/",protect,allUsers); //allUser is user searching api endpoint
 router.post("/login", authUser);
 

module.exports =router;