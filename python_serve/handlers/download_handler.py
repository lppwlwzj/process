import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import db
from common.response import success_response, error_response

def download_customer(data):
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    
    if not start_date or not end_date:
        return error_response("缺少日期参数")
    
    sql = """SELECT i.*, s.*
           FROM customer i 
           JOIN service s ON i.id = s.customer_id 
           WHERE i.createtime >= %s 
           AND i.createtime <= %s"""
    
    try:
        results = db.query(sql, (f"{start_date} 00:00:00", f"{end_date} 23:59:59"))
        return success_response(results, "操作成功！")
    except Exception as e:
        return error_response(str(e))
