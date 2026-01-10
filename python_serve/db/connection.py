import pymysql
from pymysql.cursors import DictCursor
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG

class DatabasePool:
    def __init__(self):
        self.pool = None
        self._init_pool()
    
    def _init_pool(self):
        self.pool = pymysql.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            charset=DB_CONFIG['charset'],
            cursorclass=DictCursor,
            autocommit=False
        )
    
    def get_connection(self):
        try:
            self.pool.ping(reconnect=True)
        except:
            self._init_pool()
        return self.pool
    
    def query(self, sql, params=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            result = cursor.fetchall()
            conn.commit()
            return result
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
    
    def execute(self, sql, params=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            if params:
                affected_rows = cursor.execute(sql, params)
            else:
                affected_rows = cursor.execute(sql)
            conn.commit()
            return {
                'affectedRows': affected_rows,
                'insertId': cursor.lastrowid
            }
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
    
    def close(self):
        if self.pool:
            try:
                self.pool.close()
            except:
                pass

db = DatabasePool()
