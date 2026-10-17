/* ============================================================
   app.js  —  Personal Dashboard
   Vanilla JS only. One file. LocalStorage for persistence.

   Features:
     - Greeting + live clock
     - Focus (Pomodoro) timer with configurable duration  [Challenge]
     - To-do list (add / edit / check / delete)
     - Quick links (add / open / delete)
     - Light / Dark theme toggle                          [Challenge]
     - Custom name in greeting                            [Challenge]
   ============================================================ */

'use strict';

/* ── STORAGE KEYS ─────────────────────────────────────────── */
const KEY = {
  THEME: 'dashboard_theme',
  NAME:  'dashboard_name',
  TODOS: 'dashboard_todos',
  LINKS: 'dashboard_links',
  POMO:  'dashboard_pomo_duration',
};

/* ── STORAGE HELPERS ──────────────────────────────────────── */
const store = {
  get:    (k, fallback = null) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set:    (k, v)               => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('LocalStorage write failed', e); } },
  remove: (k)                  => { try { localStorage.removeItem(k); } catch { /* noop */ } },
};

/* ══════════════════════════════════════════════════════════
   1. THEME (Light / Dark)
   ══════════════════════════════════════════════════════════ */
const themeToggleBtn = document.getElementById('themeToggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function initTheme() {
  const saved = store.get(KEY.THEME, 'light');
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  store.set(KEY.THEME, next);
  applyTheme(next);
});

/* ══════════════════════════════════════════════════════════
   2. GREETING + CLOCK
   ══════════════════════════════════════════════════════════ */
const greetingEl = document.getElementById('greeting');
const datetimeEl = document.getElementById('datetime');

function getGreetingPhrase(hour) {
  if (hour < 5)  return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now  = new Date();
  const hour = now.getHours();
  const name = store.get(KEY.NAME, '');

  const phrase = getGreetingPhrase(hour);
  greetingEl.textContent = name ? `${phrase}, ${name}! 👋` : `${phrase}! 👋`;

  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  datetimeEl.textContent = `${dateStr} · ${timeStr}`;
}

/* ══════════════════════════════════════════════════════════
   3. CUSTOM NAME MODAL
   ══════════════════════════════════════════════════════════ */
const setupModal  = document.getElementById('setupModal');
const nameInput   = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveNameBtn');

function showNameModal() {
  nameInput.value = store.get(KEY.NAME, '');
  setupModal.classList.remove('hidden');
  nameInput.focus();
}

function closeNameModal() {
  setupModal.classList.add('hidden');
}

saveNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  store.set(KEY.NAME, name);
  closeNameModal();
  updateClock();
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveNameBtn.click();
  if (e.key === 'Escape') closeNameModal();
});

// Double-click greeting to change name
greetingEl.addEventListener('dblclick', showNameModal);
greetingEl.title = 'Double-click to change your name';
greetingEl.style.cursor = 'pointer';

function initName() {
  if (!store.get(KEY.NAME, '')) showNameModal();
}

/* ══════════════════════════════════════════════════════════
   4. FOCUS TIMER (Pomodoro, configurable duration)
   ══════════════════════════════════════════════════════════ */
const timerDisplay  = document.getElementById('timerDisplay');
const startBtn      = document.getElementById('startBtn');
const stopBtn       = document.getElementById('stopBtn');
const resetBtn      = document.getElementById('resetBtn');
const pomoDurationEl = document.getElementById('pomoDuration');
const applyDurBtn   = document.getElementById('applyDuration');

let timerInterval = null;
let timerSeconds  = 0;    // remaining seconds
let timerRunning  = false;

function getDurationMinutes() {
  return store.get(KEY.POMO, 25);
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function setTimerDisplay(secs) {
  timerDisplay.textContent = formatTime(secs);
  // Update page title when running
  if (timerRunning) {
    document.title = `${formatTime(secs)} — Dashboard`;
  } else {
    document.title = 'My Personal Dashboard';
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  document.title    = 'My Personal Dashboard';
}

function resetTimer() {
  stopTimer();
  timerSeconds = getDurationMinutes() * 60;
  setTimerDisplay(timerSeconds);
}

startBtn.addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning      = true;
  startBtn.disabled = true;
  stopBtn.disabled  = false;

  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      stopTimer();
      timerDisplay.textContent = '00:00';
      timerDisplay.style.color = 'var(--success)';
      // Brief "Done!" flash then restore
      setTimeout(() => { timerDisplay.style.color = ''; }, 3000);
      new Notification && Notification.permission === 'granted'
        ? new Notification('⏱ Focus session complete! Time for a break.')
        : null;
      return;
    }
    timerSeconds--;
    setTimerDisplay(timerSeconds);
  }, 1000);
});

stopBtn.addEventListener('click',  stopTimer);
resetBtn.addEventListener('click', resetTimer);

applyDurBtn.addEventListener('click', () => {
  let val = parseInt(pomoDurationEl.value, 10);
  if (isNaN(val) || val < 1)  val = 1;
  if (val > 90) val = 90;
  pomoDurationEl.value = val;
  store.set(KEY.POMO, val);
  if (!timerRunning) {
    timerSeconds = val * 60;
    setTimerDisplay(timerSeconds);
  }
});

function initTimer() {
  const dur = getDurationMinutes();
  pomoDurationEl.value = dur;
  timerSeconds = dur * 60;
  setTimerDisplay(timerSeconds);
}

/* ══════════════════════════════════════════════════════════
   5. TO-DO LIST
   ══════════════════════════════════════════════════════════ */
const todoInput  = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoListEl = document.getElementById('todoList');

/** @type {{ id: string, text: string, done: boolean }[]} */
let todos = [];

function saveTodos() {
  store.set(KEY.TODOS, todos);
}

function renderTodos() {
  todoListEl.innerHTML = '';
  todos.forEach(todo => {
    const li   = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = todo.id;

    // Checkbox
    const cb  = document.createElement('input');
    cb.type   = 'checkbox';
    cb.checked = todo.done;
    cb.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.done ? 'not done' : 'done'}`);
    cb.addEventListener('change', () => toggleTodo(todo.id));

    // Label
    const label = document.createElement('span');
    label.className = 'todo-label' + (todo.done ? ' done' : '');
    label.textContent = todo.text;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit "${todo.text}"`);
    editBtn.addEventListener('click', () => startEditTodo(todo.id, li, label));

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = '🗑';
    delBtn.setAttribute('aria-label', `Delete "${todo.text}"`);
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    const actions = document.createElement('div');
    actions.className = 'todo-actions';
    actions.append(editBtn, delBtn);

    li.append(cb, label, actions);
    todoListEl.appendChild(li);
  });
}

function addTodo(text) {
  if (!text.trim()) return;
  todos.push({ id: Date.now().toString(36), text: text.trim(), done: false });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTodos(); renderTodos(); }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function startEditTodo(id, li, labelEl) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const input = document.createElement('input');
  input.type        = 'text';
  input.className   = 'todo-edit-input';
  input.value       = todo.text;
  input.maxLength   = 120;

  const saveEdit = () => {
    const newText = input.value.trim();
    if (newText) { todo.text = newText; saveTodos(); }
    renderTodos();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveEdit();
    if (e.key === 'Escape') renderTodos(); // cancel
  });
  input.addEventListener('blur', saveEdit);

  li.replaceChild(input, labelEl);
  input.focus();
  input.select();
}

addTodoBtn.addEventListener('click', () => {
  addTodo(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodoBtn.click();
});

function initTodos() {
  todos = store.get(KEY.TODOS, []);
  renderTodos();
}

/* ══════════════════════════════════════════════════════════
   6. QUICK LINKS
   ══════════════════════════════════════════════════════════ */
const linkNameEl  = document.getElementById('linkName');
const linkUrlEl   = document.getElementById('linkUrl');
const addLinkBtn  = document.getElementById('addLinkBtn');
const linkGrid    = document.getElementById('linkGrid');

/** @type {{ id: string, name: string, url: string }[]} */
let links = [];

function saveLinks() {
  store.set(KEY.LINKS, links);
}

function renderLinks() {
  linkGrid.innerHTML = '';
  links.forEach(link => {
    const chip = document.createElement('span');
    chip.className = 'link-chip';
    chip.setAttribute('role', 'group');
    chip.setAttribute('aria-label', link.name);

    const anchor = document.createElement('a');
    anchor.href   = link.url;
    anchor.target = '_blank';
    anchor.rel    = 'noopener noreferrer';
    anchor.textContent = link.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'link-remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Remove ${link.name}`);
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteLink(link.id);
    });

    chip.append(anchor, removeBtn);
    linkGrid.appendChild(chip);
  });
}

function addLink(name, url) {
  if (!name.trim() || !url.trim()) return;
  let normalUrl = url.trim();
  if (!/^https?:\/\//i.test(normalUrl)) normalUrl = 'https://' + normalUrl;
  links.push({ id: Date.now().toString(36), name: name.trim(), url: normalUrl });
  saveLinks();
  renderLinks();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

addLinkBtn.addEventListener('click', () => {
  addLink(linkNameEl.value, linkUrlEl.value);
  linkNameEl.value = '';
  linkUrlEl.value  = '';
  linkNameEl.focus();
});

linkUrlEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLinkBtn.click();
});

function initLinks() {
  links = store.get(KEY.LINKS, []);
 
  if (links.length === 0) {
    links = [
      { id: 'default1', name: 'GitHub',   url: 'https://github.com' },
      { id: 'default2', name: 'YouTube',  url: 'https://youtube.com' },
      { id: 'default3', name: 'Google',   url: 'https://google.com' },
    ];
    saveLinks();
  }
  renderLinks();
}


function init() {
  initTheme();
  initTimer();
  initTodos();
  initLinks();

  
  updateClock();
  setInterval(updateClock, 1000);

  
  initName();

  
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

init();
