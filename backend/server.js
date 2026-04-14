const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "./data.json";

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, "[]");
}

function getTasks() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
}

// GET
app.get("/tasks", (req, res) => {
  res.json(getTasks());
});

// POST
app.post("/tasks", (req, res) => {
  const tasks = getTasks();

  const newTask = {
    id: Date.now(),
    title: req.body.title,
    completed: 0
  };

  tasks.push(newTask);
  saveTasks(tasks);

  res.json(newTask);
});

// DELETE
app.delete("/tasks/:id", (req, res) => {
  let tasks = getTasks();
  tasks = tasks.filter(t => t.id != req.params.id);
  saveTasks(tasks);
  res.sendStatus(200);
});

// PUT
app.put("/tasks/:id", (req, res) => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id == req.params.id);

  if (!task) return res.sendStatus(404);

  task.title = req.body.title;
  task.completed = req.body.completed;

  saveTasks(tasks);

  res.json(task);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
