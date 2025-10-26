let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", category: "Inspiration" },
  { text: "Don’t watch the clock; do what it does. Keep going.", category: "Productivity" },
  { text: "Believe you can and you're halfway there.", category: "Confidence" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const syncStatus = document.getElementById("syncStatus");
const conflictList = document.getElementById("conflictList");

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  const saved = localStorage.getItem("selectedCategory");
  if (saved && (saved === "all" || categories.includes(saved))) categoryFilter.value = saved;
}

function showRandomQuote() {
  const selected = categoryFilter.value || "all";
  let filtered = quotes;
  if (selected !== "all") filtered = quotes.filter(q => q.category === selected);
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }
  const idx = Math.floor(Math.random() * filtered.length);
  const q = filtered[idx];
  quoteDisplay.innerHTML = `<p>"${q.text}"</p><p>— ${q.category}</p>`;
  try { sessionStorage.setItem("lastQuote", JSON.stringify(q)); } catch (e) {}
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }
  const existing = quotes.find(q => q.text === text);
  if (existing) {
    existing.category = category;
  } else {
    quotes.push({ text, category });
  }
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  showRandomQuote();
  postQuoteToServer({ text, category }).catch(()=>{});
}

function importFromJsonFile(event) {
  const file = event && event.target && event.target.files && event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        alert("Invalid JSON format: expected an array.");
        return;
      }
      const valid = imported.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
      if (valid.length === 0) {
        alert("No valid quotes found.");
        return;
      }
      valid.forEach(v => {
        const existing = quotes.find(q => q.text === v.text);
        if (existing) {
          existing.category = v.category;
        } else {
          quotes.push(v);
        }
      });
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Import failed.");
    } finally {
      try { event.target.value = ""; } catch (e) {}
    }
  };
  reader.readAsText(file);
}

function exportToJsonFile() {
  try {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Export failed.");
  }
}

async function fetchQuotesFromServer() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  if (!res.ok) throw new Error("fetch failed");
  const data = await res.json();
  return data.slice(0, 10).map(item => ({ text: item.title, category: "Server", serverId: item.id }));
}

async function postQuoteToServer(q) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: q.text, body: q.category })
    });
  } catch (e) {}
}

async function syncQuotes() {
  conflictList.textContent = "";
  syncStatus.textContent = "Syncing with server...";
  try {
    const serverQuotes = await fetchQuotesFromServer();
    const serverMap = new Map();
    serverQuotes.forEach(s => serverMap.set(s.text, s));
    const localMap = new Map();
    quotes.forEach(l => localMap.set(l.text, l));

    let updated = 0;
    let added = 0;
    let conflicts = [];

    serverQuotes.forEach(sq => {
      const local = localMap.get(sq.text);
      if (!local) {
        quotes.push({ text: sq.text, category: sq.category });
        added++;
      } else {
        if (local.category !== sq.category) {
          local.category = sq.category;
          conflicts.push(sq.text);
          updated++;
        }
      }
    });

    const serverTexts = new Set(serverQuotes.map(s => s.text));
    const localsNotOnServer = quotes.filter(l => !serverTexts.has(l.text));
    for (const l of localsNotOnServer) {
      try { await postQuoteToServer(l); } catch (e) {}
    }

    saveQuotes();
    populateCategories();

    if (added + updated > 0) {
      syncStatus.textContent = `${added} added, ${updated} updated from server.`;
    } else {
      syncStatus.textContent = "No updates from server.";
    }

    if (conflicts.length) {
      conflictList.innerHTML = "Resolved conflicts:<br>" + conflicts.map(t => `<div>${t}</div>`).join("");
    }
  } catch (err) {
    syncStatus.textContent = "Sync failed.";
  } finally {
    setTimeout(()=>{ syncStatus.textContent = ""; }, 5000);
  }
}

if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);
const addBtn = document.getElementById("addQuote");
if (addBtn) addBtn.addEventListener("click", addQuote);

populateCategories();

const last = sessionStorage.getItem("lastQuote");
if (last) {
  try {
    const q = JSON.parse(last);
    quoteDisplay.innerHTML = `<p>"${q.text}"</p><p>— ${q.category}</p>`;
  } catch (e) { showRandomQuote(); }
} else {
  showRandomQuote();
}

syncQuotes();
setInterval(syncQuotes, 15000);
