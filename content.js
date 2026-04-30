console.log("tripwire running");

// states   
let score = 100;
let issues = [];
let detectedSet = new Set();
let cleanModeActive = false;
let maskedElements = [];

// widget
const widget = document.createElement("div");
widget.id = "tripwire-widget";

widget.style.position = "fixed";
widget.style.top = "80px";
widget.style.right = "20px";
widget.style.width = "220px";
widget.style.background = "linear-gradient(135deg, #0f0f0f, #1c1c1c)";
widget.style.color = "white";
widget.style.padding = "14px";
widget.style.borderRadius = "14px";
widget.style.fontSize = "13px";
widget.style.zIndex = "999999";
widget.style.fontFamily = "system-ui, sans-serif";
widget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.6)";
widget.style.backdropFilter = "blur(10px)";
widget.style.transition = "all 0.3s ease";

document.body.appendChild(widget);

// panel
const panel = document.createElement("div");
panel.id = "tripwire-panel";

panel.style.position = "fixed";
panel.style.top = "80px";
panel.style.right = "260px";
panel.style.width = "300px";
panel.style.maxHeight = "400px";
panel.style.background = "linear-gradient(135deg, #111, #1f1f1f)";
panel.style.color = "white";
panel.style.borderRadius = "16px";
panel.style.fontSize = "13px";
panel.style.zIndex = "999999";
panel.style.fontFamily = "system-ui, sans-serif";
panel.style.boxShadow = "0 15px 40px rgba(0,0,0,0.7)";
panel.style.display = "none";
panel.style.overflow = "hidden";

document.body.appendChild(panel);

// render panel
function renderIssues() {
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.1);font-weight:600;">
      <span>issues detected</span>
      <button id="tripwire-close" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;">✕</button>
    </div>
    <div id="tripwire-list" style="padding:12px;max-height:320px;overflow-y:auto;"></div>
  `;

  const list = document.getElementById("tripwire-list");

  issues.forEach((issue, index) => {
    const item = document.createElement("div");
    item.style.padding = "8px";
    item.style.marginBottom = "8px";
    item.style.borderRadius = "8px";
    item.style.background = "rgba(255,77,79,0.15)";
    item.style.border = "1px solid rgba(255,77,79,0.4)";
    item.innerText = `${index + 1}. ${issue}`;
    list.appendChild(item);
  });
}

// toggle + clean
document.addEventListener("click", (e) => {
  if (e.target.id === "tripwire-toggle") panel.style.display = "block";
  if (e.target.id === "tripwire-close") panel.style.display = "none";

  if (e.target.id === "tripwire-clean") {
    if (!cleanModeActive) {
      cleanPage();
      cleanModeActive = true;
    } else {
      undoClean();
      cleanModeActive = false;
    }
  }
});

// update score
function updateScore(amount, reason) {
  if (detectedSet.has(reason)) return;

  detectedSet.add(reason);
  score = Math.max(score - amount, 0);
  issues.push(reason);

  widget.innerHTML = `
    <div style="opacity:0.7;">tripwire</div>
    <div style="font-size:22px;font-weight:bold;margin-top:4px;">
      ${score}/100
    </div>
    <button id="tripwire-toggle" style="margin-top:10px;padding:8px;width:100%;border:none;border-radius:10px;background:linear-gradient(135deg,#ff4d4f,#ff7875);color:white;cursor:pointer;font-weight:600;">
      view issues (${issues.length})
    </button>

    <button id="tripwire-clean" style="margin-top:6px;padding:8px;width:100%;border:none;border-radius:10px;background:#222;color:white;cursor:pointer;">
      ${cleanModeActive ? "undo clean" : "clean page"}
    </button>
  `;

  renderIssues();
}

// safe mask
function maskElement(el, label) {
  if (el.classList.contains("tripwire-masked")) return;

  // 🚫 avoid huge containers
  if (
    el.offsetHeight > 250 ||
    el.offsetWidth > window.innerWidth * 0.9
  ) return;

  el.classList.add("tripwire-masked");
  el.style.position = "relative";

  const overlay = document.createElement("div");
  overlay.className = "tripwire-overlay";
  overlay.innerText = `⚠️ hidden: ${label}`;
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.75)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.fontSize = "12px";
  overlay.style.color = "white";
  overlay.style.zIndex = "9999";
  overlay.style.borderRadius = "8px";

  el.appendChild(overlay);

  maskedElements.push({ el, overlay });
}

// undo clean
function undoClean() {
  maskedElements.forEach(({ el, overlay }) => {
    if (overlay && overlay.parentNode) overlay.remove();
    el.classList.remove("tripwire-masked");
    el.style.filter = "";
  });

  maskedElements = [];
}

// clean mode
function cleanPage() {

  // popups
  document.querySelectorAll('[class*="modal"], [class*="popup"]').forEach(m => {
    if (m.offsetHeight < window.innerHeight * 0.8) {
      maskElement(m, "popup");
    }
  });

  // banners (SAFE now)
  document.querySelectorAll("div").forEach(sec => {
    const text = sec.innerText.toLowerCase();

    if (
      text.includes("% off") &&
      sec.offsetHeight < 200 &&
      sec.offsetWidth < window.innerWidth * 0.8
    ) {
      maskElement(sec, "promo");
    }
  });

  // checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (cb.checked) cb.checked = false;
  });

  // images
  document.querySelectorAll("img").forEach(img => {
    const alt = (img.alt || "").toLowerCase();

    if (
      (alt.includes("sale") || alt.includes("off")) &&
      img.width < 300
    ) {
      img.style.filter = "blur(6px)";
      maskedElements.push({ el: img, overlay: null });
    }
  });
}

// detection logic (unchanged)
function detectDiscountFraming() {
  const text = document.body.innerText.toLowerCase();
  if (text.match(/up to \d+% off/)) updateScore(15, "heavy discount framing");
}

function detectUrgency() {
  const text = document.body.innerText.toLowerCase();
  if (text.includes("only") || text.includes("left") || text.includes("hurry") || text.includes("limited")) {
    updateScore(20, "fake urgency language");
  }
}

function detectPrecheckedBoxes() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (cb.checked && !cb.classList.contains("tripwire-flagged")) {
      updateScore(15, "pre selected option");
      cb.classList.add("tripwire-flagged");
    }
  });
}

function detectDelayedPopups() {
  setTimeout(() => {
    document.querySelectorAll('[class*="modal"], [class*="popup"]').forEach(m => {
      if (!m.classList.contains("tripwire-flagged")) {
        updateScore(20, "delayed popup detected");
        m.classList.add("tripwire-flagged");
      }
    });
  }, 3000);
}

// scanning
function runDetections() {
  detectDiscountFraming();
  detectUrgency();
  detectPrecheckedBoxes();
  detectDelayedPopups();
}

setTimeout(runDetections, 1500);
setInterval(runDetections, 4000);

new MutationObserver(runDetections).observe(document.body, {
  childList: true,
  subtree: true
});panel.style.maxHeight = "400px";
panel.style.background = "linear-gradient(135deg, #111, #1f1f1f)";
panel.style.color = "white";
panel.style.borderRadius = "16px";
panel.style.fontSize = "13px";
panel.style.zIndex = "999999";
panel.style.fontFamily = "system-ui, sans-serif";
panel.style.boxShadow = "0 15px 40px rgba(0,0,0,0.7)";
panel.style.display = "none";
panel.style.overflow = "hidden";

document.body.appendChild(panel);

// render panel
function renderIssues() {
  panel.innerHTML = `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:12px;
      background:rgba(255,255,255,0.05);
      border-bottom:1px solid rgba(255,255,255,0.1);
      font-weight:600;
    ">
      <span>issues detected</span>
      <button id="tripwire-close" style="
        background:none;
        border:none;
        color:white;
        font-size:16px;
        cursor:pointer;
      ">✕</button>
    </div>
    <div id="tripwire-list" style="
      padding:12px;
      max-height:320px;
      overflow-y:auto;
    "></div>
  `;

  const list = document.getElementById("tripwire-list");

  issues.forEach((issue, index) => {
    const item = document.createElement("div");

    item.style.padding = "8px";
    item.style.marginBottom = "8px";
    item.style.borderRadius = "8px";
    item.style.background = "rgba(255,77,79,0.15)";
    item.style.border = "1px solid rgba(255,77,79,0.4)";
    item.innerText = `${index + 1}. ${issue}`;

    list.appendChild(item);
  });
}

// toggle + clean hook
document.addEventListener("click", (e) => {
  if (e.target.id === "tripwire-toggle") {
    panel.style.display = "block";
  }

  if (e.target.id === "tripwire-close") {
    panel.style.display = "none";
  }

  if (e.target.id === "tripwire-clean") {
    cleanPage();
  }
});

// update score
function updateScore(amount, reason) {
  if (detectedSet.has(reason)) return;

  detectedSet.add(reason);
  score = Math.max(score - amount, 0);
  issues.push(reason);

  widget.innerHTML = `
    <div style="opacity:0.7;">tripwire</div>
    <div style="font-size:22px;font-weight:bold;margin-top:4px;">
      ${score}/100
    </div>
    <button id="tripwire-toggle" style="
      margin-top:10px;
      padding:8px;
      width:100%;
      border:none;
      border-radius:10px;
      background:linear-gradient(135deg,#ff4d4f,#ff7875);
      color:white;
      cursor:pointer;
      font-weight:600;
    ">
      view issues (${issues.length})
    </button>

    <button id="tripwire-clean" style="
      margin-top:6px;
      padding:8px;
      width:100%;
      border:none;
      border-radius:10px;
      background:#222;
      color:white;
      cursor:pointer;
      font-weight:500;
    ">
      clean page
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

// image
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

// bg
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

// mask instead of delete
function maskElement(el, label) {
  if (el.classList.contains("tripwire-masked")) return;

  el.classList.add("tripwire-masked");
  el.style.position = "relative";

  const overlay = document.createElement("div");

  overlay.innerText = `⚠️ hidden: ${label}`;
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.fontSize = "12px";
  overlay.style.zIndex = "9999";
  overlay.style.borderRadius = "8px";
  overlay.style.textAlign = "center";

  el.appendChild(overlay);
}
function cleanPage() {

  // urgency text → blur highlight instead of delete
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.match(/only|hurry|limited|left/i)) {
      const span = document.createElement("span");
      span.style.filter = "blur(4px)";
      span.textContent = node.nodeValue;

      node.parentNode.replaceChild(span, node);
    }
  }

  // popups → mask
  document.querySelectorAll('[class*="modal"], [class*="popup"]').forEach(m => {
    maskElement(m, "popup");
  });

  // banners → mask instead of remove
  document.querySelectorAll("div, section").forEach(sec => {
    const text = sec.innerText.toLowerCase();

    if (text.includes("%") && text.includes("off") && sec.offsetHeight > 200) {
      maskElement(sec, "promo banner");
    }
  });

  // checkboxes → disable
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (cb.checked) cb.checked = false;
  });

  // images → blur instead of remove
  document.querySelectorAll("img").forEach(img => {
    const alt = (img.alt || "").toLowerCase();

    if (alt.includes("sale") || alt.includes("off")) {
      img.style.filter = "blur(8px)";
    }
  });

  widget.innerHTML += `<div style="margin-top:6px;font-size:12px;opacity:0.7;">mask mode active</div>`;
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

setTimeout(runDetections, 1500);
setInterval(runDetections, 4000);

const observer = new MutationObserver(() => {
  runDetections();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
