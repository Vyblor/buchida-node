<div align="center">
  <img src="assets/logo-black.svg" alt="buchida" width="280" />
  <p><strong>CJK 지원을 갖춘 개발자 중심 이메일 API</strong></p>

  [English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

  [![npm version](https://img.shields.io/npm/v/buchida)](https://www.npmjs.com/package/buchida) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

[buchida](https://buchida.com) 이메일 API의 공식 Node.js SDK입니다.

## 설치

```bash
npm install buchida
```

```bash
pnpm add buchida
```

```bash
yarn add buchida
```

## 빠른 시작

```typescript
import { Buchida } from "buchida";

const buchida = new Buchida("bc_live_xxxxxxxxxxxxxxxxxxxxx");

const { id } = await buchida.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "buchida에 오신 것을 환영합니다!",
  html: "<h1>안녕하세요!</h1><p>가입을 환영합니다.</p>",
});

console.log(`이메일 발송 완료: ${id}`);
```

## 주요 기능

- 완전한 TypeScript 타입 지원
- ESM + CJS 듀얼 익스포트
- 의존성 없음 (네이티브 `fetch` 사용)
- Node.js 18+

## 문서

- [빠른 시작 가이드](https://buchida.com/ko/docs/quickstart)
- [API 레퍼런스](https://buchida.com/ko/docs/sending-email)
- [GitHub](https://github.com/Vyblor/buchida-node)

## 라이선스

MIT
