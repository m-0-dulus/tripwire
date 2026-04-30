console.log("tripwire running");

// states   
let score = 100;
let issues = [];
let detectedSet = new Set();

// widget
const widget = document.createElement("div");
widget.id = "tripwire-widget";

widget.style.position = "fixed";
widget.style.top = "80px";
widget.style.right = "20px";
widget.style.background = "rgba(0,0,0,0.85)";
widget.style.color = "white";
widget.style.padding = "12px 16px";
widget.style.borderRadius = "10px";
widget.style.fontSize = "14px";
widget.style.zIndex = "999999";
widget.style.fontFamily = "system-ui, sans-serif";
widget.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";
widget.style.transition = "all 0.3s ease";

document.body.appendChild(widget);

// panel
const panel = document.createElement("div");
panel.id = "tripwire-panel";

panel.style.position = "fixed";
panel.style.top = "140px";
panel.style.right = "20px";
panel.style.width = "260px";
panel.style.maxHeight = "300px";
panel.style.overflowY = "auto";
panel.style.background = "rgba(0,0,0,0.9)";
panel.style.color = "white";
panel.style.padding = "10px";
panel.style.borderRadius = "10px";
panel.style.fontSize = "13px";
panel.style.zIndex = "999999";
panel.style.fontFamily = "system-ui, sans-serif";
panel.style.display = "none";

document.body.appendChild(panel);

// render panel
function renderIssues() {
  panel.innerHTML = "<b>detected issues:</b><br><br>";

  issues.forEach((issue, index) => {
    const item = document.createElement("div");
    item.style.marginBottom = "6px";
    item.innerText = `${index + 1}. ${issue}`;
    panel.appendChild(item);
  });
}

// toggle
document.addEventListener("click", (e) => {
  if (e.target.id === "tripwire-toggle") {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
});

// update score
function updateScore(amount, reason) {
  if (detectedSet.has(reason)) return;

  detectedSet.add(reason);
  score = Math.max(score - amount, 0);
  issues.push(reason);

  widget.innerHTML = `
    <div style="font-weight:bold;">tripwire running...</div>
    <div>score: ${score}/100</div>
    <button id="tripwire-toggle" style="margin-top:6px;padding:4px 8px;border:none;border-radius:6px;cursor:pointer;">
      view issues (${issues.length})
    </button>
  `;

  renderIssues();
}

// safety lol
function highlightText(pattern) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

  let node;
  while ((node = walker.nextNode())) {
    if (
      node.parentNode &&
      !node.parentNode.classList?.contains("tripwire-highlight") &&
      pattern.test(node.nodeValue)
    ) {
      const span = document.createElement("span");
      span.className = "tripwire-highlight";
      span.style.background = "red";
      span.style.color = "white";
      span.style.padding = "2px 4px";
      span.textContent = node.nodeValue;

      node.parentNode.replaceChild(span, node);
    }
  }
}

// detection logic

// text

function detectDiscountFraming() {
  const text = document.body.innerText.toLowerCase();

  if (text.match(/up to \d+% off/)) {
    updateScore(15, "heavy discount framing");
    highlightText(/up to \d+% off/i);
  }
}

function detectUrgency() {
  const text = document.body.innerText.toLowerCase();

  if (
    text.includes("only") ||
    text.includes("left") ||
    text.includes("hurry") ||
    text.includes("limited")
  ) {
    updateScore(20, "fake urgency language");
    highlightText(/only|left|hurry|limited/i);
  }
}

// ui

function detectPrecheckedBoxes() {
  const boxes = document.querySelectorAll('input[type="checkbox"]');

  boxes.forEach(cb => {
    if (cb.checked && !cb.classList.contains("tripwire-flagged")) {
      updateScore(15, "pre selected option");

      cb.style.outline = "3px solid red";
      cb.title = "pre selected option detected";
      cb.classList.add("tripwire-flagged");
    }
  });
}

function detectDelayedPopups() {
  setTimeout(() => {
    const modals = document.querySelectorAll('[class*="modal"], [class*="popup"]');

    modals.forEach(m => {
      if (!m.classList.contains("tripwire-flagged")) {
        updateScore(20, "delayed popup detected");

        m.style.outline = "3px solid red";
        m.classList.add("tripwire-flagged");
      }
    });
  }, 3000);
}

// image pattern recognition

// img tags
function detectImagePatterns() {
  const images = document.querySelectorAll("img");

  images.forEach(img => {
    const alt = (img.alt || "").toLowerCase();
    const src = (img.src || "").toLowerCase();

    if (
      alt.includes("off") ||
      alt.includes("sale") ||
      alt.includes("deal") ||
      src.includes("sale") ||
      src.includes("discount")
    ) {
      if (!img.classList.contains("tripwire-flagged")) {
        updateScore(10, "promotional image detected");

        img.style.outline = "3px solid red";
        img.title = "promotional manipulation";
        img.classList.add("tripwire-flagged");
      }
    }
  });
}

// banners
function detectBannerSections() {
  const sections = document.querySelectorAll("div, section");

  sections.forEach(sec => {
    const text = sec.innerText.toLowerCase();

    if (
      text.includes("%") &&
      text.includes("off") &&
      sec.offsetHeight > 200
    ) {
      if (!sec.classList.contains("tripwire-flagged")) {
        updateScore(15, "promotional banner detected");

        sec.style.outline = "3px solid orange";
        sec.classList.add("tripwire-flagged");
      }
    }
  });
}

// bg images
function detectBackgroundImages() {
  const elements = document.querySelectorAll("*");

  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundImage;

    if (bg && bg !== "none") {
      if (!el.classList.contains("tripwire-bg")) {
        el.classList.add("tripwire-bg");

        if (el.innerText.toLowerCase().includes("off")) {
          updateScore(10, "background promo detected");

          el.style.outline = "2px dashed yellow";
        }
      }
    }
  });
}

// scanning
function runDetections() {
  detectDiscountFraming();
  detectUrgency();
  detectPrecheckedBoxes();
  detectDelayedPopups();

  detectImagePatterns();
  detectBannerSections();
  detectBackgroundImages();
}

// first run
setTimeout(runDetections, 1500);

// continuous scan
setInterval(runDetections, 4000);

// dom
const observer = new MutationObserver(() => {
  runDetections();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
