/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");
//const todo = require("../models/todo");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login_he=async(agent,username,password)=>{
  let res=await agent.get("/login");
  let csrfToken=extractCsrfToken(res);
  res=await agent.post("/session").send({
    email:username,
    password:password,
    _csrf:csrfToken,
  });
};

describe("Todo test suite ", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test("Sign up details", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/users").send({
      firstName:"use",
      lastName:"b",
      email:"userb@gmail.com",
      password:"0108",
      "_csrf": csrfToken,
    });
    expect(response.statusCode).toBe(302); //http status code
  });
  test("Sign out details", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res=await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res=await agent.get("/todos");
    expect(res.statusCode).toBe(302); //http status code
  });


  test("Create new todo", async () => {
    const agent =request.agent(server);
    await login_he(agent,"userb@gmail.com","0108");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Go to movie",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken,
    });
    expect(response.statusCode).toBe(302); //http status code
  });

  test("Mark todo as completed -Updating Todo", async () => {
    const agent =request.agent(server);
    await login_he(agent,"userb@gmail.com","0108");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    //const status = latestTodo.completed ? false : true;
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markresponse = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });
    const parsedUpdateResponse = JSON.parse(markresponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test(" Delete todo using ID", async () => {
    const agent =request.agent(server);
    await login_he(agent,"userb@gmail.com","0108");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Go to shopping",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    //expect(parsedGroupedResponse.dueToday).toBeDefined();

    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const delresponse = await agent.put(`todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    expect(delresponse.statusCode).toBe(200);
    // const parsedUpdateResponse = JSON.parse(response.text);
    // expect(parsedUpdateResponse.completed).toBe(true);
  });
});
