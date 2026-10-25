// 화면 채우기
// 계산은 budget.js 함수에 맡기고, 여기서는 그 결과를 화면에 넣기만 한다.

// 가짜 예시 데이터 (실제 행사·사람 정보 아님)
const events = [
  { name: "신입생 환영회", budget: 800000, spent: 667200 },
  { name: "체육대회", budget: 1200000, spent: 1200000 },
  { name: "학과 축제 부스", budget: 500000, spent: 560000 }
];

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

// 행사 목록으로 표를 채운다
function renderEvents() {
  const tbody = document.getElementById("event-rows");

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

    tbody.appendChild(tr);
  }
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

renderSummary();
renderEvents();
