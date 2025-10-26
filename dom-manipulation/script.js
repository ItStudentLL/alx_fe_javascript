const quotesKey = "quotes";
const lastIndexKey = "lastViewedIndex";
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", category: "Inspiration" },
  { text: "Don’t watch the clock; do what it does. Keep going.", category: "Productivity" },
  { text: "Believe you can and you're halfway there.", category: "Confidence" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

function saveQuotes() {
  try {
    localStorage.setItem(quotesKey, JSON.stringify(quotes));
  } catch (e) {}
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(quotesKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    const valid = parsed.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
    if (valid.length) {
      quotes.splice(0, quotes.length, ...valid);
    }
  } catch (e) {}
}

function showQuoteByIndex(idx) {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    if (quoteDisplay) quoteDisplay.textContent = "No quotes available.";
    return;
  }
  if (typeof idx !== "number" || !Number.isFinite(idx) || idx < 0 || idx >= quotes.length) {
    idx = Math.floor(Math.random() * quotes.length);
  }
  const q = quotes[idx];
  const text = typeof q.text === "string" ? q.text : "";
  const category = typeof q.category === "string" ? q.category : "Uncategorized";
  if (quoteDisplay) quoteDisplay.innerHTML = `<p>"${text}"</p><p class="category">— ${category}</p>`;
  try {
    sessionStorage.setItem(lastIndexKey, String(idx));
  } catch (e) {}
}

function showRandomQuote() {
  showQuoteByIndex(Math.floor(Math.random() * (quotes.length || 1)));
}

function addQuote(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");
  if (!textInput || !categoryInput) return;
  const text = textInput.value.trim();
  const category = categoryInput.value.trim();
  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }
  quotes.push({ text, category });
  textInput.value = "";
  categoryInput.value = "";
  saveQuotes();
  showQuoteByIndex(quotes.length - 1);
}

function importFromJsonFile(event) {
  const file = event && event.target && event.target.files && event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) {
        alert("Invalid JSON format: expected an array of quotes.");
        return;
      }
      const valid = imported.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
      if (valid.length === 0) {
        alert("No valid quotes found in the file.");
        return;
      }
      quotes.push(...valid);
      saveQuotes();
      alert("Quotes imported successfully!");
      showQuoteByIndex(quotes.length - valid.length);
    } catch (err) {
      alert("Failed to import JSON: " + (err && err.message ? err.message : "unknown error"));
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

function createAddQuoteForm() {
  if (document.getElementById("dynamicAddQuoteForm")) return;
  const container = document.createElement("div");
  container.id = "dynamicAddQuoteForm";
  const inputText = document.createElement("input");
  inputText.id = "newQuoteText";
  inputText.type = "text";
  inputText.placeholder = "Enter a new quote";
  const inputCategory = document.createElement("input");
  inputCategory.id = "newQuoteCategory";
  inputCategory.type = "text";
  inputCategory.placeholder = "Enter quote category";
  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.id = "addQuote";
  submitBtn.textContent = "Add Quote";
  submitBtn.addEventListener("click", addQuote);
  [inputText, inputCategory].forEach(input => {
    input.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") addQuote(evt);
    });
  });
  const importLabel = document.createElement("label");
  importLabel.textContent = "Import JSON: ";
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.id = "importFile";
  importInput.accept = ".json,application/json";
  importInput.addEventListener("change", importFromJsonFile);
  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.id = "exportQuotes";
  exportBtn.textContent = "Export JSON";
  exportBtn.addEventListener("click", exportToJsonFile);
  container.appendChild(inputText);
  container.appendChild(inputCategory);
  container.appendChild(submitBtn);
  container.appendChild(document.createElement("br"));
  importLabel.appendChild(importInput);
  container.appendChild(importLabel);
  container.appendChild(exportBtn);
  const afterNode = quoteDisplay || document.body;
  afterNode.insertAdjacentElement("afterend", container);
}

loadQuotes();

if (newQuoteBtn) {
  newQuoteBtn.addEventListener("click", showRandomQuote);
}

createAddQuoteForm();

try {
  const last = sessionStorage.getItem(lastIndexKey);
  const idx = last !== null && last !== undefined ? parseInt(last, 10) : NaN;
  if (!Number.isFinite(idx) || idx < 0 || idx >= quotes.length) {
    showRandomQuote();
  } else {
    showQuoteByIndex(idx);
  }
} catch (e) {
  showRandomQuote();
}
