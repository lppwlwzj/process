---
name: Node.js 后端 Python 迁移计划
overview: 将现有的 Node.js/Express 后端服务完整迁移到 Python/FastAPI，保持相同的 API 接口和功能，使用 PyMySQL 进行数据库操作，集成腾讯云 COS 文件上传和 JWT 认证。
todos: []
---

# Node.js 后端 Python 迁移实现计划

## 项目结构

```
python_serve/
├── main.py                 # FastAPI 应用入口
├── config.py               # 配置文件（数据库、JWT、COS等）
├── requirements.txt       # Python 依赖包
├── db/
│   └── connection.py      # 数据库连接池管理
├── common/
│   ├── response.py        # 统一响应格式封装
│   ├── jwt_auth.py        # JWT 认证工具
│   ├── cos_upload.py      # 腾讯云 COS 文件上传
│   └── utils.py           # 通用工具函数（JSON解析等）
├── routers/
│   ├── __init__.py
│   ├── user.py            # 用户相关路由
│   ├── customer.py        # 客户管理路由
│   ├── process.py         # 进度管理路由
│   ├── yipan.py           # 椅旁管理路由
│   ├── upload.py           # 文件上传路由
│   ├── download.py         # 下载路由
│   ├── zhibao.py           # 质保路由
│   └── process_history.py  # 历史记录路由
└── handlers/
    ├── __init__.py
    ├── user_handler.py
    ├── customer_handler.py
    ├── process_handler.py
    ├── yipan_handler.py
    ├── upload_handler.py
    ├── download_handler.py
    ├── zhibao_handler.py
    └── process_history_handler.py
```

## 技术栈

- **Web 框架**: FastAPI
- **数据库**: PyMySQL（连接池）
- **认证**: PyJWT
- **文件上传**: python-multipart（FastAPI 内置支持）
- **云存储**: cos-python-sdk-v5（腾讯云 COS）
- **CORS**: FastAPI CORS 中间件
- **日志**: Python logging

## 实现步骤

### 1. 项目初始化

- 创建 `python_serve` 目录结构
- 创建 `requirements.txt`，包含所有依赖包
- 创建 `config.py`，从 Node.js 的 `config.js` 和 `db/index.js` 迁移配置
- 创建 `main.py`，初始化 FastAPI 应用，配置 CORS、中间件、路由

### 2. 数据库连接模块 (`db/connection.py`)

- 使用 PyMySQL 创建连接池（参考 Node.js 的 `mysql2.createPool`）
- 封装数据库查询方法，支持参数化查询防止 SQL 注入
- 实现连接池管理（获取连接、释放连接）

### 3. 通用模块 (`common/`)

- **`response.py`**: 封装统一响应格式 `{code: 0/1, message: "...", re: ...}`，实现 `res.cc()` 等价功能
- **`jwt_auth.py`**: JWT Token 生成和验证（参考 `router_handler/user.js` 的登录逻辑）
- **`cos_upload.py`**: 腾讯云 COS 文件上传功能（参考 `common/cosUpload.js`）
- **`utils.py`**: 
  - `parse_materials()`: 安全解析 JSON 字段（参考 `router_handler/customer.js` 的 `parseMaterials`）
  - 其他工具函数

### 4. 路由模块 (`routers/`)

每个路由文件对应 Node.js 的 `router/` 目录下的文件：

- **`user.py`**: `/api/user/login`, `/api/user/list`, `/api/user/create`, `/api/user/delete`, `/api/user/getQrImg`
- **`customer.py`**: `/api/customer/list`, `/api/customer/create`, `/api/customer/update`, `/api/customer/delete`, `/api/customer/batchDelete`, `/api/customer/detail`
- **`process.py`**: `/api/process/list`, `/api/process/create`, `/api/process/update`, `/api/process/delete`, `/api/process/batchDelete`, `/api/process/detail`, `/api/process/updateTechnicianVideo`, `/api/process/updateWebVideo`
- **`yipan.py`**: `/api/yipan/add`, `/api/yipan/detail`, `/api/yipan/update`, `/api/yipan/list`, `/api/yipan/start`, `/api/yipan/complete`, `/api/yipan/history`, `/api/yipan/updateChairsideVideo`
- **`upload.py`**: `/api/upload`, `/api/upload/delete`
- **`download.py`**: `/api/download/customer`
- **`zhibao.py`**: `/api/zhibao/add`, `/api/zhibao/edit`, `/api/zhibao/detail`, `/api/zhibao/list`, `/api/zhibao/query`
- **`process_history.py`**: `/api/process_history/add`, `/api/process_history/list`

### 5. 处理器模块 (`handlers/`)

每个处理器对应 Node.js 的 `router_handler/` 目录下的文件，实现具体的业务逻辑：

- **`user_handler.py`**: 
  - `login()`: 硬编码账号密码验证（"ykmy111"/"111520"），生成 JWT Token（3天有效期）
  - `list()`: 查询用户列表
  - `create()`: 创建用户（bcrypt 密码加密）
  - `delete()`: 删除用户
  - `get_access_token()`: 获取微信 Access Token

- **`customer_handler.py`**:
  - `list()`: 查询客户列表，解析 `materials` JSON 字段
  - `create()`: 创建客户，将 `materials` 数组转为 JSON 字符串存储，同步创建 `customer_process` 记录（防止重复）
  - `update()`: 更新客户信息
  - `delete()`: 删除客户
  - `batch_delete()`: 批量删除客户
  - `detail()`: 获取客户详情，解析 `materials` JSON

- **`process_handler.py`**:
  - `list()`: 分页查询进度列表，支持多条件搜索（customer_name, progress, technician, remark），LEFT JOIN customer 和 yipan 表，解析 `materials` JSON
  - `create()`: 创建进度记录
  - `update()`: 更新进度记录
  - `delete()`: 删除进度记录
  - `batch_delete()`: 批量删除进度记录
  - `detail()`: 获取进度详情，解析 `materials` JSON
  - `update_technician_video()`: 更新技工视频（允许空字符串）
  - `update_web_video()`: 更新进度视频（允许空字符串）

- **`yipan_handler.py`**:
  - `add()`: 添加椅旁记录
  - `detail()`: 获取椅旁详情
  - `update()`: 更新椅旁记录
  - `list()`: 查询椅旁列表
  - `start_chairside()`: 开始椅旁操作
  - `complete_chairside()`: 完成椅旁操作
  - `get_history()`: 获取椅旁历史记录
  - `update_chairside_video()`: 更新椅旁视频（允许空字符串）

- **`upload_handler.py`**:
  - `upload()`: 文件上传（图片/视频），支持 multipart/form-data，上传到腾讯云 COS
  - `delete_img()`: 删除本地图片文件

- **`download_handler.py`**:
  - `customer()`: 客户数据下载（Excel/CSV）

- **`zhibao_handler.py`**:
  - `add_zhibao()`: 添加质保记录
  - `edit_zhibao()`: 编辑质保记录
  - `get_zhibao_detail_by_id()`: 获取质保详情
  - `get_zhibao_list()`: 获取质保列表
  - `get_zhibao_info()`: 查询质保信息

- **`process_history_handler.py`**:
  - `add_history()`: 添加操作历史记录，计算时间差和操作次数
  - `get_history()`: 获取历史记录列表

### 6. 关键实现细节

- **统一响应格式**: 所有接口返回 `{code: 0/1, message: "...", re: ...}` 格式
- **错误处理**: 使用 FastAPI 的异常处理机制，封装统一错误响应
- **JSON 字段处理**: `materials` 字段在数据库中是 JSON 类型，查询时需要解析，写入时需要序列化
- **空字符串处理**: 视频更新接口允许空字符串（删除最后一个视频时）
- **SQL 注入防护**: 所有 SQL 查询使用参数化查询（`%s` 占位符）
- **文件上传**: 使用 FastAPI 的 `UploadFile`，验证文件类型（image/jpeg, image/png, video/mp4），上传到腾讯云 COS
- **CORS 配置**: 允许所有来源（`*`），支持所有 HTTP 方法
- **静态文件服务**: 配置静态文件路由 `/img/` 指向 `public/` 目录

### 7. 配置文件迁移

- 从 `serve/config.js` 迁移 JWT Secret Key
- 从 `serve/db/index.js` 迁移数据库连接配置（host, user, password, port, database）
- 从 `serve/cos_config.js` 迁移腾讯云 COS 配置（SecretId, SecretKey, Bucket, Region）

### 8. 测试验证

- 确保所有 API 接口与 Node.js 版本行为一致
- 验证数据库操作正确性
- 验证文件上传功能
- 验证 JWT 认证流程
- 验证 JSON 字段解析和序列化

## 注意事项

1. **数据库连接**: PyMySQL 连接池配置需要与 Node.js 的 `mysql2.createPool` 行为一致
2. **日期时间处理**: Python 的 `datetime` 与 JavaScript 的 `Date` 可能有差异，需要统一格式化
3. **JSON 序列化**: Python 的 `json.dumps()` 和 `json.loads()` 与 Node.js 的 `JSON.stringify()` 和 `JSON.parse()` 行为基本一致
4. **文件上传**: FastAPI 的 `UploadFile` 与 Express 的 `multer` 使用方式不同，需要适配
5. **错误处理**: FastAPI 使用异常机制，需要封装为统一的响应格式
6. **日志记录**: 实现日志记录功能（参考 Node.js 的 `utils/index.js`）

## 依赖包列表

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pymysql==1.1.0
PyJWT==2.8.0
python-multipart==0.0.6
cos-python-sdk-v5==1.9.27
python-dotenv==1.0.0
```