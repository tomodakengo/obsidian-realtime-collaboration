# Quick Start Guide

このガイドでは、Obsidian Realtime Collaboration Pluginを素早くセットアップして動作確認を行う手順を説明します。

## 🚀 5分で始める

### 1. 環境の確認

```bash
# Node.jsのバージョン確認
node --version  # v18.0.0以上が必要

# npmのバージョン確認
npm --version   # v8.0.0以上が必要

# Gitの確認
git --version
```

### 2. プロジェクトのクローン

```bash
git clone <repository-url>
cd obsidian-realtime-collaboration
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. ビルド

```bash
npm run build
```

### 5. テスト実行

```bash
npm test
```

## 🔧 基本的な開発サイクル

### 開発モードでの作業

```bash
# ウォッチモードでビルド（ファイル変更時に自動ビルド）
npm run dev
```

### テストの実行

```bash
# 全テスト実行
npm test

# 特定のテストファイル
npm test -- test/yjsManager.spec.ts

# ウォッチモード
npm run test:watch
```

### コードの品質チェック

```bash
# ビルドチェック
npm run build

# テストカバレッジ
npm run test:coverage
```

## 📱 Obsidianでの動作確認

### 1. プラグインのインストール

```bash
# Obsidianのプラグインフォルダを開く
# 通常は以下のパス:
# - Windows: %APPDATA%\Obsidian\plugins\
# - macOS: ~/Library/Application Support/Obsidian/plugins/
# - Linux: ~/.config/Obsidian/plugins/

# プラグインをコピー
cp -r dist/* /path/to/obsidian/plugins/collaborative-editor/
cp manifest.json /path/to/obsidian/plugins/collaborative-editor/
```

### 2. プラグインの有効化

1. Obsidianを開く
2. 設定 → プラグイン
3. 「Collaborative Editor」を有効化
4. コンソールでログを確認

### 3. 動作確認

1. 新しいノートを作成
2. テキストを入力
3. 別のブラウザ/タブで同じルームに参加
4. リアルタイム同期を確認

## 🧪 サンプルコード

### 基本的な使用例

```typescript
// main.tsでの基本的な統合
import { Plugin } from 'obsidian'
import { YjsManager } from './src/collaborative/YjsManager'

export default class CollaborativePlugin extends Plugin {
  private yjsManager?: YjsManager

  async onload() {
    // Y.jsマネージャーの初期化
    this.yjsManager = new YjsManager('my-document', {
      enableIndexeddb: true,
      enableWebrtc: true,
      roomName: 'test-room'
    })

    // 接続開始
    this.yjsManager.connect()

    // 文書変更の監視
    this.yjsManager.onDocumentChange((event) => {
      console.log('Document changed:', event)
    })
  }
}
```

### カスタム設定

```typescript
// カスタムシグナリングサーバー
const yjsManager = new YjsManager('doc-id', {
  enableIndexeddb: true,
  enableWebrtc: true,
  roomName: 'custom-room',
  signalingServers: [
    'wss://my-signaling-server.com',
    'wss://backup-server.com'
  ],
  password: 'room-password'
})
```

## 🐛 よくある問題と解決方法

### ビルドエラー

```bash
# 依存関係の問題
rm -rf node_modules package-lock.json
npm install

# TypeScriptエラー
npm run build:check
```

### テストエラー

```bash
# テスト環境のリセット
npm run test:reset

# 特定のテストのみ実行
npm test -- --grep "YjsManager"
```

### プラグインが読み込まれない

- Obsidianのバージョンを確認（v0.15.0以上）
- プラグインフォルダのパーミッションを確認
- コンソールでエラーメッセージを確認

## 📊 パフォーマンス監視

### 基本的な監視

```typescript
// メモリ使用量の監視
setInterval(() => {
  const usage = process.memoryUsage()
  console.log('Memory usage:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`
  })
}, 30000)
```

### 接続状態の監視

```typescript
// 接続状態の監視
yjsManager.onConnectionChange((connected) => {
  console.log('Connection:', connected ? '🟢 Connected' : '🔴 Disconnected')
})
```

## 🔒 セキュリティ設定

### 基本的なセキュリティ

```typescript
// パスワード保護されたルーム
const yjsManager = new YjsManager('secure-doc', {
  enableWebrtc: true,
  roomName: 'secure-room',
  password: 'strong-password-123'
})
```

### 暗号化の有効化

```typescript
// 暗号化マネージャーの使用
import { EncryptionManager } from './src/security/EncryptionManager'

const encryptionManager = new EncryptionManager()
const key = await encryptionManager.generateRoomKey('password', salt)
```

## 📚 次のステップ

### 学習リソース

1. **README.md** - プロジェクトの概要とセットアップ
2. **DEVELOPMENT.md** - 詳細な開発ガイド
3. **TODO.md** - 実装状況と今後の計画

### 実装すべき機能

- [ ] ユーザー認証システム
- [ ] リアルタイムユーザー表示
- [ ] ファイル共有機能
- [ ] オフライン対応

### コミュニティ参加

- GitHub Issuesで問題を報告
- GitHub Discussionsで質問
- プルリクエストで貢献

## 🆘 サポート

### 即座に解決したい場合

1. **GitHub Issues**で問題を検索
2. **README.md**のトラブルシューティングを確認
3. **DEVELOPMENT.md**のデバッグ手法を参照

### コミュニティでの質問

- 技術的な質問: GitHub Discussions
- バグ報告: GitHub Issues
- 機能要求: GitHub Issues（ラベル「enhancement」）

---

**注意**: このプラグインは開発中です。本番環境での使用は推奨されません。

**ヒント**: 問題が解決しない場合は、詳細な情報（OS、Node.jsバージョン、エラーメッセージなど）と一緒にGitHub Issuesを作成してください。