<div align="center">
  <img src="assets/logo-black.svg" alt="buchida" width="280" />
  <p><strong>CJKサポートを備えた開発者向けメールAPI</strong></p>

  [English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

  [![npm version](https://img.shields.io/npm/v/buchida)](https://www.npmjs.com/package/buchida) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

[buchida](https://buchida.com)メールAPIの公式Node.js SDKです。

## インストール

```bash
npm install buchida
```

```bash
pnpm add buchida
```

```bash
yarn add buchida
```

## クイックスタート

```typescript
import { Buchida } from "buchida";

const buchida = new Buchida("bc_live_xxxxxxxxxxxxxxxxxxxxx");

const { id } = await buchida.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "buchidaへようこそ！",
  html: "<h1>こんにちは！</h1><p>ご登録ありがとうございます。</p>",
});

console.log(`メール送信完了: ${id}`);
```

## 特徴

- 完全なTypeScript型サポート
- ESM + CJSデュアルエクスポート
- 依存関係ゼロ（ネイティブ`fetch`使用）
- Node.js 18+

## ドキュメント

- [クイックスタート](https://buchida.com/ja/docs/quickstart)
- [APIリファレンス](https://buchida.com/ja/docs/sending-email)
- [GitHub](https://github.com/Vyblor/buchida-node)

## ライセンス

MIT
