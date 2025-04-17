import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class CdkWafStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const ResourceName =this.stackName ?? 'CdkWafStack';

    // ホワイトリストIPセットARN
    const WhiteListIpSetArn = '';

    const ManagedRules = [
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

    // ✅ AWS マネージドルールの設定
    const rules = ManagedRules.map((ruleName, index) => ({
      name: ruleName,
      priority: index + 1,
      statement: {
        managedRuleGroupStatement: {
          name: ruleName,
          vendorName: 'AWS',
        },
      },
      overrideAction: { none: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${ruleName}-Metrics`,
        sampledRequestsEnabled: true,
      },
    }));

    // ✅ CloudFront 用 WAF WebACL を作成
    const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      name: `${ResourceName}-WebACL`,
      defaultAction: { allow: {} },
      scope: 'CLOUDFRONT',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${ResourceName}-WebACL-Metrics`,
        sampledRequestsEnabled: true,
      },
      rules: [
        // ✅ ホワイトリスト (IPSet)
        ...(WhiteListIpSetArn
          ? [{
              name: 'WhiteList',
              priority: 0,
              action: { allow: {} },
              statement: {
                ipSetReferenceStatement: {
                  arn: WhiteListIpSetArn,
                },
              },
              visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'WhiteList-Metrics',
                sampledRequestsEnabled: true,
              },
            }]
          : []),
        // ✅ AWS マネージドルール
        ...rules,
      ],
    });

    // ✅ WAF ログ設定（CloudWatch Logs に出力）
    const wafLogGroup = new logs.LogGroup(this, 'WafLogGroup', {
      logGroupName:  `aws-waf-logs-${ResourceName}`,
      retention: logs.RetentionDays.FIVE_YEARS,
      removalPolicy: RemovalPolicy.DESTROY, //RemovalPolicy.RETAIN
    });

    // ✅ WAF のロギング設定
    new wafv2.CfnLoggingConfiguration(this, 'WafLoggingConfig', {
      logDestinationConfigs: [wafLogGroup.logGroupArn],
      resourceArn: webAcl.attrArn,
    });
    
    new CfnOutput(this, 'WebACLId', {
      description: 'WAF Web ACLのID',
      value: webAcl.attrId,
    });
    
  }
}
