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

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = quotes;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }
  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }
  const idx = Math.floor(Math.random() * filteredQuotes.length);
  const q = filteredQuotes[idx];
  quoteDisplay.innerHTML = `<p>"${q.text}"</p><p>— ${q.category}</p>`;
  sessionStorage.setItem("lastQuote", JSON.stringify(q));
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  showRandomQuote();
}

function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert('Quotes imported successfully!');
  };
  fileReader.readAsText(event.target.files[0]);
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
  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter && categories.includes(savedFilter)) {
    categoryFilter.value = savedFilter;
  }
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("selectedCategory", selected);
  showRandomQuote();
}

async function syncWithServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error("Failed to fetch server data.");
    const serverData = await response.json();

    const serverQuotes = serverData.slice(0, 5).map((item, i) => ({
      text: item.title,
      category: "Server"
    }));

    const combinedQuotes = [...quotes];
    let newCount = 0;

    serverQuotes.forEach(sq => {
      if (!combinedQuotes.some(lq => lq.text === sq.text)) {
        combinedQuotes.push(sq);
        newCount++;
      }
    });

    quotes = combinedQuotes;
    saveQuotes();
    populateCategories();

    if (newCount > 0) {
      syncStatus.textContent = `${newCount} new quotes synced from server.`;
    } else {
      syncStatus.textContent = "No new updates from server.";
    }

    setTimeout(() => { syncStatus.textContent = ""; }, 4000);
  } catch (error) {
    syncStatus.textContent = "Sync failed. Please check your connection.";
    setTimeout(() => { syncStatus.textContent = ""; }, 4000);
  }
}

if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);
document.getElementById("addQuote").addEventListener("click", addQuote);

populateCategories();
showRandomQuote();

const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) {
  const q = JSON.parse(lastQuote);
  quoteDisplay.innerHTML = `<p>"${q.text}"</p><p>— ${q.category}</p>`;
}

syncWithServer();
setInterval(syncWithServer, 15000);
