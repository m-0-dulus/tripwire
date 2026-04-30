console.log("tripwire running");

// states
let score = 100;
let issues = [];

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
widget.innerText = "tripwire ACTIVE\nScore: 100/100";

document.body.appendChild(widget);

// --- UPDATE SCORE ---
function updateScore(amount, reason) {
  score = Math.max(score - amount, 0);
  issues.push(reason);

  widget.innerText = `tripwire ACTIVE\nScore: ${score}/100\nLast: ${reason}`;
}

// safe text
function highlightText(pattern, label) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

  let node;
  while ((node = walker.nextNode())) {
    if (node.parentNode && node.nodeValue.match(pattern)) {
      const span = document.createElement("span");
      span.style.background = "red";
      span.style.color = "white";
      span.style.padding = "2px 4px";
      span.textContent = node.nodeValue;

      node.parentNode.replaceChild(span, node);
    }
  }
}

// detection logic

function detectDiscountFraming() {
  const text = document.body.innerText.toLowerCase();

  if (text.match(/up to \d+% off/)) {
    updateScore(15, "Heavy discount framing");
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

function detectPrecheckedBoxes() {
  const boxes = document.querySelectorAll('input[type="checkbox"]');

  boxes.forEach(cb => {
    if (cb.checked) {
      updateScore(15, "pre selected option");

      cb.style.outline = "3px solid red";
      cb.title = "pre selected option detected";
    }
  });
}

function detectDelayedPopups() {
  setTimeout(() => {
    const modals = document.querySelectorAll('[class*="modal"], [class*="popup"]');

    if (modals.length > 0) {
      updateScore(20, "delayed popup detected");

      modals.forEach(m => {
        m.style.outline = "3px solid red";
      });
    }
  }, 3000);
}

// run funcs
setTimeout(() => {
  detectDiscountFraming();
  detectUrgency();
  detectPrecheckedBoxes();
  detectDelayedPopups();
}, 1500);
