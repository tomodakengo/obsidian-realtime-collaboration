# GitHub Actions ワークフロー

このプロジェクトでは、以下のGitHub Actionsワークフローを使用して自動化を行っています。

## 📋 ワークフロー一覧

### 1. Release (`release.yml`)
**トリガー:** mainブランチへのpush、mainブランチへのPR

**機能:**
- ✅ テストの実行
- 🔍 manifest.jsonの検証
- 🏗️ プロダクション用ビルド
- 🚀 自動リリース作成（mainブランチのみ）

**リリース内容:**
- `main.js` - メインプラグインファイル
- `main.js.map` - ソースマップ
- `manifest.json` - プラグインマニフェスト
- `INSTALL.md` - インストール手順

### 2. CI (`ci.yml`)
**トリガー:** main/developブランチへのPR、developブランチへのpush

**機能:**
- 🧪 複数のNode.jsバージョンでのテスト (16, 18, 20)
- 🏗️ ビルド検証
- 📋 manifest.json検証

### 3. Version Bump (`version-bump.yml`)
**トリガー:** 手動実行（workflow_dispatch）

**機能:**
- 📈 バージョン自動更新 (patch/minor/major)
- 📝 package.json と manifest.json の同期
- 🔄 プルリクエストの自動作成

## 🚀 使用方法

### 新しいリリースの作成

1. **開発ブランチで作業**
   ```bash
   git checkout -b feature/new-feature
   # 開発作業...
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **プルリクエストを作成**
   - CI ワークフローが自動実行されます
   - テストとビルド検証が行われます

3. **mainブランチにマージ**
   - マージ後、Release ワークフローが自動実行されます
   - 新しいバージョンのリリースが自動作成されます

### バージョンの更新

1. **GitHub Actionsページで手動実行**
   - Actions タブ → "Version Bump" → "Run workflow"
   - バージョンタイプを選択 (patch/minor/major)

2. **自動作成されたPRをレビュー・マージ**
   - バージョン更新のPRが自動作成されます
   - レビュー後、mainブランチにマージ

## ⚙️ 設定

### 必要な権限
- `GITHUB_TOKEN` - 自動的に提供される
- リポジトリの "Actions" 権限が有効

### ブランチ保護
推奨設定:
- mainブランチの直接pushを禁止
- PRでのレビュー必須
- ステータスチェック必須（CI通過）

## 🔧 カスタマイズ

### Node.jsバージョンの変更
`release.yml` の `NODE_VERSION` 環境変数を変更:
```yaml
env:
  NODE_VERSION: '20'  # お好みのバージョンに変更
```

### テストマトリックスの変更
`ci.yml` の `matrix.node-version` を変更:
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]  # テスト対象バージョン
```

### リリース対象ファイルの変更
`release.yml` の `files` セクションを変更:
```yaml
files: |
  release-assets/main.js
  release-assets/manifest.json
  # 追加ファイル...
```

## 🐛 トラブルシューティング

### よくある問題

1. **ビルドエラー**
   ```bash
   npm ci
   npm run build
   ```
   ローカルで確認してからpush

2. **バージョン重複エラー**
   - manifest.json のバージョンを手動更新
   - または Version Bump ワークフローを使用

3. **テスト失敗**
   ```bash
   npm test
   ```
   ローカルでテストを確認

### ログの確認
- GitHub Actions タブでワークフロー実行結果を確認
- 失敗した場合は詳細ログをチェック

## 📚 参考資料

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Obsidian Plugin Development](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Semantic Versioning](https://semver.org/)