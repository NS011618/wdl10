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
const LocalStrategy=require('passport-local');

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
  User.findOne({where:{email:username,password:password}})
  .then((user)=>{
    return done(null,user)
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
  
  const allTodos = await Todo.getTodos();
  const overdue = await Todo.overdue();
  const dueLater = await Todo.dueLater();
  const dueToday = await Todo.dueToday();
  const completedItems = await Todo.completedItems();
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

// app.get("/todos", async (request, response) => {
//   // defining route to displaying message
//   console.log("Todo list");
//   try {
//     const todoslist = await Todo.findAll();
//     return response.json(todoslist);
//   } catch (error) {
//     console.log(error);
//     return response.status(422).json(error);
//   }
// });
// app.get("/todos/:id", async function (request, response) {
//   try {
//     const todo = await Todo.findByPk(request.params.id);
//     return response.json(todo);
//   } catch (error) {
//     console.log(error);
//     return response.status(422).json(error);
//   }
// });
//signup page
app.get("/signup",async (request, response)=>{
   response.render("signup",{csrfToken:request.csrfToken()})
})
//users page
app.post("/users",async (request, response)=>{
  try{
    const user= await User.create({
      firstName:request.body.firstName,
      lastName:request.body.lastName,
      email:request.body.email,
      password:request.body.password
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


//app.post()
app.post("/todos", async (request, response) => {
  console.log("creating new todo", request.body);
  try {
    // eslint-disable-next-line no-unused-vars
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      commpleted: false,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});


//app.put
app.put("/todos/:id", async (request, response) => {
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
app.delete("/todos/:id", async (request, response) => {
  console.log("delete a todo with ID:", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    return response.status(422).json(error);
  }
});
module.exports = app;
