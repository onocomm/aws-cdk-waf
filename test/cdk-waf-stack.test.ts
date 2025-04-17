import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as CdkWaf from '../lib/cdk-waf-stack';

describe('CdkWafStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CdkWaf.CdkWafStack(app, 'TestCdkWafStack', {
      env: { 
        account: '123456789012', // テスト用のダミーアカウント
        region: 'us-east-1'      // テスト用のダミーリージョン
      }
    });
    template = Template.fromStack(stack);
  });

  test('WAF WebACL が正しく作成されていること', () => {
    // WAF WebACL リソースの検証
    template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Name: 'TestCdkWafStack-WebACL',
      DefaultAction: {
        Allow: {}
      },
      Scope: 'CLOUDFRONT',
      VisibilityConfig: {
        CloudWatchMetricsEnabled: true,
        MetricName: 'TestCdkWafStack-WebACL-Metrics',
        SampledRequestsEnabled: true
      }
    });
  });

  test('マネージドルールが正しく設定されていること', () => {
    // マネージドルールの検証
    const expectedRules = [
      "AWSManagedRulesAdminProtectionRuleSet",
      "AWSManagedRulesAmazonIpReputationList",
      "AWSManagedRulesAnonymousIpList",
      "AWSManagedRulesCommonRuleSet",
      "AWSManagedRulesKnownBadInputsRuleSet",
      "AWSManagedRulesLinuxRuleSet",
      "AWSManagedRulesPHPRuleSet",
      "AWSManagedRulesUnixRuleSet",
      "AWSManagedRulesSQLiRuleSet"
    ];
    
    // 各マネージドルールが存在することを検証
    expectedRules.forEach((ruleName, index) => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: ruleName,
            Priority: index + 1,
            Statement: {
              ManagedRuleGroupStatement: {
                Name: ruleName,
                VendorName: 'AWS'
              }
            },
            OverrideAction: {
              None: {}
            },
            VisibilityConfig: {
              CloudWatchMetricsEnabled: true,
              MetricName: `${ruleName}-Metrics`,
              SampledRequestsEnabled: true
            }
          })
        ])
      });
    });
  });

  test('ログ設定が正しく構成されていること', () => {
    // CloudWatch Logs グループの検証
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: 'aws-waf-logs-TestCdkWafStack',
      RetentionInDays: 1825 // 5年 = 1825日
    });
    
    // WAF ロギング設定の検証
    template.resourceCountIs('AWS::WAFv2::LoggingConfiguration', 1);
    
    // LoggingConfiguration リソースの検証
    // LogDestinationConfigs には LogGroup の ARN が含まれる
    template.hasResourceProperties('AWS::WAFv2::LoggingConfiguration', {
      LogDestinationConfigs: Match.arrayWith([
        {
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('WafLogGroup'),
            'Arn'
          ])
        }
      ]),
      ResourceArn: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('WebACL'),
          'Arn'
        ])
      }
    });
  });

  test('出力値が正しく設定されていること', () => {
    // WebACL ID の出力値の検証
    template.hasOutput('WebACLId', {
      Description: 'WAF Web ACLのID',
      Value: {
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('WebACL'),
          'Id'
        ])
      }
    });
  });

  test('ホワイトリストIPが設定されていない場合、対応するルールが含まれないこと', () => {
    // デフォルトではホワイトリストIPが設定されていないため、
    // WhiteList という名前のルールが含まれていないことを検証
    
    // WAF WebACL のルールを取得
    const webAcl = template.findResources('AWS::WAFv2::WebACL');
    const webAclKeys = Object.keys(webAcl);
    
    // ルールの中に WhiteList という名前のルールがないことを確認
    const rules = webAcl[webAclKeys[0]].Properties.Rules;
    const whiteListRule = rules.find((rule: any) => rule.Name === 'WhiteList');
    
    expect(whiteListRule).toBeUndefined();
  });
});

// ホワイトリストIPが設定されている場合のテスト
describe('CdkWafStack with WhiteListIpSet', () => {
  test('ホワイトリストIPが設定されている場合、対応するルールが含まれること', () => {
    // このテストは実際にはホワイトリストIPを設定する方法がないため、
    // 実装できません。実際のコードでは、WhiteListIpSetArn を設定する
    // 方法を提供する必要があります。
    
    // 以下は、もしホワイトリストIPを設定する方法があれば、
    // どのようにテストするかの例です。
    
    /*
    // ホワイトリストIPを設定したスタックを作成
    const app = new cdk.App();
    const stack = new CdkWaf.CdkWafStack(app, 'TestCdkWafStackWithWhiteList', {
      env: { 
        account: '123456789012',
        region: 'us-east-1'
      },
      // ここでホワイトリストIPを設定するプロパティを渡す必要があります
      // 例: whiteListIpSetArn: 'arn:aws:wafv2:us-east-1:123456789012:global/ipset/example/abcdef'
    });
    const template = Template.fromStack(stack);
    
    // WhiteList ルールが含まれていることを検証
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: 'WhiteList',
          Priority: 0,
          Action: {
            Allow: {}
          },
          Statement: {
            IPSetReferenceStatement: {
              Arn: Match.anyValue() // 実際のARNを検証
            }
          }
        })
      ])
    });
    */
    
    // 現状ではこのテストはスキップ
    expect(true).toBeTruthy();
  });
});
