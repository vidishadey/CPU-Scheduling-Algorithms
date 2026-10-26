
const ALGO_INFO = {
    'fcfs': {
        name: 'FCFS (First Come First Serve)',
        type: 'Non-Preemptive',
        desc: 'Processes are executed in order of arrival.'
    },
    'sjf': {
        name: 'SJF Non-Preemptive',
        type: 'Non-Preemptive',
        desc: 'The process with the shortest burst time is selected first.'
    },
    'srtf': {
        name: 'SRTF (Shortest Remaining Time First)',
        type: 'Preemptive',
        desc: 'The process with the shortest remaining time is selected.'
    },
    'rr': {
        name: 'Round Robin',
        type: 'Preemptive',
        desc: 'Each process gets CPU time according to the time quantum.'
    },
    'priority-np': {
        name: 'Priority Non-Preemptive',
        type: 'Non-Preemptive',
        desc: 'The available process with the highest priority is selected.'
    },
    'priority-p': {
        name: 'Priority Preemptive',
        type: 'Preemptive',
        desc: 'The process with the highest priority can interrupt the current process.'
    }
};

let currentAlgorithm = 'fcfs';

// Standard textbook sample dataset for instant college viva demo
const SAMPLE_PROCESSES = [
    { id: 1, arrival: 0, burst: 5, priority: 2 },
    { id: 2, arrival: 1, burst: 3, priority: 1 },
    { id: 3, arrival: 2, burst: 4, priority: 3 },
    { id: 4, arrival: 4, burst: 2, priority: 4 }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupProcessRows(4, SAMPLE_PROCESSES);
    setupEventListeners();
});

function setupEventListeners() {
    // Add processes button
    document.getElementById('btn-add-processes').addEventListener('click', () => {
        const count = parseInt(document.getElementById('num-processes').value, 10);
        if (isNaN(count) || count < 1) {
            alert('Please enter a valid number of processes (at least 1).');
            return;
        }
        setupProcessRows(count);
    });

    // Load example data button
    document.getElementById('btn-load-example').addEventListener('click', () => {
        document.getElementById('num-processes').value = SAMPLE_PROCESSES.length;
        setupProcessRows(SAMPLE_PROCESSES.length, SAMPLE_PROCESSES);
    });

    // Algorithm selection buttons
    const algoButtons = document.querySelectorAll('.btn-algo');
    algoButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            algoButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAlgorithm = btn.getAttribute('data-algo');

            // Show or hide Time Quantum box
            const quantumBox = document.getElementById('quantum-container');
            if (currentAlgorithm === 'rr') {
                quantumBox.style.display = 'inline-flex';
            } else {
                quantumBox.style.display = 'none';
            }
        });
    });

    // Run Scheduler button
    document.getElementById('btn-run').addEventListener('click', runScheduler);

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', resetAll);
}

/**
 * Dynamically generate process input rows
 */
function setupProcessRows(count, defaultData = null) {
    const tbody = document.getElementById('process-table-body');
    tbody.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        const pid = i + 1;

        let arrival = i;
        let burst = Math.floor(Math.random() * 5) + 2;
        let priority = Math.floor(Math.random() * 4) + 1;

        if (defaultData && defaultData[i]) {
            arrival = defaultData[i].arrival;
            burst = defaultData[i].burst;
            priority = defaultData[i].priority;
        }

        tr.innerHTML = `
            <td><strong>P${pid}</strong></td>
            <td><input type="number" class="input-at" min="0" value="${arrival}" data-pid="${pid}"></td>
            <td><input type="number" class="input-bt" min="1" value="${burst}" data-pid="${pid}"></td>
            <td><input type="number" class="input-pr" min="1" value="${priority}" data-pid="${pid}"></td>
        `;
        tbody.appendChild(tr);
    }
}

/**
 * Read processes from HTML input table
 */
function getProcessesFromTable() {
    const rows = document.querySelectorAll('#process-table-body tr');
    const processes = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const atInput = row.querySelector('.input-at');
        const btInput = row.querySelector('.input-bt');
        const prInput = row.querySelector('.input-pr');

        const pid = parseInt(atInput.getAttribute('data-pid'), 10);
        const arrival = parseInt(atInput.value, 10);
        const burst = parseInt(btInput.value, 10);
        const priority = parseInt(prInput.value, 10);

        if (isNaN(arrival) || arrival < 0) {
            alert(`Please enter a valid Arrival Time for P${pid} (>= 0).`);
            return null;
        }
        if (isNaN(burst) || burst <= 0) {
            alert(`Please enter a valid Burst Time for P${pid} (> 0).`);
            return null;
        }
        if (isNaN(priority) || priority < 0) {
            alert(`Please enter a valid Priority for P${pid} (>= 0).`);
            return null;
        }

        processes.push({
            id: pid,
            arrival: arrival,
            burst: burst,
            priority: priority,
            remaining: burst,
            completion: 0,
            turnaround: 0,
            waiting: 0
        });
    }

    return processes;
}

/**
 * Main Run Scheduler Handler
 */
function runScheduler() {
    const processes = getProcessesFromTable();
    if (!processes || processes.length === 0) return;

    const n = processes.length;
    let scheduleResult = null;

    if (currentAlgorithm === 'fcfs') {
        scheduleResult = runFCFS(processes, n);
    } else if (currentAlgorithm === 'sjf') {
        scheduleResult = runSJF(processes, n);
    } else if (currentAlgorithm === 'srtf') {
        scheduleResult = runSRTF(processes, n);
    } else if (currentAlgorithm === 'rr') {
        const quantumInput = document.getElementById('time-quantum');
        const quantum = parseInt(quantumInput.value, 10);
        if (isNaN(quantum) || quantum <= 0) {
            alert('Please enter a valid Time Quantum (> 0).');
            return;
        }
        scheduleResult = runRoundRobin(processes, n, quantum);
    } else if (currentAlgorithm === 'priority-np') {
        scheduleResult = runPriorityNonPreemptive(processes, n);
    } else if (currentAlgorithm === 'priority-p') {
        scheduleResult = runPriorityPreemptive(processes, n);
    }

    if (scheduleResult) {
        displayResults(scheduleResult.processes, scheduleResult.gantt);
        updateAlgorithmInfo(currentAlgorithm);
        const resultsSection = document.getElementById('results-section');
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}


function runFCFS(p, n) {

    p.sort((a, b) => a.arrival - b.arrival || a.id - b.id);

    let time = 0;
    const gantt = [];

    for (let i = 0; i < n; i++) {
        if (time < p[i].arrival) {

            gantt.push({
                id: 'IDLE',
                start: time,
                end: p[i].arrival
            });
            time = p[i].arrival;
        }

        const start = time;
        time = time + p[i].burst;

        p[i].completion = time;
        p[i].turnaround = p[i].completion - p[i].arrival;
        p[i].waiting = p[i].turnaround - p[i].burst;

        gantt.push({
            id: p[i].id,
            start: start,
            end: time
        });
    }


    p.sort((a, b) => a.id - b.id);

    return { processes: p, gantt: gantt };
}


function runSJF(p, n) {
    let time = 0;
    let completed = 0;
    const done = new Array(n).fill(0);
    const gantt = [];

    while (completed < n) {
        let index = -1;
        let smallest = 999999;

        for (let i = 0; i < n; i++) {
            if (done[i] === 0 && p[i].arrival <= time) {
                if (p[i].burst < smallest) {
                    smallest = p[i].burst;
                    index = i;
                }
            }
        }

        if (index === -1) {
            // CPU Idle
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;
        } else {
            const start = time;
            time = time + p[index].burst;

            p[index].completion = time;
            p[index].turnaround = p[index].completion - p[index].arrival;
            p[index].waiting = p[index].turnaround - p[index].burst;

            done[index] = 1;
            completed++;

            gantt.push({
                id: p[index].id,
                start: start,
                end: time
            });
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}


function runSRTF(p, n) {
    let time = 0;
    let completed = 0;
    const gantt = [];

    for (let i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
    }

    while (completed < n) {
        let index = -1;
        let smallest = 999999;

        for (let i = 0; i < n; i++) {
            if (p[i].arrival <= time && p[i].remaining > 0) {
                if (p[i].remaining < smallest) {
                    smallest = p[i].remaining;
                    index = i;
                }
            }
        }

        if (index === -1) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;
        } else {
            const currentPid = p[index].id;
            if (gantt.length > 0 && gantt[gantt.length - 1].id === currentPid) {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: currentPid, start: time, end: time + 1 });
            }

            p[index].remaining--;
            time++;

            if (p[index].remaining === 0) {
                p[index].completion = time;
                p[index].turnaround = p[index].completion - p[index].arrival;
                p[index].waiting = p[index].turnaround - p[index].burst;
                completed++;
            }
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// 4. Round Robin - Exact C++ Logic
// ==========================================================
function runRoundRobin(p, n, quantum) {
    const queue = [];
    const added = new Array(n).fill(0);
    const gantt = [];
    let time = 0;
    let completed = 0;

    for (let i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
        added[i] = 0;
    }

    // Add processes with arrival == 0
    for (let i = 0; i < n; i++) {
        if (p[i].arrival === 0) {
            queue.push(i);
            added[i] = 1;
        }
    }

    while (completed < n) {
        if (queue.length === 0) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;

            for (let i = 0; i < n; i++) {
                if (added[i] === 0 && p[i].arrival <= time) {
                    queue.push(i);
                    added[i] = 1;
                }
            }
            continue;
        }

        const index = queue.shift();
        const run = (p[index].remaining > quantum) ? quantum : p[index].remaining;
        const start = time;

        for (let i = 0; i < run; i++) {
            time++;
            p[index].remaining--;

            // Check newly arrived processes during execution
            for (let j = 0; j < n; j++) {
                if (added[j] === 0 && p[j].arrival <= time) {
                    queue.push(j);
                    added[j] = 1;
                }
            }
        }

        gantt.push({
            id: p[index].id,
            start: start,
            end: time
        });

        if (p[index].remaining === 0) {
            p[index].completion = time;
            p[index].turnaround = p[index].completion - p[index].arrival;
            p[index].waiting = p[index].turnaround - p[index].burst;
            completed++;
        } else {
            queue.push(index);
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// 5. Priority Non-Preemptive - Exact C++ Logic
// ==========================================================
function runPriorityNonPreemptive(p, n) {
    let time = 0;
    let completed = 0;
    const done = new Array(n).fill(0);
    const gantt = [];

    while (completed < n) {
        let index = -1;
        let bestPriority = 999999;

        for (let i = 0; i < n; i++) {
            if (done[i] === 0 && p[i].arrival <= time) {
                if (p[i].priority < bestPriority) {
                    bestPriority = p[i].priority;
                    index = i;
                }
            }
        }

        if (index === -1) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;
        } else {
            const start = time;
            time = time + p[index].burst;

            p[index].completion = time;
            p[index].turnaround = p[index].completion - p[index].arrival;
            p[index].waiting = p[index].turnaround - p[index].burst;

            done[index] = 1;
            completed++;

            gantt.push({
                id: p[index].id,
                start: start,
                end: time
            });
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// 6. Priority Preemptive - Exact C++ Logic
// ==========================================================
function runPriorityPreemptive(p, n) {
    let time = 0;
    let completed = 0;
    const gantt = [];

    for (let i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
    }

    while (completed < n) {
        let index = -1;
        let bestPriority = 999999;

        for (let i = 0; i < n; i++) {
            if (p[i].arrival <= time && p[i].remaining > 0) {
                if (p[i].priority < bestPriority) {
                    bestPriority = p[i].priority;
                    index = i;
                }
            }
        }

        if (index === -1) {
            if (gantt.length > 0 && gantt[gantt.length - 1].id === 'IDLE') {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1 });
            }
            time++;
        } else {
            const currentPid = p[index].id;
            if (gantt.length > 0 && gantt[gantt.length - 1].id === currentPid) {
                gantt[gantt.length - 1].end++;
            } else {
                gantt.push({ id: currentPid, start: time, end: time + 1 });
            }

            p[index].remaining--;
            time++;

            if (p[index].remaining === 0) {
                p[index].completion = time;
                p[index].turnaround = p[index].completion - p[index].arrival;
                p[index].waiting = p[index].turnaround - p[index].burst;
                completed++;
            }
        }
    }

    p.sort((a, b) => a.id - b.id);
    return { processes: p, gantt: gantt };
}

// ==========================================================
// Results Display and Gantt Chart Rendering
// ==========================================================
function displayResults(processes, gantt) {
    const tbody = document.getElementById('results-table-body');
    tbody.innerHTML = '';

    let totalWT = 0;
    let totalTAT = 0;
    const n = processes.length;

    processes.forEach(p => {
        totalWT += p.waiting;
        totalTAT += p.turnaround;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>P${p.id}</strong></td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>${p.priority}</td>
            <td>${p.completion}</td>
            <td>${p.turnaround}</td>
            <td>${p.waiting}</td>
        `;
        tbody.appendChild(tr);
    });

    const avgWT = (totalWT / n).toFixed(2);
    const avgTAT = (totalTAT / n).toFixed(2);

    document.getElementById('avg-wt-value').textContent = avgWT;
    document.getElementById('avg-tat-value').textContent = avgTAT;

    renderGanttChart(gantt);
}

function renderGanttChart(gantt) {
    const wrapper = document.getElementById('gantt-chart-wrapper');
    wrapper.innerHTML = '';

    if (!gantt || gantt.length === 0) return;

    const chart = document.createElement('div');
    chart.className = 'gantt-chart';

    // Calculate total duration for proportional widths
    const totalDuration = gantt[gantt.length - 1].end - gantt[0].start;

    gantt.forEach((block, idx) => {
        const duration = block.end - block.start;
        const blockElem = document.createElement('div');
        blockElem.className = 'gantt-block';


        if (block.id === 'IDLE') {
            blockElem.classList.add('pid-idle');
            blockElem.textContent = 'Idle';
        } else {
            const colorIndex = ((block.id - 1) % 8) + 1;
            blockElem.classList.add(`pid-${colorIndex}`);
            blockElem.textContent = `P${block.id}`;
        }


        blockElem.style.flex = `${duration} 0 ${Math.max(duration * 24, 40)}px`;


        if (idx === 0) {
            const startMarker = document.createElement('span');
            startMarker.className = 'gantt-time-start';
            startMarker.textContent = block.start;
            blockElem.appendChild(startMarker);
        }

        const endMarker = document.createElement('span');
        endMarker.className = 'gantt-time-end';
        endMarker.textContent = block.end;
        blockElem.appendChild(endMarker);

        chart.appendChild(blockElem);
    });

    wrapper.appendChild(chart);
}


function updateAlgorithmInfo(algoKey) {
    const info = ALGO_INFO[algoKey] || ALGO_INFO['fcfs'];
    document.getElementById('info-algo-name').textContent = info.name;
    document.getElementById('info-algo-type').textContent = info.type;
    document.getElementById('info-algo-desc').textContent = info.desc;
}



function resetAll() {
    document.getElementById('num-processes').value = 4;
    setupProcessRows(4);


    const algoButtons = document.querySelectorAll('.btn-algo');
    algoButtons.forEach(b => b.classList.remove('active'));
    algoButtons[0].classList.add('active');
    currentAlgorithm = 'fcfs';

    // Hide quantum
    const quantumBox = document.getElementById('quantum-container');
    quantumBox.style.display = 'none';
    document.getElementById('time-quantum').value = 2;

    // Hide results section and clear Gantt
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('results-table-body').innerHTML = '';
    document.getElementById('gantt-chart-wrapper').innerHTML = '';
    document.getElementById('avg-wt-value').textContent = '0.00';
    document.getElementById('avg-tat-value').textContent = '0.00';

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
