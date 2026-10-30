// 화면 채우기
// 계산은 budget.js 함수에 맡기고, 여기서는 그 결과를 화면에 넣기만 한다.

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

  for (const event of events) {
    const remaining = calcRemaining(event.budget, event.spent);
    const status = getStatus(event.budget, event.spent);

    const tr = document.createElement("tr");
    tr.appendChild(makeCell(event.name));
    tr.appendChild(makeCell(formatWon(event.budget), "num"));
    tr.appendChild(makeCell(formatWon(event.spent), "num"));
    tr.appendChild(makeCell(formatWon(remaining), remaining < 0 ? "num negative" : "num"));
    tr.appendChild(makeCell(formatRate(calcUsageRate(event.budget, event.spent)), "num"));

    const badge = document.createElement("span");
    badge.className = "status " + statusClass[status];
    badge.textContent = status;
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

// 요약 카드 4개를 채운다
function renderSummary() {
  const totals = calcTotals(events);
  document.getElementById("total-budget").textContent = formatWon(totals.budget);
  document.getElementById("total-spent").textContent = formatWon(totals.spent);
  document.getElementById("total-remaining").textContent =
    formatWon(calcRemaining(totals.budget, totals.spent));
  document.getElementById("total-rate").textContent =
    formatRate(calcUsageRate(totals.budget, totals.spent));
}

// 요약 카드와 표를 모두 다시 그린다
function render() {
  renderSummary();
  renderEvents();
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

document.getElementById("add-event-form").addEventListener("submit", handleAddEvent);

render();
