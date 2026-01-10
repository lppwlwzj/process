import requests
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import db
from common.response import success_response, error_response
from common.jwt_auth import generate_token
from common.cos_upload import upload_file_to_cos
from config import WX_CONFIG

def login(userinfo):
    username = userinfo.get('username')
    usercount = userinfo.get('usercount')
    password = userinfo.get('password')
    
    if username != "ykmy111" and usercount != "ykmy111":
        return error_response("用户不存在！")
    
    if password != "111520":
        return error_response("密码错误！")
    
    user = {
        'id': 1,
        'username': 'ykmy111',
        'usercount': '111520',
        'role': 'admin'
    }
    
    token_str = generate_token(user, expires_days=31)
    
    return success_response({
        'token': f'Bearer {token_str}',
        'userinfo': {
            'usercount': '123',
            'username': '123'
        }
    }, "登录成功！")

def list_users():
    sql = "SELECT * FROM user"
    try:
        results = db.query(sql)
        return success_response(results)
    except Exception as e:
        return error_response(str(e))

def delete_user(data):
    user_id = data.get('id')
    if not user_id:
        return error_response("缺少用户ID！")
    
    sql = "DELETE FROM user WHERE id=%s"
    try:
        result = db.execute(sql, (user_id,))
        if result['affectedRows'] != 1:
            return error_response("删除用户失败！")
        return success_response(None, "删除成功！")
    except Exception as e:
        return error_response(str(e))

def create_user(data):
    username = data.get('username')
    usercount = data.get('usercount')
    password = data.get('password')
    role = data.get('role', '其他人员')
    
    if not username or not usercount or not password:
        return error_response("用户名、账号和密码不能为空！")
    
    check_sql = "SELECT * FROM user WHERE usercount=%s"
    try:
        check_results = db.query(check_sql, (usercount,))
        if len(check_results) > 0:
            return error_response("用户账号已存在！")
        
        insert_sql = "INSERT INTO user (username, usercount, password, role) VALUES (%s, %s, %s, %s)"
        result = db.execute(insert_sql, (username, usercount, password, role))
        if result['affectedRows'] != 1:
            return error_response("新增用户失败！")
        return success_response(None, "新增成功！")
    except Exception as e:
        return error_response(str(e))

async def get_access_token(data):
    try:
        response = requests.get("https://api.weixin.qq.com/cgi-bin/token", params={
            'appid': WX_CONFIG['appid'],
            'secret': WX_CONFIG['secret'],
            'grant_type': 'client_credential'
        })
        response.raise_for_status()
        result = response.json()
        access_token = result.get('access_token')
        
        if access_token:
            img = await get_qr_code(access_token, data)
            sql = "UPDATE customer SET qr_code=%s WHERE id=%s"
            db.execute(sql, (img, data.get('id')))
            return success_response({'img': img})
        else:
            return error_response("获取access_token失败")
    except Exception as e:
        return error_response(str(e))

async def get_qr_code(token, params):
    page = params.get('page')
    customer_id = params.get('id')
    
    try:
        response = requests.post(
            f"https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token={token}",
            json={
                'page': page,
                'scene': str(customer_id),
                'width': 280,
                'check_path': False
            },
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        
        file_key = f'qrCode/{customer_id}.png'
        cos_file_url = upload_file_to_cos(response.content, file_key, 'image/png')
        return f"https://{cos_file_url}"
    except Exception as e:
        print(f"生成二维码图片失败: {e}")
        raise e
