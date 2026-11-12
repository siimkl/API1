(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const wait = (ms) => new Promise(resolve => window.setTimeout(resolve, ms));

  const els = {
    progressValue: $("#progressValue"), progressText: $("#progressText"), progressBar: $("#progressBar"),
    resetButton: $("#resetButton"), flowStage: $("#flowStage"), packet: $("#packet"), flowStatus: $("#flowStatus"),
    storyIndex: $("#storyIndex"), storyText: $("#storyText"), responseOutput: $("#responseOutput"),
    terminalTitle: $("#terminalTitle"), statusBadge: $("#statusBadge"), requestCount: $("#requestCount"),
    getMetadata: $("#getMetadata"), selectionSection: $("#selectionSection"), selectionFields: $("#selectionFields"),
    indicatorSelect: $("#indicatorSelect"), activitySelect: $("#activitySelect"), selectionMath: $("#selectionMath"),
    valueCount: $("#valueCount"), sendSection: $("#sendSection"), sendFields: $("#sendFields"),
    scenarioSelect: $("#scenarioSelect"), requestPreview: $("#requestPreview"), sendRequest: $("#sendRequest"),
    requestFeedback: $("#requestFeedback"), validationSection: $("#validationSection"), validationFields: $("#validationFields"),
    checkScore: $("#checkScore"), takeaway: $("#takeaway"), methodScenario: $("#methodScenario"),
    methodRound: $("#methodRound"), methodBar: $("#methodBar"), methodScore: $("#methodScore"),
    methodOptions: $("#methodOptions"), methodFeedback: $("#methodFeedback")
  };

  const state = { metadata: false, successfulPost: false, requests: 0, checks: 0, currentStep: 1, methodRound: 0, methodScore: 0, methodLocked: false };
  const methodRounds = [
    { text: "Vaja on kolme väärtust ühest veebitabelist.", correct: "manual", why: "Väikese ühekordse ülesande jaoks on veebiliides kõige otstarbekam." },
    { text: "Suur andmestik on juba CSV-failina saadaval.", correct: "file", why: "Valmis fail on siin lihtsam ja säästab tarbetuid API-päringuid." },
    { text: "Statistikat tuleb igal kuul automaatselt uuendada.", correct: "api", why: "Korduv ja struktureeritud andmevahetus on API tugevus." },
    { text: "API puudub, kuid vajalik avalik info on veebilehel nähtav.", correct: "scrape", why: "Kraapimist võib kaaluda, kui tingimused seda lubavad ja API-t pole." },
    { text: "Kaks süsteemi peavad andmeid regulaarselt vahetama.", correct: "api", why: "Süsteemide korduvaks suhtluseks on API tavaliselt mõistlik esimene valik." }
  ];

  function selectedPeriods() { return $$("#selectionFields input[type='checkbox']:checked").map(input => input.value); }

  function requestBody() {
    return {
      query: [
        { code: "Näitaja", selection: { filter: "item", values: [els.indicatorSelect.value] } },
        { code: "Tegevusala", selection: { filter: "item", values: [els.activitySelect.value] } },
        { code: "Vaatlusperiood", selection: { filter: "item", values: selectedPeriods() } }
      ],
      response: { format: "json-stat2" }
    };
  }

  function updateRequestPreview() {
    const count = selectedPeriods().length;
    els.selectionMath.textContent = `1 × 1 × ${count}`;
    els.valueCount.textContent = `= ${count} ${count === 1 ? "väärtus" : "väärtust"}`;
    els.requestPreview.textContent = JSON.stringify(requestBody(), null, 2);
  }

  function setProgress(step, completed = false) {
    state.currentStep = step;
    const percent = step === 1 ? 0 : step === 2 ? 25 : step === 3 ? 50 : completed ? 100 : 75;
    const labels = { 1: "Alusta metaandmetest", 2: "Koosta andmevalik", 3: "Saada ja tõlgenda", 4: completed ? "Missioon täidetud" : "Kontrolli vastust" };
    els.progressValue.textContent = `${percent}%`;
    els.progressText.textContent = labels[step];
    els.progressBar.style.width = `${percent}%`;
    $$(".step").forEach(item => {
      const n = Number(item.dataset.step);
      item.classList.toggle("active", n === step);
      item.classList.toggle("done", n < step || (completed && n === 4));
      const badge = item.firstElementChild;
      badge.textContent = (n < step || (completed && n === 4)) ? "✓" : n;
    });
    syncHeight();
  }

  function setStory(index, html) { els.storyIndex.textContent = String(index).padStart(2, "0"); els.storyText.innerHTML = html; }
  function setStatus(code, kind) { els.statusBadge.textContent = code; els.statusBadge.className = kind; }
  function showResponse(data) { els.responseOutput.textContent = JSON.stringify(data, null, 2); }
  function updateRequestCount() { els.requestCount.textContent = `${state.requests} ${state.requests === 1 ? "päring" : "päringut"}`; }

  async function animateFlow(label) {
    els.flowStatus.textContent = label;
    els.flowStage.classList.remove("returning", "sending");
    void els.flowStage.offsetWidth;
    els.flowStage.classList.add("sending");
    await wait(850);
    els.flowStage.classList.remove("sending");
    els.flowStage.classList.add("returning");
    await wait(650);
    els.flowStage.classList.remove("returning");
    els.flowStatus.textContent = "Vastus käes";
  }

  async function loadMetadata() {
    if (els.getMetadata.disabled) return;
    els.getMetadata.disabled = true;
    els.getMetadata.querySelector("span").textContent = "API töötleb…";
    state.requests += 1; updateRequestCount();
    setStory(1, "<b>Klient saadab GET-päringu.</b> URL osutab tabelile PA111; päringu keha pole vaja.");
    await animateFlow("GET liigub");
    showResponse({
      title: "PA111 · Keskmine brutokuupalk… (lühendatud)",
      variables: [
        { code: "Näitaja", values: ["GR_W_AVG", "NR_EMPL"] },
        { code: "Tegevusala", values: ["TOTAL", "P", "F"] },
        { code: "Vaatlusperiood", values: ["2024Q2", "2025Q2", "2026Q2"] }
      ]
    });
    els.terminalTitle.textContent = "metaandmed.json";
    setStatus("200 OK", "success");
    setStory(2, "<b>Vastus kirjeldab valikuid.</b> Need on andmed andmete kohta — palgaväärtusi siin veel ei ole.");
    state.metadata = true;
    els.selectionSection.classList.remove("locked"); els.selectionFields.disabled = false;
    els.sendSection.classList.remove("locked"); els.sendFields.disabled = false;
    els.getMetadata.querySelector("span").textContent = "Metaandmed käes";
    setProgress(2);
    updateRequestPreview();
  }

  const errorResponses = {
    "400": { status: 400, error: "Bad Request", message: "Päringu keha vormingut ei saanud tuvastada." },
    "404": { status: 404, error: "Not Found", message: "Soovitud tabelit sellel aadressil ei leitud." },
    "429": { status: 429, error: "Too Many Requests", message: "Päringupiirang on ajutiselt ületatud." }
  };
  const errorHints = {
    "400": "Kontrolli päist <b>Content-Type: application/json</b> ja JSON-i süntaksit.",
    "404": "Kontrolli URL-i ning tabeli koodi. Kas <b>PA111</b> on õiges teeosas?",
    "429": "Peata kordused, vaata dokumentatsiooni piiranguid ja proovi hiljem uuesti."
  };

  async function sendPost() {
    if (els.sendRequest.disabled) return;
    if (!selectedPeriods().length) {
      els.requestFeedback.hidden = false; els.requestFeedback.className = "feedback error";
      els.requestFeedback.textContent = "Vali vähemalt üks vaatlusperiood — muidu ei tea API, milliseid väärtusi tagastada.";
      return;
    }
    state.requests += 1; updateRequestCount();
    els.sendRequest.disabled = true; els.sendRequest.querySelector("span").textContent = "API töötleb…";
    els.requestFeedback.hidden = true;
    setProgress(3);
    setStory(3, "<b>POST saadab valiku JSON-kehas.</b> Meetodi tähendus sõltub API dokumentatsioonist.");
    await animateFlow("POST liigub");
    const scenario = els.scenarioSelect.value;
    if (scenario !== "200") {
      showResponse(errorResponses[scenario]);
      setStatus(`${scenario} ${errorResponses[scenario].error}`, "error");
      els.terminalTitle.textContent = "viga.json";
      els.requestFeedback.hidden = false; els.requestFeedback.className = "feedback error";
      els.requestFeedback.innerHTML = `<b>Mida kontrollida?</b> ${errorHints[scenario]}`;
      setStory(3, `<b>${scenario} ei ole lihtsalt punane tuli.</b> Olekukood suunab sind vea põhjuse juurde.`);
    } else {
      const periods = selectedPeriods();
      const base = els.indicatorSelect.value === "GR_W_AVG" ? [2080, 2220, 2360] : [100, 103, 105];
      const allPeriods = ["2024Q2", "2025Q2", "2026Q2"];
      const values = periods.map(period => base[allPeriods.indexOf(period)]);
      showResponse({
        class: "dataset", label: "Illustratiivne õppevastus",
        id: ["Näitaja", "Tegevusala", "Vaatlusperiood"],
        size: [1, 1, periods.length], dimension: { Vaatlusperiood: { category: { index: periods } } }, values,
        note: "Õppeandmed — mitte ametlik statistika"
      });
      setStatus("200 OK", "success"); els.terminalTitle.textContent = "andmed.json";
      els.requestFeedback.hidden = false; els.requestFeedback.className = "feedback success";
      els.requestFeedback.innerHTML = "<b>Tehniliselt õnnestus.</b> Nüüd kontrolli, kas sisu vastab sinu küsimusele.";
      setStory(4, "<b>200 OK kinnitab tehnilist edu.</b> See ei kinnita veel valikute, ühikute ega tähenduse õigsust.");
      state.successfulPost = true;
      els.validationSection.classList.remove("locked"); els.validationFields.disabled = false;
      setProgress(4);
      window.setTimeout(() => els.validationSection.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    }
    els.sendRequest.disabled = false; els.sendRequest.querySelector("span").textContent = scenario === "200" ? "Saada uuesti" : "Paranda ja proovi";
    syncHeight();
  }

  function updateChecks() {
    state.checks = $$("#validationFields input:checked").length;
    els.checkScore.textContent = `${state.checks}/4`;
    const done = state.checks === 4;
    els.takeaway.hidden = !done;
    if (done) { setProgress(4, true); setStory(4, "<b>Kontroll muudab vastuse kasutatavaks.</b> Alles nüüd on päringuring sisuliselt lõpetatud."); }
    else if (state.successfulPost) setProgress(4);
    syncHeight();
  }

  function renderMethodRound() {
    const round = methodRounds[state.methodRound];
    els.methodScenario.textContent = round.text;
    els.methodRound.textContent = `${state.methodRound + 1} / ${methodRounds.length}`;
    els.methodBar.style.width = `${((state.methodRound + 1) / methodRounds.length) * 100}%`;
    els.methodScore.textContent = `${state.methodScore} ${state.methodScore === 1 ? "punkt" : "punkti"}`;
    els.methodFeedback.className = "method-feedback";
    els.methodFeedback.textContent = "Tee valik, et saada kohe tagasisidet.";
    state.methodLocked = false;
    $$("button", els.methodOptions).forEach(button => { button.disabled = false; button.classList.remove("correct", "wrong"); });
  }

  function chooseMethod(event) {
    const button = event.target.closest("button[data-method]");
    if (!button || state.methodLocked) return;
    state.methodLocked = true;
    const round = methodRounds[state.methodRound];
    const correct = button.dataset.method === round.correct;
    if (correct) state.methodScore += 1;
    $$("button", els.methodOptions).forEach(item => {
      item.disabled = true;
      if (item.dataset.method === round.correct) item.classList.add("correct");
    });
    if (!correct) button.classList.add("wrong");
    els.methodScore.textContent = `${state.methodScore} ${state.methodScore === 1 ? "punkt" : "punkti"}`;
    els.methodFeedback.className = `method-feedback ${correct ? "good" : "bad"}`;
    els.methodFeedback.textContent = `${correct ? "Õige." : "Mõtle veel."} ${round.why}`;
    window.setTimeout(() => {
      if (state.methodRound < methodRounds.length - 1) { state.methodRound += 1; renderMethodRound(); }
      else {
        els.methodScenario.textContent = `Valmis — ${state.methodScore}/${methodRounds.length} mõistlikku valikut.`;
        els.methodFeedback.className = "method-feedback good";
        els.methodFeedback.textContent = "Hea meetodivalik algab alati ülesandest, mahust ja korduvusest.";
      }
      syncHeight();
    }, 1700);
  }

  function resetLab() {
    Object.assign(state, { metadata: false, successfulPost: false, requests: 0, checks: 0, currentStep: 1 });
    els.selectionSection.classList.add("locked"); els.selectionFields.disabled = true;
    els.sendSection.classList.add("locked"); els.sendFields.disabled = true;
    els.validationSection.classList.add("locked"); els.validationFields.disabled = true;
    $$("#selectionFields input[type='checkbox']").forEach(input => input.checked = true);
    $$("#validationFields input").forEach(input => input.checked = false);
    els.indicatorSelect.selectedIndex = 0; els.activitySelect.selectedIndex = 0; els.scenarioSelect.selectedIndex = 0;
    els.getMetadata.disabled = false; els.getMetadata.querySelector("span").textContent = "Küsi metaandmeid";
    els.requestFeedback.hidden = true; els.takeaway.hidden = true; els.checkScore.textContent = "0/4";
    els.terminalTitle.textContent = "vastus.json"; setStatus("—", "neutral");
    showResponse({ status: "Päringut pole veel saadetud" });
    setStory(1, "<b>Alusta kirjeldusest.</b> GET-päring näitab, mida tabelist üldse küsida saab.");
    els.flowStatus.textContent = "Valmis"; updateRequestCount(); updateRequestPreview(); setProgress(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function syncHeight() {
    const params = new URLSearchParams(location.search);
    if (window.self === window.top && params.get("embed") !== "1" && params.get("embedMode") !== "1") return;
    const height = Math.ceil(document.documentElement.scrollHeight);
    window.parent.postMessage({ type: "simfluence:resize", height }, "*");
    window.parent.postMessage({ type: "resize", height }, "*");
  }

  els.getMetadata.addEventListener("click", loadMetadata);
  els.sendRequest.addEventListener("click", sendPost);
  els.resetButton.addEventListener("click", resetLab);
  els.selectionFields.addEventListener("change", updateRequestPreview);
  els.validationFields.addEventListener("change", updateChecks);
  els.methodOptions.addEventListener("click", chooseMethod);
  window.addEventListener("message", event => { if (event.data?.type === "simfluence:measure" || event.data?.type === "measure") syncHeight(); });

  const params = new URLSearchParams(location.search);
  if (params.get("embed") === "1" || params.get("embedMode") === "1") document.body.classList.add("embed-mode");
  if ("ResizeObserver" in window) new ResizeObserver(syncHeight).observe(document.body);
  updateRequestPreview(); renderMethodRound(); setProgress(1); window.setTimeout(syncHeight, 100);
})();
