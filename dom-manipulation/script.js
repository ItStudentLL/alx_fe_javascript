const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", category: "Inspiration" },
  { text: "Don’t watch the clock; do what it does. Keep going.", category: "Productivity" },
  { text: "Believe you can and you're halfway there.", category: "Confidence" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

function showRandomQuote() {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }
  const idx = Math.floor(Math.random() * quotes.length);
  const q = quotes[idx];
  const text = typeof q.text === "string" ? q.text : "";
  const category = typeof q.category === "string" ? q.category : "Uncategorized";
  quoteDisplay.innerHTML = `
    <p>"${text}"</p>
    <p class="category">— ${category}</p>
  `;
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
  showRandomQuote();
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
  container.appendChild(inputText);
  container.appendChild(inputCategory);
  container.appendChild(submitBtn);
  const afterNode = quoteDisplay || document.body;
  afterNode.insertAdjacentElement("afterend", container);
}

if (newQuoteBtn) {
  newQuoteBtn.addEventListener("click", showRandomQuote);
}

createAddQuoteForm();
showRandomQuote();
