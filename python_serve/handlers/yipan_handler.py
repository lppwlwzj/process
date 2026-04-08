from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import db
from common.response import success_response, error_response
from common.utils import parse_materials

def add_yipan(data):
    yipan_info = {k: v for k, v in data.items()}
    
    columns = ', '.join(yipan_info.keys())
    placeholders = ', '.join(['%s'] * len(yipan_info))
    sql = f"INSERT INTO yipan ({columns}) VALUES ({placeholders})"
    
    try:
        result = db.execute(sql, tuple(yipan_info.values()))
        if result['affectedRows'] != 1:
            return error_response("新增椅旁记录失败！")
        return success_response({'id': result['insertId']}, "新增椅旁记录成功！")
    except Exception as e:
        return error_response(str(e))

def get_yipan_detail(data):
    customer_id = data.get('customer_id')
    
    if not customer_id:
        return error_response("客户ID不能为空")
    
    sql = "SELECT * FROM yipan WHERE customer_id = %s ORDER BY updated_at DESC LIMIT 1"
    try:
        results = db.query(sql, (customer_id,))
        
        if len(results) == 0:
            return success_response(None, "未找到该客户的椅旁记录")
        
        return success_response(results[0], "获取椅旁记录成功")
    except Exception as e:
        return error_response(str(e))

def start_chairside(data):
    customer_id = data.get('customer_id')
    chairside_doctor = data.get('chairside_doctor')
    
    if not customer_id or not chairside_doctor:
        return error_response("客户ID和椅旁医生不能为空")
    
    check_sql = "SELECT * FROM yipan WHERE customer_id = %s"
    try:
        results = db.query(check_sql, (customer_id,))
        
        if len(results) == 0:
            return error_response("未找到该客户的椅旁记录")
        
        yipan_record = results[0]
        
        if yipan_record.get('start_time'):
            return error_response(f"医生{yipan_record.get('chairside_doctor')}正在进行椅旁操作，请先完成后再开始新的椅旁")
        
        update_sql = "UPDATE yipan SET chairside_doctor = %s, start_time = NOW() WHERE customer_id = %s"
        result = db.execute(update_sql, (chairside_doctor, customer_id))
        if result['affectedRows'] == 0:
            return error_response("开始椅旁操作失败！")
        
        return success_response({
            'chairside_doctor': chairside_doctor,
            'start_time': datetime.now().isoformat()
        }, "开始椅旁操作成功")
    except Exception as e:
        return error_response(str(e))

def complete_chairside(data):
    customer_id = data.get('customer_id')
    
    if not customer_id:
        return error_response("客户ID不能为空")
    
    check_sql = """SELECT y.*, cp.progress, c.customer_name AS customer_name_from_customer
        FROM yipan y 
        LEFT JOIN customer_process cp ON y.customer_id = cp.customer_id 
        LEFT JOIN customer c ON c.id = y.customer_id
        WHERE y.customer_id = %s"""
    try:
        results = db.query(check_sql, (customer_id,))
        
        if len(results) == 0:
            return error_response("未找到该客户的椅旁记录")
        
        yipan_record = results[0]
        
        if not yipan_record.get('start_time'):
            return error_response("该客户尚未开始椅旁操作，无法完成")
        
        start_time = yipan_record['start_time']
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        elif not isinstance(start_time, datetime):
            start_time = datetime.now()
        
        end_time = datetime.now()
        duration_minutes = int((end_time - start_time).total_seconds() / 60)
        
        insert_history_sql = """INSERT INTO yipan_history 
            (customer_id, customer_name, progress, chairside_doctor, start_time, end_time, duration_minutes) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)"""
        
        customer_name_for_history = (
            yipan_record.get('customer_name_from_customer')
            or yipan_record.get('customer_name')
            or ''
        )
        history_params = (
            customer_id,
            customer_name_for_history,
            yipan_record.get('progress') or '未知',
            yipan_record.get('chairside_doctor'),
            start_time,
            end_time,
            duration_minutes
        )
        
        history_result = db.execute(insert_history_sql, history_params)
        
        clear_start_time_sql = "UPDATE yipan SET start_time = NULL WHERE customer_id = %s"
        db.execute(clear_start_time_sql, (customer_id,))
        
        return success_response({
            'history_id': history_result['insertId'],
            'chairside_doctor': yipan_record.get('chairside_doctor'),
            'start_time': start_time.isoformat() if isinstance(start_time, datetime) else str(start_time),
            'end_time': end_time.isoformat(),
            'duration_minutes': duration_minutes
        }, "完成椅旁操作成功")
    except Exception as e:
        return error_response(str(e))

def update_yipan(data):
    yipan_id = data.get('id')
    customer_id = data.get('customer_id')
    
    if not yipan_id and not customer_id:
        return error_response("缺少更新条件：需要提供id或customer_id")
    
    update_fields = {k: v for k, v in data.items() if k not in ['id', 'customer_id']}
    
    if not update_fields:
        return error_response("没有要更新的字段")
    
    set_clause = ', '.join([f"{k}=%s" for k in update_fields.keys()])
    params = list(update_fields.values())
    
    if yipan_id:
        sql = f"UPDATE yipan SET {set_clause} WHERE id = %s"
        params.append(yipan_id)
    else:
        sql = f"UPDATE yipan SET {set_clause} WHERE customer_id = %s"
        params.append(customer_id)
    
    try:
        result = db.execute(sql, tuple(params))
        if result['affectedRows'] == 0:
            return error_response("更新椅旁记录失败！")
        return success_response(None, "更新椅旁记录成功！")
    except Exception as e:
        return error_response(str(e))

def list_yipan(data):
    customer_id = data.get('customer_id')
    
    sql = "SELECT * FROM yipan"
    params = []
    
    if customer_id:
        sql += " WHERE customer_id = %s"
        params.append(customer_id)
    
    sql += " ORDER BY updated_at DESC"
    
    try:
        results = db.query(sql, tuple(params) if params else None)
        return success_response(results, "获取椅旁记录列表成功")
    except Exception as e:
        return error_response(str(e))

def update_chairside_video(data):
    customer_id = data.get('customer_id')
    chairside_video = data.get('chairside_video')
    
    if not customer_id:
        return error_response("缺少客户ID！")
    if chairside_video is None:
        return error_response("缺少视频URL！")
    
    check_sql = "SELECT id, customer_name FROM yipan WHERE customer_id=%s LIMIT 1"
    try:
        results = db.query(check_sql, (customer_id,))
        
        if len(results) > 0:
            update_sql = "UPDATE yipan SET chairside_video=%s WHERE customer_id=%s"
            db.execute(update_sql, (chairside_video, customer_id))
            return success_response(None, "更新视频成功！")
        else:
            get_customer_sql = "SELECT customer_name FROM customer WHERE id=%s LIMIT 1"
            customer_results = db.query(get_customer_sql, (customer_id,))
            if len(customer_results) == 0:
                return error_response("客户不存在！")
            
            customer_name = customer_results[0]['customer_name']
            insert_sql = "INSERT INTO yipan (customer_id, customer_name, chairside_video) VALUES (%s, %s, %s)"
            db.execute(insert_sql, (customer_id, customer_name, chairside_video))
            return success_response(None, "保存视频成功！")
    except Exception as e:
        return error_response(str(e))

def get_yipan_history(data):
    customer_id = data.get('customer_id')
    date_str = data.get('date')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    chairside_doctor = data.get('chairside_doctor')

    conditions = []
    params = []

    if customer_id:
        conditions.append("h.customer_id = %s")
        params.append(customer_id)
    if start_date and end_date:
        conditions.append("DATE(h.start_time) >= %s AND DATE(h.start_time) <= %s")
        params.extend([start_date, end_date])
    elif date_str:
        conditions.append("DATE(h.start_time) = %s")
        params.append(date_str)
    if chairside_doctor:
        conditions.append("h.chairside_doctor = %s")
        params.append(chairside_doctor)

    def attach_materials(rows):
        out = []
        for row in rows or []:
            r = dict(row)
            r["materials"] = parse_materials(r.get("materials"))
            out.append(r)
        return out

    if not conditions:
        sql = (
            "SELECT h.*, c.materials AS materials FROM yipan_history h "
            "LEFT JOIN customer c ON h.customer_id = c.id ORDER BY h.start_time DESC"
        )
        try:
            results = db.query(sql, None)
            return success_response(attach_materials(results), "获取椅旁历史记录成功")
        except Exception as e:
            return error_response(str(e))

    if not customer_id and not date_str and not (start_date and end_date):
        return error_response("缺少客户ID或日期！")

    sql = (
        "SELECT h.*, c.materials AS materials FROM yipan_history h "
        "LEFT JOIN customer c ON h.customer_id = c.id WHERE "
        + " AND ".join(conditions)
        + " ORDER BY h.start_time DESC"
    )

    try:
        results = db.query(sql, tuple(params))
        return success_response(attach_materials(results), "获取椅旁历史记录成功")
    except Exception as e:
        return error_response(str(e))
