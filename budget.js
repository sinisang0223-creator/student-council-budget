// 예산 계산 로직
// 화면(HTML)과 분리해 두어서, 계산이 맞는지 test.html로 따로 확인할 수 있다.
// 잘못된 입력이 들어오면 계산하지 않고 null을 돌려준다.

// 금액 규칙
// - 예산, 새로 입력하는 지출: 1원 이상의 정수
// - 행사의 총 지출: 0원 이상의 정수 (새 행사는 아직 지출이 없으므로)

// 입력값이 올바른 금액인지 검사한다.
// 결과는 { amount: 금액, error: 잘못된 이유 } 모양이다.
// 올바르면 error가 null, 잘못되면 amount가 null이다.
// minimum은 허용하는 가장 작은 금액이다. 적지 않으면 1원.
// 예: "800,000원" → { amount: 800000, error: null }
//     "0"        → { amount: null, error: "1원 이상 입력해 주세요." }
function checkAmount(value, minimum) {
  if (minimum === undefined) {
    minimum = 1;
  }

  let number;
  if (typeof value === "number") {
    number = value;
  } else if (typeof value === "string") {
    // 쉼표, 공백, 끝의 "원"을 지운다
    const cleaned = value.replace(/,/g, "").replace(/\s/g, "").replace(/원$/, "");
    if (cleaned === "") {
      return { amount: null, error: "금액을 입력해 주세요." };
    }
    // 숫자(앞에 - 와 중간에 . 하나까지)만 허용한다. "1e3", "0x10" 같은 것도 막는다
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
      return { amount: null, error: "숫자만 입력해 주세요." };
    }
    number = Number(cleaned);
  } else if (value === null || value === undefined) {
    return { amount: null, error: "금액을 입력해 주세요." };
  } else {
    return { amount: null, error: "숫자만 입력해 주세요." };
  }

  if (!Number.isFinite(number)) {
    return { amount: null, error: "숫자만 입력해 주세요." };
  }
  if (!Number.isInteger(number)) {
    return { amount: null, error: "원 단위 정수로 입력해 주세요." };
  }
  if (number < minimum) {
    return { amount: null, error: minimum + "원 이상 입력해 주세요." };
  }
  return { amount: number, error: null };
}

// 입력값을 금액으로 바꾼다. 잘못된 값이면 null. 규칙은 checkAmount와 같다.
// 예: 800000 → 800000, "800,000" → 800000, "800,000원" → 800000
function parseAmount(value, minimum) {
  return checkAmount(value, minimum).amount;
}

// 사용률(%). 반올림하지 않은 값을 돌려준다. 화면에 보여줄 때는 formatRate를 쓴다.
function calcUsageRate(budget, spent) {
  const b = parseAmount(budget);
  const s = parseAmount(spent, 0);
  if (b === null || s === null) {
    return null;
  }
  return (s / b) * 100;
}

// 남은 금액. 초과했으면 음수가 된다.
function calcRemaining(budget, spent) {
  const b = parseAmount(budget);
  const s = parseAmount(spent, 0);
  if (b === null || s === null) {
    return null;
  }
  return b - s;
}

// 쓴 돈이 예산보다 많으면 true. 정확히 100%는 초과가 아니다.
function isOverBudget(budget, spent) {
  const b = parseAmount(budget);
  const s = parseAmount(spent, 0);
  if (b === null || s === null) {
    return null;
  }
  return s > b;
}

// 상태 판단. 반올림한 사용률이 아니라 지출과 예산을 직접 비교한다.
// 지출 < 예산이면 "정상", 지출 = 예산이면 "주의", 지출 > 예산이면 "초과"
// 예: 예산 1,000,000원에 지출 999,600원(99.96%)은 "정상"
function getStatus(budget, spent) {
  const b = parseAmount(budget);
  const s = parseAmount(spent, 0);
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

// 지금까지의 지출에 새로 입력한 지출을 더한다 (누적).
// 결과는 { spent: 더한 뒤 총 지출, error: 잘못된 이유 } 모양이다.
// 새로 입력하는 지출은 1원 이상이어야 한다. 잘못되면 spent는 null.
// 예: addSpending(700000, "100,000") → { spent: 800000, error: null }
function addSpending(currentSpent, input) {
  const current = parseAmount(currentSpent, 0);
  if (current === null) {
    return { spent: null, error: "지금까지의 지출 금액이 올바르지 않습니다." };
  }
  const result = checkAmount(input);
  if (result.error !== null) {
    return { spent: null, error: result.error };
  }
  return { spent: current + result.amount, error: null };
}

// 행사 목록에 같은 이름의 행사가 이미 있으면 true. 앞뒤 공백은 무시하고 비교한다.
// 예: "  체육대회 "는 "체육대회"와 같은 이름으로 본다. "체육 대회"(가운데 공백)는 다른 이름이다.
function hasEventName(events, name) {
  const target = String(name).trim();
  for (const event of events) {
    if (String(event.name).trim() === target) {
      return true;
    }
  }
  return false;
}

// 행사 목록의 총 예산과 총 지출을 더한다.
// 목록 예: [{ name: "체육대회", budget: 1200000, spent: 1200000 }, ...]
// 잘못된 금액이 하나라도 있으면 null (화면에서는 입력할 때 checkAmount로 미리 막는다)
function calcTotals(events) {
  let totalBudget = 0;
  let totalSpent = 0;
  for (const event of events) {
    const b = parseAmount(event.budget);
    const s = parseAmount(event.spent, 0);
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
// 100% 초과는 반올림해도 최소 100.1%로 보인다. 예: 100.04 → "100.1%"
// (반올림으로 "100.0%"가 되면 상태가 "주의"인 것처럼 헷갈리기 때문)
function formatRate(rate) {
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    return "";
  }
  let text = rate.toFixed(1);
  if (rate < 100 && text === "100.0") {
    text = "99.9";
  }
  if (rate > 100 && text === "100.0") {
    text = "100.1";
  }
  return text + "%";
}
