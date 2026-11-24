const STORAGE_KEY = "packetHarborLabV1";
const TOTAL = 18;
const defaultState = { completed: [], missionAnswers: {} };
let state = loadState();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function loadState() {
  try { return { ...defaultState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
  catch { return { ...defaultState }; }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function complete(id) {
  if (!state.completed.includes(id)) {
    state.completed.push(id); saveState(); updateProgress(); toast("Activity complete. Progress saved.");
  }
}
function toast(message) {
  const box = $("#toast"); box.textContent = message; box.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => box.classList.remove("show"), 2200);
}
function feedback(selector, message, good) {
  const box = $(selector); box.textContent = message; box.className = `feedback ${good ? "good" : "bad"}`;
}
function updateProgress() {
  const count = Math.min(TOTAL, state.completed.length);
  $("#progressLabel").textContent = `${count}/${TOTAL} complete`;
  $("#progressBar").value = count;
  $("#completion").classList.toggle("show", count === TOTAL);
}

const ipQuestions = [
  { q: "Which value is a valid IPv4 address?", options: ["192.168.10.42", "192.168.10.300", "192.168.10"], a: 0 },
  { q: "What does an IP address primarily identify in this lab?", options: ["A network interface on a device", "A service such as HTTPS", "A password"], a: 0 },
  { q: "Which address means this same computer?", options: ["127.0.0.1", "192.168.1.1", "8.8.8.8"], a: 0 },
  { q: "What is the usual job of a default gateway?", options: ["Forward traffic toward other networks", "Store every website", "Choose a user's password"], a: 0 }
];

const serviceQuestions = [
  { q: "Which endpoint represents secure web traffic?", options: ["TCP/443", "UDP/53", "TCP/22"], a: 0 },
  { q: "Which service translates a domain name into an IP address?", options: ["DNS", "RDP", "SMTP"], a: 0 },
  { q: "Which port is commonly associated with SSH?", options: ["22", "80", "3389"], a: 0 },
  { q: "Why must an analyst record TCP or UDP with a port?", options: ["TCP/53 and UDP/53 are different endpoints", "The protocol changes the IP address", "Ports work only without protocols"], a: 0 }
];

function renderQuiz(container, questions) {
  $(container).innerHTML = questions.map((item, index) => `<div class="quiz-row"><label>${index + 1}. ${item.q}<select data-question="${index}"><option value="">Choose an answer</option>${item.options.map((option, optionIndex) => `<option value="${optionIndex}">${option}</option>`).join("")}</select></label></div>`).join("");
}

function checkQuiz(container, questions, id) {
  const selects = $$(`${container} select`);
  if (selects.some(select => select.value === "")) return feedback(`${container}Feedback`, "Answer every question first.", false);
  const score = questions.filter((item, index) => Number(selects[index].value) === item.a).length;
  if (score !== questions.length) return feedback(`${container}Feedback`, `${score}/${questions.length} correct. Re-read the diagrams and try again.`, false);
  feedback(`${container}Feedback`, `${score}/${questions.length} correct. You can explain the What, Why, and How.`, true); complete(id);
}

renderQuiz("#ipQuiz", ipQuestions); renderQuiz("#serviceQuiz", serviceQuestions);
$$('.check').forEach(button => button.addEventListener("click", () => {
  if (button.dataset.check === "ipQuiz") checkQuiz("#ipQuiz", ipQuestions, "ip-check");
  else checkQuiz("#serviceQuiz", serviceQuestions, "service-check");
}));

const octetValues = [192, 168, 10, 42];
$("#octets").innerHTML = octetValues.map((value, index) => `<div class="octet"><label for="octet${index}">Octet ${index + 1}</label><input id="octet${index}" type="range" min="0" max="300" value="${value}"><output>${value}</output></div>`).join("");
function updateOctets() {
  const values = $$('.octet input').map(input => Number(input.value));
  $$('.octet input').forEach((input, index) => input.nextElementSibling.textContent = input.value);
  const valid = values.every(value => value >= 0 && value <= 255);
  $("#octetResult").textContent = `${values.join(".")} — ${valid ? "valid octet range" : "invalid: every octet must be 0–255"}`;
  $("#octetResult").className = `octet-result ${valid ? "good" : "bad"}`;
}
$$('.octet input').forEach(input => input.addEventListener("input", updateOctets)); updateOctets();
$("#validateIp").addEventListener("click", () => {
  const values = $$('.octet input').map(input => Number(input.value));
  if (!values.every(value => value <= 255)) return toast("One or more octets are above 255.");
  complete("valid-ip"); toast(`Valid IPv4 format: ${values.join(".")}`);
});

$("#replayEndpoint").addEventListener("click", () => {
  const demo = $("#endpointDemo"); demo.style.animation = "none"; void demo.offsetWidth;
  $$('.endpoint-ip,.endpoint-port,.endpoint-result', demo).forEach(element => { element.style.animation = "none"; void element.offsetWidth; element.style.animation = ""; });
});

const services = [
  { name: "DNS", port: "53", protocol: "UDP/TCP", what: "Domain Name System resolves names such as portal.example into IP addresses.", why: "People remember names more easily than numeric addresses.", how: "A client asks a DNS server a question. The reply contains an address or related record." },
  { name: "HTTP", port: "80", protocol: "TCP", what: "Hypertext Transfer Protocol carries web requests and responses.", why: "Browsers and web servers need a shared application protocol.", how: "The client opens a TCP connection and sends an HTTP request to the server." },
  { name: "HTTPS", port: "443", protocol: "TCP", what: "HTTPS is HTTP protected with TLS encryption and server authentication.", why: "It protects web data in transit and helps clients verify the server identity.", how: "A TLS session is established, then HTTP messages travel inside the protected connection." },
  { name: "SSH", port: "22", protocol: "TCP", what: "Secure Shell provides encrypted remote command-line access.", why: "Administrators need to manage systems remotely while protecting credentials and commands.", how: "An SSH client connects, verifies the server, authenticates, and opens an encrypted session." },
  { name: "SMTP", port: "25", protocol: "TCP", what: "Simple Mail Transfer Protocol transfers email between mail systems.", why: "Mail servers need a standard way to relay messages.", how: "A sending mail server connects and exchanges SMTP commands with a receiving server." },
  { name: "DHCP", port: "67/68", protocol: "UDP", what: "Dynamic Host Configuration Protocol supplies network settings to clients.", why: "Devices need an IP address, gateway, and often DNS settings before normal communication.", how: "A client broadcasts a request from UDP 68. A DHCP server replies from UDP 67." },
  { name: "RDP", port: "3389", protocol: "TCP", what: "Remote Desktop Protocol provides a graphical remote session, commonly for Windows systems.", why: "Users or administrators may need to operate a distant desktop.", how: "An RDP client connects to the remote service and authenticates before a desktop session opens." },
  { name: "FTP", port: "21", protocol: "TCP", what: "File Transfer Protocol supports file transfer and related commands.", why: "Systems sometimes need a standard file-transfer service.", how: "The client connects to the FTP control service. Traditional FTP does not protect credentials by itself." }
];

$("#serviceButtons").innerHTML = services.map((service, index) => `<button type="button" data-service="${index}">${service.name}<br>${service.port}</button>`).join("");
$("#serverRack").innerHTML = services.map((service, index) => `<div class="port-door" data-door="${index}">${service.protocol}/${service.port} · ${service.name}</div>`).join("");
function selectService(index) {
  const service = services[index];
  $$('[data-service]').forEach(button => button.classList.toggle("active", Number(button.dataset.service) === index));
  $$('[data-door]').forEach(door => door.classList.toggle("active", Number(door.dataset.door) === index));
  $("#serviceExplanation").innerHTML = `<div><b>WHAT</b><p>${service.what}</p></div><div><b>WHY</b><p>${service.why}</p></div><div><b>HOW</b><p>${service.how}</p></div>`;
  $("#servicePacket").textContent = `${service.protocol}/${service.port}`;
  const wire = $('.service-wire'); wire.classList.remove("animate"); void wire.offsetWidth; wire.classList.add("animate");
}
$$('[data-service]').forEach(button => button.addEventListener("click", () => selectService(Number(button.dataset.service)))); selectService(0);

const missions = [
  { title: "Valid address or impossible address?", scenario: "A ticket says a printer uses 192.168.10.275. What is the best finding?", choices: ["Invalid IPv4 because an octet exceeds 255", "Valid private IPv4", "Loopback address"], a: 0, hint: "Check every decimal number separately.", why: "IPv4 has four octets and each must be between 0 and 255." },
  { title: "Local or internet-routable?", scenario: "A laptop has 192.168.10.42. Which context is most accurate?", choices: ["It is a private IPv4 address used inside a local network", "It is always a public web server", "It is the loopback address"], a: 0, hint: "Recall the common private range beginning with 192.168.", why: "192.168.0.0/16 is reserved for private networks and is not routed across the public internet as a normal destination." },
  { title: "Where should the packet go?", scenario: "The laptop needs 198.51.100.20, which is outside its local network. What does it use first?", choices: ["Its configured default gateway", "TCP port 80 as a router", "The loopback address"], a: 0, hint: "Which device forwards traffic to other networks?", why: "The host sends non-local traffic toward its default gateway for onward routing." },
  { title: "Name before address", scenario: "A user types intranet.example but the browser needs an IP address. Which service helps first?", choices: ["DNS on port 53", "RDP on port 3389", "SSH on port 22"], a: 0, hint: "The service translates human-readable names.", why: "DNS resolves a name into an IP address before the application connects to the destination service." },
  { title: "Choose the secure website door", scenario: "The browser must open a protected payroll website. Which destination endpoint is expected?", choices: ["TCP/443", "TCP/80", "UDP/67"], a: 0, hint: "Protected HTTP uses TLS.", why: "HTTPS commonly listens on TCP port 443. HTTP on TCP/80 does not provide the same TLS protection." },
  { title: "Remote command line", scenario: "An administrator needs an encrypted terminal session to a Linux server. Which service fits?", choices: ["SSH on TCP/22", "SMTP on TCP/25", "RDP on TCP/3389"], a: 0, hint: "The requirement is a terminal, not a graphical desktop.", why: "SSH provides encrypted remote shell access and commonly uses TCP port 22." },
  { title: "New laptop, no address", scenario: "A new laptop joins Wi-Fi and needs an IP address, gateway, and DNS configuration. Which service supplies them?", choices: ["DHCP using UDP 67/68", "HTTPS using TCP 443", "FTP using TCP 21"], a: 0, hint: "This service dynamically configures clients.", why: "DHCP assigns or offers network configuration. Clients and servers use UDP ports 68 and 67." },
  { title: "Read the endpoint correctly", scenario: "A record shows 10.20.5.8:22. What can you responsibly say?", choices: ["Traffic targets service port 22 on device 10.20.5.8, commonly SSH", "The device itself is named SSH", "The IP address proves an attack"], a: 0, hint: "Separate the device address from the service door.", why: "The IP identifies the target interface and 22 identifies the target port. Context is still required before deciding whether activity is malicious." },
  { title: "Port alone is not a verdict", scenario: "A firewall log shows outbound TCP/443. What is the best conclusion?", choices: ["It is commonly HTTPS, but destination and context must be checked", "It proves data theft", "It is DNS because all ports are interchangeable"], a: 0, hint: "A common service mapping describes likely use, not intent.", why: "TCP/443 commonly carries HTTPS, including both legitimate and malicious traffic. Analysts need host, time, direction, process, and destination context." },
  { title: "Spot the unusual direction", scenario: "An unknown internet IP attempts TCP/3389 to an office server at midnight. What is the best first assessment?", choices: ["Possible external RDP access that requires investigation", "Normal DNS lookup", "A DHCP address offer"], a: 0, hint: "Match 3389 to its common service, then consider direction and time.", why: "TCP/3389 commonly maps to RDP. An unsolicited external attempt to an internal server is notable, though the log alone does not prove compromise." }
];

let selectedAnswers = { ...state.missionAnswers };
function renderMissions() {
  $("#missionList").innerHTML = missions.map((mission, index) => {
    const done = state.completed.includes(`mission-${index + 1}`);
    return `<article class="mission ${done ? "done" : ""}" data-mission="${index}"><button class="mission-title" type="button"><span>MISSION ${String(index + 1).padStart(2, "0")}</span><div><h3>${mission.title}</h3><small>${done ? "Completed" : "Ready to investigate"}</small></div><em>${done ? "✓" : "+"}</em></button><div class="mission-body"><p class="scenario">${mission.scenario}</p><div class="choices">${mission.choices.map((choice, choiceIndex) => `<button type="button" data-choice="${choiceIndex}" class="${selectedAnswers[index] === choiceIndex ? "selected" : ""}">${choice}</button>`).join("")}</div><button class="hint-toggle" type="button">Show hint</button><p class="hint">${mission.hint}</p><button class="primary check-mission" type="button">Check decision</button><p class="mission-feedback ${done ? "good" : ""}">${done ? mission.why : ""}</p></div></article>`;
  }).join("");
}
renderMissions();
$("#missionList").addEventListener("click", event => {
  const card = event.target.closest('.mission'); if (!card) return;
  const index = Number(card.dataset.mission);
  if (event.target.closest('.mission-title')) card.classList.toggle("open");
  if (event.target.matches('.hint-toggle')) event.target.nextElementSibling.classList.toggle("show");
  if (event.target.matches('[data-choice]')) {
    selectedAnswers[index] = Number(event.target.dataset.choice); state.missionAnswers = selectedAnswers; saveState();
    $$('.choices button', card).forEach(button => button.classList.toggle("selected", button === event.target));
  }
  if (event.target.matches('.check-mission')) {
    const message = $('.mission-feedback', card);
    if (selectedAnswers[index] === undefined) { message.className = "mission-feedback bad"; message.textContent = "Choose an answer first."; return; }
    if (selectedAnswers[index] !== missions[index].a) { message.className = "mission-feedback bad"; message.textContent = "Not quite. Use the hint and match the address, service, protocol, and context."; return; }
    complete(`mission-${index + 1}`); renderMissions();
    const reopened = $(`[data-mission="${index}"]`); reopened.classList.add("open");
  }
});

const finalQuestions = [
  { q: "Which IP initiated the connection?", options: ["203.0.113.77", "192.168.10.25", "3389"], a: 0 },
  { q: "Which device was targeted?", options: ["192.168.10.25", "203.0.113.77", "127.0.0.1"], a: 0 },
  { q: "Which service is commonly associated with TCP/3389?", options: ["RDP", "DNS", "HTTPS"], a: 0 },
  { q: "Did the firewall allow the attempt?", options: ["No, action is BLOCK", "Yes, TCP always means allowed", "The log does not contain an action"], a: 0 },
  { q: "Which conclusion is best supported?", options: ["An external RDP attempt was blocked and should be reviewed with more context", "The server was definitely compromised", "The event is a normal DNS response"], a: 0 }
];
renderQuiz("#finalQuestions", finalQuestions);
$("#checkFinal").addEventListener("click", () => {
  const selects = $$('#finalQuestions select');
  if (selects.some(select => select.value === "")) return feedback("#finalFeedback", "Answer all five investigation questions.", false);
  const wrong = finalQuestions.findIndex((question, index) => Number(selects[index].value) !== question.a);
  if (wrong !== -1) return feedback("#finalFeedback", `Question ${wrong + 1} needs another look. Read the log field names carefully.`, false);
  finalQuestions.forEach((_, index) => complete(`final-${index + 1}`));
  feedback("#finalFeedback", "5/5 correct. You separated device, service, direction, action, and conclusion.", true);
  $("#completion").scrollIntoView({ behavior: "smooth", block: "center" });
});

$("#resume").addEventListener("click", () => {
  const target = state.completed.length >= 13 ? "#investigation" : state.completed.length >= 3 ? "#missions" : state.completed.length >= 1 ? "#services" : "#learn";
  $(target).scrollIntoView({ behavior: "smooth" });
});
$("#resetLab").addEventListener("click", () => {
  if (!confirm("Reset all Packet Harbor progress?")) return;
  localStorage.removeItem(STORAGE_KEY); location.reload();
});
updateProgress();
