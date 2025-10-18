// Select DOM Elements
const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const timerElement = document.getElementById("timer");
const examDateInput = document.getElementById("exam-date");

// Load saved todos
const saved = localStorage.getItem('todos');
const todos = saved ? JSON.parse(saved) : [];

// Save todos
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Create todo node
function createTodoNode(todo, index) {
    const li = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!todo.completed;

    const textSpan = document.createElement('span');
    textSpan.textContent = todo.text;
    textSpan.style.margin = '0 8px';
    if (todo.completed) textSpan.style.textDecoration = 'line-through';

    checkbox.addEventListener("change", () => {
        todo.completed = checkbox.checked;
        textSpan.style.textDecoration = todo.completed ? 'line-through' : '';
        saveTodos();
    });

    textSpan.addEventListener("dblclick", () => {
        const newText = prompt("Edit todo", todo.text);
        if (newText !== null) {
            todo.text = newText.trim();
            textSpan.textContent = todo.text;
            saveTodos();
        }
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = "Delete";
    delBtn.addEventListener('click', () => {
        todos.splice(index, 1);
        render();
        saveTodos();
    });

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(delBtn);

    return li;
}

// Render todos
function render() {
    list.innerHTML = '';
    todos.forEach((todo, index) => {
        const node = createTodoNode(todo, index);
        list.appendChild(node);
    });
}

// Add todo
function addTodo() {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text: text, completed: false });
    input.value = '';
    render();
    saveTodos();
}

addBtn.addEventListener("click", addTodo);
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
});
render();

// ======= Countdown Timer =======
let examDate = localStorage.getItem("examDate") || new Date().toISOString().slice(0,10);
examDateInput.value = examDate;

function updateCountdown() {
    const now = new Date().getTime();
    const target = new Date(examDate).getTime();
    const distance = target - now;

    if (distance < 0) {
        timerElement.textContent = "EXAM TIME!";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Update exam date from input
examDateInput.addEventListener("change", () => {
    examDate = examDateInput.value;
    localStorage.setItem("examDate", examDate);
    updateCountdown();
});

// ======= Motivational Quotes =======
const quotes = [
  "Stay focused, your hard work will pay off!",
  "One step closer every day!",
  "Consistency is the key to success.",
  "Don’t count the days, make the days count.",
  "Your goal is worth every effort!",
  "Push yourself, because no one else will.",
  "Dream big, study bigger!"
];

const quoteElement = document.getElementById("quote");

function updateQuote() {
    // Fade out
    quoteElement.style.opacity = 0;

    setTimeout(() => {
        // Change text
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteElement.textContent = quotes[randomIndex];

        // Fade in
        quoteElement.style.opacity = 1;
    }, 1000);
}

// Initial quote
updateQuote();
setInterval(updateQuote, 60000);
