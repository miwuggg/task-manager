const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

// файл базы данных
const DB_FILE = "./data.json";
const USERS_FILE = "./users.json";  // файл для пользователей

const SECRET_KEY = "your_secret_key"; // для подписания JWT

// если файлов нет — создаём их
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// чтение задач
function getTasks() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

// сохранение задач
function saveTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
}

// чтение пользователей
function getUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

// сохранение пользователей
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// GET — все задачи
app.get("/tasks", (req, res) => {
  const tasks = getTasks();
  res.json(tasks);
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

// POST — регистрация нового пользователя
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  // Проверка на существующего пользователя
  if (users.find(user => user.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  // Хэширование пароля
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now(),
    username: username,
    password: hashedPassword
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({ message: "User registered successfully" });
});

// POST — вход пользователя (логин)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  // Сравнение пароля
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  // Генерация JWT
  const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// МIDDLEWARE для проверки авторизации (проверка токена)
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ error: "Token is required" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  });
}

// Используем middleware для защиты маршрутов с задачами
app.use("/tasks", authenticateToken);

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});