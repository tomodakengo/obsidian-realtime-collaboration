# Development Guide

このドキュメントは、Obsidian Realtime Collaboration Pluginの開発者向けガイドです。

## 🏗️ アーキテクチャ概要

### 全体構造

```
obsidian-realtime-collaboration/
├── src/
│   ├── collaborative/          # 協同編集コアロジック
│   │   ├── YjsManager.ts      # Y.js文書管理
│   │   ├── P2PProvider.ts     # WebRTC P2P通信
│   │   └── ObsidianEditorBinding.ts # エディター統合
│   ├── security/              # セキュリティ層
│   │   ├── EncryptionManager.ts # 暗号化機能
│   │   └── AccessControl.ts   # アクセス制御
│   ├── ui/                    # UI コンポーネント
│   │   ├── UserAwareness.ts   # ユーザー存在表示
│   │   └── ShareDialog.ts     # 共有ダイアログ
│   └── types/                 # 型定義
├── test/                      # テストファイル
├── dist/                      # ビルド出力
└── docs/                      # ドキュメント
```

### データフロー

```
Obsidian Editor ↔ ObsidianEditorBinding ↔ YjsManager ↔ P2PProvider ↔ WebRTC Network
                ↓
            UserAwareness
                ↓
            EncryptionManager + AccessControl
```

## 🔧 開発環境のセットアップ

### 必須ツール

- **Node.js**: v18.0.0以上
- **npm**: v8.0.0以上
- **Git**: 最新版
- **VS Code**: 推奨エディター

### 推奨拡張機能

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "eamodio.gitlens",
    "ms-vscode.vscode-js-debug"
  ]
}
```

### 環境変数の設定

`.env.local`ファイルを作成:
```bash
# 開発環境
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# テスト環境
VITEST_ENV=test
TEST_DB_PATH=./test-data

# 開発用シグナリングサーバー
SIGNALING_SERVER_DEV=wss://localhost:3000
```

## 📝 コーディング規約

### TypeScript規約

#### 型定義
```typescript
// インターフェースは大文字で始める
export interface UserAwarenessOptions {
  maxUsers?: number
  userTimeout?: number
}

// 列挙型は大文字で始める
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected'
}

// 型エイリアスは大文字で始める
export type UserId = string
export type RoomName = string
```

#### クラス設計
```typescript
export class YjsManager {
  // プライベートフィールドは_で始める
  private readonly _doc: Y.Doc
  private readonly _providers: Map<string, any>
  
  // パブリックメソッドは動詞で始める
  public connect(): void
  public disconnect(): void
  
  // プライベートメソッドは_で始める
  private _setupProviders(): void
  private _handleConnectionChange(): void
}
```

#### エラーハンドリング
```typescript
try {
  const result = await this.performOperation()
  return result
} catch (error) {
  // エラーログを記録
  this.logger.error('Operation failed', { error, context: 'YjsManager' })
  
  // 適切なエラーを再スロー
  throw new CollaborativeError('Failed to perform operation', { cause: error })
}
```

### 命名規約

#### ファイル名
- クラスファイル: `PascalCase.ts` (例: `YjsManager.ts`)
- ユーティリティファイル: `camelCase.ts` (例: `textUtils.ts`)
- テストファイル: `*.spec.ts` (例: `yjsManager.spec.ts`)

#### 変数名
```typescript
// 定数は大文字とアンダースコア
const MAX_CONNECTIONS = 20
const DEFAULT_TIMEOUT = 30000

// 変数はcamelCase
let connectionCount = 0
let isConnected = false

// ブール値はis/has/canで始める
const isInitialized = true
const hasPermission = false
const canConnect = true
```

### コメント規約

#### JSDoc形式
```typescript
/**
 * Y.js文書を管理し、協同編集機能を提供するクラス
 * 
 * @example
 * ```typescript
 * const manager = new YjsManager('doc-id')
 * const text = manager.getText('content')
 * text.insert(0, 'Hello, World!')
 * ```
 */
export class YjsManager {
  /**
   * 新しいYjsManagerインスタンスを作成
   * 
   * @param documentId - 文書の一意ID
   * @param options - 設定オプション
   * @throws {Error} 無効なdocumentIdが指定された場合
   */
  constructor(documentId: string, options?: YjsManagerOptions) {
    // 実装
  }
}
```

#### インラインコメント
```typescript
// 複雑なロジックには説明を追加
const commonPrefix = this.findCommonPrefix(newContent, oldContent)
const commonSuffix = this.findCommonSuffix(newContent, oldContent, commonPrefix)

// 変更を適用（削除 → 挿入の順序で実行）
if (endPos > startPos) {
  this.ytext.delete(startPos, endPos)
}
if (newText.length > 0) {
  this.ytext.insert(startPos, newText)
}
```

## 🧪 テスト戦略

### テストピラミッド

```
    E2E Tests (少数)
        ↑
   Integration Tests (中程度)
        ↑
  Unit Tests (多数)
```

### テストファイルの構造

```typescript
describe('YjsManager', () => {
  let manager: YjsManager
  let mockDoc: Y.Doc

  beforeEach(() => {
    // セットアップ
    mockDoc = new Y.Doc()
    manager = new YjsManager('test-doc', { doc: mockDoc })
  })

  afterEach(() => {
    // クリーンアップ
    manager.destroy()
    mockDoc.destroy()
  })

  describe('Document Management', () => {
    it('creates a new document', () => {
      // テスト実装
    })

    it('handles document changes', () => {
      // テスト実装
    })
  })

  describe('Connection Management', () => {
    it('connects to P2P network', () => {
      // テスト実装
    })
  })
})
```

### モックとスタブ

```typescript
// 依存関係のモック
vi.mock('y-webrtc', () => ({
  WebrtcProvider: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    awareness: {
      getLocalState: vi.fn(() => ({ user: { name: 'Test User' } }))
    }
  }))
}))

// テスト用のスタブ
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}
```

### テストカバレッジ

```bash
# カバレッジレポートの生成
npm run test:coverage

# 特定のファイルのカバレッジ
npm run test:coverage -- --include="src/collaborative/**/*.ts"
```

目標: **80%以上**のカバレッジを維持

## 🐛 デバッグ手法

### ログシステム

```typescript
export class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO

  public log(level: LogLevel, message: string, context?: any): void {
    if (level >= this.logLevel) {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] [${level}] ${message}`
      
      if (context) {
        console.log(logMessage, context)
      } else {
        console.log(logMessage)
      }
    }
  }
}

// 使用例
this.logger.debug('Y.js document changed', { 
  documentId: this.documentId, 
  changeType: event.type 
})
```

### デバッグモード

```typescript
// 開発環境でのデバッグ情報
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', {
    documentId: this.documentId,
    providers: Array.from(this.providers.keys()),
    awareness: this.awareness.getStates()
  })
}
```

### パフォーマンス監視

```typescript
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  public startTimer(operation: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(operation, duration)
    }
  }

  public recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    this.metrics.get(operation)!.push(value)
  }

  public getAverageTime(operation: string): number {
    const values = this.metrics.get(operation) || []
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
}
```

## 🔄 開発ワークフロー

### Gitワークフロー

#### ブランチ戦略
```
main (本番)
├── develop (開発)
│   ├── feature/user-awareness
│   ├── feature/encryption
│   └── bugfix/connection-issue
└── release/v1.0.0
```

#### コミットメッセージ
```
feat: add user awareness display
fix: resolve connection timeout issue
docs: update API documentation
test: add integration tests for P2P
refactor: simplify Y.js integration
style: format code with Prettier
```

### コードレビュープロセス

1. **プルリクエストの作成**
   - 明確なタイトルと説明
   - 関連するIssueへのリンク
   - 変更内容の要約

2. **レビューのポイント**
   - コードの品質と可読性
   - テストの適切性
   - パフォーマンスへの影響
   - セキュリティの考慮

3. **承認条件**
   - 最低1人のレビュー承認
   - 全テストが通る
   - コードカバレッジ80%以上
   - リンターエラーなし

### 継続的インテグレーション

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run test:coverage
```

## 📊 パフォーマンス最適化

### メモリ管理

```typescript
export class MemoryManager {
  private readonly maxMemoryUsage = 100 * 1024 * 1024 // 100MB
  private readonly cleanupThreshold = 0.8 // 80%

  public checkMemoryUsage(): void {
    const usage = process.memoryUsage()
    
    if (usage.heapUsed > this.maxMemoryUsage * this.cleanupThreshold) {
      this.performCleanup()
    }
  }

  private performCleanup(): void {
    // 古いデータの削除
    // ガベージコレクションの促進
    // キャッシュのクリア
  }
}
```

### 接続プーリング

```typescript
export class ConnectionPool {
  private connections: Map<string, WebRTCConnection> = new Map()
  private readonly maxConnections = 20

  public getConnection(roomId: string): WebRTCConnection {
    if (this.connections.has(roomId)) {
      return this.connections.get(roomId)!
    }

    if (this.connections.size >= this.maxConnections) {
      this.evictOldestConnection()
    }

    const connection = this.createConnection(roomId)
    this.connections.set(roomId, connection)
    return connection
  }
}
```

### バッチ処理

```typescript
export class BatchProcessor {
  private batch: any[] = []
  private readonly batchSize = 100
  private readonly flushInterval = 1000 // 1秒

  public addToBatch(item: any): void {
    this.batch.push(item)
    
    if (this.batch.length >= this.batchSize) {
      this.flushBatch()
    }
  }

  private flushBatch(): void {
    if (this.batch.length > 0) {
      this.processBatch(this.batch)
      this.batch = []
    }
  }
}
```

## 🔒 セキュリティ考慮事項

### 暗号化の実装

```typescript
export class SecurityManager {
  private readonly algorithm = 'AES-GCM'
  private readonly keyLength = 256

  public async encryptData(data: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    return crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      key,
      data
    )
  }

  public async generateSecureKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    )
  }
}
```

### 入力検証

```typescript
export class InputValidator {
  public static validateRoomName(roomName: string): boolean {
    // ルーム名の形式チェック
    const roomNameRegex = /^[a-zA-Z0-9_-]{3,50}$/
    return roomNameRegex.test(roomName)
  }

  public static validateUserId(userId: string): boolean {
    // ユーザーIDの形式チェック
    const userIdRegex = /^[a-zA-Z0-9_-]{3,20}$/
    return userIdRegex.test(userId)
  }

  public static sanitizeInput(input: string): string {
    // XSS対策
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }
}
```

## 📚 参考資料

### 技術ドキュメント

- [Y.js Documentation](https://docs.yjs.dev/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### ベストプラクティス

- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350884)
- [Effective TypeScript](https://www.oreilly.com/library/view/effective-typescript/9781492033744/)
- [Testing JavaScript](https://testingjavascript.com/)

### コミュニティ

- [Obsidian Discord](https://discord.gg/veuWUTm)
- [Y.js Discord](https://discord.gg/6w7qZ8h)
- [TypeScript Community](https://github.com/typescript-community)

## 🚀 次のステップ

### Phase 2の実装計画

1. **セキュリティ強化**
   - エンドツーエンド暗号化の完全実装
   - アクセス制御システムの改善
   - ユーザー認証の強化

2. **パフォーマンス最適化**
   - メモリ使用量の最適化
   - 接続品質の監視
   - 自動フォールバック機能

3. **UI/UX改善**
   - CodeMirror 6との完全統合
   - リアルタイムユーザー表示
   - カーソル位置表示

### 長期目標

- **スケーラビリティ**: 1000+同時接続のサポート
- **モバイル対応**: iOS/Androidアプリでの利用
- **オフライン対応**: オフライン時の編集と同期
- **プラグインエコシステム**: サードパーティ拡張のサポート

---

**開発者向けサポート**: 技術的な質問や問題がある場合は、GitHub DiscussionsまたはIssuesを使用してください。