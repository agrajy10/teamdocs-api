import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class TeamdocsInfraStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "AppVpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: "private-isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const repository = new ecr.Repository(this, "AppRepository", {
      repositoryName: "teamdocs-api",
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, "Ec2SecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Security group for application EC2 instance",
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH",
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP",
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      "Allow application port 3000",
    );

    const instanceRole = new iam.Role(this, "Ec2InstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEC2ContainerRegistryReadOnly",
      ),
    );

    const stack = cdk.Stack.of(this);
    const ecrRegistry = `${stack.account}.dkr.ecr.${stack.region}.amazonaws.com`;

    const userData = ec2.UserData.forLinux();

    userData.addCommands(
      "sudo dnf update -y",
      "sudo dnf install -y docker awscli",
      "sudo systemctl enable docker",
      "sudo systemctl start docker",
      `aws ecr get-login-password --region ${stack.region} | docker login --username AWS --password-stdin ${ecrRegistry}`,
      `docker pull ${repository.repositoryUri}:latest`,
    );

    const instance = new ec2.Instance(this, "AppInstance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ec2SecurityGroup,
      role: instanceRole,
      userData,
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Security group for RDS PostgreSQL instance",
    });

    dbSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from EC2 instance",
    );

    const dbEngine = rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.of("18", "18"),
    });

    const parameterGroup = new rds.ParameterGroup(this, "PostgresParams", {
      engine: dbEngine,
      parameters: {
        "rds.force_ssl": "0",
      },
    });

    const dbInstance = new rds.DatabaseInstance(this, "AppDatabase", {
      engine: dbEngine,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      allocatedStorage: 20,
      multiAz: false,
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      securityGroups: [dbSecurityGroup],
      parameterGroup,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deleteAutomatedBackups: true,
      publiclyAccessible: false,
    });

    if (dbInstance.secret) {
      dbInstance.secret.grantRead(instanceRole);
    }

    const apiEnvSecret = new secretsmanager.Secret(this, "ApiEnvSecret", {
      secretName: "teamdocs-api-env",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          NODE_ENV: "production",
        }),
        generateStringKey: "SESSION_SECRET",
      },
    });

    apiEnvSecret.grantRead(instanceRole);

    new cdk.CfnOutput(this, "ApiEnvSecretArn", {
      value: apiEnvSecret.secretArn,
      exportName: "ApiEnvSecretArn",
    });

    new cdk.CfnOutput(this, "Ec2PublicIp", {
      value: instance.instancePublicIp,
      exportName: "Ec2PublicIp",
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: dbInstance.instanceEndpoint.hostname,
      exportName: "DatabaseEndpoint",
    });

    new cdk.CfnOutput(this, "EcrRepositoryUri", {
      value: repository.repositoryUri,
      exportName: "EcrRepositoryUri",
    });
  }
}
