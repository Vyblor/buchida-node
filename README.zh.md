<div align="center">
  <img src="assets/logo-black.svg" alt="buchida" width="280" />
  <p><strong>支持CJK的开发者优先邮件API</strong></p>

  [English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

  [![npm version](https://img.shields.io/npm/v/buchida)](https://www.npmjs.com/package/buchida) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

[buchida](https://buchida.com)邮件API的官方Node.js SDK。

## 安装

```bash
npm install buchida
```

```bash
pnpm add buchida
```

```bash
yarn add buchida
```

## 快速开始

```typescript
import { Buchida } from "buchida";

const buchida = new Buchida("bc_live_xxxxxxxxxxxxxxxxxxxxx");

const { id } = await buchida.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "欢迎使用buchida！",
  html: "<h1>你好！</h1><p>欢迎加入。</p>",
});

console.log(`邮件发送成功: ${id}`);
```

## 特性

- 完整的TypeScript类型支持
- ESM + CJS双格式导出
- 零依赖（原生`fetch`）
- Node.js 18+

## 文档

- [快速开始](https://buchida.com/zh/docs/quickstart)
- [API参考](https://buchida.com/zh/docs/sending-email)
- [GitHub](https://github.com/Vyblor/buchida-node)

## 许可证

MIT
