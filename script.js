const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyMessage = document.getElementById("empty-message");
const taskCounter = document.getElementById("task-counter");
const submitBtn = document.getElementById("submit-btn");
const statTotal = document.getElementById("stat-total");
const statActive = document.getElementById("stat-active");
const statCompleted = document.getElementById("stat-completed");
const countAll = document.getElementById("count-all");
const countActive = document.getElementById("count-active");
const countCompleted = document.getElementById("count-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = [];
let currentFilter = "all";
let editingTaskId = null;

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem("taskflow-tasks") || "[]");
    if (Array.isArray(stored)) {
      tasks = stored.filter(t => t && typeof t.id === "number" && typeof t.text === "string")
        .map(t => ({ id: t.id, text: t.text, completed: Boolean(t.completed) }));
    }
  } catch (error) {
    console.warn("Could not load saved tasks.", error);
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
  } catch (error) {
    console.error("Could not save tasks in this browser.", error);
  }
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderTasks();
}

filterButtons.forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  if (editingTaskId !== null) {
    const task = tasks.find(item => item.id === editingTaskId);
    if (task) task.text = text;
    editingTaskId = null;
    submitBtn.innerHTML = 'Add task <span aria-hidden="true">↗</span>';
  } else {
    tasks.unshift({ id: Date.now(), text, completed: false });
  }
  taskInput.value = "";
  saveTasks();
  renderTasks();
  taskInput.focus();
});

function makeTaskElement(task) {
  const item = document.createElement("li");
  item.className = "task-item";
  item.classList.toggle("completed", task.completed);
  item.dataset.id = String(task.id);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Mark ${task.text} as completed`);

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "edit-btn";
  edit.dataset.action = "edit";
  edit.textContent = "Edit";
  edit.setAttribute("aria-label", `Edit ${task.text}`);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete-btn";
  remove.dataset.action = "delete";
  remove.textContent = "Delete";
  remove.setAttribute("aria-label", `Delete ${task.text}`);

  actions.append(edit, remove);
  item.append(checkbox, text, actions);
  return item;
}

function renderTasks() {
  taskList.replaceChildren();
  const visible = tasks.filter(task => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });
  visible.forEach(task => taskList.appendChild(makeTaskElement(task)));

  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const active = total - completed;
  statTotal.textContent = total;
  statActive.textContent = active;
  statCompleted.textContent = completed;
  countAll.textContent = total;
  countActive.textContent = active;
  countCompleted.textContent = completed;
  taskCounter.textContent = `${visible.length} ${visible.length === 1 ? "task" : "tasks"}`;

  const isEmpty = visible.length === 0;
  emptyState.hidden = !isEmpty;
  taskList.hidden = isEmpty;

  if (currentFilter === "active") {
    emptyTitle.textContent = "You're all caught up.";
    emptyMessage.textContent = "There are no active tasks right now. Enjoy the breathing room.";
  } else if (currentFilter === "completed") {
    emptyTitle.textContent = "Nothing completed yet.";
    emptyMessage.textContent = "Finish a task and it will show up here.";
  } else {
    emptyTitle.textContent = "A fresh start.";
    emptyMessage.textContent = "Add your first task above and turn your plans into progress.";
  }
}

taskList.addEventListener("change", event => {
  if (!event.target.matches(".task-checkbox")) return;
  const item = event.target.closest(".task-item");
  if (!item) return;
  const task = tasks.find(entry => entry.id === Number(item.dataset.id));
  if (!task) return;
  task.completed = event.target.checked;
  saveTasks();
  renderTasks();
});

taskList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = button.closest(".task-item");
  if (!item) return;
  const id = Number(item.dataset.id);
  const task = tasks.find(entry => entry.id === id);
  if (!task) return;

  if (button.dataset.action === "edit") {
    taskInput.value = task.text;
    editingTaskId = task.id;
    submitBtn.textContent = "Save changes";
    taskInput.focus();
    taskInput.select();
  } else if (button.dataset.action === "delete") {
    if (!confirm(`Delete "${task.text}"?`)) return;
    tasks = tasks.filter(entry => entry.id !== id);
    if (editingTaskId === id) {
      editingTaskId = null;
      taskInput.value = "";
      submitBtn.innerHTML = 'Add task <span aria-hidden="true">↗</span>';
    }
    saveTasks();
    renderTasks();
  }
});

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeIcon.textContent = dark ? "☀" : "☾";
  themeLabel.textContent = dark ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

let initialTheme = "light";
try {
  initialTheme = localStorage.getItem("taskflow-theme") || "light";
} catch (error) {
  console.warn("Could not load theme preference.", error);
}
applyTheme(initialTheme === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("taskflow-theme", next);
  } catch (error) {
    console.warn("Could not save theme preference.", error);
  }
});

document.getElementById("today-label").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long", month: "short", day: "numeric"
}).format(new Date()).toUpperCase();

loadTasks();
renderTasks();
