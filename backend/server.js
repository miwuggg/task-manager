const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const DB_FILE = "./data.json";
const USERS_FILE = "./users.json";

const SECRET_KEY = "your_secret_key";

// INIT FILES
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]");
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");

// HELPERS
function getTasks() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
}

function getUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ================= AUTH =================

// REGISTER
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "User exists" });
  }

  const hash = await bcrypt.hash(password, 10);

  users.push({
    id: Date.now(),
    username,
    password: hash
  });

  saveUsers(users);

  res.json({ message: "Registered" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user.id },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// ================= AUTH MIDDLEWARE =================

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) return res.sendStatus(401);

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(403);
  }
}

// ================= TASKS (PRIVATE) =================

// GET TASKS (only user)
app.get("/tasks", auth, (req, res) => {
  const tasks = getTasks();
  res.json(tasks.filter(t => t.userId === req.user.userId));
});

// POST TASK
app.post("/tasks", auth, (req, res) => {
  const tasks = getTasks();

  const newTask = {
    id: Date.now(),
    userId: req.user.userId,
    title: req.body.title,
    completed: 0
  };

  tasks.push(newTask);
  saveTasks(tasks);

  res.json(newTask);
});

// DELETE TASK
app.delete("/tasks/:id", auth, (req, res) => {
  let tasks = getTasks();

  tasks = tasks.filter(
    t => !(t.id == req.params.id && t.userId === req.user.userId)
  );

  saveTasks(tasks);

  res.sendStatus(200);
});

// UPDATE TASK
app.put("/tasks/:id", auth, (req, res) => {
  const tasks = getTasks();

  const task = tasks.find(
    t => t.id == req.params.id && t.userId === req.user.userId
  );

  if (!task) return res.sendStatus(404);

  task.title = req.body.title;
  task.completed = req.body.completed;

  saveTasks(tasks);

  res.json(task);
});

// START
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});