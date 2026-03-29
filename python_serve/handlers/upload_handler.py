from fastapi import UploadFile
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.response import success_response, error_response
from common.cos_upload import upload_file_to_cos

async def upload_file(file: UploadFile):
    if not file:
        return error_response("没有上传文件")
    
    content_type = file.content_type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4']
    
    if content_type not in allowed_types:
        return error_response("不支持的文件类型")
    
    try:
        file_data = await file.read()
        file_key = f'uploads/{file.filename}'
        cos_file_url = upload_file_to_cos(file_data, file_key, content_type)
        
        return success_response({
            'img_url': f"https://{cos_file_url}"
        }, "上传成功！")
    except Exception as e:
        return error_response(str(e))

def delete_image(data):
    img_url = data.get('img_url')
    if not img_url:
        return error_response("缺少图片URL")
    
    import re
    import os
    
    reg = re.compile(r'(\/img\/images\/\S*)')
    match = reg.search(img_url)
    
    if match:
        img_path = match.group(0)
        id_part = img_path.split('.')[1] if '.' in img_path else None
        
        if id_part:
            dir_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'images')
            try:
                if os.path.exists(dir_path):
                    for filename in os.listdir(dir_path):
                        if filename.split('.')[1] == id_part:
                            file_path = os.path.join(dir_path, filename)
                            if os.path.exists(file_path):
                                os.remove(file_path)
                return success_response(None, "操作成功！")
            except Exception as e:
                return error_response(str(e))
    
    return success_response(None, "操作成功！")
