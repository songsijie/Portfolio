---
title: "重定向之Redirect和Rewrite的区别"
description: "深入解析Web服务器中Redirect和Rewrite的技术原理与使用场景"
publishDate: 2025-09-10
tags: ["运维", "Web服务器", "重定向", "URL重写", "Nginx", "Apache"]
---

在Web服务器运维中，**Redirect**和**Rewrite**是两个核心概念，虽然都涉及URL处理，但技术原理和应用场景截然不同。

| 概念 | 全称 | 定义 | 示例 | 特点 |
|------|------|------|------|------|
| **Redirect** | **HTTP重定向** | 服务器返回特殊状态码，指示浏览器访问新URL | `http://old.com → http://new.com` | 浏览器地址栏会变化 |
| **Rewrite** | **URL重写** | 服务器内部修改请求URL，用户无感知 | `访问: /user/123` → `实际: /user.php?id=123` | 地址栏保持不变 |

---

### 核心区别：

1. **HTTP请求次数**  
   - **Redirect**：需要两次HTTP请求（客户端→服务器→新地址→客户端）  
     *用户访问 `/old` → 服务器返回301 → 浏览器自动访问 `/new`*  
   - **Rewrite**：只需一次HTTP请求（服务器内部处理）  
     *用户访问 `/products/123` → 服务器内部处理为 `/product.php?id=123`*

2. **浏览器感知度**  
   - **Redirect**：浏览器完全感知，会显示跳转过程  
     *地址栏从 `http://example.com/old` 变为 `http://example.com/new`*  
   - **Rewrite**：浏览器无感知，用户看到原始URL  
     *地址栏始终显示 `http://example.com/products/123`*

3. **SEO影响**  
   - **Redirect**：需要正确处理权重传递，避免SEO损失  
     *301重定向会将原页面权重传递给新页面*  
   - **Rewrite**：对SEO友好，不会产生权重分散问题  
     *搜索引擎只看到最终的实际URL*

---

### 常见状态码对比：

| 状态码 | 类型 | 含义 | 使用场景 |
|--------|------|------|----------|
| **301** | 永久重定向 | 资源永久移动到新位置 | 域名迁移、网站改版 |
| **302** | 临时重定向 | 资源临时移动到新位置 | 维护页面、A/B测试 |
| **307** | 临时重定向 | 保持原始请求方法 | API重定向 |
| **308** | 永久重定向 | 保持原始请求方法 | 永久API迁移 |

---

### 使用场景对比：

| 场景类型 | Redirect 适用 | Rewrite 适用 |
|----------|---------------|--------------|
| **网站改版** | ✅ 永久改变URL结构 | ❌ 不适合 |
| **维护页面** | ✅ 临时跳转到维护页 | ❌ 不适合 |
| **HTTPS强制** | ✅ 强制跳转到HTTPS | ❌ 不适合 |
| **域名迁移** | ✅ 权重传递 | ❌ 不适合 |
| **URL美化** | ❌ 会产生额外请求 | ✅ 隐藏技术细节 |
| **API网关** | ❌ 性能较差 | ✅ 统一入口处理 |
| **负载均衡** | ❌ 增加延迟 | ✅ 内部转发 |

---

### 详细配置示例：

**Nginx Redirect 配置：**
```nginx
# 永久重定向（301）
location /old-page {
    return 301 /new-page;
}

# 临时重定向（302）
location /temp-page {
    return 302 /maintenance.html;
}

# HTTPS强制跳转
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

# 域名迁移
server {
    server_name old-domain.com;
    return 301 https://new-domain.com$request_uri;
}
```

**Nginx Rewrite 配置：**
```nginx
# URL美化
location /products/ {
    rewrite ^/products/(\d+)$ /product.php?id=$1 last;
}

# 隐藏文件扩展名
location / {
    try_files $uri $uri/ @rewrite;
}

location @rewrite {
    rewrite ^/(.*)$ /index.php?url=$1 last;
}

# API路由重写
location /api/ {
    rewrite ^/api/(.*)$ /api/index.php?route=$1 last;
}
```

**Apache Redirect 配置：**
```apache
# 永久重定向
Redirect 301 /old-page /new-page

# 临时重定向
Redirect 302 /temp-page /maintenance.html

# HTTPS强制跳转
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# 域名迁移
RewriteCond %{HTTP_HOST} ^old-domain\.com$ [NC]
RewriteRule ^(.*)$ https://new-domain.com/$1 [L,R=301]
```

**Apache Rewrite 配置：**
```apache
# URL美化
RewriteEngine On
RewriteRule ^products/(\d+)$ product.php?id=$1 [L]

# 隐藏扩展名
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php?url=$1 [L,QSA]

# API路由
RewriteRule ^api/(.*)$ api/index.php?route=$1 [L,QSA]
```

---

### 性能对比分析：

| 指标 | Redirect | Rewrite |
|------|----------|---------|
| **网络请求** | 2次（客户端往返） | 1次（服务器内部） |
| **响应时间** | 较慢（+100-300ms） | 较快（几乎无延迟） |
| **服务器负载** | 较低（只返回状态码） | 较高（需要处理请求） |
| **带宽消耗** | 较高（两次传输） | 较低（一次传输） |
| **缓存友好** | 是（状态码可缓存） | 否（内容动态生成） |

---

### 最佳实践建议：

1. **选择原则**  
   - 需要改变URL结构 → 使用 **Redirect**  
   - 需要美化URL但保持原地址 → 使用 **Rewrite**

2. **SEO优化**  
   - Redirect：使用301传递权重，避免302导致权重分散  
   - Rewrite：确保搜索引擎能正确索引实际内容

3. **性能优化**  
   - Redirect：合理使用缓存，减少重复跳转  
   - Rewrite：避免复杂的正则表达式，提高匹配效率

4. **监控建议**  
   - 监控重定向链长度，避免循环跳转  
   - 定期检查Rewrite规则，确保正确匹配

---

### 记忆技巧：
- **Redirect**（重定向）：浏览器"跳转"到新地址，类似搬家后告诉朋友新地址。  
- **Rewrite**（重写）：服务器"伪装"URL，类似用假名但实际还是同一个人。