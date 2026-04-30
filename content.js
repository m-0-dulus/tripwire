console.log("tripwire running");

const box = document.createElement("div");
box.innerText = "tripwire ACTIVE";
box.style.position = "fixed";
box.style.top = "80px";
box.style.right = "20px";
box.style.background = "red";
box.style.color = "white";
box.style.padding = "12px";
box.style.zIndex = "999999";
box.style.fontSize = "16px";

document.body.appendChild(box);
