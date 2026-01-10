from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import COS_CONFIG

config = CosConfig(
    Region=COS_CONFIG['Region'],
    SecretId=COS_CONFIG['SecretId'],
    SecretKey=COS_CONFIG['SecretKey'],
    Scheme='https'
)

client = CosS3Client(config)

def upload_file_to_cos(file_data, file_key, content_type):
    try:
        response = client.put_object(
            Bucket=COS_CONFIG['Bucket'],
            Body=file_data,
            Key=file_key,
            ContentType=content_type
        )
        location = response.get('Location', '')
        return location
    except Exception as e:
        raise Exception(f"上传文件到COS失败: {str(e)}")
