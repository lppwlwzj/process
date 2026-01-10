# Python 后端服务

这是 Node.js 后端服务的 Python/FastAPI 实现版本。

# Python >= 3.8, < 3.12

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置

编辑 `config.py` 文件，配置数据库连接、JWT密钥、腾讯云COS等信息。

## 初始化数据库

首次使用前，需要初始化数据库：

```bash
python init_db.py
```

这个脚本会：
1. 创建数据库（如果不存在）
2. 按照顺序执行所有 SQL 文件创建表结构
3. 插入示例数据

## 运行服务

```bash
python main.py
```

或者使用 uvicorn：

```bash
uvicorn main:app --host 127.0.0.1 --port 3006
```

## API 接口

所有接口与 Node.js 版本保持一致，包括：

- `/api/user/*` - 用户相关接口
- `/api/customer/*` - 客户管理接口
- `/api/process/*` - 进度管理接口
- `/api/yipan/*` - 椅旁管理接口
- `/api/upload` - 文件上传接口
- `/api/download/*` - 下载接口
- `/api/zhibao/*` - 质保接口
- `/api/process_history/*` - 历史记录接口

## 项目结构

- `main.py` - FastAPI 应用入口
- `config.py` - 配置文件
- `db/` - 数据库连接模块
- `common/` - 通用工具模块
- `routers/` - 路由定义
- `handlers/` - 业务逻辑处理
