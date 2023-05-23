const asyncHandler = require('express-async-handler')
const Chat = require("../models/chatModel");
const User=require("../models/userModel")

const accessChat = asyncHandler(async (req, res) => {

    const { userId } = req.body;
    //console.log("accesschat-->", userId);
   
    if (!userId) {
       // console.log("UserId param not sent with request")
        return res.sendStatus(400);
    }
     //console.log("req.user._id", req.user._id);

    var isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ]
    })
      .populate("users", "-password")
      .populate("latestMessage");
   

    //console.log("isChat1", isChat);

    //below isChat populate sender field
    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email",
    });

    //console.log("isChat2",isChat);


    if (isChat.length > 0) {
      res.send(isChat[0]); //because one chat only available in isChat array, because one chat avalable b/w   { users: { $elemMatch: { $eq: req.user._id } } },{ users: { $elemMatch: { $eq: userId } } }      {
       
    }
  
    else {

        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],//req.user._id-->current logged in user, userId-->with which we going to create chat
        }


        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "-password"
            );
            res.status(200).json(FullChat);
        } 
        catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }

    });

const fetchChats=asyncHandler(async(req,res)=>{
    //console.log("req-->",req.user._id);
try{
Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
  .populate("users", "-password")
  .populate("groupAdmin", "-password")
  .populate("latestMessage")
  .sort({ updatedAt: -1 })
  .then(async (results) => {
    results = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });
    res.status(200).send(results);
  });
}catch(error)
{
     res.status(400);
     throw new Error(error.message);

}
}) 

const createGroupChat=asyncHandler(async(req,res)=>{
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  var users = JSON.parse(req.body.users); //req.body.users will be sent from frontend as json.stringify and parse here as js obj

  // if (users.length < 2) {...}reflects group must have two users
  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user);//because in group chat login user must be included

   try {
     const groupChat = await Chat.create({
       chatName: req.body.name,
       users: users,
       isGroupChat: true,
       groupAdmin: req.user,
     });

     const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
       .populate("users", "-password")
       .populate("groupAdmin", "-password");

      //console.log("fgc",fullGroupChat);

     res.status(200).json(fullGroupChat);
   } catch (error) {
     res.status(400);
     throw new Error(error.message);
   }

})

const renameGroup=asyncHandler(async(req,res)=>{
const { chatId, chatName } = req.body;
//console.log("ci=",chatId)
//console.log("cn=",chatName)
const updatedChat = await Chat.findByIdAndUpdate(
  chatId,//find this id
  {
    chatName: chatName,//update name
  },
 
)
  .populate("users", "-password")
  .populate("groupAdmin", "-password");

if (!updatedChat) {
  res.status(404);
  throw new Error("Chat Not Found");
} else {
  res.json(updatedChat);
}
})


const addToGroup=asyncHandler(async(req,res)=>{

  const { chatId, userId } = req.body;

 // console.log("atg chatId",chatId);
  //console.log("atg usrId",userId);

  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },//update users array
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
})


const removeFromGroup=asyncHandler(async(req,res)=>{
const { chatId, userId } = req.body;

 //console.log("rfg chatId", chatId);
 //console.log("rfg usrId", userId);


const removed = await Chat.findByIdAndUpdate(
  chatId,
  {
    $pull: { users: userId },
  },
  {
    new: true,
  }
)
  .populate("users", "-password")
  .populate("groupAdmin", "-password");

if (!removed) {
  res.status(404);
  throw new Error("Chat Not Found");
} else {
  res.json(removed);
}

})

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};