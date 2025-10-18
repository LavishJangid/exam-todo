/* ---------------------------
   App: Exam Workspace (vanilla JS)
   features:
   - sidebar nav
   - todos CRUD (localStorage)
   - exam date picker + countdown (localStorage)
   - Pomodoro-like timer (persistent config)
   - notes editor (autosave to localStorage)
   - export data button
   --------------------------- */

/* ------------- Utilities ------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ------------- Elements ------------- */
const navItems = $$('.nav-item');
const views = $$('.view');
const pageTitle = $('#page-title');

const todoInput = $('#todo-input');
const addTodoBtn = $('#add-todo');
const todoListEl = $('#todo-list');

const examDateInput = $('#exam-date');
const countdownDisplay = $('#countdown');
const examDateDisplay = $('#exam-date-display');
const examCountdown = $('#exam-countdown');
const clearExamBtn = $('#clear-exam');

const timerViewMode = $('#timer-mode');
const timerClock = $('#timer-clock');
const startPauseBtn = $('#start-pause');
const resetTimerBtn = $('#reset-timer');
const studyMinInput = $('#study-min');
const breakMinInput = $('#break-min');

const noteTitle = $('#note-title');
const noteBody = $('#note-body');
const saveNoteBtn = $('#save-note');
const clearNoteBtn = $('#clear-note');

const exportBtn = $('#export-btn');

/* ------------- Storage Keys ------------- */
const STORAGE = {
  TODOS: 'ew_todos_v1',
  EXAM: 'ew_exam_v1',
  TIMER: 'ew_timer_v1',
  NOTES: 'ew_notes_v1'
};

/* ========== NAVIGATION ========== */
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    btn.classList.add('active');

    const view = btn.dataset.view;
    views.forEach(v => v.classList.remove('active'));
    const target = $(`#view-${view}`);
    if (target) target.classList.add('active');

    pageTitle.textContent = btn.textContent.replace('📘','To-Do').trim();
  });
});

/* ========== TODOS ========== */
let todos = JSON.parse(localStorage.getItem(STORAGE.TODOS) || '[]');

function saveTodos(){ localStorage.setItem(STORAGE.TODOS, JSON.stringify(todos)); }
function renderTodos(){
  todoListEl.innerHTML = '';
  todos.forEach((t,i) => {
    const li = document.createElement('li');

    const left = document.createElement('div'); left.className='todo-left';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!t.completed;
    const span = document.createElement('div'); span.className='todo-text'; span.textContent = t.text;
    if (t.completed) span.classList.add('completed');

    cb.addEventListener('change', () => {
      t.completed = cb.checked;
      if (t.completed) span.classList.add('completed'); else span.classList.remove('completed');
      saveTodos();
    });

    // double click inline edit
    span.addEventListener('dblclick', () => {
      const newText = prompt('Edit task', t.text);
      if (newText !== null) {
        t.text = newText.trim();
        span.textContent = t.text;
        saveTodos();
      }
    });

    left.appendChild(cb); left.appendChild(span);

    const actions = document.createElement('div'); actions.className='todo-actions';
    const delBtn = document.createElement('button'); delBtn.className='ghost'; delBtn.textContent='Delete';
    delBtn.addEventListener('click', () => {
      todos.splice(i,1); saveTodos(); renderTodos();
    });

    actions.appendChild(delBtn);
    li.appendChild(left); li.appendChild(actions);
    todoListEl.appendChild(li);
  });
}

function addTodo(){
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ text, completed: false, created: Date.now() });
  todoInput.value = '';
  saveTodos();
  renderTodos();
}
addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

renderTodos();

/* ========== EXAM DATE + COUNTDOWN ========== */
let exam = JSON.parse(localStorage.getItem(STORAGE.EXAM) || 'null');

function setExamDate(dateString){
  if (!dateString) { exam = null; localStorage.removeItem(STORAGE.EXAM); }
  else { exam = { date: dateString }; localStorage.setItem(STORAGE.EXAM, JSON.stringify(exam)); }
  refreshExamUI();
}

function refreshExamUI(){
  if (exam && exam.date){
    examDateInput.value = exam.date;
    examDateDisplay.textContent = exam.date;
  } else {
    examDateInput.value = '';
    examDateDisplay.textContent = '—';
  }
}
examDateInput.addEventListener('change', () => {
  const val = examDateInput.value;
  if (val) setExamDate(val);
  else setExamDate(null);
});

/* countdown updater */
function formatTimeLeft(ms){
  if (ms <= 0) return '0d 0h 0m 0s';
  const days = Math.floor(ms / (1000*60*60*24));
  const hours = Math.floor((ms % (1000*60*60*24)) / (1000*60*60));
  const mins = Math.floor((ms % (1000*60*60)) / (1000*60));
  const secs = Math.floor((ms % (1000*60)) / 1000);
  return `${days}d ${hours}h ${mins}m ${secs}s`;
}

function updateCountdownTick(){
  const now = Date.now();
  if (exam && exam.date){
    const target = new Date(exam.date + 'T00:00:00').getTime();
    const left = target - now;
    examCountdown.textContent = left > 0 ? formatTimeLeft(left) : 'EXAM DAY!';
    countdownDisplay.textContent = (left>0) ? formatTimeLeft(left) : 'EXAM DAY!';
  } else {
    examCountdown.textContent = '—';
    countdownDisplay.textContent = 'No date set';
  }
}
setInterval(updateCountdownTick, 1000);
updateCountdownTick();
refreshExamUI();

clearExamBtn && clearExamBtn.addEventListener('click', () => {
  setExamDate(null);
  updateCountdownTick();
});

/* ========== TIMER (Pomodoro-ish) ========== */
let timerState = JSON.parse(localStorage.getItem(STORAGE.TIMER) || 'null') || {
  running:false,
  mode:'study', // 'study' or 'break'
  remaining: 25*60,
  studyMin:25,
  breakMin:5
};

function saveTimer(){ localStorage.setItem(STORAGE.TIMER, JSON.stringify(timerState)); }
function updateTimerUI(){
  const mm = String(Math.floor(timerState.remaining/60)).padStart(2,'0');
  const ss = String(timerState.remaining%60).padStart(2,'0');
  timerClock.textContent = `${mm}:${ss}`;
  timerViewMode.textContent = timerState.mode === 'study' ? 'Study' : 'Break';
  studyMinInput.value = timerState.studyMin;
  breakMinInput.value = timerState.breakMin;
  startPauseBtn.textContent = timerState.running ? 'Pause' : 'Start';
}

/* start/pause */
let timerInterval = null;
function startTimer(){
  if (timerState.running) return;
  timerState.running = true;
  saveTimer();
  timerInterval = setInterval(() => {
    if (timerState.remaining <= 0){
      // switch mode
      timerState.mode = timerState.mode === 'study' ? 'break' : 'study';
      timerState.remaining = (timerState.mode === 'study' ? timerState.studyMin : timerState.breakMin) * 60;
      // small notification (if allowed)
      try { if (Notification && Notification.permission === 'granted') new Notification('Timer', {body: timerState.mode === 'study' ? 'Study time!' : 'Break time!'}) } catch(e){}
    } else {
      timerState.remaining -= 1;
    }
    saveTimer(); updateTimerUI();
  }, 1000);
}

function pauseTimer(){
  timerState.running = false;
  clearInterval(timerInterval);
  timerInterval = null;
  saveTimer(); updateTimerUI();
}
startPauseBtn.addEventListener('click', () => {
  if (timerState.running) pauseTimer(); else startTimer();
});

resetTimerBtn.addEventListener('click', () => {
  pauseTimer();
  timerState.mode = 'study';
  timerState.remaining = timerState.studyMin * 60;
  saveTimer(); updateTimerUI();
});

/* change config */
studyMinInput.addEventListener('change', () => {
  const v = parseInt(studyMinInput.value) || 1;
  timerState.studyMin = v;
  if (timerState.mode === 'study') timerState.remaining = v*60;
  saveTimer(); updateTimerUI();
});
breakMinInput.addEventListener('change', () => {
  const v = parseInt(breakMinInput.value) || 1;
  timerState.breakMin = v;
  if (timerState.mode === 'break') timerState.remaining = v*60;
  saveTimer(); updateTimerUI();
});

/* initialize timer UI & maybe start if running */
updateTimerUI();
if (timerState.running) startTimer();

/* ========== NOTES ========== */
let notes = JSON.parse(localStorage.getItem(STORAGE.NOTES) || 'null') || { title:'', body:'' };

function saveNotes(){ localStorage.setItem(STORAGE.NOTES, JSON.stringify(notes)); }
function loadNotes(){ noteTitle.value = notes.title || ''; noteBody.innerHTML = notes.body || ''; }

saveNoteBtn.addEventListener('click', () => {
  notes.title = noteTitle.value;
  notes.body = noteBody.innerHTML;
  saveNotes();
  alert('Note saved');
});
clearNoteBtn.addEventListener('click', () => {
  if (!confirm('Clear note?')) return;
  notes = { title:'', body:'' };
  saveNotes(); loadNotes();
});

/* autosave notes every 3 seconds when editing */
let autosaveTimer = null;
noteBody.addEventListener('input', () => {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    notes.title = noteTitle.value;
    notes.body = noteBody.innerHTML;
    saveNotes();
  }, 1500);
});
noteTitle.addEventListener('input', () => {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    notes.title = noteTitle.value;
    notes.body = noteBody.innerHTML;
    saveNotes();
  }, 1500);
});

loadNotes();

/* ========== EXPORT (download JSON) ========== */
exportBtn.addEventListener('click', () => {
  const data = {
    todos, exam, timerState, notes
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exam-workspace-export.json';
  a.click();
  URL.revokeObjectURL(url);
});

/* ======= On load: set exam input if saved ======= */
if (exam && exam.date) examDateInput.value = exam.date;

/* ======= Ensure UI accurate on start ======= */
updateTimerUI();
renderTodos();
updateCountdownTick();
