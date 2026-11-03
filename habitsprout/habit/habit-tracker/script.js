// 预设习惯数据
const DEFAULT_HABITS = [
    { id: "habit_1", name: "Water", icon: "💧" },
    { id: "habit_2", name: "Stretch", icon: "🧘‍♂️" },
    { id: "habit_3", name: "Breakfast", icon: "🥗" }
];

// 当前选中的日期
let selectedDate = '';

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取指定日期所在周的所有日期字符串数组（周日为第一天）
function getWeekDates(targetDateStr) {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const currentDay = targetDate.getDay(); // 0 (Sun) - 6 (Sat)
    
    // 找到这周的周日
    const sunday = new Date(targetDate);
    sunday.setDate(targetDate.getDate() - currentDay);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        weekDates.push(`${year}-${month}-${day}`);
    }
    return weekDates;
}

// 初始化数据
function initData() {
    if (!localStorage.getItem('habit_tracker_habits')) {
        localStorage.setItem('habit_tracker_habits', JSON.stringify(DEFAULT_HABITS));
    }
    if (!localStorage.getItem('habit_tracker_records')) {
        localStorage.setItem('habit_tracker_records', JSON.stringify({}));
    }
}

// 获取习惯列表
function getHabits() {
    return JSON.parse(localStorage.getItem('habit_tracker_habits')) || [];
}

// 获取打卡记录
function getRecords() {
    return JSON.parse(localStorage.getItem('habit_tracker_records')) || {};
}

// 保存打卡记录
function saveRecords(records) {
    localStorage.setItem('habit_tracker_records', JSON.stringify(records));
}

// 切换打卡状态
function toggleHabit(habitId) {
    const targetDate = selectedDate || getTodayString();
    const records = getRecords();
    
    if (!records[targetDate]) {
        records[targetDate] = [];
    }
    
    const index = records[targetDate].indexOf(habitId);
    if (index > -1) {
        // 已打卡，取消打卡
        records[targetDate].splice(index, 1);
    } else {
        // 未打卡，进行打卡
        records[targetDate].push(habitId);
    }
    
    saveRecords(records);
    renderApp();
}

// 计算选中日期的完成情况
function getDailyProgress() {
    const habits = getHabits();
    const records = getRecords();
    const targetDate = selectedDate || getTodayString();
    
    const totalPossible = habits.length;
    const completedCount = records[targetDate] ? records[targetDate].length : 0;
    
    return {
        completed: completedCount,
        total: totalPossible,
        percentage: totalPossible === 0 ? 0 : Math.round((completedCount / totalPossible) * 100)
    };
}

// 渲染日期
function renderDate() {
    const targetDateStr = selectedDate || getTodayString();
    const dateObj = new Date(targetDateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    
    let dateText = dateObj.toLocaleDateString('zh-CN', options);
    if (targetDateStr === getTodayString()) {
        dateText = '今天 · ' + dateText;
    }
    
    document.getElementById('currentDate').textContent = dateText;
}

// 计算选中日期所在周的完成情况（按天计算，每天全完成算1天）
function getWeeklyProgress() {
    const habits = getHabits();
    const records = getRecords();
    const targetDateStr = selectedDate || getTodayString();
    const weekDates = getWeekDates(targetDateStr);
    
    const totalDays = 7;
    let completedDays = 0;
    
    weekDates.forEach(dateStr => {
        const dayRecords = records[dateStr] || [];
        if (dayRecords.length === habits.length && habits.length > 0) {
            completedDays++;
        }
    });
    
    return {
        completed: completedDays,
        total: totalDays,
        percentage: Math.round((completedDays / totalDays) * 100)
    };
}

// 渲染进度条
function renderProgress() {
    const daily = getDailyProgress();
    const weekly = getWeeklyProgress();
    
    // 每日完成率
    document.getElementById('dailyProgressText').textContent = `${daily.completed}/${daily.total}`;
    document.getElementById('dailyProgressBar').style.width = `${daily.percentage}%`;
    
    // 每周完成率
    document.getElementById('weeklyProgressText').textContent = `${weekly.completed}/${weekly.total}`;
    document.getElementById('weeklyProgressBar').style.width = `${weekly.percentage}%`;
}

// 渲染习惯列表
function renderHabits() {
    const habits = getHabits();
    const records = getRecords();
    const targetDate = selectedDate || getTodayString();
    const targetRecords = records[targetDate] || [];
    
    const habitList = document.getElementById('habitList');
    habitList.innerHTML = '';
    
    habits.forEach(habit => {
        const isCompleted = targetRecords.includes(habit.id);
        const li = document.createElement('li');
        li.className = `habit-item ${isCompleted ? 'completed' : ''}`;
        li.onclick = () => toggleHabit(habit.id);
        
        li.innerHTML = `
            <div class="habit-info">
                <span class="habit-icon">${habit.icon}</span>
                <span class="habit-name">${habit.name}</span>
            </div>
            <div class="check-circle"></div>
        `;
        
        habitList.appendChild(li);
    });
}

// 渲染周打卡进程视图
function renderWeekView() {
    const weekView = document.getElementById('weekView');
    weekView.innerHTML = '';
    
    const targetDateStr = selectedDate || getTodayString();
    const weekDates = getWeekDates(targetDateStr);
    const today = getTodayString();
    const records = getRecords();
    const habits = getHabits();
    
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    weekDates.forEach((dateStr, index) => {
        const isToday = dateStr === today;
        const dateObj = new Date(dateStr);
        const dayNum = dateObj.getDate();
        
        // 检查这一天是否完成了所有习惯
        const dayRecords = records[dateStr] || [];
        const isCompleted = dayRecords.length === habits.length && habits.length > 0;
        const isSelected = dateStr === (selectedDate || today);
        
        const dayItem = document.createElement('div');
        dayItem.className = `day-item ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}`;
        
        // 点击切换日期
        dayItem.onclick = () => {
            selectedDate = dateStr;
            renderApp();
        };
        
        dayItem.innerHTML = `
            <span class="day-name">${dayNames[index]}</span>
            <div class="day-circle">${isCompleted ? '✓' : dayNum}</div>
        `;
        
        weekView.appendChild(dayItem);
    });
}

// 渲染整个应用
function renderApp() {
    renderDate();
    renderProgress();
    renderWeekView();
    renderHabits();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initData();
    selectedDate = getTodayString(); // 默认选中今天
    
    // 初始化日期选择器
    const datePicker = document.getElementById('datePicker');
    datePicker.value = selectedDate;
    datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            selectedDate = e.target.value;
            renderApp();
        }
    });
    
    renderApp();
});
