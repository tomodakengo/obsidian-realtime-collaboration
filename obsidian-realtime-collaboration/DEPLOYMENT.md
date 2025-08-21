# 🚀 デプロイメント & リリースガイド

## 概要

このObsidianプラグインは、GitHub Actionsを使用した完全自動化されたCI/CDパイプラインを実装しています。mainブランチにマージされるたびに、自動的にビルド・テスト・リリースが実行されます。

## 🔄 リリースプロセス

### 自動リリース（推奨）

1. **機能開発**
   ```bash
   git checkout -b feature/your-feature-name
   # 開発作業
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

2. **プルリクエスト作成**
   - GitHub上でPRを作成
   - CI ワークフローが自動実行
   - テスト・ビルド・Lint チェック

3. **レビュー & マージ**
   - コードレビュー完了後、mainブランチにマージ
   - **自動的にリリースが作成されます**

### 手動バージョン管理

バージョンを明示的に更新したい場合:

1. **GitHub Actionsから実行**
   - Repository → Actions → "Version Bump"
   - "Run workflow" をクリック
   - バージョンタイプを選択:
     - `patch`: バグフィックス (1.0.0 → 1.0.1)
     - `minor`: 新機能 (1.0.0 → 1.1.0)
     - `major`: 破壊的変更 (1.0.0 → 2.0.0)

2. **自動PR確認**
   - バージョン更新のPRが自動作成
   - レビュー後、mainにマージ
   - リリースが自動作成

## 📦 リリース内容

各リリースには以下のファイルが含まれます:

| ファイル | 説明 |
|---------|------|
| `main.js` | コンパイル済みプラグインファイル |
| `main.js.map` | デバッグ用ソースマップ |
| `manifest.json` | プラグインメタデータ |
| `INSTALL.md` | インストール手順 |

## 🛠️ ワークフロー詳細

### Release Workflow (`release.yml`)

**トリガー条件:**
- mainブランチへのpush
- mainブランチへのPR（テストのみ）

**実行ステップ:**
1. ✅ **テスト実行** - 全テストスイートの実行
2. 🔍 **Manifest検証** - 必須フィールドの確認
3. 🏗️ **プロダクションビルド** - 最適化されたビルド
4. 📋 **バージョン確認** - 重複タグのチェック
5. 📦 **アセット準備** - リリースファイルの準備
6. 🚀 **リリース作成** - GitHubリリースの自動作成

### CI Workflow (`ci.yml`)

**トリガー条件:**
- main/developブランチへのPR
- developブランチへのpush

**マトリックステスト:**
- Node.js 16, 18, 20での並列テスト
- クロスプラットフォーム互換性確認

## 🔧 設定とカスタマイズ

### 環境変数

```yaml
env:
  NODE_VERSION: '18'  # ビルド用Node.jsバージョン
```

### ブランチ戦略

```
main (本番)
  ↑
develop (開発)
  ↑
feature/* (機能開発)
```

### 必要な権限

- **GITHUB_TOKEN**: 自動提供（リリース作成用）
- **Actions権限**: リポジトリ設定で有効化

## 📊 ワークフロー状況確認

### ステータスバッジ

```markdown
![Release](https://github.com/your-org/obsidian-realtime-collaboration/workflows/Release/badge.svg)
![CI](https://github.com/your-org/obsidian-realtime-collaboration/workflows/CI/badge.svg)
```

### 実行履歴

- Repository → Actions タブ
- 各ワークフローの実行状況を確認
- 失敗時は詳細ログを確認

## 🐛 トラブルシューティング

### よくある問題と解決法

#### 1. ビルドエラー

**症状**: ビルドが失敗する
```bash
# ローカルで確認
npm ci
npm run build
npm test
```

**解決法**: 
- 依存関係の更新: `npm update`
- キャッシュクリア: `npm run clean`

#### 2. バージョン重複エラー

**症状**: "Tag already exists" エラー
```yaml
⚠️ Tag v1.0.0 already exists
```

**解決法**:
1. Version Bumpワークフローでバージョン更新
2. または手動でmanifest.jsonを更新

#### 3. テスト失敗

**症状**: CI でテストが失敗
```bash
# ローカルテスト実行
npm test
npm run test:watch  # ウォッチモード
```

**解決法**:
- テストファイルの確認
- 依存関係の問題解決

#### 4. リリース作成失敗

**症状**: リリースが作成されない

**確認ポイント**:
- GITHUB_TOKEN権限
- リポジトリのActions設定
- ブランチ保護ルール

### デバッグ方法

1. **ローカル環境での再現**
   ```bash
   # 同じ環境を再現
   node --version  # v18.x.x
   npm --version
   npm ci
   npm run prepare:release
   ```

2. **ワークフローログ確認**
   - Actions → 失敗したワークフロー → 詳細表示
   - エラーメッセージとスタックトレース確認

3. **段階的テスト**
   ```bash
   npm run clean     # クリーン
   npm ci           # 依存関係インストール
   npm test         # テスト実行
   npm run build    # ビルド実行
   ```

## 📈 パフォーマンス最適化

### ビルド時間短縮

1. **依存関係キャッシュ**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'  # npm キャッシュ有効
   ```

2. **並列実行**
   - マトリックス戦略でテスト並列化
   - 複数Node.jsバージョンでの同時テスト

3. **条件分岐**
   - mainブランチでのみリリース実行
   - 不要なステップのスキップ

### リソース使用量

- **ビルド時間**: 通常 2-3分
- **テスト実行**: 1-2分
- **リリース作成**: 30秒-1分

## 🔄 継続的改善

### メトリクス監視

- ビルド成功率
- テスト実行時間
- リリース頻度

### 定期メンテナンス

- 依存関係の定期更新
- セキュリティアップデート
- ワークフロー最適化

## 📚 関連ドキュメント

- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Semantic Versioning](https://semver.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)