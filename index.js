const app = require("./app");
//port number  3000 is localhost
const port = process.env.PORT || 3000;
//app.listen helps to  run the server at a particular port
app.listen(port, () => {
  console.log(`server listening at port - ${port}`);
});
