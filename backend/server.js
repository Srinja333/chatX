const express=require("express")
const {chats} =require("./data/data")
const dotenv=require("dotenv");
const connectDB = require("./config/db");
const { red } = require("colors");
const userRoutes=require("./routes/userRoutes")
const {notFound,errorHandler}=require("./middleware/errorMiddleware")
const chatRoutes=require("./routes/chatRoutes")
const messageRoutes=require("./routes/messageRoutes")
const path = require("path");



const app = express();
dotenv.config();
connectDB();

app.use(express.json());//because we get data from front end to need to tell server to accept json data

app.get("/",(req,res)=>{
   res.send("api is running successfully")
})

app.use('/api/user',userRoutes)
app.use('/api/chat',chatRoutes);
app.use('/api/message',messageRoutes);


app.use(notFound)
app.use(errorHandler)



//static files
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});


const PORT=process.env.PORT||5000;
const server= app.listen(PORT,console.log(`server started at ${PORT}`));
const io=require('socket.io')(server,{
   pingTimeout:60000,//pingTimeout means if for 60s  and user did not any message then it will close the connection to save the bandwidth
   cors:{
      origin:"http://localhost:3000"
   }
})

//create connection
io.on("connection", (socket) => {
   console.log("Connected to socket.io");
   socket.on("setup", (userData) => {
     socket.join(userData._id);
     //console.log("name server 43 line-->",userData.name)
     socket.emit("connected");
   });

   socket.on("join chat", (room) => {
      socket.join(room);
      //console.log("User Joined Room: " + room);
    });


    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  

    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;
      //console.log("chat",chat)
      if (!chat.users) return console.log("chat.users not defined");
  
      chat.users.forEach((user) => {
        if (user._id == newMessageRecieved.sender._id) return;
  
        //console.log("user.name",user.name)
        //console.log("newMessageRecieved",newMessageRecieved)
        socket.in(user._id).emit("message recieved", newMessageRecieved);//send to other users not to the sender in a particular room
      });
    });





    //cleanup socket
    socket.off("setup", () => {
      console.log("USER DISCONNECTED");
      socket.leave(userData._id);
    });


})

