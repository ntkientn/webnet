// State Management
let rollsHistory = [];
let simulationCount = 50;
let isDetailsOpen = false;

// Statistics data per dice
let stats = {
    d1: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] },
    d2: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] },
    d3: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] }
};

// SVG Dice Face Icons Generator (Faces 1-6)
function getDiceSvg(val) {
    const pipsMap = {
        1: [[2, 2]],
        2: [[1, 1], [3, 3]],
        3: [[1, 1], [2, 2], [3, 3]],
        4: [[1, 1], [3, 1], [1, 3], [3, 3]],
        5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
        6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]]
    };
    const coords = pipsMap[val] || [];
    let pipsSvg = '';
    coords.forEach(([c, r]) => {
        const cx = c * 7;
        const cy = r * 7;
        const fill = val === 1 ? '#ef4444' : '#1e293b';
        pipsSvg += `<circle cx="${cx}" cy="${cy}" r="2.2" fill="${fill}" />`;
    });

    return `<svg class="w-6 h-6 inline-block shadow-sm rounded-md border border-slate-300" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="6" fill="#F8FAFC"/>
        ${pipsSvg}
    </svg>`;
}

// Toggle Details Collapsible
function toggleDetails() {
    isDetailsOpen = !isDetailsOpen;
    const container = document.getElementById('detailsCollapsible');
    const chevron = document.getElementById('collapseChevron');
    const btnText = document.querySelector('#collapseToggleBtn span');

    if (isDetailsOpen) {
        container.classList.remove('hidden');
        chevron.classList.add('rotate-180');
        btnText.innerText = 'Thu gọn';
    } else {
        container.classList.add('hidden');
        chevron.classList.remove('rotate-180');
        btnText.innerText = 'Xem chi tiết';
    }
}

// Handle Quick Count Presets
function setQuickCount(val) {
    simulationCount = val;
    document.getElementById('customCountInput').value = val;
    
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.className = 'count-btn py-3 rounded-xl font-bold text-sm border bg-slate-800/80 border-slate-700 hover:border-brand-500 text-slate-200 transition';
    });
    event.currentTarget.className = 'count-btn py-3 border-brand-500 bg-brand-600/20 rounded-xl font-bold text-sm border text-brand-300 transition';
}

document.getElementById('customCountInput').addEventListener('input', (e) => {
    let val = parseInt(e.target.value);
    if (val > 500) val = 500;
    if (val >= 1) simulationCount = val;
    
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.className = 'count-btn py-3 rounded-xl font-bold text-sm border bg-slate-800/80 border-slate-700 hover:border-brand-500 text-slate-200 transition';
    });
});

// Trigger Main Simulation
function triggerSimulation() {
    const btn = document.getElementById('rollBtn');
    const dice1 = document.getElementById('diceCube1');
    const dice2 = document.getElementById('diceCube2');
    const dice3 = document.getElementById('diceCube3');

    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    // Add rolling animation class
    dice1.classList.add('rolling');
    dice2.classList.add('rolling');
    dice3.classList.add('rolling');

    setTimeout(() => {
        runSimulation(simulationCount);

        dice1.classList.remove('rolling');
        dice2.classList.remove('rolling');
        dice3.classList.remove('rolling');

        const lastRoll = rollsHistory[rollsHistory.length - 1];
        setCubeFace(dice1, 'lastVal1', lastRoll.v1);
        setCubeFace(dice2, 'lastVal2', lastRoll.v2);
        setCubeFace(dice3, 'lastVal3', lastRoll.v3);

        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');

        showToast(`Đã gieo thành công ${simulationCount} lượt!`);
    }, 600);
}

function setCubeFace(element, textId, val) {
    element.className = `dice-cube show-${val}`;
    document.getElementById(textId).innerText = val;
}

// Core Simulation Engine
function runSimulation(count) {
    rollsHistory = [];
    stats = {
        d1: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] },
        d2: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] },
        d3: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] }
    };

    for (let i = 1; i <= count; i++) {
        const v1 = Math.floor(Math.random() * 6) + 1;
        const v2 = Math.floor(Math.random() * 6) + 1;
        const v3 = Math.floor(Math.random() * 6) + 1;

        stats.d1.counts[v1]++;
        stats.d2.counts[v2]++;
        stats.d3.counts[v3]++;

        const comboSorted = [v1, v2, v3].sort((a, b) => a - b).join('-');

        rollsHistory.push({
            index: i,
            v1, v2, v3,
            raw: `${v1}-${v2}-${v3}`,
            normalized: comboSorted
        });
    }

    calculateDiceRanks(stats.d1);
    calculateDiceRanks(stats.d2);
    calculateDiceRanks(stats.d3);

    renderStatsUI();
    computeCombinationsTierMatrix();
    renderLogsTable();
}

// Rank Calculation Logic (Supports Tie Ranks)
function calculateDiceRanks(diceStat) {
    const freqMap = {};
    for (let face = 1; face <= 6; face++) {
        const cnt = diceStat.counts[face];
        if (!freqMap[cnt]) freqMap[cnt] = [];
        freqMap[cnt].push(face);
    }

    const sortedFreqs = Object.keys(freqMap).map(Number).sort((a, b) => b - a);

    diceStat.top1 = sortedFreqs[0] !== undefined ? freqMap[sortedFreqs[0]] : [];
    diceStat.top2 = sortedFreqs[1] !== undefined ? freqMap[sortedFreqs[1]] : [];
    diceStat.top3 = sortedFreqs[2] !== undefined ? freqMap[sortedFreqs[2]] : [];
}

// Render Dice Breakdown UI
function renderStatsUI() {
    document.getElementById('totalRollsCount').innerText = rollsHistory.length;
    document.getElementById('rollCountBadge').innerText = rollsHistory.length;

    const renderDicePanel = (diceStat, freqContainerId, top1Id, top2Id, top3Id, colorClass) => {
        const container = document.getElementById(freqContainerId);
        container.innerHTML = '';

        const total = rollsHistory.length;

        for (let face = 1; face <= 6; face++) {
            const count = diceStat.counts[face];
            const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

            const barHtml = `
                <div class="space-y-1">
                    <div class="flex justify-between items-center text-slate-300">
                        <span class="font-medium flex items-center gap-2">
                            ${getDiceSvg(face)}
                        </span>
                        <span class="text-xs"><strong class="text-white font-bold">${count}</strong> lần (${percent}%)</span>
                    </div>
                    <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full ${colorClass} transition-all duration-500" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
            container.innerHTML += barHtml;
        }

        document.getElementById(top1Id).innerText = diceStat.top1.length > 0 ? diceStat.top1.join(', ') : '--';
        document.getElementById(top2Id).innerText = diceStat.top2.length > 0 ? diceStat.top2.join(', ') : '--';
        document.getElementById(top3Id).innerText = diceStat.top3.length > 0 ? diceStat.top3.join(', ') : '--';
    };

    renderDicePanel(stats.d1, 'freq-d1', 'top1-d1', 'top2-d1', 'top3-d1', 'bg-brand-500');
    renderDicePanel(stats.d2, 'freq-d2', 'top1-d2', 'top2-d2', 'top3-d2', 'bg-accent-cyan');
    renderDicePanel(stats.d3, 'freq-d3', 'top1-d3', 'top2-d3', 'top3-d3', 'bg-accent-emerald');
}

// Compute Deduplicated Tier Matrix
function computeCombinationsTierMatrix() {
    const highestSets = new Set();
    const highSets = new Set();
    const mediumSets = new Set();

    const d1_t1 = stats.d1.top1;
    const d1_t2 = stats.d1.top2;
    const d1_t3 = stats.d1.top3;

    const d2_t1 = stats.d2.top1;
    const d2_t2 = stats.d2.top2;
    const d2_t3 = stats.d2.top3;

    const d3_t1 = stats.d3.top1;
    const d3_t2 = stats.d3.top2;
    const d3_t3 = stats.d3.top3;

    const makeKey = (a, b, c) => [a, b, c].sort((x, y) => x - y).join('-');

    // 1. Khả Năng Cao Nhất: Top 1 XX1 × Top 1 XX2 × Top 1 XX3
    for (let a of d1_t1) {
        for (let b of d2_t1) {
            for (let c of d3_t1) {
                highestSets.add(makeKey(a, b, c));
            }
        }
    }

    // 2. Khả Năng Cao: Top 1 của 1 XX + 2 con Top 2 của 2 XX còn lại
    // TH1: XX1 (Top 1) + XX2 (Top 2) + XX3 (Top 2)
    for (let a of d1_t1) {
        for (let b of d2_t2) {
            for (let c of d3_t2) {
                const key = makeKey(a, b, c);
                if (!highestSets.has(key)) highSets.add(key);
            }
        }
    }
    // TH2: XX2 (Top 1) + XX1 (Top 2) + XX3 (Top 2)
    for (let b of d2_t1) {
        for (let a of d1_t2) {
            for (let c of d3_t2) {
                const key = makeKey(a, b, c);
                if (!highestSets.has(key)) highSets.add(key);
            }
        }
    }
    // TH3: XX3 (Top 1) + XX1 (Top 2) + XX2 (Top 2)
    for (let c of d3_t1) {
        for (let a of d1_t2) {
            for (let b of d2_t2) {
                const key = makeKey(a, b, c);
                if (!highestSets.has(key)) highSets.add(key);
            }
        }
    }

    // 3. Khả Năng Trung Bình: Top 1 của 1 XX + 2 con Top 3 của 2 XX còn lại
    // TH1: XX1 (Top 1) + XX2 (Top 3) + XX3 (Top 3)
    for (let a of d1_t1) {
        for (let b of d2_t3) {
            for (let c of d3_t3) {
                const key = makeKey(a, b, c);
                if (!highestSets.has(key) && !highSets.has(key)) mediumSets.add(key);
            }
        }
    }
    // TH2: XX2 (Top 1) + XX1 (Top 3) + XX3 (Top 3)
    for (let b of d2_t1) {
        for (let a of d1_t3) {
            for (let c of d3_t3) {
                const key = makeKey(a, b, c);
                if (!highestSets.has(key) && !highSets.has(key)) mediumSets.add(key);
            }
        }
    }
    // TH3: XX3 (Top 1) + XX1 (Top 3) + XX2 (Top 3)
    for (let c of d3_t1) {
        for (let a of d1_t3) {
            for (let b of d2_t3) {
                const key = makeKey(a, b, c);
                if (!highestSets.has(key) && !highSets.has(key)) mediumSets.add(key);
            }
        }
    }

    renderComboList('list-highest', 'count-highest', Array.from(highestSets), 'gold');
    renderComboList('list-high', 'count-high', Array.from(highSets), 'silver');
    renderComboList('list-medium', 'count-medium', Array.from(mediumSets), 'bronze');
}

// Render Combination Cards
function renderComboList(containerId, countId, combos, theme) {
    const container = document.getElementById(containerId);
    const countBadge = document.getElementById(countId);

    container.innerHTML = '';
    countBadge.innerText = `${combos.length} bộ`;

    if (combos.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-500 italic py-2">Không có bộ thỏa mãn</span>`;
        return;
    }

    const styleMap = {
        gold: 'px-4 py-2 text-lg sm:text-xl font-extrabold bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 text-amber-300 border-2 border-amber-400/50 hover:border-amber-300 shadow-md shadow-amber-500/10 rounded-2xl',
        silver: 'px-3.5 py-1.5 text-base sm:text-lg font-bold bg-gradient-to-r from-slate-400/20 to-slate-200/10 text-slate-100 border border-slate-300/40 hover:border-slate-200 rounded-xl',
        bronze: 'px-3 py-1.5 text-xs sm:text-sm font-semibold bg-amber-800/20 text-amber-400 border border-amber-700/40 hover:border-amber-500 rounded-xl'
    };

    combos.forEach(combo => {
        const tag = document.createElement('span');
        tag.className = `font-mono transition transform hover:-translate-y-0.5 flex items-center gap-1.5 ${styleMap[theme]}`;
        const iconClass = theme === 'gold' ? 'text-amber-400 text-sm' : (theme === 'silver' ? 'text-slate-300 text-xs' : 'text-amber-600 text-xs');
        tag.innerHTML = `<i class="fa-solid fa-cube ${iconClass}"></i> ${combo}`;
        container.appendChild(tag);
    });
}

// Render History Table safely
function renderLogsTable() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const displayList = [...rollsHistory].reverse();

    displayList.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/40 transition';
        tr.innerHTML = `
            <td class="py-2 px-3 text-slate-400">#${item.index}</td>
            <td class="py-2 px-3 font-bold text-brand-400">${item.v1}</td>
            <td class="py-2 px-3 font-bold text-accent-cyan">${item.v2}</td>
            <td class="py-2 px-3 font-bold text-accent-emerald">${item.v3}</td>
            <td class="py-2 px-3 text-slate-300">${item.raw}</td>
            <td class="py-2 px-3 text-accent-amber font-bold">${item.normalized}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Copy Results Function
function copyCombinations() {
    const highest = Array.from(document.querySelectorAll('#list-highest span')).map(el => el.innerText.trim()).join(', ');
    const high = Array.from(document.querySelectorAll('#list-high span')).map(el => el.innerText.trim()).join(', ');
    const medium = Array.from(document.querySelectorAll('#list-medium span')).map(el => el.innerText.trim()).join(', ');

    const text = `--- KẾT QUẢ DỰ ĐOÁN BỘ 3 SỐ ---
🥇 KHẢ NĂNG CAO NHẤT: ${highest || 'Không có'}
🥈 KHẢ NĂNG CAO: ${high || 'Không có'}
🥉 KHẢ NĂNG TRUNG BÌNH: ${medium || 'Không có'}`;

    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    showToast('Đã sao chép kết quả vào bộ nhớ tạm!');
}

// Reset State
function resetData() {
    rollsHistory = [];
    stats = {
        d1: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] },
        d2: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] },
        d3: { counts: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, top1: [], top2: [], top3: [] }
    };

    renderStatsUI();
    computeCombinationsTierMatrix();

    const tbody = document.getElementById('historyTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-500 font-sans">Bấm "THẢ XÚC XẮC NGAY" để tạo dữ liệu lượt gieo!</td></tr>`;
    }

    setCubeFace(document.getElementById('diceCube1'), 'lastVal1', 1);
    setCubeFace(document.getElementById('diceCube2'), 'lastVal2', 2);
    setCubeFace(document.getElementById('diceCube3'), 'lastVal3', 3);

    showToast('Đã xóa dữ liệu!');
}

// Helper Toast Notification
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.innerText = msg;

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
}

// Initialize on page load
window.onload = function() {
    runSimulation(50);
};
