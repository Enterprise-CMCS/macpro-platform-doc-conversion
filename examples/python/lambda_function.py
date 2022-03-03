import requests
import base64
import json
import argparse
from aws_requests_auth.boto_utils import BotoAWSRequestsAuth
import boto3
import os
from aws_requests_auth.aws_auth import AWSRequestsAuth

def lambda_handler(event, context):
    # message = 'Calling: '.format(event['api_endpoint'])  

    api_endpoint = event['api_endpoint']
    output_location = event['output_location']
    input_bucket = event['input_bucket']
    input_file = event['input_file']

#    parser = argparse.ArgumentParser()
#    parser.add_argument("api_endpoint", help="https://<API ID>.execute-api.us-east-1.amazonaws.com/<branch name>/prince")
#    parser.add_argument("output_location", help="example: ~/Desktop")
#    args = parser.parse_args()
#    api_endpoint = args.api_endpoint
#    output_location = args.output_location
    stage = api_endpoint.split('/')[-2]
    aws_host = api_endpoint.split('/')[-3]


    #input_file_location = "examples/test_data/test.html" if input_file_location is None else input_file_location




    s3 = boto3.resource('s3')
    #s3client = boto3.client(
    #    's3',
    #    region_name='us-east-1'
    #)
    
    #Create a file object using the bucket and object key. 
    fileobj = s3.Object(input_bucket, input_file)

    # open the file object and read it into the variable filedata. 
    filedata = fileobj.get()['Body'].read()
    
    filedata2 = '''
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
    '''
    
    #print(filedata)

    # file data will be a binary stream.  We have to decode it 
    html_data = filedata.decode('latin-1')
    #html_data = filedata
    
 
    # latin-1 is required or we won't be able to decode this properly later
    # html_data = open(input_file_location, "r", encoding="latin-1").read()

    # str -> bytes
    input_bytes = html_data.encode()


    # bytes -> base64
    b64_data = base64.b64encode(input_bytes)

    print(f"508 html being converted to pdf:\n\n\n{html_data}\n\n\n")
    print(f"sending request to {api_endpoint}:")



    auth = AWSRequestsAuth(aws_access_key=os.environ['AWS_ACCESS_KEY_ID'],
                           aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
                           aws_token=os.environ['AWS_SESSION_TOKEN'],
                           aws_host=aws_host,
                           aws_region='us-east-1',
                           aws_service='execute-api')

    
#    auth = BotoAWSRequestsAuth(
#                           aws_host=aws_host,
#                           aws_region='us-east-1',
#                          aws_service='execute-api')
  

    # Sending post request and saving response as response object 
    r = requests.post(url = api_endpoint, data = b64_data, auth=auth)


    # resp is json with base64 payload
    api_resp = r.json()
    print(r.content)
    print(r.json)

    # base64 -> bytes
    out_bytes = base64.b64decode(api_resp, validate=True)



    # Perform a basic validation to make sure that the result is a valid PDF file
    # Note this is not 100% reliable (the magic number / file signature)
    if out_bytes[0:4] != b'%PDF':
      raise ValueError('Missing the PDF file signature')
 


    # Write the PDF contents (bytes) to a local file
    # b = binary
    output_file = f'prince-{stage}.pdf'
    s3.Bucket(output_location).put_object(Body=out_bytes,  Key=output_file)

    #f = open(output_file, 'wb')
    #f.write(out_bytes)
    #f.close()
    #print(f"508 PDF written to: {output_location}/{output_file}")

    return { 
        'message' : f"508 PDF written to: {output_location}/{output_file}"
    }
