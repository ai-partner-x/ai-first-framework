# 认证 API

## 登录

**POST** `/api/auth/login`

### 请求参数

```json
{
  "username": "string",
  "password": "string"
}
```

### 响应

```json
{
  "token": "string",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

## 注册

**POST** `/api/auth/register`

### 请求参数

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### 响应

```json
{
  "id": 1,
  "username": "string",
  "email": "string"
}
```
