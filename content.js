let score = 100;
let issues = [];

function updateScore(amount, issue) {
  score -= amount;
  issues.push(issue);
  showWarning(issue);
  updateFloatingScore();
}

function showWarning(message) {
  const box = document.createElement("div");
  box.className = "dp-warning";
  box.innerText = message;

  document.body.appendChild(box);

  setTimeout(() => box.remove(), 4000);
}

function updateFloatingScore() {
  let widget = document.getElementById("dp-score");

  if (!widget) {
    widget = document.createElement("div");
    widget.id = "dp-score";
    document.body.appendChild(widget);
  }

  widget.innerText = "Trust Score: " + score + "/100";
}

// detection logic

function detectUrgency() {
  const text = document.body.innerText.toLowerCase();
  if (text.includes("only") && text.includes("left")) {
    updateScore(20, "fake urgency detected!");
  }
}

function detectCheckboxes() {
  const boxes = document.querySelectorAll('input[type="checkbox"]');
  boxes.forEach(cb => {
    if (cb.checked) {
      updateScore(15, "pre selected option detected!");
    }
  });
}

function detectPopups() {
  setTimeout(() => {
    const modals = document.querySelectorAll('[class*="modal"], [class*="popup"]');
    if (modals.length > 0) {
      updateScore(20, "delayed popup detected!");
    }
  }, 3000);
}

// run funcs
detectUrgency();
detectCheckboxes();
detectPopups();
