const STORAGE_KEY = "transactions";
const GOAL_KEY = "monthlySavingsGoal";
const THEME_KEY = "mymoneyTheme";

function loadTransactions() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved.filter(item => item && typeof item === "object") : [];
    } catch (error) {
        return [];
    }
}

let transactions = loadTransactions();
let activeFilter = "all";

const form = document.getElementById("transactionForm");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const transactionDate = document.getElementById("transactionDate");
const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const transactionList = document.getElementById("transactionList");
const clearAll = document.getElementById("clearAll");
const searchInput = document.getElementById("searchInput");
const categoryIcons = {
    "Gaji": "<rect x=\"3\" y=\"7\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"M8 7V5h8v2m-5 5h2m-7 0h1m8 0h1\"/>",
    "Uang Jajan": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M15.5 9c-.5-1-1.6-1.5-3.2-1.5-1.7 0-2.8.8-2.8 1.8s1.1 1.6 2.8 2.1 2.7 1 2.7 2.1-1.1 2-2.9 2c-1.5 0-2.6-.5-3.1-1.5M12 6v12\"/>",
    "Bonus": "<path d=\"m12 3 2.2 5.2 5.6.5-4.3 3.6 1.3 5.5-4.8-3-4.8 3 1.3-5.5-4.3-3.6 5.6-.5L12 3Z\"/>",
    "Hadiah": "<path d=\"M4 10h16v11H4zM3 6h18v4H3zM12 6v15m0-15H8.5a2.5 2.5 0 1 1 2.4-3.2L12 6Zm0 0h3.5a2.5 2.5 0 1 0-2.4-3.2L12 6Z\"/>",
    "Freelance": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M8 5V3h8v2M3 11h18m-11 0v2h4v-2\"/>",
    "Investasi": "<path d=\"M3 17 9 11l4 4 8-9m-6 0h6v6\"/>",
    "Tabungan": "<path d=\"M4 10h16v10H4zM6 10V7a6 6 0 0 1 12 0v3m-6 4v2m-4-6h.01m8 0h.01\"/>",
    "Makanan": "<path d=\"M7 3v7m-3-7v4a3 3 0 0 0 6 0V3m-3 7v11m10-18v18m0-18c-2 2-3 5-3 8h3\"/>",
    "Transportasi": "<path d=\"M5 17h14l-1-9a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2l-1 9Zm0 0v2m14-2v2M7 13h.01M17 13h.01M7 17l-1 2m11-2 1 2M8 6l1-3h6l1 3\"/>",
    "Pendidikan": "<path d=\"m3 9 9-5 9 5-9 5-9-5Zm4 2v5c3 3 7 3 10 0v-5m5-2v7\"/>",
    "Hiburan": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"m10 9 5 3-5 3V9Z\"/>",
    "Belanja": "<path d=\"M5 8h14l1 13H4L5 8Zm4 0V6a3 3 0 0 1 6 0v2\"/>",
    "Tagihan": "<path d=\"M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h3\"/>",
    "Kesehatan": "<path d=\"M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z\"/><path d=\"M9 12h6m-3-3v6\"/>",
    "Lainnya": "<circle cx=\"5\" cy=\"12\" r=\"1\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/>"
};
const categoriesByType = {
    income: ["Gaji", "Uang Jajan", "Bonus", "Hadiah", "Freelance", "Investasi", "Tabungan", "Lainnya"],
    expense: ["Makanan", "Transportasi", "Pendidikan", "Hiburan", "Belanja", "Tagihan", "Kesehatan", "Lainnya"]
};
const chartColors = ["#62b996", "#e58b81", "#779cc4", "#dfb763", "#a590c9", "#5faeb0", "#d48ba8", "#9aa8ad"];

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

function localDateISO(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseTransactionDate(value) {
    if (!value) return null;
    const text = String(value);
    const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    const localMatch = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/);
    if (localMatch) return new Date(Number(localMatch[3]), Number(localMatch[2]) - 1, Number(localMatch[1]));
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
    const date = parseTransactionDate(value);
    return date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date) : String(value || "Tanggal tidak diketahui");
}

function iconMarkup(categoryName, className = "") {
    const paths = categoryIcons[categoryName] || categoryIcons.Lainnya;
    return `<svg${className ? ` class="${className}"` : ""} viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
}

function updateCategoryOptions() {
    const options = categoriesByType[type.value] || categoriesByType.expense;
    category.replaceChildren();
    options.forEach(categoryName => {
        const option = document.createElement("option");
        option.value = categoryName;
        option.textContent = categoryName;
        category.appendChild(option);
    });
    updateSelectedCategoryIcon();
}

function updateSelectedCategoryIcon() {
    document.getElementById("selectedCategoryIcon").innerHTML = iconMarkup(category.value);
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function isCurrentMonth(transaction) {
    const date = parseTransactionDate(transaction.date);
    const now = new Date();
    return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function updateDashboard() {
    let income = 0;
    let expense = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach(transaction => {
        const value = Number(transaction.amount) || 0;
        if (transaction.type === "income") income += value;
        else expense += value;
        if (isCurrentMonth(transaction)) {
            if (transaction.type === "income") monthlyIncome += value;
            else monthlyExpense += value;
        }
    });

    totalBalance.textContent = formatRupiah(income - expense);
    totalIncome.textContent = formatRupiah(income);
    totalExpense.textContent = formatRupiah(expense);
    document.getElementById("monthlyIncome").textContent = formatRupiah(monthlyIncome);
    document.getElementById("monthlyExpense").textContent = formatRupiah(monthlyExpense);
    document.getElementById("chartTotal").textContent = formatRupiah(monthlyExpense);

    const monthName = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date());
    document.getElementById("monthLabel").textContent = monthName;
    document.getElementById("currentDate").textContent = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()).toUpperCase();
    document.getElementById("balanceNote").textContent = income - expense >= 0 ? "Keuanganmu berada di jalur positif" : "Atur pengeluaran untuk kembali seimbang";

    updateMonthlyChart();
    updateBreakdown();
    updateSavingsGoal(monthlyIncome, monthlyExpense);
    displayTransactions();
}

function updateMonthlyChart() {
    const chart = document.getElementById("monthlyChart");
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeks = [
        { label: "1–7", start: 1, end: 7, income: 0, expense: 0 },
        { label: "8–14", start: 8, end: 14, income: 0, expense: 0 },
        { label: "15–21", start: 15, end: 21, income: 0, expense: 0 },
        { label: "22–" + lastDay, start: 22, end: lastDay, income: 0, expense: 0 }
    ];
    transactions.forEach(transaction => {
        const date = parseTransactionDate(transaction.date);
        if (!date || date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return;
        const week = weeks.find(item => date.getDate() >= item.start && date.getDate() <= item.end);
        if (week) week[transaction.type === "income" ? "income" : "expense"] += Number(transaction.amount) || 0;
    });
    const maximum = Math.max(1, ...weeks.flatMap(week => [week.income, week.expense]));
    chart.innerHTML = weeks.map(week => {
        const incomeHeight = week.income ? Math.max(4, week.income / maximum * 82) : 3;
        const expenseHeight = week.expense ? Math.max(4, week.expense / maximum * 82) : 3;
        return `<div class="week-column" aria-label="Minggu ${week.label}: pemasukan ${formatRupiah(week.income)}, pengeluaran ${formatRupiah(week.expense)}"><div class="bar-pair"><span class="chart-bar" style="height:${incomeHeight}px" title="Pemasukan ${formatRupiah(week.income)}"></span><span class="chart-bar expense-bar" style="height:${expenseHeight}px" title="Pengeluaran ${formatRupiah(week.expense)}"></span></div><span class="week-label">${week.label}</span></div>`;
    }).join("");
}

function updateBreakdown() {
    const categoryBreakdown = document.getElementById("categoryBreakdown");
    const chart = document.getElementById("spendingChart");
    const empty = document.getElementById("chartEmpty");
    const totals = {};
    transactions.forEach(transaction => {
        if (!isCurrentMonth(transaction) || transaction.type === "income") return;
        const name = transaction.category || "Lainnya";
        totals[name] = (totals[name] || 0) + (Number(transaction.amount) || 0);
    });
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const grandTotal = entries.reduce((sum, entry) => sum + entry[1], 0);
    if (!grandTotal) {
        chart.style.background = "conic-gradient(#e9eef0 0 100%)";
        categoryBreakdown.innerHTML = "";
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";
    let position = 0;
    const segments = entries.map((entry, index) => {
        const start = position;
        position += entry[1] / grandTotal * 100;
        return `${chartColors[index % chartColors.length]} ${start}% ${position}%`;
    });
    chart.style.background = `conic-gradient(${segments.join(",")})`;
    categoryBreakdown.innerHTML = entries.slice(0, 4).map(([name, value], index) => `<div class="legend-item"><span class="legend-name"><i class="legend-swatch" style="background:${chartColors[index % chartColors.length]}"></i>${escapeHTML(name)}</span><span class="legend-value">${formatRupiah(value)}</span></div>`).join("");
}

function updateSavingsGoal(monthlyIncome, monthlyExpense) {
    const goalInput = document.getElementById("goalAmount");
    const savedGoal = Number(localStorage.getItem(GOAL_KEY));
    const goal = Number(goalInput.value) || savedGoal || 1000000;
    if (!goalInput.value) goalInput.value = goal;
    const savedThisMonth = Math.max(0, monthlyIncome - monthlyExpense);
    const percentage = Math.min(100, savedThisMonth / goal * 100);
    document.getElementById("goalProgress").style.width = `${percentage}%`;
    document.getElementById("goalProgressText").textContent = `${formatRupiah(savedThisMonth)} terkumpul dari target ${formatRupiah(goal)} (${Math.floor(percentage)}%).`;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function displayTransactions() {
    transactionList.replaceChildren();
    const query = searchInput.value.trim().toLocaleLowerCase("id-ID");
    const filtered = transactions.slice().reverse().filter(transaction => {
        const matchesType = activeFilter === "all" || transaction.type === activeFilter;
        const matchesSearch = `${transaction.description || ""} ${transaction.category || ""}`.toLocaleLowerCase("id-ID").includes(query);
        return matchesType && matchesSearch;
    });

    if (filtered.length === 0) {
        const noTransactions = transactions.length === 0;
        const title = noTransactions ? "Belum ada transaksi" : "Transaksi tidak ditemukan";
        const message = noTransactions ? "Mulai catat pemasukan atau pengeluaran pertamamu." : "Coba kata kunci atau filter yang berbeda.";
        transactionList.innerHTML = `<div class="empty-state"><span class="empty-icon" aria-hidden="true">${noTransactions ? "＋" : "⌕"}</span><strong>${title}</strong><p>${message}</p></div>`;
        return;
    }

    filtered.forEach(transaction => {
        const isIncome = transaction.type === "income";
        const categoryName = transaction.category || "Lainnya";
        const item = document.createElement("article");
        item.className = "transaction";
        const icon = document.createElement("span");
        icon.className = "category-icon";
        icon.style.setProperty("--icon-bg", isIncome ? "var(--green-soft)" : "var(--red-soft)");
        icon.style.setProperty("--icon-color", isIncome ? "var(--green)" : "var(--red)");
        icon.innerHTML = iconMarkup(categoryName);
        icon.setAttribute("aria-hidden", "true");
        const info = document.createElement("div");
        info.className = "transaction-info";
        const name = document.createElement("h4");
        name.textContent = transaction.description || "Transaksi";
        const detail = document.createElement("p");
        detail.textContent = `${categoryName} · ${formatDate(transaction.date)}`;
        info.append(name, detail);
        const right = document.createElement("div");
        right.className = "transaction-right";
        const price = document.createElement("span");
        price.className = `transaction-amount ${isIncome ? "plus" : "minus"}`;
        price.textContent = `${isIncome ? "+" : "−"} ${formatRupiah(transaction.amount)}`;
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.setAttribute("aria-label", `Hapus transaksi ${transaction.description || ""}`);
        deleteButton.title = "Hapus transaksi";
        deleteButton.innerHTML = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3\"/></svg>";
        deleteButton.addEventListener("click", () => deleteTransaction(transaction.id));
        right.append(price, deleteButton);
        item.append(icon, info, right);
        transactionList.appendChild(item);
    });
}

function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveData();
    updateDashboard();
}

form.addEventListener("submit", event => {
    event.preventDefault();
    const value = Number(amount.value);
    if (!description.value.trim() || !Number.isSafeInteger(value) || value <= 0) {
        alert("Masukkan nama dan jumlah uang yang valid!");
        return;
    }
    transactions.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        description: description.value.trim(),
        amount: value,
        type: type.value,
        category: category.value,
        date: transactionDate.value || localDateISO()
    });
    saveData();
    form.reset();
    transactionDate.value = localDateISO();
    setTransactionType("expense");
    updateDashboard();
});

function setTransactionType(nextType) {
    type.value = nextType;
    document.querySelectorAll(".type-option").forEach(button => {
        const selected = button.dataset.type === nextType;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
    updateCategoryOptions();
}

document.querySelectorAll(".type-option").forEach(button => {
    button.addEventListener("click", () => setTransactionType(button.dataset.type));
});
category.addEventListener("change", updateSelectedCategoryIcon);
searchInput.addEventListener("input", displayTransactions);
document.querySelectorAll(".filter-tab").forEach(button => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll(".filter-tab").forEach(tab => {
            const selected = tab === button;
            tab.classList.toggle("active", selected);
            tab.setAttribute("aria-pressed", String(selected));
        });
        displayTransactions();
    });
});

clearAll.addEventListener("click", () => {
    if (transactions.length === 0) {
        alert("Belum ada transaksi untuk dihapus.");
        return;
    }
    if (confirm("Yakin ingin menghapus semua transaksi?")) {
        transactions = [];
        saveData();
        updateDashboard();
    }
});

const goalInput = document.getElementById("goalAmount");
goalInput.addEventListener("change", () => {
    const goal = Number(goalInput.value);
    if (!Number.isSafeInteger(goal) || goal <= 0) {
        goalInput.value = Number(localStorage.getItem(GOAL_KEY)) || 1000000;
        return;
    }
    localStorage.setItem(GOAL_KEY, String(goal));
    updateDashboard();
});

const themeToggle = document.getElementById("themeToggle");
function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    themeToggle.setAttribute("aria-label", isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    themeToggle.innerHTML = isDark
        ? "<svg viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42\"/></svg>"
        : "<svg viewBox=\"0 0 24 24\"><path d=\"M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z\"/></svg>";
}
applyTheme(localStorage.getItem(THEME_KEY));
themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
});

transactionDate.value = localDateISO();
setTransactionType("expense");
updateDashboard();
