const API = "https://task-manager-00y6.onrender.com/tasks";

const app = Vue.createApp({
  data() {
    return {
      tasks: [],
      newTask: "",
      editingTask: null,
      editText: "",
      filter: "all",
      lang: "ua",

      texts: {
        ua: {
          title: "📝 Менеджер завдань",
          placeholder: "Нове завдання...",
          all: "Всі",
          active: "Активні",
          done: "Виконані"
        },
        en: {
          title: "📝 Task Manager",
          placeholder: "New task...",
          all: "All",
          active: "Active",
          done: "Done"
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
    }
  },

  methods: {

    async loadTasks() {
      const res = await fetch(API);
      this.tasks = await res.json();
    },

    async addTask() {
      if (!this.newTask.trim()) return;

      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: this.newTask })
      });

      this.newTask = "";
      this.loadTasks();
    },

    async deleteTask(id) {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      this.loadTasks();
    },

    async toggleTask(task) {
      await fetch(`${API}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      await fetch(`${API}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: this.editText,
          completed: task.completed
        })
      });

      this.editingTask = null;
      this.loadTasks();
    }
  },

  mounted() {
    this.loadTasks();
  }
});

app.mount("#app");
