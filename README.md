# macpro-platform-doc-conversion ![Build](https://github.com/CMSgov/macpro-platform-doc-conversion/workflows/Deploy/badge.svg?branch=master) [![Maintainability](https://api.codeclimate.com/v1/badges/c6b3d112f68f9be7f95a/maintainability)](https://codeclimate.com/github/CMSgov/macpro-platform-doc-conversion/maintainability) [![CodeQL](https://github.com/CMSgov/macpro-platform-doc-conversion/actions/workflows/codeql-analysis.yml/badge.svg?branch=master)](https://github.com/CMSgov/macpro-platform-doc-conversion/actions/workflows/codeql-analysis.yml) [![Dependabot](https://badgen.net/badge/Dependabot/enabled/green?icon=dependabot)](https://dependabot.com/) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![Test Coverage](https://api.codeclimate.com/v1/badges/c6b3d112f68f9be7f95a/test_coverage)](https://codeclimate.com/github/CMSgov/macpro-platform-doc-conversion/test_coverage)

MACPRO Platform document conversion APIs.

Initial API:

- 508 compliant HTML -> 508 compliant PDF (via Prince XML)
  - Input needs to be base 64 encoded
    - NOTE:   `title` and `lang` tags should be set in the HTML body in order for Prince to set these attributes in the resulting PDF.
              Reference `examples/test_data/test.html` for an example. 
  - Output is base 64 encoded

## Release

Our product is promoted through branches. Master is merged to val to affect a master release, and val is merged to production to affect a production release. Please use the buttons below to promote/release code to higher environments.<br />

| branch     | status                                                                                                               | release                                                                                                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| master     | ![master](https://github.com/CMSgov/macpro-platform-doc-conversion/workflows/Deploy/badge.svg?branch=master)         | [![release to master](https://img.shields.io/badge/-Create%20PR-blue.svg)](https://github.com/CMSgov/macpro-platform-doc-conversion/compare?quick_pull=1)                                                                                                   |
| val        | ![val](https://github.com/CMSgov/macpro-platform-doc-conversion/workflows/Deploy/badge.svg?branch=val)               | [![release to val](https://img.shields.io/badge/-Create%20PR-blue.svg)](https://github.com/CMSgov/macpro-platform-doc-conversion/compare/val...master?quick_pull=1&template=PULL_REQUEST_TEMPLATE.val.md&title=Release%20to%20Val)                          |
| production | ![production](https://github.com/CMSgov/macpro-platform-doc-conversion/workflows/Deploy/badge.svg?branch=production) | [![release to production](https://img.shields.io/badge/-Create%20PR-blue.svg)](https://github.com/CMSgov/macpro-platform-doc-conversion/compare/production...val?quick_pull=1&template=PULL_REQUEST_TEMPLATE.production.md&title=Release%20to%20Production) |

## Architecture

![Architecture Diagram](./.images/architecture.svg?raw=true)

## Usage

See master build [here](https://github.com/CMSgov/macpro-platform-doc-conversion/actions?query=branch%3Amaster)

This application is built and deployed via GitHub Actions.

Want to deploy from your Mac?

- Create an AWS account
- Install/configure the AWS CLI
- brew install yarn
- sh deploy.sh

## Requirements

Node - we enforce using a specific version of node, specified in the file `.nvmrc`. This version matches the Lambda runtime. We recommend managing node versions using [NVM](https://github.com/nvm-sh/nvm#installing-and-updating).

Serverless - Get help installing it here: [Serverless Getting Started page](https://www.serverless.com/framework/docs/providers/aws/guide/installation/)

Yarn - in order to install dependencies, you need to [install yarn](https://classic.yarnpkg.com/en/docs/install/).

AWS Account: You'll need an AWS account with appropriate IAM permissions (admin recommended) to deploy this app in Amazon.

If you are on a Mac, you should be able to install all the dependencies like so:

```
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash

# select the version specified in .nvmrc
nvm install
nvm use

# install yarn
brew install yarn
```

If you'd like to test deploying prior to committing, you can deploy to AWS as follows:

```
./deploy.sh <branch name>

# Quick and dirty test where "test.hmtl" is a valid html file that is already 508 compliant.
# First we base64 encode the html:
# base64 -i ~/Desktop/test.html -o test_b64.html

# Note output will be a little garbled since we're filtering out special chars
# To properly validate the output perform these steps in JS or Python and decode the API response from base64
# API ID will be output from the deploy
curl -F "data=~@~/Desktop/test_b64.html" --tlsv1.2 https://<API ID>.execute-api.us-east-1.amazonaws.com/<branch name>/prince | sed 's/^"//; s/"$//' | base64 -d > ~/Desktop/test.pdf

# to clean up
./destroy.sh <branch name>
```

## Invocation example #1 (IAM Off)

We are starting with a simplified example, where no authorization is required.
To disable authorization, comment out `authorizer: aws_iam` in the `services/app-api/serverless.yml` as well as removing the `resourcePolicy` block.
To run the Python example calling your deployed API:

```
# Setting up a Python virtualenv is beyond the scope of this guide.
# Below assumes Python 3.8 and a pyenv virtual environment dedicated for calling this API
pyenv activate my-prince-virtual-env
pip install -r examples/python/requirements.txt
python examples/python/call_prince.py https://abc123.execute-api.us-east-1.amazonaws.com/master/prince ~/Desktop
508 html being converted to pdf:

<html lang="en">
        <head>
...
        </body>
      </html>

sending request to https://abc123.execute-api.us-east-1.amazonaws.com/master/prince:
<bound method Response.json of <Response [200]>>
508 PDF written to: /Users/jeffreysobchak/Desktop/prince-master.pdf
```

## Invocation example #2 (IAM Authorization) in EC2 or ECS (EC2, Fargate)

By default authorization is handled by IAM via a resource policy on the API Gateway. For more details, consult the readme in `services/app-api`.

The `call_prince_iam.py` script is using the [AWS V4 signing process](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html) to sign the request that is submitted to the API. This is a requirement when using IAM authentication. This is a complicated process, and packages exist to handle this for you. The example uses `BotoAWSRequestsAuth` for Python.

For this example, the IAM role attached to the ec2 instance is:

```
arn:aws:iam::<AWS ACCOUNT NO>:role/delegatedadmin/developer/This-Is-An-IAM-Role-for-EC2
```

The above IAM role would need to be placed in the SSM StringList parameter for allowed ARNs that can invoke the API,
ensuring the IAM role gets added to the API Gateway resource policy:

```
/configuration/my-branch-name/macpro-platform-doc-conversion/iam/invoke-arns
```

Additionally, the IAM role needs `"execute-api:Invoke"` on `"Resource": "arn:aws:execute-api:us-east-1:*`.

**NOTE:** for ECS, the IAM role that has the above `execute-api` permissions needs to be assigned to the _Task role_, NOT the _Task execution role_. The latter is used to pull container images and publish container logs, while the former is the role your invoking code uses. These two roles are named confusingly by AWS.

[IAM authentication and resource policy](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-authorization-flow.html#apigateway-authorization-flow-iam) covers the why in extensive detail. TL;DR both the identity policy (invoker) and resource policy (API Gateway) matter.

```
# Connect to ec2 instance via SSM
# Below assumes python3 and pip3 installed already or .debug ec2 instance being used
sh-4.2$ cd ~
sh-4.2$ git clone https://github.com/CMSgov/macpro-platform-doc-conversion
sh-4.2$ cd macpro-platform-doc-conversion
sh-4.2$ git checkout -b my-branch-name
sh-4.2$ pip3 install -r examples/python/requirements.txt
sh-4.2$ python3 examples/python/call_prince_iam.py https://<API ID>.execute-api.us-east-1.amazonaws.com/<STAGE NAME>/prince ~
508 html being converted to pdf:


<html lang="en">
        <head>
          <title>APS print page</title>
        </head>
        <body>
          <img
            alt="SC state logo"
            src="https://i.pinimg.com/originals/c4/52/04/c4520440b727695b5aca89e7afa2e7e3.jpg"
            width="50"
          />
          <p style={{ "border-top": "1px solid black" }}>&nbsp;</p>
          <h1>Amendment to Planned Settlement (APS)</h1>
          <p>&nbsp;</p>
          <p>APD-ID: ND-0001</p>
          <p>Submitter: Jeffrey Sobchak</p>
          <p>Submitter Email: jeffrey.sobchak@gmail.com</p>
          <p>Urgent?: false</p>
          <p>Comments:</p>
        </body>
      </html>



sending request to https://abc123.execute-api.us-east-1.amazonaws.com/my-branch-name/prince:
<bound method Response.json of <Response [200]>>
508 PDF written to: /home/ssm-user/my-branch-name.pdf
sh-4.2$
```

## Invocation example #3 (IAM Authorization) in a Lambda Function

In this example, all permission requirements and SSM setup for the invoker remain the same as example #2.
What changes is the invocation code. For Lambda will we work with `examples/python/lambda_handler.py`.

This example differs from the previous in that it reads an html input file from an S3 bucket and writes it to an S3 bucket, so the IAM role for the Lambda function would also need permissions for this.

[AWS's instructions for packaging and deploying a Python Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html) can be used to deploy this example handler. The dependencies that need included are in `examples/python/requirements.txt`

Example test input lambda function (can be tested in AWS console):

```
{
  "api_endpoint": "https://abc123.execute-api.us-east-1.amazonaws.com/my-branch-name/prince",
  "input_bucket": "my-test-bucket-name",
  "input_file": "test.html",
  "output_location": "my-test-bucket-name"
}
```

## Contributing / To-Do

See current open [issues](https://github.com/CMSgov/macpro-platorm-doc-conversion/issues) or check out the [project board](https://github.com/CMSgov/macpro-platform-doc-conversion/projects/1).

Please feel free to open new issues for defects or enhancements.

To contribute:

- Fork this repository
- Make changes in your fork
- Open a pull request targetting this repository

Pull requests are being accepted.

## License

[![License](https://img.shields.io/badge/License-CC0--1.0--Universal-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/legalcode)

See [LICENSE](LICENSE.md) for full details.

```text
As a work of the United States Government, this project is
in the public domain within the United States.

Additionally, we waive copyright and related rights in the
work worldwide through the CC0 1.0 Universal public domain dedication.
```

## Slack channel

To enable slack integration, set a value for SLACK_WEBHOOK_URL in github actions secret.

To set the SLACK_WEBHOOK_URL:

- Go to https://api.slack.com/apps
- Create new app : fill in the information
- Add features and funtionality----Incoming webhooks--- activative incoming webooks--- Add new webhook to workspace.
- copy new webhook url and set it as SLACK_WEBHOOK_URL in Github Actions Secrets.
