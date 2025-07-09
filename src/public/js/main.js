function addTask() {
    const container = document.getElementById('tasks-container');
    const taskDiv = document.createElement('div');
    taskDiv.innerHTML = `
        <input type="text" placeholder="Descrição da tarefa" class="task-description">
        <label><input type="checkbox" class="task-completed"> Concluída</label>
        <button type="button" onclick="this.parentElement.remove()">Remover</button>
    `;
    container.appendChild(taskDiv);
}

function saveTasks() {
    const tasks = [];
    document.querySelectorAll('#tasks-container .task-description').forEach((input, index) => {
        tasks.push({
            description: input.value,
            completed: document.querySelectorAll('.task-completed')[index].checked
        });
    });
    document.getElementById('tasks-input').value = JSON.stringify(tasks);
}

document.addEventListener('submit', (e) => {
    if (e.target.matches('form')) {
        saveTasks();
    }
});