const API = "https://task-manager-00y6.onrender.com";

const app = Vue.createApp({
  data() {
    return {
      tasks: [],
      newTask: "",
      editingTask: null,
      editText: "",
      filter: "all",
      lang: "ua",

      username: "",
      password: "",
      token: localStorage.getItem("token") || "",

      texts: {
        ua: {
          title: "📝 Менеджер завдань",
          placeholder: "Нове завдання...",
          all: "Всі",
          active: "Активні",
          done: "Виконані",
          add: "Додати",
          login: "Увійти",
          register: "Реєстрація"
        },
        en: {
          title: "📝 Task Manager",
          placeholder: "New task...",
          all: "All",
          active: "Active",
          done: "Done",
          add: "Add",
          login: "Login",
          register: "Register"
        }
      }
    };
  },

  computed: {
    t() {
      return this.texts[this.lang];
    },

    filteredTasks() {
      if (this.filter === "all") return this.tasks;
      if (this.filter === "active") return this.tasks.filter(t => t.completed === 0);
      if (this.filter === "done") return this.tasks.filter(t => t.completed === 1);
      return this.tasks;
    }
  },

  methods: {

    getHeaders() {
      return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`
      };
    },

    async loadTasks() {
      if (!this.token) return;

      try {
        const res = await fetch(`${API}/tasks`, {
          headers: this.getHeaders()
        });

        this.tasks = await res.json();
      } catch (err) {
        console.log("Load error:", err);
      }
    },

    async addTask() {
      if (!this.token || !this.newTask.trim()) return;

      await fetch(`${API}/tasks`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ title: this.newTask })
      });

      this.newTask = "";
      this.loadTasks();
    },

    async deleteTask(id) {
      await fetch(`${API}/tasks/${id}`, {
        method: "DELETE",
        headers: this.getHeaders()
      });

      this.loadTasks();
    },

    async toggleTask(task) {
      await fetch(`${API}/tasks/${task.id}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({
          title: task.title,
          completed: task.completed === 1 ? 0 : 1
        })
      });

      this.loadTasks();
    },

    editTask(task) {
      this.editingTask = task;
      this.editText = task.title;
    },

    async saveEdit(task) {
      await fetch(`${API}/tasks/${task.id}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({
          title: this.editText,
          completed: task.completed
        })
      });

      this.editingTask = null;
      this.loadTasks();
    },

    async login() {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.username,
          password: this.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        this.token = data.token;
        localStorage.setItem("token", this.token);
        this.loadTasks();
      } else {
        alert(data.error);
      }
    },

    async register() {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.username,
          password: this.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registered! Now login.");
      } else {
        alert(data.error);
      }
    },

    logout() {
      this.token = "";
      localStorage.removeItem("token");
      this.tasks = [];
    }
  },

  mounted() {
    if (this.token) {
      this.loadTasks();
    }
  }
});

app.mount("#app");