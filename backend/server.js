const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./database.db");

// CREATE TABLE
db.run(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0
)
`);

// GET
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    res.json(rows);
  });
});

// POST
app.post("/tasks", (req, res) => {
  const { title } = req.body;

  db.run(
    "INSERT INTO tasks (title, completed) VALUES (?, 0)",
    [title],
    function (err) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    }
  );
});

// DELETE
app.delete("/tasks/:id", (req, res) => {
  db.run("DELETE FROM tasks WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }
    res.sendStatus(200);
  });
});

// PUT (update + toggle)
app.put("/tasks/:id", (req, res) => {
  const { title, completed } = req.body;

  db.run(
    "UPDATE tasks SET title = ?, completed = ? WHERE id = ?",
    [title, completed ? 1 : 0, req.params.id],
    function (err) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    }
  );
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});