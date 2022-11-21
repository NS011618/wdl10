const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());

const path = require("path");
const { Todo,User} = require("./models");
// eslint-disable-next-line no-unused-vars
const todo = require("./models/todo");
//app.use()
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_charactes_long", ["POST", "PUT", "DELETE"]));

//passport
const passport=require('passport');
const connectEnsureLogin=require('connect-ensure-login');
const session=require('express-session');
const flash=require("connect-flash");
app.set("views",path.join(__dirname,"views"));
const LocalStrategy=require('passport-local');
const bcrypt=require('bcrypt');

const saltRounds=10;
app.use(flash());

app.use(session({
  secret:"my-super-secret-key-2172817261561562",
  cookie:{
    maxAge:24*60*60*60*1000
  }
}));


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField:'email',
  passwordField:'password'
},(username,password,done)=>{
  User.findOne({where:{email:username}})
  .then(async (user)=>{
   const result= await bcrypt.compare(password,user.password)
   if(result){
    return done(null,user);
   }else{
    return done(null,false,{message:"Invalid password"});
   }
    
  }).catch((error)=>{
    return (error);
  })
}));



passport.serializeUser((user,done)=>{
  console.log("serial user in session",user.id);
  done(null,user.id);
});

passport.deserializeUser((id,done)=>{
  User.findByPk(id)
  .then(user=>{
    done(null,user)
  })
  .catch(error=>{
    done(error,null)
  })
});


//app.get()
app.set("view engine", "ejs");
app.get("/", async (request, response) => {
 
    response.render("index", {
      title: "Todo Application",     
      csrfToken: request.csrfToken(),
    });
  
});

app.get("/todos",connectEnsureLogin.ensureLoggedIn() ,async (request, response) => {
  const loggedinuser=request.user.id;
  const allTodos = await Todo.getTodos();
  const overdue = await Todo.overdue(loggedinuser);
  const dueLater = await Todo.dueLater(loggedinuser);
  const dueToday = await Todo.dueToday(loggedinuser);
  const completedItems = await Todo.completedItems(loggedinuser);
  if (request.accepts("html")) {
    response.render("todo", {
      title: "Todo Application",
      allTodos,
      overdue,
      dueLater,
      dueToday,
      completedItems,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json(overdue, dueLater, dueToday, completedItems);
  }
});

app.get("/todos", async (request, response) => {
  // defining route to displaying message
  console.log("Todo list");
  try {
    const todoslist = await Todo.findAll();
    return response.json(todoslist);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
//signup page
app.get("/signup",async (request, response)=>{
   response.render("signup",{csrfToken:request.csrfToken()})
})
//users page
app.post("/users",async (request, response)=>{
  //hash password using bcrpt
  const hashedpwd=await bcrypt.hash(request.body.password,saltRounds);
  console.log(hashedpwd);
  //have to create the user here
  try{
    const user= await User.create({
      firstName:request.body.firstName,
      lastName:request.body.lastName,
      email:request.body.email,
      password:hashedpwd
    });
    request.login(user,(err)=>{
      if(err){
        console.log(err)
      }
      response.redirect("/todos");
    })    
  }catch (error) {
   console.log(error);
  }
})
//login page details
app.get("/login",async (request,response)=>{
    response.render("login",{csrfToken:request.csrfToken()});
});

app.post("/session",passport.authenticate('local',{failureRedirect:"/login"}),async (request,response)=>{
   console.log(request.user);
   response.redirect("/todos");
});
//signout page details
app.get("/signout",async (request,response,next)=>{
   request.logOut((err)=>{
    if(err){return next(err);}
    response.redirect("/");
   })
})


//app.post()
app.post("/todos",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("creating new todo", request.body);
  try {
    // eslint-disable-next-line no-unused-vars
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      userId:request.user.id,
      completed: false,
    });
    return response.redirect("/todos");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});


//app.put
app.put("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("Mark Todo as completed:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedtodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedtodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//app.delete
app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("delete a todo with ID:", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    return response.status(422).json(error);
  }
});
module.exports = app;
