# AWS CDK WAF

このプロジェクトは、AWS CDKを使用してCloudFront用のWAF（Web Application Firewall）を設定するためのTypeScriptアプリケーションです。

## アーキテクチャ

このプロジェクトでは、以下のAWSリソースを作成します：

- **WAF WebACL**: CloudFrontディストリビューションに関連付けるためのWAF WebACL
- **WAFルール**: 複数のAWSマネージドルールを適用
- **CloudWatch Logs**: WAFのログを保存するためのロググループ

## 前提条件

このプロジェクトを使用するには、以下が必要です：

- Node.js 14.x以上
- AWS CDK CLI（`npm install -g aws-cdk`）
- AWS CLIがインストールされ、適切に設定されていること
- AWSアカウントとデプロイ権限

## セットアップ

```bash
# リポジトリをクローン
git clone <リポジトリURL>
cd aws-cdk-waf

# 依存関係のインストール
npm install

# TypeScriptのコンパイル
npm run build
```

## デプロイ方法

```bash
# CDKブートストラップ（初回のみ）
cdk bootstrap

# デプロイ
cdk deploy
```

デプロイが完了すると、CloudFrontディストリビューションに関連付け可能なWAF WebACL IDが出力されます。

## 機能説明

### WAFマネージドルール

このプロジェクトでは、以下のAWSマネージドルールを適用しています：

- **AWSManagedRulesAdminProtectionRuleSet**: 管理ページへの不正アクセスを防止
- **AWSManagedRulesAmazonIpReputationList**: 悪意のあるIPアドレスからのリクエストをブロック
- **AWSManagedRulesAnonymousIpList**: 匿名プロキシやVPNからのリクエストを検出
- **AWSManagedRulesCommonRuleSet**: 一般的なWebアプリケーション脆弱性を防止
- **AWSManagedRulesKnownBadInputsRuleSet**: 既知の悪意のある入力パターンをブロック
- **AWSManagedRulesLinuxRuleSet**: Linuxに特化した脆弱性を防止
- **AWSManagedRulesPHPRuleSet**: PHPアプリケーションの脆弱性を防止
- **AWSManagedRulesUnixRuleSet**: Unixに特化した脆弱性を防止
- **AWSManagedRulesSQLiRuleSet**: SQLインジェクション攻撃を防止

### ログ記録

WAFのログはCloudWatch Logsに保存され、5年間保持されます。ログには、ブロックされたリクエストや検出されたルール違反などの情報が含まれます。

## カスタマイズ方法

### ホワイトリストIPの設定

特定のIPアドレスをホワイトリストに登録するには、`lib/cdk-waf-stack.ts`ファイルの`WhiteListIpSetArn`変数に、事前に作成したIPセットのARNを設定します。

```typescript
// ホワイトリストIPセットARN
const WhiteListIpSetArn = 'arn:aws:wafv2:us-east-1:123456789012:global/ipset/example-ipset/abcdef12-3456-7890-abcd-ef1234567890';
```

### マネージドルールの追加・削除

適用するマネージドルールを変更するには、`lib/cdk-waf-stack.ts`ファイルの`ManagedRules`配列を編集します。

```typescript
const ManagedRules = [
  "AWSManagedRulesAdminProtectionRuleSet",
  "AWSManagedRulesAmazonIpReputationList",
  // 他のルールを追加または削除
];
```

## ログの確認方法

WAFのログは、AWS Management ConsoleのCloudWatch Logsセクションで確認できます。ロググループ名は`aws-waf-logs-[スタック名]`の形式です。

```bash
# AWS CLIを使用してログを確認する例
aws logs get-log-events --log-group-name aws-waf-logs-CdkWafStack --log-stream-name [ログストリーム名]
```

## 注意事項

- このプロジェクトは、CloudFront用のWAF WebACLのみを作成します。CloudFrontディストリビューションやS3バケットなどの他のリソースは作成しません。
- WAF WebACLをCloudFrontディストリビューションに関連付けるには、CloudFrontコンソールまたはCDKを使用して別途設定する必要があります。
- WAFのログは、CloudWatch Logsに保存されるため、ログの量に応じてコストが発生する可能性があります。

## ライセンス

このプロジェクトは[ライセンス名]の下で公開されています。詳細については、LICENSEファイルを参照してください。
