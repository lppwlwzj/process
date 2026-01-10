import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import db
from common.response import success_response, error_response

def add_zhibao(data):
    fields = [
        'patient', 'dateTime', 'orderNo', 'zhibaoDate', 'hospital', 'origin',
        'product', 'colorNo', 'top', 'bottom', 'liscens', 'certificate', 'business', 'imgQr'
    ]
    
    values = [data.get(field) for field in fields]
    columns = ', '.join(fields)
    placeholders = ', '.join(['%s'] * len(fields))
    
    sql = f"INSERT INTO zhibao ({columns}) VALUES ({placeholders})"
    
    try:
        result = db.execute(sql, tuple(values))
        if result['affectedRows'] != 1:
            return error_response("新增失败！")
        return success_response({'id': result['insertId']}, "新增信息成功！")
    except Exception as e:
        return error_response(str(e))

def edit_zhibao(data):
    zhibao_id = data.get('id')
    if not zhibao_id:
        return error_response("缺少质保ID")
    
    fields = [
        'patient', 'orderNo', 'zhibaoDate', 'hospital', 'origin',
        'product', 'colorNo', 'top', 'bottom', 'liscens', 'certificate', 'business'
    ]
    
    set_clause = ', '.join([f"{field}=%s" for field in fields])
    values = [data.get(field) for field in fields]
    values.append(zhibao_id)
    
    sql = f"UPDATE zhibao SET {set_clause} WHERE id=%s"
    
    try:
        result = db.execute(sql, tuple(values))
        return success_response({'id': zhibao_id}, "修改成功！")
    except Exception as e:
        return error_response(str(e))

def get_zhibao_detail_by_id(data):
    zhibao_id = data.get('id')
    if not zhibao_id:
        return error_response("缺少质保ID")
    
    sql = "SELECT * FROM zhibao WHERE id=%s"
    try:
        results = db.query(sql, (zhibao_id,))
        if len(results) > 0:
            return success_response(results[0], "查询成功！")
        return error_response("未找到质保记录")
    except Exception as e:
        return error_response(str(e))

def get_zhibao_info(data):
    search = data.get('search')
    if not search:
        return error_response("缺少搜索参数")
    
    sql = "SELECT i.* FROM zhibao i WHERE i.orderNo = %s"
    try:
        results = db.query(sql, (search,))
        if len(results) > 0:
            return success_response(results[0], "查询成功！")
        return success_response(None, "查询成功！")
    except Exception as e:
        return error_response(str(e))

def get_zhibao_list(data):
    search = data.get('search', '')
    
    sql1 = "SELECT i.* FROM zhibao i WHERE i.patient LIKE %s"
    sql2 = "SELECT i.* FROM zhibao i WHERE i.orderNo LIKE %s"
    
    try:
        results1 = db.query(sql1, (f"%{search}%",))
        results2 = db.query(sql2, (f"%{search}%",))
        
        combined_list = list(results1) + list(results2)
        
        seen_ids = set()
        unique_list = []
        for item in combined_list:
            item_id = item.get('id')
            if item_id and item_id not in seen_ids:
                seen_ids.add(item_id)
                unique_list.append(item)
        
        return success_response(unique_list, "查询成功！")
    except Exception as e:
        return error_response(str(e))
