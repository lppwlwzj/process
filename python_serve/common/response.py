from fastapi.responses import JSONResponse

def success_response(data=None, message="成功！"):
    return JSONResponse(content={
        "code": 0,
        "message": message,
        "re": data
    })

def error_response(message, code=1):
    return JSONResponse(
        status_code=200,
        content={
            "code": code,
            "message": message if isinstance(message, str) else str(message)
        }
    )
