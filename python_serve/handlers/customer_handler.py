import json
import sys
import os
from datetime import datetime
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import db
from common.response import success_response, error_response
from common.utils import parse_materials

def convert_datetime_to_str(obj):
    """递归转换字典中的 datetime 对象为字符串"""
    if isinstance(obj, dict):
        return {k: convert_datetime_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime_to_str(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj

def list_customers():
    sql = """SELECT 
        c.*,
        (SELECT technician_video FROM customer_process WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as technician_video
        FROM customer c
        ORDER BY c.created_at DESC"""
    try:
        results = db.query(sql)
        parsed_results = []
        for item in results:
            parsed_item = {
                **item,
                'materials': parse_materials(item.get('materials'))
            }
            parsed_item = convert_datetime_to_str(parsed_item)
            parsed_results.append(parsed_item)
        return success_response(parsed_results)
    except Exception as e:
        return error_response(str(e))

def create_customer(data):
    customer_name = data.get('customer_name')
    wear_time = data.get('wear_time')
    preparation_time = data.get('preparation_time')
    doctor = data.get('doctor')
    materials = data.get('materials')
    image = data.get('image')
    qr_code = data.get('qr_code')
    remark = data.get('remark')
    
    if not customer_name:
        return error_response("客户姓名不能为空！")
    
    materials_json = json.dumps(materials) if materials else None
    
    material_str = None
    if materials and len(materials) > 0:
        material_str = ','.join([m.get('material', '') for m in materials if m.get('material')])
    
    sql = """INSERT INTO customer (customer_name, wear_time, preparation_time, doctor, materials, image, qr_code, remark) 
             VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
    try:
        result = db.execute(sql, (customer_name, wear_time, preparation_time, doctor, materials_json, image, qr_code, remark))
        if result['affectedRows'] != 1:
            return error_response("新增客户失败！")
        
        customer_id = result['insertId']
        
        check_process_sql = "SELECT id FROM customer_process WHERE customer_id=%s LIMIT 1"
        process_results = db.query(check_process_sql, (customer_id,))
        
        if len(process_results) > 0:
            update_process_sql = """UPDATE customer_process SET customer_name=%s, wear_time=%s, material=%s, remark=%s 
                                     WHERE customer_id=%s"""
            db.execute(update_process_sql, (customer_name, wear_time, material_str, remark, customer_id))
        else:
            insert_process_sql = """INSERT INTO customer_process (customer_id, customer_name, wear_time, progress, material, remark) 
                                     VALUES (%s, %s, %s, %s, %s, %s)"""
            db.execute(insert_process_sql, (customer_id, customer_name, wear_time, 'not_started', material_str, remark))
        
        check_yipan_sql = "SELECT id FROM yipan WHERE customer_id=%s LIMIT 1"
        yipan_results = db.query(check_yipan_sql, (customer_id,))
        
        if len(yipan_results) == 0:
            insert_yipan_sql = "INSERT INTO yipan (customer_id, customer_name) VALUES (%s, %s)"
            db.execute(insert_yipan_sql, (customer_id, customer_name))
        
        return success_response({'id': customer_id}, "新增成功！")
    except Exception as e:
        return error_response(str(e))

def update_customer(data):
    customer_id = data.get('id')
    customer_name = data.get('customer_name')
    wear_time = data.get('wear_time')
    preparation_time = data.get('preparation_time')
    doctor = data.get('doctor')
    materials = data.get('materials')
    image = data.get('image')
    qr_code = data.get('qr_code')
    remark = data.get('remark')
    
    if not customer_id:
        return error_response("缺少客户ID！")
    if not customer_name:
        return error_response("客户姓名不能为空！")
    
    materials_json = json.dumps(materials) if materials else None
    
    sql = """UPDATE customer SET customer_name=%s, wear_time=%s, preparation_time=%s, doctor=%s, 
             materials=%s, image=%s, qr_code=%s, remark=%s WHERE id=%s"""
    try:
        result = db.execute(sql, (customer_name, wear_time, preparation_time, doctor, materials_json, image, qr_code, remark, customer_id))
        if result['affectedRows'] != 1:
            return error_response("更新客户失败！")
        return success_response(None, "更新成功！")
    except Exception as e:
        return error_response(str(e))

def delete_customer(data):
    customer_id = data.get('id')
    if not customer_id:
        return error_response("缺少客户ID！")
    
    sql = "DELETE FROM customer WHERE id=%s"
    try:
        result = db.execute(sql, (customer_id,))
        if result['affectedRows'] != 1:
            return error_response("删除客户失败！")
        return success_response(None, "删除成功！")
    except Exception as e:
        return error_response(str(e))

def batch_delete_customers(data):
    ids = data.get('ids')
    if not ids or not isinstance(ids, list) or len(ids) == 0:
        return error_response("缺少客户ID列表！")
    
    placeholders = ','.join(['%s'] * len(ids))
    sql = f"DELETE FROM customer WHERE id IN ({placeholders})"
    try:
        result = db.execute(sql, tuple(ids))
        if result['affectedRows'] == 0:
            return error_response("删除客户失败！")
        return success_response(None, f"成功删除 {result['affectedRows']} 条记录！")
    except Exception as e:
        return error_response(str(e))

def get_customer_detail(data):
    customer_id = data.get('id')
    if not customer_id:
        return error_response("缺少客户ID！")
    
    sql = "SELECT * FROM customer WHERE id=%s"
    try:
        results = db.query(sql, (customer_id,))
        if len(results) != 1:
            return error_response("客户不存在！")
        
        customer = {
            **results[0],
            'materials': parse_materials(results[0].get('materials'))
        }
        customer = convert_datetime_to_str(customer)
        return success_response(customer)
    except Exception as e:
        return error_response(str(e))
