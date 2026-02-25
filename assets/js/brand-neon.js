document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll(".site-brand h1[data-neon]");
  targets.forEach((h1) => {
    const text = (h1.textContent || "").trim();
    if (!text) return;
    h1.textContent = "";
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      h1.appendChild(span);
    }
  });
});
