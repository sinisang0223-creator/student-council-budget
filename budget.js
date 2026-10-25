// 예산 계산 로직
// 화면(HTML)과 분리해 두어서, 계산이 맞는지 test.html로 따로 확인할 수 있다.
// 잘못된 입력이 들어오면 계산하지 않고 null을 돌려준다.

// 입력값을 1원 이상의 정수 금액으로 바꾼다.
// 예: 800000 → 800000, "800,000" → 800000, "800,000원" → 800000
// 0원, 음수, 소수, 글자, 빈 값이면 null
function parseAmount(value) {
  let number;

  if (typeof value === "number") {
    number = value;
  } else if (typeof value === "string") {
    // 쉼표, 공백, 끝의 "원"을 지운다
    const cleaned = value.replace(/,/g, "").replace(/\s/g, "").replace(/원$/, "");
    if (cleaned === "") {
      return null;
    }
    number = Number(cleaned);
  } else {
    return null;
  }

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }
  return number;
}

// 사용률(%). 반올림하지 않은 값을 돌려준다. 화면에 보여줄 때는 formatRate를 쓴다.
function calcUsageRate(budget, spent) {
  const b = parseAmount(budget);
  const s = parseAmount(spent);
  if (b === null || s === null) {
    return null;
  }
  return (s / b) * 100;
}

// 남은 금액. 초과했으면 음수가 된다.
function calcRemaining(budget, spent) {
  const b = parseAmount(budget);
  const s = parseAmount(spent);
  if (b === null || s === null) {
    return null;
  }
  return b - s;
}

// 쓴 돈이 예산보다 많으면 true. 정확히 100%는 초과가 아니다.
function isOverBudget(budget, spent) {
  const b = parseAmount(budget);
  const s = parseAmount(spent);
  if (b === null || s === null) {
    return null;
  }
  return s > b;
}

// 상태 판단. 반올림한 사용률이 아니라 지출과 예산을 직접 비교한다.
// 지출 < 예산이면 "정상", 지출 = 예산이면 "주의", 지출 > 예산이면 "초과"
// 예: 예산 1,000,000원에 지출 999,600원(99.96%)은 화면에 100.0%로 보여도 "정상"
function getStatus(budget, spent) {
  const b = parseAmount(budget);
  const s = parseAmount(spent);
  if (b === null || s === null) {
    return null;
  }
  if (s < b) {
    return "정상";
  }
  if (s === b) {
    return "주의";
  }
  return "초과";
}

// 행사 목록의 총 예산과 총 지출을 더한다.
// 목록 예: [{ name: "체육대회", budget: 1200000, spent: 1200000 }, ...]
// 잘못된 금액이 하나라도 있으면 null (잘못된 행 처리는 4단계에서 정한다)
function calcTotals(events) {
  let totalBudget = 0;
  let totalSpent = 0;
  for (const event of events) {
    const b = parseAmount(event.budget);
    const s = parseAmount(event.spent);
    if (b === null || s === null) {
      return null;
    }
    totalBudget += b;
    totalSpent += s;
  }
  return { budget: totalBudget, spent: totalSpent };
}

// 금액을 화면용 글자로 바꾼다. 예: 800000 → "800,000원", -50000 → "-50,000원"
function formatWon(amount) {
  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    return "";
  }
  return amount.toLocaleString("ko-KR") + "원";
}

// 사용률을 화면용 글자로 바꾼다. 소수 첫째 자리까지 표시. 예: 83.36 → "83.4%"
// 100% 미만은 반올림해도 최대 99.9%까지만 보인다. 예: 99.96 → "99.9%"
// (반올림으로 "100.0%"가 되면 상태가 "주의"인 것처럼 헷갈리기 때문)
function formatRate(rate) {
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    return "";
  }
  let text = rate.toFixed(1);
  if (rate < 100 && text === "100.0") {
    text = "99.9";
  }
  return text + "%";
}
