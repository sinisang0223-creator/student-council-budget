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

// 금액을 화면용 글자로 바꾼다. 예: 800000 → "800,000원", -50000 → "-50,000원"
function formatWon(amount) {
  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    return "";
  }
  return amount.toLocaleString("ko-KR") + "원";
}

// 사용률을 화면용 글자로 바꾼다. 소수 첫째 자리까지 표시. 예: 83.36 → "83.4%"
function formatRate(rate) {
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    return "";
  }
  return rate.toFixed(1) + "%";
}
