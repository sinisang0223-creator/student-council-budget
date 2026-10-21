# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

학생회 행사 예산 모니터링 대시보드. 사용자는 한국 대학 학생회 임원이다.

## 기술 제약

- HTML, CSS, 바닐라 JavaScript만 쓴다.
- npm, 빌드 도구, 외부 서버, API 키를 쓰지 않는다. `index.html`을 브라우저로 바로 열면 동작해야 한다.
- 계산 로직(사용률, 남은 금액, 초과 판단)은 `budget.js`에 따로 둔다.

## 화면과 데이터

- 화면 문구는 한국어로 쓴다.
- 금액은 원 단위에 천 단위 쉼표를 붙인다. 예: `800,000원`
- 예시 데이터는 가짜로 만든다. 실제 사람 이름이나 계좌번호를 넣지 않는다.

## 작업 방식

- 한 번에 한 단계만 작업하고, 끝나면 멈춰서 사용자 확인을 받는다.
- 새 파일을 만들기 전에 먼저 물어본다.
- 사용자는 HTML/JS 초보다. 변경할 때마다 무엇을 왜 바꿨는지 한국어로 짧게 설명한다.
