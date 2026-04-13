const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// файл базы данных
const DB_FILE = "./backend/data.json";

// если файла нет — создаём
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// чтение задач
function getTasks() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

// сохранение задач
function saveTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
}

// GET — все задачи
app.get("/tasks", (req, res) => {
  res.json(getTasks());
});

// POST — добавить задачу
app.post("/tasks", (req, res) => {
  const tasks = getTasks();

  const newTask = {
    id: Date.now(), // уникальный id
    title: req.body.title,
    completed: 0
  };

  tasks.push(newTask);
  saveTasks(tasks);

  res.json(newTask);
});

// DELETE — удалить задачу
app.delete("/tasks/:id", (req, res) => {
  let tasks = getTasks();

  tasks = tasks.filter(task => task.id != req.params.id);

  saveTasks(tasks);

  res.sendStatus(200);
});

// PUT — обновить задачу (редактирование + галочка)
app.put("/tasks/:id", (req, res) => {
  let tasks = getTasks();

  const index = tasks.findIndex(t => t.id == req.params.id);

  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      title: req.body.title,
      completed: req.body.completed
    };

    saveTasks(tasks);
    res.json(tasks[index]);
  } else {
    res.sendStatus(404);
  }
});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});