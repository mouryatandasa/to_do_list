// =========================================================
// TaskFlow — Premium To-Do App with localStorage
// =========================================================

const STORAGE_KEY = 'taskflow-v2';

let todos = [];
let currentFilter = 'all';

const el = {
  form:           document.getElementById('todo-form'),
  input:          document.getElementById('todo-input'),
  list:           document.getElementById('todo-list'),
  filters:        document.querySelectorAll('.filter-btn'),
  clearCompleted: document.getElementById('clear-completed'),
  count:          document.getElementById('count'),
  progressFill:   document.getElementById('progress-fill'),
  progressLabel:  document.getElementById('progress-label'),
  progressTrack:  document.getElementById('progress-track'),
  statTotal:      document.getElementById('stat-total-num'),
  statDone:       document.getElementById('stat-done-num'),
  todoCard:       document.querySelector('.todo-card'),
};

// --- Utilities ---
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatTime(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now - d;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// --- Data persistence ---
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    todos = raw ? JSON.parse(raw) : [];
  } catch (e) {
    todos = [];
    console.error('Failed to load todos:', e);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// --- CRUD ---
function addTodo(text) {
  if (!text || !text.trim()) return;
  todos.push({
    id: uid(),
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
  });
  save();
  render();
}

function toggleComplete(id) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  save();
  render();
}

function deleteTodo(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.style.transition = 'all 0.3s ease';
    item.style.opacity = '0';
    item.style.transform = 'translateX(40px) scale(0.95)';
    setTimeout(() => {
      todos = todos.filter(x => x.id !== id);
      save();
      render();
    }, 280);
  } else {
    todos = todos.filter(x => x.id !== id);
    save();
    render();
  }
}

function updateTodoText(id, newText) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.text = newText.trim();
  save();
  render();
}

function clearCompleted() {
  todos = todos.filter(x => !x.completed);
  save();
  render();
}

// --- Filtering ---
function filteredTodos() {
  if (currentFilter === 'active') return todos.filter(t => !t.completed);
  if (currentFilter === 'completed') return todos.filter(t => t.completed);
  return todos;
}

// --- SVG icon helpers ---
const icons = {
  edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  delete: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  cancel: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  empty: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>`,
};

// --- Render ---
function render() {
  el.list.innerHTML = '';
  const list = filteredTodos();

  if (list.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'todo-item empty';
    empty.id = 'empty-state';

    const messages = {
      all: 'No tasks yet — add one above!',
      active: 'All caught up! No active tasks.',
      completed: 'Nothing completed yet.',
    };

    empty.innerHTML = `${icons.empty}<span>${messages[currentFilter]}</span>`;
    el.list.appendChild(empty);
  } else {
    list.forEach((todo, index) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.completed ? ' completed' : '');
      li.dataset.id = todo.id;
      li.style.animationDelay = `${index * 0.04}s`;

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'checkbox';
      checkbox.id = `chk-${todo.id}`;
      checkbox.checked = todo.completed;
      checkbox.setAttribute('aria-label', todo.completed ? 'Mark as not completed' : 'Mark as completed');
      checkbox.addEventListener('change', () => toggleComplete(todo.id));

      // Label
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = todo.text;
      label.title = 'Double-click to edit';
      label.addEventListener('dblclick', () => startEdit(li, todo));

      // Timestamp
      const time = document.createElement('span');
      time.className = 'todo-timestamp';
      time.textContent = formatTime(todo.createdAt);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-icon btn-edit';
      editBtn.type = 'button';
      editBtn.innerHTML = icons.edit;
      editBtn.title = 'Edit task';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.addEventListener('click', () => startEdit(li, todo));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-icon btn-delete';
      delBtn.type = 'button';
      delBtn.innerHTML = icons.delete;
      delBtn.title = 'Delete task';
      delBtn.setAttribute('aria-label', 'Delete task');
      delBtn.addEventListener('click', () => deleteTodo(todo.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(checkbox);
      li.appendChild(label);
      li.appendChild(time);
      li.appendChild(actions);
      el.list.appendChild(li);
    });
  }

  updateStats();
}

// --- Inline editing ---
function startEdit(li, todo) {
  li.innerHTML = '';
  li.classList.remove('completed');
  li.style.animation = 'none';

  const input = document.createElement('input');
  input.className = 'edit-input';
  input.value = todo.text;
  input.setAttribute('aria-label', 'Edit todo');

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn-save';
  saveBtn.innerHTML = icons.save;
  saveBtn.title = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-cancel';
  cancelBtn.innerHTML = icons.cancel;
  cancelBtn.title = 'Cancel';

  saveBtn.addEventListener('click', () => {
    if (input.value.trim()) updateTodoText(todo.id, input.value);
    else {
      input.style.borderColor = 'var(--danger)';
      input.style.boxShadow = '0 0 0 3px var(--danger-glow)';
      input.focus();
    }
  });

  cancelBtn.addEventListener('click', render);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
    if (e.key === 'Escape') cancelBtn.click();
  });

  li.appendChild(input);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);
  input.focus();
  input.select();
}

// --- Stats & progress ---
function updateStats() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const remaining = total - completed;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Header stats
  el.statTotal.textContent = total;
  el.statDone.textContent = completed;

  // Progress bar
  el.progressFill.style.width = `${pct}%`;
  el.progressLabel.textContent = total === 0 ? '' : `${pct}%`;
  el.progressTrack.setAttribute('aria-valuenow', pct);

  // Count text
  el.count.textContent = total === 0
    ? ''
    : `${remaining} task${remaining === 1 ? '' : 's'} remaining · ${completed} completed`;

  // Celebration for 100%
  if (total > 0 && completed === total) {
    el.todoCard.classList.add('all-done');
    setTimeout(() => el.todoCard.classList.remove('all-done'), 700);
  }
}

// --- Events ---

// Form submit
el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(el.input.value);
  el.input.value = '';
  el.input.focus();
});

// Filter tabs
el.filters.forEach(btn => {
  btn.addEventListener('click', () => {
    el.filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// Clear completed
el.clearCompleted.addEventListener('click', () => {
  const completedCount = todos.filter(t => t.completed).length;
  if (completedCount === 0) return;
  clearCompleted();
});

// Keyboard shortcut: focus input on "/"
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== el.input) {
    e.preventDefault();
    el.input.focus();
  }
});

// --- 3D tilt effect on main card ---
const card = el.todoCard;
let tiltEnabled = window.matchMedia('(min-width: 520px)').matches;

window.matchMedia('(min-width: 520px)').addEventListener('change', (e) => {
  tiltEnabled = e.matches;
  if (!tiltEnabled) {
    card.style.transform = '';
  }
});

card.addEventListener('mousemove', (e) => {
  if (!tiltEnabled) return;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  const rotateX = ((y - cy) / cy) * -2.5;
  const rotateY = ((x - cx) / cx) * 2.5;

  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
});

card.addEventListener('mouseleave', () => {
  if (!tiltEnabled) return;
  card.style.transform = '';
});

// --- Initialize ---
load();
render();