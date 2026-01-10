import json

def parse_materials(materials):
    if not materials:
        return []
    
    if isinstance(materials, (list, dict)):
        return materials if isinstance(materials, list) else []
    
    if isinstance(materials, str):
        try:
            parsed = json.loads(materials)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, Exception) as e:
            print(f"解析 materials JSON 失败: {e}, 原始值: {materials}")
            return []
    
    return []
