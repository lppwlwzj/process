from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import db
from common.response import success_response, error_response

def add_history(data):
    customer_id = data.get('customer_id')
    customer_name = data.get('customer_name')
    progress = data.get('progress')
    technician = data.get('technician')
    start_time = data.get('start_time')
    
    if not all([customer_id, customer_name, progress, technician, start_time]):
        return error_response("缺少必要参数！")
    
    get_last_sql = """SELECT progress, technician, start_time FROM customer_process_history 
                      WHERE customer_id=%s ORDER BY start_time DESC LIMIT 1"""
    get_count_sql = "SELECT COUNT(*) as count FROM customer_process_history WHERE customer_id=%s"
    
    try:
        last_results = db.query(get_last_sql, (customer_id,))
        
        previous_progress = None
        previous_technician = None
        duration_minutes = None
        
        if last_results and len(last_results) > 0:
            last_record = last_results[0]
            previous_progress = last_record.get('progress')
            previous_technician = last_record.get('technician')
            
            last_time = last_record.get('start_time')
            if isinstance(last_time, str):
                last_time = datetime.fromisoformat(last_time.replace('Z', '+00:00'))
            elif not isinstance(last_time, datetime):
                last_time = datetime.now()
            
            current_time = datetime.fromisoformat(start_time) if isinstance(start_time, str) else start_time
            if isinstance(current_time, str):
                current_time = datetime.fromisoformat(current_time.replace('Z', '+00:00'))
            
            duration_minutes = int((current_time - last_time).total_seconds() / 60)
        
        count_results = db.query(get_count_sql, (customer_id,))
        operation_count = (count_results[0].get('count', 0) if count_results else 0) + 1
        
        insert_sql = """INSERT INTO customer_process_history 
            (customer_id, customer_name, progress, technician, operation_count, start_time, duration_minutes, previous_progress, previous_technician) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        
        history_result = db.execute(insert_sql, (
            customer_id, customer_name, progress, technician, operation_count,
            start_time, duration_minutes, previous_progress, previous_technician
        ))
        
        check_process_sql = "SELECT id FROM customer_process WHERE customer_id=%s"
        process_results = db.query(check_process_sql, (customer_id,))
        
        if process_results and len(process_results) > 0:
            update_process_sql = "UPDATE customer_process SET progress=%s, technician=%s, updated_at=NOW() WHERE customer_id=%s"
            db.execute(update_process_sql, (progress, technician, customer_id))
        else:
            insert_process_sql = "INSERT INTO customer_process (customer_id, customer_name, progress, technician) VALUES (%s, %s, %s, %s)"
            db.execute(insert_process_sql, (customer_id, customer_name, progress, technician))
        
        return success_response({
            'id': history_result['insertId'],
            'operation_count': operation_count,
            'duration_minutes': duration_minutes,
            'previous_progress': previous_progress,
            'previous_technician': previous_technician
        }, "操作记录添加成功！")
    except Exception as e:
        return error_response(str(e))

def get_history(data):
    customer_id = data.get('customer_id')
    
    if not customer_id:
        return error_response("缺少客户ID！")
    
    sql = "SELECT * FROM customer_process_history WHERE customer_id=%s ORDER BY start_time DESC"
    
    try:
        results = db.query(sql, (customer_id,))
        return success_response(results, "获取操作历史成功！")
    except Exception as e:
        return error_response(str(e))
