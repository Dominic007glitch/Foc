// Missões App - Produtividade Gamificada
let missions = [];
let completedMissions = [];
let xp = 0;
let level = 1;
let streak = 0;
let bestStreak = 0;
let lastCompletionDate = null;
let achievements = [];
let dailyHistory = {}; // date -> {completed: number, total: number}

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1400, 2500, 4200, 6500, 9500, 13500]; // example progression

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDate();
    setInterval(updateDate, 60000);
    renderDashboard();
    checkDailyReset();
    
    // Keyboard for focus mode
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const focusModal = document.getElementById('focus-modal');
            if (!focusModal.classList.contains('hidden')) {
                exitFocusMode();
            }
        }
    });
});

function loadData() {
    const savedMissions = localStorage.getItem('missions');
    if (savedMissions) missions = JSON.parse(savedMissions);
    
    const savedCompleted = localStorage.getItem('completedMissions');
    if (savedCompleted) completedMissions = JSON.parse(savedCompleted);
    
    const savedXp = localStorage.getItem('xp');
    if (savedXp) xp = parseInt(savedXp);
    
    const savedLevel = localStorage.getItem('level');
    if (savedLevel) level = parseInt(savedLevel);
    
    const savedStreak = localStorage.getItem('streak');
    if (savedStreak) streak = parseInt(savedStreak);
    
    const savedBestStreak = localStorage.getItem('bestStreak');
    if (savedBestStreak) bestStreak = parseInt(savedBestStreak);
    
    const savedHistory = localStorage.getItem('dailyHistory');
    if (savedHistory) dailyHistory = JSON.parse(savedHistory);
    
    const savedAchievements = localStorage.getItem('achievements');
    if (savedAchievements) achievements = JSON.parse(savedAchievements);
}

function saveData() {
    localStorage.setItem('missions', JSON.stringify(missions));
    localStorage.setItem('completedMissions', JSON.stringify(completedMissions));
    localStorage.setItem('xp', xp);
    localStorage.setItem('level', level);
    localStorage.setItem('streak', streak);
    localStorage.setItem('bestStreak', bestStreak);
    localStorage.setItem('dailyHistory', JSON.stringify(dailyHistory));
    localStorage.setItem('achievements', JSON.stringify(achievements));
}

function updateDate() {
    const dateEl = document.getElementById('current-date');
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    dateEl.textContent = now.toLocaleDateString('pt-BR', options);
    
    const greeting = document.getElementById('greeting');
    const hour = now.getHours();
    if (hour < 12) greeting.textContent = "Bom dia, Produtivo";
    else if (hour < 18) greeting.textContent = "Boa tarde, Produtivo";
    else greeting.textContent = "Boa noite, Produtivo";
}

function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    if (lastCompletionDate && lastCompletionDate !== today) {
        // Check if yesterday was completed fully
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = yesterday.toISOString().split('T')[0];
        
        if (dailyHistory[yKey] && dailyHistory[yKey].completed === dailyHistory[yKey].total && dailyHistory[yKey].total > 0) {
            streak++;
            if (streak > bestStreak) bestStreak = streak;
        } else if (dailyHistory[yKey]) {
            streak = 0;
        }
        
        lastCompletionDate = today;
        saveData();
    }
}

function getCurrentLevelInfo() {
    let currentLevel = 1;
    let nextThreshold = LEVEL_THRESHOLDS[1];
    
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            currentLevel = i + 1;
            nextThreshold = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i] + 3000;
        } else {
            break;
        }
    }
    
    const progress = ((xp - (LEVEL_THRESHOLDS[currentLevel-1] || 0)) / (nextThreshold - (LEVEL_THRESHOLDS[currentLevel-1] || 0))) * 100;
    
    const titles = ["Iniciante", "Organizado", "Focado", "Produtivo", "Especialista", "Mestre da Produtividade"];
    const title = titles[Math.min(currentLevel-1, titles.length-1)];
    
    return { level: currentLevel, title, progress: Math.min(Math.max(progress, 0), 100), nextXp: nextThreshold };
}

function navigateTo(page) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(`nav-${page}`).classList.add('active');
    
    const titleEl = document.getElementById('page-title');
    titleEl.textContent = page === 'dashboard' ? 'Dashboard' : 
                         page === 'missions' ? 'Minhas Missões' :
                         page === 'calendar' ? 'Calendário' :
                         page === 'achievements' ? 'Conquistas' : 'Estatísticas';
    
    const content = document.getElementById('main-content');
    
    if (page === 'dashboard') {
        renderDashboard();
    } else if (page === 'missions') {
        renderMissionsPage();
    } else if (page === 'calendar') {
        renderCalendar();
    } else if (page === 'achievements') {
        renderAchievements();
    } else if (page === 'stats') {
        renderStats();
    }
}

function renderDashboard() {
    const content = document.getElementById('main-content');
    const todayMissions = getTodayMissions();
    const completedToday = todayMissions.filter(m => m.completed).length;
    const progress = todayMissions.length > 0 ? Math.round((completedToday / todayMissions.length) * 100) : 0;
    
    const levelInfo = getCurrentLevelInfo();
    
    let html = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Welcome Card -->
            <div class="lg:col-span-8 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-10">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-5xl title-font font-semibold tracking-tighter mb-2">Bem-vindo de volta!</h2>
                        <p class="text-zinc-400 text-xl">Continue construindo sua consistência</p>
                    </div>
                    <div class="text-right">
                        <div class="flex items-center gap-2 justify-end text-amber-400">
                            <i class="fa-solid fa-fire streak-flame text-4xl"></i>
                            <span class="text-6xl font-light">${streak}</span>
                        </div>
                        <div class="text-xs text-zinc-500 -mt-1">STREAK</div>
                    </div>
                </div>
                
                <div class="mt-12 flex items-center gap-8">
                    <div>
                        <div class="text-7xl font-light tabular-nums">${levelInfo.level}</div>
                        <div class="text-sm text-blue-400">${levelInfo.title}</div>
                    </div>
                    
                    <div class="flex-1">
                        <div class="flex justify-between text-xs mb-2 text-zinc-400">
                            <div>XP</div>
                            <div>${xp} / ${levelInfo.nextXp}</div>
                        </div>
                        <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
                            <div class="xp-bar h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style="width: ${levelInfo.progress}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Progress Card -->
            <div class="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col">
                <div class="text-sm uppercase tracking-widest text-zinc-400 mb-2">HOJE</div>
                <div class="text-7xl font-light tabular-nums text-emerald-400">${progress}<span class="text-4xl">%</span></div>
                <div class="text-zinc-400">Progresso do dia</div>
                
                <div class="mt-auto pt-8 border-t border-zinc-800 grid grid-cols-2 gap-6 text-center">
                    <div>
                        <div class="text-4xl font-medium">${completedToday}</div>
                        <div class="text-xs text-zinc-500">CONCLUÍDAS</div>
                    </div>
                    <div>
                        <div class="text-4xl font-medium">${todayMissions.length - completedToday}</div>
                        <div class="text-xs text-zinc-500">PENDENTES</div>
                    </div>
                </div>
            </div>
            
            <!-- Today's Missions -->
            <div class="lg:col-span-12">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-semibold">Missões de Hoje</h3>
                    <button onclick="showNewMissionModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl text-sm font-medium">
                        <i class="fa-solid fa-plus"></i>
                        <span>Nova Missão</span>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="today-missions-grid">
                    ${renderMissionCards(todayMissions, true)}
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

function getTodayMissions() {
    const today = new Date().toISOString().split('T')[0];
    return missions.filter(m => {
        if (m.type === 'daily') return true;
        if (m.type === 'weekly') return true; // simplified
        return false;
    });
}

function renderMissionCards(missionsList, showActions = true) {
    if (missionsList.length === 0) {
        return `<div class="col-span-full text-center py-12 text-zinc-500">Nenhuma missão encontrada. Crie uma nova!</div>`;
    }
    
    return missionsList.map(mission => {
        const isCompleted = mission.completed || false;
        const priorityColor = mission.priority === 'high' ? 'text-red-400' : mission.priority === 'medium' ? 'text-amber-400' : 'text-emerald-400';
        
        return `
            <div class="mission-card bg-zinc-900 border ${isCompleted ? 'border-emerald-500/30' : 'border-zinc-700'} rounded-3xl p-6">
                <div class="flex justify-between">
                    <div class="${isCompleted ? 'line-through text-zinc-400' : ''}">
                        <div class="font-medium">${mission.title}</div>
                        ${mission.description ? `<div class="text-sm text-zinc-400 mt-1 line-clamp-2">${mission.description}</div>` : ''}
                    </div>
                    <div onclick="toggleComplete(${missions.indexOf(mission)})" class="cursor-pointer w-7 h-7 rounded-xl flex items-center justify-center border ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-600 hover:border-zinc-400'}">
                        ${isCompleted ? '<i class="fa-solid fa-check text-sm"></i>' : ''}
                    </div>
                </div>
                
                <div class="flex items-center justify-between mt-6 text-xs">
                    <div class="${priorityColor}">
                        <i class="fa-solid fa-flag"></i> ${mission.type === 'daily' ? 'Diária' : mission.type === 'weekly' ? 'Semanal' : 'Mensal'}
                    </div>
                    ${showActions ? `
                    <div class="flex gap-3">
                        <button onclick="editMission(${missions.indexOf(mission)})" class="text-zinc-400 hover:text-white"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteMission(${missions.indexOf(mission)})" class="text-zinc-400 hover:text-red-400"><i class="fa-solid fa-trash"></i></button>
                    </div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function showNewMissionModal(editIndex = null) {
    const modal = document.getElementById('mission-modal');
    modal.classList.remove('hidden');
    
    if (editIndex !== null) {
        const mission = missions[editIndex];
        document.getElementById('modal-title').textContent = 'Editar Missão';
        document.getElementById('mission-title').value = mission.title;
        document.getElementById('mission-desc').value = mission.description || '';
        document.getElementById('mission-type').value = mission.type;
        if (mission.priority) document.getElementById('mission-priority').value = mission.priority;
        
        window.currentEditIndex = editIndex;
    } else {
        document.getElementById('modal-title').textContent = 'Nova Missão';
        document.getElementById('mission-form').reset();
        window.currentEditIndex = null;
    }
    
    updatePriorityField();
}

function closeModal() {
    document.getElementById('mission-modal').classList.add('hidden');
}

function updatePriorityField() {
    const type = document.getElementById('mission-type').value;
    const container = document.getElementById('priority-container');
    if (type === 'daily') {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
    }
}

function saveMission() {
    const title = document.getElementById('mission-title').value.trim();
    if (!title) return alert("Título é obrigatório");
    
    const desc = document.getElementById('mission-desc').value.trim();
    const type = document.getElementById('mission-type').value;
    const priority = type !== 'daily' ? document.getElementById('mission-priority').value : null;
    
    if (window.currentEditIndex !== null) {
        missions[window.currentEditIndex].title = title;
        missions[window.currentEditIndex].description = desc;
        missions[window.currentEditIndex].type = type;
        if (priority) missions[window.currentEditIndex].priority = priority;
    } else {
        missions.push({
            id: Date.now(),
            title,
            description: desc,
            type,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        });
    }
    
    saveData();
    closeModal();
    renderDashboard(); // refresh current view
    if (document.getElementById('nav-missions').classList.contains('active')) renderMissionsPage();
}

function toggleComplete(index) {
    const mission = missions[index];
    mission.completed = !mission.completed;
    
    if (mission.completed) {
        xp += mission.type === 'daily' ? 10 : mission.type === 'weekly' ? 30 : 100;
        checkLevelUp();
        awardAchievements();
        
        const todayKey = new Date().toISOString().split('T')[0];
        if (!dailyHistory[todayKey]) dailyHistory[todayKey] = {completed: 0, total: 0};
        dailyHistory[todayKey].completed++;
    } else {
        // decrement if uncompleting
        const todayKey = new Date().toISOString().split('T')[0];
        if (dailyHistory[todayKey]) dailyHistory[todayKey].completed = Math.max(0, dailyHistory[todayKey].completed - 1);
    }
    
    saveData();
    renderDashboard();
}

function deleteMission(index) {
    if (confirm("Excluir esta missão?")) {
        missions.splice(index, 1);
        saveData();
        renderDashboard();
    }
}

function editMission(index) {
    showNewMissionModal(index);
}

function checkLevelUp() {
    const levelInfo = getCurrentLevelInfo();
    if (levelInfo.level > level) {
        level = levelInfo.level;
        // could show level up toast
        alert(`🎉 Parabéns! Você subiu para o Nível ${level} - ${levelInfo.title}`);
    }
}

function awardAchievements() {
    // Simple achievement checks
    const totalCompleted = completedMissions.length + missions.filter(m => m.completed).length;
    
    const achList = [
        {id: 'first', name: 'Primeira Missão', desc: 'Conclua sua primeira missão', condition: totalCompleted >= 1},
        {id: 'ten', name: 'Consistente', desc: '10 missões concluídas', condition: totalCompleted >= 10},
        {id: 'streak7', name: 'Uma Semana', desc: '7 dias de streak', condition: streak >= 7}
    ];
    
    achList.forEach(ach => {
        if (ach.condition && !achievements.includes(ach.id)) {
            achievements.push(ach.id);
            alert(`🏆 Conquista desbloqueada: ${ach.name}`);
        }
    });
    
    saveData();
}

function renderMissionsPage() {
    const content = document.getElementById('main-content');
    let html = `
        <div class="max-w-5xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-3xl font-semibold">Todas as Missões</h2>
                <button onclick="showNewMissionModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl text-sm font-medium">
                    <i class="fa-solid fa-plus"></i> Nova Missão
                </button>
            </div>
            
            <div class="space-y-10">
                <div>
                    <h3 class="uppercase text-xs tracking-widest text-zinc-400 mb-4">Missões de Hoje</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${renderMissionCards(getTodayMissions())}
                    </div>
                </div>
                
                <div>
                    <h3 class="uppercase text-xs tracking-widest text-zinc-400 mb-4">Missões Semanais</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${renderMissionCards(missions.filter(m => m.type === 'weekly'))}
                    </div>
                </div>
                
                <div>
                    <h3 class="uppercase text-xs tracking-widest text-zinc-400 mb-4">Missões Mensais</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${renderMissionCards(missions.filter(m => m.type === 'monthly'))}
                    </div>
                </div>
            </div>
        </div>
    `;
    content.innerHTML = html;
}

function renderCalendar() {
    const content = document.getElementById('main-content');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Simple calendar
    let daysHtml = '';
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const dayData = dailyHistory[dateStr] || {completed: 0, total: 0};
        
        let colorClass = 'bg-zinc-800';
        if (dayData.total > 0) {
            const perc = dayData.completed / dayData.total;
            if (perc === 1) colorClass = 'bg-emerald-500 text-black';
            else if (perc > 0.5) colorClass = 'bg-amber-400 text-black';
            else colorClass = 'bg-red-500';
        }
        
        daysHtml += `
            <div onclick="showDayDetail('${dateStr}')" class="calendar-day w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-medium cursor-pointer ${colorClass}">
                ${i}
            </div>
        `;
    }
    
    let html = `
        <div class="max-w-2xl mx-auto">
            <h2 class="text-3xl font-semibold mb-8">Calendário de Produtividade</h2>
            <div class="bg-zinc-900 rounded-3xl p-8">
                <div class="flex justify-between mb-8">
                    <button class="text-zinc-400">‹</button>
                    <div class="font-medium">${today.toLocaleString('pt-BR', {month: 'long'})} ${currentYear}</div>
                    <button class="text-zinc-400">›</button>
                </div>
                <div class="grid grid-cols-7 gap-3 text-center text-xs text-zinc-400 mb-3">
                    <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                </div>
                <div class="grid grid-cols-7 gap-3">
                    ${daysHtml}
                </div>
            </div>
        </div>
    `;
    content.innerHTML = html;
}

function showDayDetail(date) {
    const data = dailyHistory[date] || {completed: 0, total: 0};
    alert(`Resumo do dia ${date}:\nConcluídas: ${data.completed}/${data.total}`);
}

function renderAchievements() {
    const content = document.getElementById('main-content');
    const achList = [
        {id: 'first', icon: '🌱', name: 'Primeira Missão', desc: 'Conclua sua primeira missão'},
        {id: 'ten', icon: '🔥', name: 'Consistente', desc: '10 missões concluídas'},
        {id: 'streak7', icon: '📅', name: 'Uma Semana', desc: 'Mantenha streak por 7 dias'}
    ];
    
    let html = `
        <div>
            <h2 class="text-3xl font-semibold mb-8">Suas Conquistas</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                ${achList.map(ach => {
                    const unlocked = achievements.includes(ach.id);
                    return `
                        <div class="bg-zinc-900 border ${unlocked ? 'border-amber-400' : 'border-zinc-700 opacity-60'} rounded-3xl p-8 text-center">
                            <div class="text-6xl mb-4">${ach.icon}</div>
                            <div class="font-semibold mb-1">${ach.name}</div>
                            <div class="text-sm text-zinc-400">${ach.desc}</div>
                            ${unlocked ? '<div class="text-xs mt-4 text-amber-400">✓ DESBLOQUEADA</div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    content.innerHTML = html;
}

function renderStats() {
    const content = document.getElementById('main-content');
    const totalCompleted = missions.filter(m => m.completed).length + completedMissions.length;
    
    let html = `
        <div class="max-w-4xl mx-auto space-y-10">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div class="bg-zinc-900 rounded-3xl p-8">
                    <div class="text-emerald-400 text-6xl font-light">${totalCompleted}</div>
                    <div class="text-sm text-zinc-400 mt-1">Missões Concluídas</div>
                </div>
                <div class="bg-zinc-900 rounded-3xl p-8">
                    <div class="text-6xl font-light">${xp}</div>
                    <div class="text-sm text-zinc-400 mt-1">XP Acumulado</div>
                </div>
                <div class="bg-zinc-900 rounded-3xl p-8">
                    <div class="text-6xl font-light">${streak}</div>
                    <div class="text-sm text-zinc-400 mt-1">Streak Atual</div>
                </div>
                <div class="bg-zinc-900 rounded-3xl p-8">
                    <div class="text-6xl font-light">${bestStreak}</div>
                    <div class="text-sm text-zinc-400 mt-1">Melhor Streak</div>
                </div>
            </div>
            
            <div class="bg-zinc-900 rounded-3xl p-8">
                <canvas id="progressChart" class="h-80"></canvas>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    
    // Render Chart
    setTimeout(() => {
        const ctx = document.getElementById('progressChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                    datasets: [{
                        label: 'Missões Concluídas',
                        data: [4, 7, 3, 8, 5, 9, 6],
                        borderColor: '#3b82f6',
                        tension: 0.4
                    }]
                },
                options: { responsive: true, plugins: { legend: { display: false } } }
            });
        }
    }, 100);
}

function toggleFocusMode() {
    const focusModal = document.getElementById('focus-modal');
    const todayMissions = getTodayMissions().filter(m => !m.completed);
    
    if (todayMissions.length === 0) {
        alert("Todas as missões de hoje estão concluídas! 🎉");
        return;
    }
    
    // Pick first incomplete
    window.focusMissionIndex = missions.indexOf(todayMissions[0]);
    const mission = missions[window.focusMissionIndex];
    
    document.getElementById('focus-mission-title').textContent = mission.title;
    document.getElementById('focus-description').textContent = mission.description || "Mantenha o foco e complete esta missão!";
    
    focusModal.classList.remove('hidden');
    startFocusTimer();
}

let focusInterval;
function startFocusTimer() {
    let seconds = 0;
    const timerEl = document.getElementById('focus-time');
    
    if (focusInterval) clearInterval(focusInterval);
    
    focusInterval = setInterval(() => {
        seconds++;
        const min = Math.floor(seconds / 60).toString().padStart(2, '0');
        const sec = (seconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${min}:${sec}`;
    }, 1000);
}

function exitFocusMode() {
    if (focusInterval) clearInterval(focusInterval);
    document.getElementById('focus-modal').classList.add('hidden');
}

function completeFocusMission() {
    if (window.focusMissionIndex !== undefined) {
        missions[window.focusMissionIndex].completed = true;
        xp += 20; // bonus for focus mode
        checkLevelUp();
        saveData();
    }
    exitFocusMode();
    renderDashboard();
}

function requestNotifications() {
    if ("Notification" in window) {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                new Notification("Missões", {
                    body: "Notificações ativadas! Lembretes virão aqui.",
                    icon: "https://via.placeholder.com/128"
                });
            }
        });
    }
}

// Expose some functions to window for onclick handlers
window.navigateTo = navigateTo;
window.showNewMissionModal = showNewMissionModal;
window.closeModal = closeModal;
window.saveMission = saveMission;
window.toggleComplete = toggleComplete;
window.deleteMission = deleteMission;
window.editMission = editMission;
window.updatePriorityField = updatePriorityField;
window.toggleFocusMode = toggleFocusMode;
window.exitFocusMode = exitFocusMode;
window.completeFocusMission = completeFocusMission;
window.requestNotifications = requestNotifications;
window.renderCalendar = renderCalendar; // not needed
window.showDayDetail = showDayDetail;
