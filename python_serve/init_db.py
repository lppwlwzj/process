import pymysql
import os
import sys

## 这行代码将当前脚本所在目录添加到 Python 的模块搜索路径，以便导入同目录下的模块（如 config.py）。
## __file__ 是 Python 中的一个内置变量，表示当前脚本的文件路径。
## os.path.dirname(os.path.abspath(__file__)) 获取当前脚本所在目录的绝对路径。
## os.path.dirname(...)：获取路径的目录部分
## sys.path.append(...)：将该目录添加到 Python 的模块搜索路径列表
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import DB_CONFIG

## 这行代码定义了一个函数，用于读取 SQL 文件的内容。
## file_path 是 SQL 文件的路径。
## with open(file_path, 'r', encoding='utf-8') as f: 打开 SQL 文件，并将其内容赋值给 content 变量。
## return content 返回 SQL 文件的内容。
def read_sql_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return content

def clean_sql_content(sql_content):
    lines = sql_content.split('\n')
    cleaned_lines = []
    in_comment = False
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        if stripped.startswith('/*'):
            in_comment = True
            continue
        
        if in_comment:
            if '*/' in stripped:
                in_comment = False
                remaining = stripped.split('*/', 1)[1].strip()
                if remaining:
                    cleaned_lines.append(remaining)
            continue
        
        if stripped.startswith('--'):
            continue
        
        if stripped.startswith('/*!'):
            continue
        
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def execute_sql_file(conn, sql_content, file_name):
    cursor = conn.cursor()
    try:
        cleaned_content = clean_sql_content(sql_content)
        
        statements = []
        current_statement = []
        
        for line in cleaned_content.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            
            current_statement.append(line)
            
            if stripped.endswith(';'):
                statement = '\n'.join(current_statement).strip()
                if statement:
                    statements.append(statement)
                current_statement = []
        
        if current_statement:
            statement = '\n'.join(current_statement).strip()
            if statement:
                statements.append(statement)
        
        for statement in statements:
            statement = statement.rstrip(';').strip()
            if not statement:
                continue
            
            try:
                cursor.execute(statement)
                statement_preview = statement[:60].replace('\n', ' ')
                print(f"  ✓ {statement_preview}...")
            except Exception as e:
                error_msg = str(e)
                if any(keyword in error_msg.lower() for keyword in ['already exists', "doesn't exist", 'duplicate', 'unknown table']):
                    print(f"  ⚠ 跳过 (已存在或表不存在): {error_msg[:50]}")
                else:
                    print(f"  ✗ 执行失败: {error_msg}")
                    raise e
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"执行 {file_name} 失败: {e}")
        raise e
    finally:
        cursor.close()

def init_database():
    mysql_config = {
        'host': DB_CONFIG['host'],
        'user': DB_CONFIG['user'],
        'password': DB_CONFIG['password'],
        'port': DB_CONFIG['port'],
        'charset': DB_CONFIG['charset']
    }
    
    try:
        conn = pymysql.connect(**mysql_config) #把字典里的键值对一次性拆成关键字实参传给函数
        print("连接 MySQL 成功")
        
        cursor = conn.cursor()
        
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_CONFIG['database']}` DEFAULT CHARACTER SET utf8mb4")
        print(f"创建数据库 {DB_CONFIG['database']} 成功")
        
        cursor.execute(f"USE `{DB_CONFIG['database']}`")
        print(f"切换到数据库 {DB_CONFIG['database']}")
        
        cursor.close()
        conn.close()
        
        mysql_config['database'] = DB_CONFIG['database']
        conn = pymysql.connect(**mysql_config)
        print("重新连接数据库成功")
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sql_dir = os.path.join(base_dir, 'web', 'mysql')
        
        sql_files = [
            'user.sql',
            'customer.sql',
            'customer_process.sql',
            'yipan.sql',
            'yipan_history.sql',
            'customer_process_history.sql'
        ]
        
        for sql_file in sql_files:
            sql_path = os.path.join(sql_dir, sql_file)
            if os.path.exists(sql_path):
                print(f"\n{'='*60}")
                print(f"执行文件: {sql_file}")
                print(f"{'='*60}")
                sql_content = read_sql_file(sql_path)
                
                if sql_file == 'user.sql':
                    lines = sql_content.split('\n')
                    cleaned_lines = []
                    for line in lines:
                        stripped = line.strip()
                        if stripped.startswith('CREATE DATABASE') or stripped.startswith('USE `process`'):
                            cleaned_lines.append('-- ' + line)
                        else:
                            cleaned_lines.append(line)
                    sql_content = '\n'.join(cleaned_lines)
                
                execute_sql_file(conn, sql_content, sql_file)
                print(f"✓ {sql_file} 执行完成")
            else:
                print(f"⚠ 警告: 文件 {sql_path} 不存在，跳过")
        
        conn.close()
        print("\n数据库初始化完成！")
        
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        raise e

if __name__ == "__main__":
    print("开始初始化数据库...")
    init_database()
