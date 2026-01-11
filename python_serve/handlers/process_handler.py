import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import db
from common.response import success_response, error_response
from common.utils import parse_materials

def list_processes(data):
    customer_name = data.get('customer_name')
    progress = data.get('progress')
    technician = data.get('technician')
    remark = data.get('remark')
    current_page = data.get('currentPage', 1)
    page_size = data.get('pageSize', 10)
    
    sql = """SELECT 
        cp.*,
        c.materials,
        c.wear_time,
        c.preparation_time,
        c.remark as customer_remark,
        y.edge_seating,
        y.occlusion_status,
        y.chairside_video
        FROM customer_process cp
        LEFT JOIN customer c ON cp.customer_id = c.id
        LEFT JOIN yipan y ON cp.customer_id = y.customer_id
        WHERE 1=1"""
    params = []
    
    if customer_name:
        sql += " AND cp.customer_name LIKE %s"
        params.append(f"%{customer_name}%")
    if progress:
        sql += " AND cp.progress = %s"
        params.append(progress)
    if technician:
        sql += " AND cp.technician = %s"
        params.append(technician)
    if remark:
        sql += " AND (cp.remark LIKE %s OR c.remark LIKE %s)"
        params.append(f"%{remark}%")
        params.append(f"%{remark}%")
    
        count_sql = f"SELECT COUNT(*) as total FROM ({sql}) as temp"
        try:
        count_results = db.query(count_sql, tuple(params))
        total = count_results[0]['total'] if count_results else 0
        
        sql += """ ORDER BY 
      CASE
        WHEN cp.progress != 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN 1
        WHEN c.wear_time = DATE_FORMAT(CURDATE(), '%m-%d') THEN 2
        WHEN cp.progress = 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN 4
        ELSE 3
      END ASC,
      CASE
        WHEN cp.progress != 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN c.wear_time
        WHEN cp.progress = 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN NULL
        WHEN c.wear_time = DATE_FORMAT(CURDATE(), '%m-%d') THEN NULL
        WHEN c.wear_time IS NULL THEN '99-99'
        ELSE c.wear_time
      END ASC,
      CASE
        WHEN cp.progress = 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN c.wear_time
        ELSE NULL
      END DESC
      LIMIT %s, %s"""
        params.append((current_page - 1) * page_size)
        params.append(page_size)
        
        results = db.query(sql, tuple(params))
        
        parsed_results = []
        for item in results:
            materials = []
            if item.get('materials'):
                try:
                    materials_data = item['materials']
                    if isinstance(materials_data, str):
                        materials = json.loads(materials_data)
                    else:
                        materials = materials_data
                    if not isinstance(materials, list):
                        materials = []
                except Exception as e:
                    print(f"解析 materials JSON 失败: {e}")
                    materials = []
            parsed_results.append({
                **item,
                'materials': materials
            })
        
        return success_response({
            'list': parsed_results,
            'total': total,
            'currentPage': int(current_page),
            'pageSize': int(page_size)
        }, "获取客户进度列表成功！")
    except Exception as e:
        return error_response(str(e))

def create_process(data):
    customer_name = data.get('customer_name')
    wear_time = data.get('wear_time')
    progress = data.get('progress')
    technician = data.get('technician')
    material = data.get('material')
    quantity = data.get('quantity')
    image = data.get('image')
    remark = data.get('remark')
    technician_audio = data.get('technician_audio')
    technician_video = data.get('technician_video')
    chairside_audio = data.get('chairside_audio')
    chairside_video = data.get('chairside_video')
    start_chairside_time = data.get('start_chairside_time')
    complete_chairside_time = data.get('complete_chairside_time')
    chairside_doctor = data.get('chairside_doctor')
    daily_wear_status = data.get('daily_wear_status')
    
    if not customer_name or not progress:
        return error_response("客户名称和进度不能为空！")
    
    sql = """INSERT INTO customer_process (customer_name, wear_time, progress, technician, material, quantity, image, remark, 
             technician_audio, technician_video, chairside_audio, chairside_video, start_chairside_time, complete_chairside_time, 
             chairside_doctor, daily_wear_status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
    
    try:
        result = db.execute(sql, (
            customer_name, wear_time or None, 'not_started', technician or None, material or None, quantity or None,
            image or None, remark or None, technician_audio or None, technician_video or None,
            chairside_audio or None, chairside_video or None, start_chairside_time or None,
            complete_chairside_time or None, chairside_doctor or None,
            daily_wear_status if daily_wear_status is not None else None
        ))
        if result['affectedRows'] != 1:
            return error_response("新增客户进度失败！")
        return success_response(None, "新增成功！")
    except Exception as e:
        return error_response(str(e))

def update_process(data):
    process_id = data.get('id')
    customer_name = data.get('customer_name')
    wear_time = data.get('wear_time')
    progress = data.get('progress')
    technician = data.get('technician')
    material = data.get('material')
    quantity = data.get('quantity')
    image = data.get('image')
    remark = data.get('remark')
    technician_audio = data.get('technician_audio')
    technician_video = data.get('technician_video')
    chairside_audio = data.get('chairside_audio')
    chairside_video = data.get('chairside_video')
    start_chairside_time = data.get('start_chairside_time')
    complete_chairside_time = data.get('complete_chairside_time')
    chairside_doctor = data.get('chairside_doctor')
    daily_wear_status = data.get('daily_wear_status')
    
    if not process_id:
        return error_response("缺少客户进度ID！")
    if not customer_name or not progress:
        return error_response("客户名称和进度不能为空！")
    
    sql = """UPDATE customer_process SET customer_name=%s, wear_time=%s, progress=%s, technician=%s, material=%s, quantity=%s, 
             image=%s, remark=%s, technician_audio=%s, technician_video=%s, chairside_audio=%s, chairside_video=%s, 
             start_chairside_time=%s, complete_chairside_time=%s, chairside_doctor=%s, daily_wear_status=%s WHERE id=%s"""
    
    try:
        result = db.execute(sql, (
            customer_name, wear_time or None, progress, technician or None, material or None, quantity or None,
            image or None, remark or None, technician_audio or None, technician_video or None,
            chairside_audio or None, chairside_video or None, start_chairside_time or None,
            complete_chairside_time or None, chairside_doctor or None,
            daily_wear_status if daily_wear_status is not None else None, process_id
        ))
        if result['affectedRows'] != 1:
            return error_response("更新客户进度失败！")
        return success_response(None, "更新成功！")
    except Exception as e:
        return error_response(str(e))

def delete_process(data):
    process_id = data.get('id')
    if not process_id:
        return error_response("缺少客户进度ID！")
    
    sql = "DELETE FROM customer_process WHERE id=%s"
    try:
        result = db.execute(sql, (process_id,))
        if result['affectedRows'] != 1:
            return error_response("删除客户进度失败！")
        return success_response(None, "删除成功！")
    except Exception as e:
        return error_response(str(e))

def batch_delete_processes(data):
    ids = data.get('ids')
    if not ids or not isinstance(ids, list) or len(ids) == 0:
        return error_response("缺少客户进度ID列表！")
    
    placeholders = ','.join(['%s'] * len(ids))
    sql = f"DELETE FROM customer_process WHERE id IN ({placeholders})"
    try:
        result = db.execute(sql, tuple(ids))
        if result['affectedRows'] == 0:
            return error_response("删除客户进度失败！")
        return success_response(None, f"成功删除 {result['affectedRows']} 条记录！")
    except Exception as e:
        return error_response(str(e))

def get_process_detail(data):
    customer_id = data.get('id')
    if not customer_id:
        return error_response("缺少客户ID！")
    
    sql = """SELECT
        c.id as customer_id,
        c.customer_name,
        c.wear_time,
        c.preparation_time,
        c.doctor,
        c.materials,
        c.image,
        c.qr_code,
        c.remark as customer_note,
        cp.id as process_id,
        cp.progress,
        cp.technician,
        cp.remark,
        cp.technician_audio,
        cp.web_video,
        cp.technician_video,
        cp.created_at as process_created_at,
        cp.updated_at as process_updated_at,
        y.edge_seating,
        y.occlusion_status
        FROM customer c
        LEFT JOIN customer_process cp ON c.id = cp.customer_id
        LEFT JOIN yipan y ON c.id = y.customer_id
        WHERE c.id = %s
        ORDER BY cp.created_at DESC
        LIMIT 1"""
    
    try:
        results = db.query(sql, (customer_id,))
        if len(results) == 0:
            return error_response("未找到该客户信息！")
        
        materials = []
        if results[0].get('materials'):
            try:
                materials_data = results[0]['materials']
                if isinstance(materials_data, str):
                    materials = json.loads(materials_data)
                else:
                    materials = materials_data
                if not isinstance(materials, list):
                    materials = []
            except Exception as e:
                print(f"解析 materials JSON 失败: {e}")
                materials = []
        
        result = {
            **results[0],
            'materials': materials
        }
        return success_response(result, "获取成功！")
    except Exception as e:
        return error_response(str(e))

def update_technician_video(data):
    customer_id = data.get('customer_id')
    technician_video = data.get('technician_video')
    
    if not customer_id:
        return error_response("缺少客户ID！")
    if technician_video is None:
        return error_response("缺少视频URL！")
    
    check_sql = "SELECT id, customer_name FROM customer_process WHERE customer_id=%s LIMIT 1"
    try:
        results = db.query(check_sql, (customer_id,))
        
        if len(results) > 0:
            update_sql = "UPDATE customer_process SET technician_video=%s WHERE customer_id=%s"
            db.execute(update_sql, (technician_video, customer_id))
            return success_response(None, "更新视频成功！")
        else:
            get_customer_sql = "SELECT customer_name FROM customer WHERE id=%s LIMIT 1"
            customer_results = db.query(get_customer_sql, (customer_id,))
            if len(customer_results) == 0:
                return error_response("客户不存在！")
            
            customer_name = customer_results[0]['customer_name']
            insert_sql = "INSERT INTO customer_process (customer_id, customer_name, progress, technician_video) VALUES (%s, %s, %s, %s)"
            db.execute(insert_sql, (customer_id, customer_name, 'not_started', technician_video))
            return success_response(None, "保存视频成功！")
    except Exception as e:
        return error_response(str(e))

def update_web_video(data):
    customer_id = data.get('customer_id')
    web_video = data.get('web_video')
    
    if not customer_id:
        return error_response("缺少客户ID！")
    if web_video is None:
        return error_response("缺少视频URL！")
    
    check_sql = "SELECT id, customer_name FROM customer_process WHERE customer_id=%s LIMIT 1"
    try:
        results = db.query(check_sql, (customer_id,))
        
        if len(results) > 0:
            update_sql = "UPDATE customer_process SET web_video=%s WHERE customer_id=%s"
            db.execute(update_sql, (web_video, customer_id))
            return success_response(None, "更新视频成功！")
        else:
            get_customer_sql = "SELECT customer_name FROM customer WHERE id=%s LIMIT 1"
            customer_results = db.query(get_customer_sql, (customer_id,))
            if len(customer_results) == 0:
                return error_response("客户不存在！")
            
            customer_name = customer_results[0]['customer_name']
            insert_sql = "INSERT INTO customer_process (customer_id, customer_name, progress, web_video) VALUES (%s, %s, %s, %s)"
            db.execute(insert_sql, (customer_id, customer_name, 'not_started', web_video))
            return success_response(None, "保存视频成功！")
    except Exception as e:
        return error_response(str(e))
