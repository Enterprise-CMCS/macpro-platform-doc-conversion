# app-api

## IAM Considerations with API Gateway

https://aws.amazon.com/premiumsupport/knowledge-center/api-gateway-cloudfront-distribution/

> By default, CloudFront doesn't forward incoming Authorization headers to the origin (for this use case, API Gateway). If you're using IAM authentication for your >API or custom domain names for your distribution, you must do one of the following..."

### Other Important Points

1. Even though you can apply a resource policy to a public api without IAM on, only non-IAM conditions are evaluated without turning on IAM. IAM identity conditions are still applied on the invoking side
2. API Gateway edge endpoints don’t forward auth headers, but if they were previously regional endpoints and you had a successful call against it, that auth can be cached for a period of time and succeed against the point when it is switched to edge.
3. There is some delay in switching between edge and regional endpoints in the background, even when the operation succeeds. This manifests itself if you try to reverse the switch and go back the opposite way too fast. IE regional -> edge -> regional

### TL;DR | Takeway

when using IAM authentication and a resource policy while allowing cross-account invokers, the endpoint should be REGIONAL, and IAM authentication needs turned on for the API Gateway method.

## Fonts
Open Sans and DejaVu Sans fonts are packaged with the Lambda.  The latter font is primarily used to ensure Ballot Box and Checked Ballot Box characters are available. 

DejaVu Sans hasn't been updated in some time, so we looked at replacing it with a Google font like Source Code Pro that contained the Ballot Box and Checked Ballot Box symbols.  When a symbol is not available in the fonts specified, Prince will fall back to the next font in the cascade, typically a [Genric font family](https://www.princexml.com/doc/11/fonts/#font-families).  On Linux DejaVu is one of the generic fonts.  Thus, including DejaVu Sans in the lambda zip means the aforementioned ballot box symbols fall through and find a match.  Source Code Pro is not part of the generic font families, so including it instead of DejaVu Sans means a match for Ballot Box and Checked Ballot Box is not found.  Generic font families can be redefined from defaults, but we don't want to override developer desired fonts.


## Configuration - AWS Systems Manager Parameter Store (SSM)

The following values are used to configure the deployment of this service (see below for more background and context).
| Parameter | Required? | Accepts a default? | Accepts a branch override? | Purpose |
| --- | :---: | :---: | :---: | --- |
| .../iam/path | N | Y | Y | Specifies the [IAM Path](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html#identifiers-friendly-names) at which all IAM objects should be created. The default value is "/". The path variable in IAM is used for grouping related users and groups in a unique namespace, usually for organizational purposes.|
| .../iam/permissionsBoundaryPolicy | N | Y | Y | Specifies the [IAM Permissions Boundary](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html) that should be attached to all IAM objects. A permissions boundary is an advanced feature for using a managed policy to set the maximum permissions that an identity-based policy can grant to an IAM entity. If set, this parmeter should contain the full ARN to the policy.|
| .../warmup/schedule | N | Y | Y | This is a set schedule for warming up the lambda function.|
| .../warmup/concurrency | N | Y | Y | The number of lambda functions to invoke on warmup. The higher this number the warm lambda containers are ready to go.|
|.../macpro-platform-doc-conversion/iam/invoke-arns | N | Y | Y | StringList of ARNs that get added to the resource policy as allowed invokers. Must be without quotes, no spaces, comma seperated. IAM roles, users, and accounts are all valid here. Defaults to the account this code is deployed in. Works for cross-account.
| .../prince/license | Y | Y | Y | Specifies the license to be applied to PrinceXML. The non-commercial use license can be extracted from [PrinceXML's zip archive](https://www.princexml.com/download/prince-14.2-aws-lambda.zip) at the path `prince-engine/license/license.dat`.|

This project uses [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html), often referred to as simply SSM, to inject environment specific, project specific, and/or sensitive information into the deployment.
In short, SSM is an AWS service that allows users to store (optionally) encrypted strings in a directory like hierarchy. For example, "/my/first/ssm/param" is a valid path for a parameter. Access to this service and even individual paramters is granted via AWS IAM.

An example of environment specific information is the id of a VPC into which we want to deploy. This VPC id should not be checked in to git, as it may vary from environment to environment, so we would use SSM to store the id information and use the [Serverless Framework's SSM lookup capability](https://www.serverless.com/framework/docs/providers/aws/guide/variables/#reference-variables-using-the-ssm-parameter-store) to fetcn the information at deploy time.

This project has also implemented a pattern for specifying defaults for variables, while allowing for branch (environment specific overrides). That pattern looks like this:

```
sesSourceEmailAddress: ${ssm:/configuration/${self:custom.stage}/sesSourceEmailAddress~true, ssm:/configuration/default/sesSourceEmailAddress~true}
```

The above syntax says "look for an ssm parameter at /configuration/<branch name>/sesSourceEmailAddress; if there isn't one, look for a parameter at /configuration/default/sesSourceEmailAddress". With this logic, we can specify a generic value for this variable that would apply to all environments deployed to a given account, but if we wish to set a different value for a specific environment (branch), we can create a parameter at the branch specific path and it will take precedence.

In the above tabular documentation, you will see columns for "Accepts default?" and "Accepts a branch override?". These columns relate to the above convention of searching for a branch specific override but falling back to a default parameter. It's important to note if a parameter can accept a default or can accept an override, because not all can do both. For example, a parameter used to specify Okta App information cannot be set as a default, because Okta can only support one environment (branch) at a time; so, okta_metadata_url is a good example of a parameter that can only be specified on a branch by branch basis, and never as a default.

In the above documentation, you will also see the Parameter value denoted as ".../iam/path", for example. This notation is meant to represent the core of the parameter's expected path. The "..." prefix is meant to be a placeholder for either "/configuration/default" (in the case of a default value) or "/configuration/myfavoritebranch" (in the case of specifying a branch specific override for the myfavoritebranch branch.
