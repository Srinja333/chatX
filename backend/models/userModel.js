const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique:true },
  password: { type: String, required: true },
  pic: {
    type: String,
    default:
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
  },
},
{
    timestamps:true,
});


//below compare given password with before password
userSchema.methods.matchPassword=async function(enteredPassword){
//console.log("this.password",this.password)
//console.log("ep",enteredPassword)
return await bcrypt.compare(enteredPassword,this.password)
}


//below will encrypt password before saving user in db
userSchema.pre("save", async function () {
  //console.log(this.password);

  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//mongoose.model(<Collectionname>, <CollectionSchema>)
//generally const "User" and  "User" in mongoose.model() written in same name
const User=new mongoose.model("User",userSchema);

module.exports=User;