const express = require("express"); 
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport") 
const passportLocalMongoose = require("passport-local-mongoose");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(cors({origin: true, credentials: true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret:'news api',
  resave:true,
  saveUninitialized:true,
  cookie:{maxAge:6000000},
}))
app.use(passport.initialize());
app.use(passport.session());

//mogodb connection,schema and model


//for local mongobb comment it to use cloud mongodb
const mongoDbUrl="mongodb://127.0.0.1:27017/todotestdb";
// const mongoDbUrl="mongodb+srv://tarun1820:$Tarun%401820@cluster0.aksnxov.mongodb.net/?retryWrites=true&w=majority";

mongoose.set('strictQuery', false);

mongoose.connect(mongoDbUrl,{
    useNewUrlParser:true
}).then(()=>{
    console.log("connection succesfull")
}).catch((err)=>{
    console.log(err);
});

const userschema = new mongoose.Schema(
    {
        username:String,
        email:{type:String,unique:true},
        password:String,
        saved:[Object]
    },
    {
        collection:"userdata"
    }
)

userschema.plugin(passportLocalMongoose);

const userdata=mongoose.model("userdata",userschema);
passport.use(userdata.createStrategy());

passport.serializeUser(userdata.serializeUser())
passport.deserializeUser(userdata.deserializeUser());


//listining to signup form 
app.post("/signup",async(req,res)=>{
    const {username,email,password}=req.body;
    console.log(username)
    // const encriptedpassword = await bcrypt.hash(password,10);
    try{
      const olduserWithMail=await userdata.findOne({email});
      //checking for email if alredy registered or not
      const olduserWithUserName=await userdata.findOne({username});
      if(olduserWithMail){
        // console.log("user")
        return res.json({error:"email alredy regitered"});
      }
      if(olduserWithUserName){
        // console.log("user")
        return res.json({error:"username alredy regitered"});
      }
      
      userdata.register({username:req.body.username,email:email},password,(err,user)=>{
        if(err){
          console.log(err)
          // res.("/login")
        }
        else{
          passport.authenticate("local")(req,res,()=>{
            //  req.session.save();
             res.send({status:"ok"})
            
          })
        }
      })
    }
    catch(err){
        console.log(err);
        res.send({status:"not ok"})
    }
    
})



//listining to login form 
app.post("/login",async(req,res,next)=>{
    const {username,password}=req.body;

    const newuser = new userdata({
      username,
      password
    });
    
    console.log("hello1")
    passport.authenticate('local', function (err, newuser, info) {
      if (err) {
          return res.status(401).json(err);
      }
      if (!newuser) { 
          return res.send({status:"Unauth"}) 
      }
  
      req.logIn(newuser, function (err) {
          if (err) { return next(err); }
          return res.redirect("/tolist.html");
      });
  
  })(req, res, next);
    
    
})


//post request for axising newsapi
app.post("/user",function(req,res){
    let category=req.body.category||"general";
    // console.log(category)
    newsapi.v2.topHeadlines({
        category: category,
        country: req.body.country||"in",
        pageSize:20
      }).then(response => {
        res.send(response);
      });
})

app.get("/user",(req,res)=>{
  // console.log(req.session)
  if(req.isAuthenticated()){
    res.send(req.session.passport.user);
  }
  else{
    res.send({status:"not login"});
  }
})

// app.get("/logout",function(req,res){
//   req.logOut(function(err) {
//     if (err) { return next(err)}
  
// })

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.send({status:"logout"})
  });
  // req.logOut();
  // res.clearCookie('connect.sid');
  console.log("cookie deleted");
});

app.post('/save' , function(req,res){
  const {cardarticle}=req.body
  const userid=req.user.id;
  userdata.findById(userid,(err,foundUser)=>{
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        console.log("user found")
        foundUser.saved.push(cardarticle)//pushing article to saved object to user
        foundUser.save(()=>{
          res.send({status:"saved sucess"});
        })//function to save founduserobject in db
      }
    }
  });

})

app.get('/save',function(req,res){
  if(req.isAuthenticated()){
    // console.log(res.send(req.session.passport.user));
    const userid=req.user.id;
    userdata.findById(userid,(err,foundUser)=>{
      if(err){
        console.log(err);
      }
      else{
        if(foundUser){
            res.send({saved_articles:foundUser.saved});
        }
      }
    })
}
  else{
    res.send({status:"not login"});
  }
})
//backend is listing to port 5000
app.listen(5000,()=>{console.log("sever started")});
