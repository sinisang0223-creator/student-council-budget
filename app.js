// 화면 채우기와 버튼 동작
// 화면 그리기, 행사 추가·지출 입력 처리, 브라우저 저장과 불러오기, CSV 내려받기를 맡는다.
// 계산과 검사는 budget.js 함수에 맡기고, 여기서는 그 결과를 화면에 넣기만 한다.

// 가짜 예시 데이터 (실제 행사·사람 정보 아님). 저장된 목록이 없을 때 보여 준다
const sampleEvents = [
  { name: "신입생 환영회", budget: 800000, spent: 667200 },
  { name: "체육대회", budget: 1200000, spent: 1200000 },
  { name: "학과 축제 부스", budget: 500000, spent: 560000 }
];

// 브라우저 저장 공간(localStorage)에서 행사 목록을 찾을 때 쓰는 이름표
const STORAGE_KEY = "student-council-budget-events";

// 저장해 둔 행사 목록을 불러온다
// 저장된 것이 없거나, 읽기가 막혔거나, 내용이 깨졌으면 예시 행사로 시작한다
function loadEvents() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // 시크릿 모드처럼 읽기가 막힌 브라우저. 아래에서 예시 행사를 쓴다
  }
  const loaded = parseSavedEvents(saved);
  if (loaded === null) {
    return sampleEvents;
  }
  return loaded;
}

const events = loadEvents();

// 행사 목록 전체를 글자(JSON)로 바꿔 브라우저에 저장한다
// 시크릿 모드처럼 저장이 막힌 브라우저에서는 오류가 나므로, 화면은 그대로 두고 문구만 보여 준다
function saveEvents() {
  const saveError = document.getElementById("save-error");
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    saveError.textContent = "";
  } catch (e) {
    saveError.textContent = "저장되지 않았습니다.";
  }
}

// 상태 글자에 맞는 색깔 스타일 이름 (style.css)
const statusClass = {
  "정상": "status-ok",
  "주의": "status-warn",
  "초과": "status-over"
};

// 상태 글자 앞에 붙이는 기호. 색을 구분하기 어려운 사람도 상태를 알 수 있게 한다
const statusIcon = {
  "정상": "✓",
  "주의": "!",
  "초과": "▲"
};

// 사용률 막대의 색과 길이를 정한다. 표의 막대와 요약 카드의 큰 막대가 같이 쓴다
// baseClass는 막대 모양 스타일 이름이고, 여기에 상태 색 스타일 이름을 붙인다
function fillMeter(meter, budget, spent, baseClass) {
  const status = getStatus(budget, spent);
  const width = calcBarWidth(budget, spent);
  // 행사가 하나도 없으면 상태와 길이를 정할 수 없으므로 빈 막대로 둔다
  meter.className = status === null ? baseClass : baseClass + " " + statusClass[status];
  meter.firstChild.style.width = (width === null ? 0 : width) + "%";
}

// 사용률 칸: [막대] 83.4% 모양으로 만든다
// 막대 색은 상태를 따르고, 숫자 글자는 그대로 검은 글자로 둔다
function makeRateCell(budget, spent) {
  const meter = document.createElement("span");
  // 막대는 옆의 숫자와 같은 내용이라 화면 읽기 프로그램은 건너뛰게 한다
  meter.setAttribute("aria-hidden", "true");
  const fill = document.createElement("span");
  fill.className = "meter-fill";
  meter.appendChild(fill);
  fillMeter(meter, budget, spent, "meter");

  const rateText = document.createElement("span");
  rateText.className = "rate-text";
  rateText.textContent = formatRate(calcUsageRate(budget, spent));

  const wrap = document.createElement("span");
  wrap.className = "rate";
  wrap.appendChild(meter);
  wrap.appendChild(rateText);

  const td = document.createElement("td");
  td.className = "num";
  td.appendChild(wrap);
  return td;
}

// 표의 칸 하나를 만든다. textContent를 써서 글자가 그대로 보이게 한다
function makeCell(text, className) {
  const td = document.createElement("td");
  td.textContent = text;
  if (className) {
    td.className = className;
  }
  return td;
}

// 행사마다 지출 금액 칸을 기억해 둔다. 다시 그린 뒤 커서를 돌려놓을 때 쓴다
// Map은 "행사 → 그 행사의 금액 칸"처럼 짝을 지어 저장하는 상자다
let spendInputs = new Map();

// 행사 목록으로 표를 채운다
function renderEvents() {
  const tbody = document.getElementById("event-rows");
  // 다시 그릴 때 같은 행이 두 번 들어가지 않도록 먼저 비운다
  tbody.textContent = "";
  spendInputs = new Map();

  if (events.length === 0) {
    renderEmptyRow(tbody);
    return;
  }

  for (const event of events) {
    const remaining = calcRemaining(event.budget, event.spent);
    const status = getStatus(event.budget, event.spent);

    const tr = document.createElement("tr");
    tr.appendChild(makeCell(event.name));
    tr.appendChild(makeCell(formatWon(event.budget), "num"));
    tr.appendChild(makeCell(formatWon(event.spent), "num"));
    tr.appendChild(makeCell(formatWon(remaining), isOverBudget(event.budget, event.spent) ? "num negative" : "num"));
    tr.appendChild(makeRateCell(event.budget, event.spent));

    const badge = document.createElement("span");
    badge.className = "status " + statusClass[status];
    badge.textContent = statusIcon[status] + " " + status;
    const statusCell = document.createElement("td");
    statusCell.appendChild(badge);
    tr.appendChild(statusCell);

    tr.appendChild(makeSpendCell(event, tr));

    tbody.appendChild(tr);
  }
}

// 행 오른쪽의 [금액] [입력] 칸을 만든다
// form으로 감싸서 버튼을 눌러도, 금액 칸에서 Enter를 눌러도 입력된다
function makeSpendCell(event, tr) {
  const form = document.createElement("form");
  form.className = "spend-form";
  form.noValidate = true;

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.placeholder = "금액";
  // 화면 읽기 프로그램이 어느 행사의 칸인지 알 수 있게 이름을 붙인다
  input.setAttribute("aria-label", event.name + " 지출 금액");
  spendInputs.set(event, input);

  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "입력";

  form.appendChild(input);
  form.appendChild(button);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleAddSpending(event, input, tr);
  });

  const td = document.createElement("td");
  td.appendChild(form);
  return td;
}

// 지출 입력을 검사하고, 통과하면 그 행사의 지출에 더한다
function handleAddSpending(event, input, tr) {
  const result = addSpending(event.spent, input.value);
  if (result.error !== null) {
    // 잘못된 금액은 저장하지 않는다. 입력한 내용은 남겨 두어 바로 고칠 수 있게 한다
    showRowError(tr, "지출: " + result.error);
    input.focus();
    return;
  }
  event.spent = result.spent;
  saveEvents();
  // 다시 그리면 입력칸과 오류 문구는 저절로 비워진다
  render();
  // 다시 그리면서 입력칸이 새로 만들어졌으므로, 같은 행사의 새 금액 칸으로 커서를 옮긴다
  // 영수증 여러 장을 연달아 입력하기 편하게 하려는 것
  spendInputs.get(event).focus();
}

// 행 바로 아래에 오류 문구 행을 보여 준다. 이미 있으면 문구만 바꾼다
function showRowError(tr, message) {
  let errorRow = tr.nextElementSibling;
  if (!errorRow || errorRow.className !== "error-row") {
    errorRow = document.createElement("tr");
    errorRow.className = "error-row";
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "error-message";
    td.setAttribute("role", "alert");
    errorRow.appendChild(td);
    tr.parentNode.insertBefore(errorRow, tr.nextElementSibling);
  }
  errorRow.firstChild.textContent = message;
}

// 요약 카드 4개(전체 사용률 큰 카드 + 작은 카드 3개)를 채운다
function renderSummary() {
  const totals = calcTotals(events);
  document.getElementById("total-budget").textContent = formatWon(totals.budget);
  document.getElementById("total-spent").textContent = formatWon(totals.spent);

  const remaining = document.getElementById("total-remaining");
  const rate = document.getElementById("total-rate");
  fillMeter(document.getElementById("total-meter"), totals.budget, totals.spent,
    "meter meter-wide");

  // 행사가 없으면 예산이 0원이라 사용률을 계산할 수 없다. 빈칸 대신 "–"와 안내를 보여 준다
  if (events.length === 0) {
    remaining.textContent = formatWon(0);
    remaining.className = "card-value";
    rate.textContent = "–";
    rate.className = "hero-value is-empty";
    document.getElementById("status-counts").textContent = "아직 행사가 없습니다";
    return;
  }

  // 전체가 예산을 넘으면 표처럼 남은 금액을 빨간 글자로 보인다
  remaining.textContent = formatWon(calcRemaining(totals.budget, totals.spent));
  remaining.className = isOverBudget(totals.budget, totals.spent) ? "card-value negative" : "card-value";
  rate.textContent = formatRate(calcUsageRate(totals.budget, totals.spent));
  rate.className = "hero-value";

  renderStatusCounts();
}

// 행사가 없을 때 표 안에 보여 주는 안내 한 줄
function renderEmptyRow(tbody) {
  const td = document.createElement("td");
  td.colSpan = 7;
  td.append("아직 행사가 없습니다. 위의 ");
  const strong = document.createElement("strong");
  strong.textContent = "행사 추가";
  td.append(strong, "에서 첫 행사를 넣어 주세요.");
  const tr = document.createElement("tr");
  tr.className = "empty-row";
  tr.appendChild(td);
  tbody.appendChild(tr);
}

// 행사가 없으면 내보내거나 지울 것이 없으므로 버튼을 누를 수 없게 한다
function renderButtons() {
  const isEmpty = events.length === 0;
  document.getElementById("export-csv").disabled = isEmpty;
  document.getElementById("open-sheets").disabled = isEmpty;
  document.getElementById("reset-events").disabled = isEmpty;
  // 행사를 다시 추가하면 "새로 시작했습니다" 안내는 더 필요 없다
  if (!isEmpty) {
    document.getElementById("reset-done").hidden = true;
  }
}

// "✓ 정상 1  ! 주의 1  ▲ 초과 1"처럼 상태별 행사 개수를 보여 준다
function renderStatusCounts() {
  const box = document.getElementById("status-counts");
  box.textContent = "";
  const counts = countStatuses(events);
  if (counts === null) {
    return;
  }
  for (const status of ["정상", "주의", "초과"]) {
    const badge = document.createElement("span");
    badge.className = "status " + statusClass[status];
    badge.textContent = statusIcon[status] + " " + status + " " + counts[status];
    box.appendChild(badge);
  }
}

// 요약 카드와 표, 버튼 상태를 모두 다시 그린다
function render() {
  renderSummary();
  renderEvents();
  renderButtons();
}

// "행사 추가" 버튼을 누르거나 입력칸에서 Enter를 누르면 실행된다
function handleAddEvent(e) {
  // 폼의 기본 동작(페이지 새로고침)을 막는다. 막지 않으면 입력한 내용이 사라진다
  e.preventDefault();

  const nameInput = document.getElementById("event-name");
  const budgetInput = document.getElementById("event-budget");
  const errorMessage = document.getElementById("add-event-error");

  const name = nameInput.value.trim();
  if (name === "") {
    errorMessage.textContent = "행사명을 입력해 주세요.";
    nameInput.focus();
    return;
  }
  if (hasEventName(events, name)) {
    // 같은 이름이 두 개 있으면 지출을 어느 행에 넣을지 헷갈리므로 막는다
    errorMessage.textContent = "이미 있는 행사명입니다.";
    nameInput.focus();
    return;
  }

  const result = checkAmount(budgetInput.value);
  if (result.error !== null) {
    // 잘못된 금액은 저장하지 않는다. 입력한 내용은 남겨 두어 바로 고칠 수 있게 한다
    errorMessage.textContent = "예산: " + result.error;
    budgetInput.focus();
    return;
  }

  // 새 행사는 아직 지출이 없으므로 0원으로 시작한다
  events.push({ name: name, budget: result.amount, spent: 0 });
  saveEvents();
  render();

  // 다음 행사를 바로 입력할 수 있게 칸을 비운다
  errorMessage.textContent = "";
  nameInput.value = "";
  budgetInput.value = "";
  nameInput.focus();
}

// 오늘 날짜를 "2026-10-30" 모양의 글자로 만든다. 파일 이름에 쓴다
function todayText() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// 지금 시각을 "1530"(15시 30분) 모양의 글자로 만든다. 백업 파일 이름에 쓴다
function timeText() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return hour + minute;
}

// 지금 행사 목록을 CSV 파일로 내려받는다. 내보내기와 백업이 같이 쓴다
function downloadCsv(fileName) {
  const csv = makeCsv(events);
  if (csv === null) {
    return;
  }
  // 맨 앞의 \uFEFF(BOM)는 "이 파일은 UTF-8"이라는 표시다. 없으면 엑셀에서 한글이 깨진다
  const file = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  // 파일을 가리키는 임시 주소를 만들고, 보이지 않는 링크를 눌러 내려받게 한다
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // 내려받기가 시작된 뒤에 임시 주소를 지운다. 바로 지우면 일부 브라우저에서 내려받기가 실패한다
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);
}

// "CSV로 내보내기" 버튼을 누르면 지금 행사 목록을 CSV 파일로 내려받는다
function handleExportCsv() {
  downloadCsv("학생회-예산-" + todayText() + ".csv");
}

// "새로 시작하기" 버튼: 확인을 받고, 지금 내용을 CSV로 백업한 뒤, 행사를 모두 지운다
// 백업 CSV는 다시 불러올 수 없다(CSV는 내보내기만 함). 엑셀이나 구글 시트에서 보는 기록용이다
function handleResetEvents() {
  const ok = window.confirm(
    "정말 지울까요?\n\n"
    + "행사 " + events.length + "개와 지출 기록을 모두 지웁니다.\n"
    + "지우기 전에 지금 내용을 CSV 파일로 내려받습니다. 다운로드 폴더를 확인해 주세요."
  );
  if (!ok) {
    return;
  }

  // 지우기 전에 백업한다. 이름에 시각을 넣어 보통 내보내기 파일과 구분한다
  downloadCsv("학생회-예산-백업-" + todayText() + "-" + timeText() + ".csv");

  // events는 const라서 새 목록을 넣을 수 없으므로, 안의 행사를 모두 빼서 비운다
  events.length = 0;
  saveEvents();
  render();
  document.getElementById("sheets-help").hidden = true;
  document.getElementById("reset-done").hidden = false;
}

// 빈 구글 시트를 새로 만드는 주소. 링크로 창만 열고, 데이터는 보내지 않는다 (CLAUDE.md 예외)
const SHEETS_URL = "https://sheets.new";

// "구글 시트로 열기" 버튼: CSV를 내려받고, 새 창에 빈 구글 시트를 연다
// 구글 시트에 내용을 자동으로 넣으려면 API가 필요하므로, 파일은 사용자가 직접 올리도록 안내한다
function handleOpenSheets() {
  handleExportCsv();
  // noopener: 새 창이 이 페이지를 건드리지 못하게 한다
  window.open(SHEETS_URL, "_blank", "noopener");
  document.getElementById("sheets-help").hidden = false;
}

document.getElementById("add-event-form").addEventListener("submit", handleAddEvent);
document.getElementById("export-csv").addEventListener("click", handleExportCsv);
document.getElementById("reset-events").addEventListener("click", handleResetEvents);
document.getElementById("open-sheets").addEventListener("click", handleOpenSheets);

render();
