# Obsidian Realtime Collaboration Plugin

リアルタイム協同編集機能をObsidianプラグインで実装したプロジェクトです。Y.js + WebRTC P2Pアプローチにより、月額$5-20の低コストでGoogle Docsレベルの協同編集機能を実現します。

## 🚀 現在の実装状況

### ✅ Phase 1: MVP実装完了
- **Y.js CRDT統合**: 完全実装済み
  - Y.Docの初期化と管理
  - Y.Textの設定と監視
  - 変更イベントの処理
  - IndexedDBによる文書永続化
- **P2P通信**: WebRTC実装完了
  - WebrtcProvider統合
  - シグナリングサーバー接続
  - 接続状態管理
- **エディター統合**: 基本的な実装完了
  - 双方向バインディング（Y.js ↔ Obsidian）
  - 変更の伝播処理
  - 競合解決機能

### 🔄 Phase 2: セキュリティとアクセス制御（開発中）
- エンドツーエンド暗号化
- アクセス制御システム
- ユーザー認証

### 📋 Phase 3: UI/UX改善（計画中）
- リアルタイムユーザー表示
- カーソル位置表示
- 共有機能

## 🛠️ 技術スタック

- **CRDT**: Y.js（週間900,000ダウンロードの成熟ライブラリ）
- **通信**: WebRTC P2P（サーバーコスト最小化）
- **永続化**: IndexedDB（ローカルストレージ）
- **言語**: TypeScript（型安全性）
- **フレームワーク**: Obsidian Plugin API

## 📦 セットアップマニュアル

### 前提条件

- **Node.js**: v18.0.0以上
- **npm**: v8.0.0以上
- **Git**: 最新版
- **Obsidian**: v0.15.0以上

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd obsidian-realtime-collaboration
```

### 2. 依存関係のインストール

```bash
npm install
```

**主要な依存関係**:
- `yjs`: CRDTライブラリ
- `y-webrtc`: WebRTC通信
- `y-indexeddb`: ローカル永続化
- `y-protocols`: プロトコル実装
- `obsidian`: ObsidianプラグインAPI

### 3. 開発環境のセットアップ

#### TypeScript設定の確認
```bash
# tsconfig.jsonが正しく設定されているか確認
cat tsconfig.json
```

#### Rollup設定の確認
```bash
# rollup.config.jsが正しく設定されているか確認
cat rollup.config.js
```

### 4. ビルドとテスト

#### 開発ビルド
```bash
# 開発モード（ウォッチ）
npm run dev
```

#### 本番ビルド
```bash
# 本番ビルド
npm run build
```

#### テスト実行
```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# 特定のテストファイル
npm test -- test/yjsManager.spec.ts
```

### 5. Obsidianプラグインとしてのインストール

#### 手動インストール（開発用）

1. **プラグインフォルダの特定**
   - Obsidianを開く
   - 設定 → プラグイン → 開発者ツール → プラグインフォルダを開く

2. **プラグインの配置**
   ```bash
   # ビルドされたファイルをプラグインフォルダにコピー
   cp -r dist/* /path/to/obsidian/plugins/collaborative-editor/
   cp manifest.json /path/to/obsidian/plugins/collaborative-editor/
   ```

3. **プラグインの有効化**
   - Obsidianで設定 → プラグイン
   - 「Collaborative Editor」を有効化

#### 自動インストール（開発用）

```bash
# シンボリックリンクを作成（開発中の変更が即座に反映）
ln -s $(pwd)/dist /path/to/obsidian/plugins/collaborative-editor
ln -s $(pwd)/manifest.json /path/to/obsidian/plugins/collaborative-editor/
```

### 6. 開発環境の設定

#### VS Code推奨設定

`.vscode/settings.json`を作成:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

#### 推奨拡張機能
- TypeScript Importer
- ESLint
- Prettier
- GitLens

### 7. 環境変数の設定

#### 開発用設定ファイル

`.env.development`を作成:
```bash
# 開発用シグナリングサーバー
SIGNALING_SERVER_DEV=wss://localhost:3000

# デバッグモード
DEBUG=true

# テスト用ルーム名
TEST_ROOM_NAME=dev-test-room
```

#### 本番用設定ファイル

`.env.production`を作成:
```bash
# 本番用シグナリングサーバー
SIGNALING_SERVER_PROD=wss://signaling.yjs.dev

# 本番用ルーム名
PROD_ROOM_NAME=obsidian-collab
```

### 8. トラブルシューティング

#### よくある問題と解決方法

**ビルドエラー**
```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュのクリア
npm run clean
npm run build
```

**テストエラー**
```bash
# テスト環境のリセット
npm run test:reset

# 特定のテストの実行
npm test -- --reporter=verbose
```

**プラグインが読み込まれない**
- Obsidianのバージョンを確認（v0.15.0以上が必要）
- プラグインフォルダのパーミッションを確認
- コンソールでエラーメッセージを確認

#### ログの確認

```bash
# 開発ログの確認
tail -f logs/development.log

# エラーログの確認
tail -f logs/error.log
```

### 9. 開発ワークフロー

#### 新機能の追加

1. **ブランチの作成**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **テストの作成**
   ```bash
   # テストファイルを作成
   touch test/newFeature.spec.ts
   ```

3. **実装**
   ```bash
   # 開発モードでビルド
   npm run dev
   ```

4. **テスト実行**
   ```bash
   npm test
   ```

5. **コミット**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

#### デバッグ

```bash
# デバッグモードでビルド
npm run build:debug

# ソースマップ付きでビルド
npm run build:sourcemap
```

### 10. パフォーマンス監視

#### メモリ使用量の監視

```bash
# メモリ使用量の確認
npm run profile:memory

# パフォーマンステスト
npm run test:performance
```

#### ベンチマーク

```bash
# ベンチマークテスト
npm run benchmark

# 負荷テスト
npm run test:load
```

## 🚀 使用方法

### 基本的な使用方法

1. **プラグインの有効化**
   - Obsidianで設定 → プラグイン
   - 「Collaborative Editor」を有効化

2. **協同編集セッションの開始**
   - ノートを開く
   - プラグインのステータスバーで接続状態を確認
   - 他のユーザーとルーム名を共有

3. **リアルタイム編集**
   - 複数ユーザーで同時編集
   - 変更は自動的に同期
   - 競合は自動的に解決

### 高度な使用方法

#### カスタムルーム設定

```typescript
// カスタムルーム名とパスワード
const roomName = 'my-secret-room'
const password = 'secure-password'

// プラグインの設定で指定
```

#### シグナリングサーバーのカスタマイズ

```typescript
// カスタムシグナリングサーバー
const customServers = [
  'wss://my-signaling-server.com',
  'wss://backup-server.com'
]
```

## 🧪 テスト

### テストの実行

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# 特定のテストスイート
npm test -- --grep "YjsManager"
```

### テストの種類

- **ユニットテスト**: 個別コンポーネントのテスト
- **統合テスト**: コンポーネント間の連携テスト
- **E2Eテスト**: エンドツーエンドの動作テスト
- **パフォーマンステスト**: 性能とスケーラビリティのテスト

## 📊 コスト分析

| ユーザー数 | 月額コスト | 構成 |
|------------|------------|------|
| 1-20 | $5-10 | 純粋P2P + シグナリングサーバー |
| 20-100 | $15-30 | ハイブリッドP2P + Firebase |
| 100+ | $50-100 | Firebase主体 |

## 🔒 セキュリティ

- エンドツーエンド暗号化
- ゼロノレッジアーキテクチャ
- クライアントサイド暗号化

## 📈 パフォーマンス

- 100万操作で220MB RAM使用量
- リアルタイム同期（ローカル操作は即座に適用）
- 自動競合解決

## 🤝 コントリビューション

### 開発環境のセットアップ

1. このリポジトリをフォーク
2. 開発環境をセットアップ（上記の手順に従う）
3. フィーチャーブランチを作成
4. 変更を実装
5. テストを追加・実行
6. プルリクエストを作成

### コーディング規約

- TypeScriptの厳格モードを使用
- ESLintとPrettierの設定に従う
- テストカバレッジ80%以上を維持
- コミットメッセージはConventional Commitsに従う

### プルリクエストのガイドライン

- 明確なタイトルと説明
- 関連するIssueへのリンク
- テストの追加・更新
- ドキュメントの更新

## 📄 ライセンス

ISC License

## 🔗 参考プロジェクト

- **Peerdraft**: 商業的に成功した協同編集プラグイン
- **brush701/obsidian-multiplayer**: オープンソース参考実装
- **Conclave**: 包括的な技術ケーススタディ

## 📞 サポート

### 問題の報告

1. GitHub Issuesで問題を報告
2. 詳細な情報を含める（OS、Obsidianバージョン、エラーメッセージなど）
3. 再現手順を明確に記載

### 開発者向けサポート

- 技術的な質問はGitHub Discussionsを使用
- バグ報告はGitHub Issuesを使用
- 機能要求はGitHub Issuesでラベル「enhancement」を使用

### コミュニティ

- Discordサーバー（開発中）
- GitHub Discussions
- 技術ブログ（開発中）

---

**注意**: このプラグインは現在開発中です。本番環境での使用は推奨されません。

**開発者向け**: 詳細な開発ガイドは`DEVELOPMENT.md`を参照してください。