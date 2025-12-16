---
title: "MySQL SQL 语法大全"
description: "MySQL SQL 完整语法参考手册，包含DDL、DML、DQL、DCL、函数、索引、事务等"
pubDate: 2024-12-17
tags: ["MySQL", "SQL", "数据库", "参考手册"]
---

## 目录

1. [数据定义语言 (DDL)](#数据定义语言-ddl)
2. [数据操作语言 (DML)](#数据操作语言-dml)
3. [数据查询语言 (DQL)](#数据查询语言-dql)
4. [JOIN 连接查询](#join-连接查询)
5. [子查询](#子查询)
6. [窗口函数](#窗口函数)
7. [常用函数](#常用函数)
8. [索引](#索引)
9. [事务控制](#事务控制)
10. [视图](#视图)
11. [存储过程与函数](#存储过程与函数)
12. [触发器](#触发器)
13. [数据控制语言 (DCL)](#数据控制语言-dcl)

---

## 数据定义语言 (DDL)

### CREATE - 创建

#### 创建数据库

```sql
CREATE DATABASE [IF NOT EXISTS] 数据库名
[CHARACTER SET 字符集]
[COLLATE 排序规则];
```

**示例：**
```sql
CREATE DATABASE IF NOT EXISTS my_shop
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

#### 创建表

```sql
CREATE TABLE [IF NOT EXISTS] 表名 (
    列名1 数据类型 [约束],
    列名2 数据类型 [约束],
    ...
    [表级约束]
) [ENGINE=存储引擎] [DEFAULT CHARSET=字符集];
```

**常用数据类型：**

| 类别 | 类型 | 说明 |
|------|------|------|
| 整数 | `TINYINT` | 1字节，-128~127 |
| | `SMALLINT` | 2字节 |
| | `INT` | 4字节 |
| | `BIGINT` | 8字节 |
| 小数 | `DECIMAL(M,D)` | 精确小数，M总位数，D小数位 |
| | `FLOAT` | 单精度浮点 |
| | `DOUBLE` | 双精度浮点 |
| 字符串 | `CHAR(N)` | 定长字符串，最大255 |
| | `VARCHAR(N)` | 变长字符串，最大65535 |
| | `TEXT` | 长文本 |
| | `LONGTEXT` | 超长文本 |
| 日期时间 | `DATE` | 日期 YYYY-MM-DD |
| | `TIME` | 时间 HH:MM:SS |
| | `DATETIME` | 日期时间 |
| | `TIMESTAMP` | 时间戳（自动更新） |
| 二进制 | `BLOB` | 二进制大对象 |
| | `JSON` | JSON格式（MySQL 5.7+） |

**常用约束：**

| 约束 | 说明 |
|------|------|
| `PRIMARY KEY` | 主键 |
| `NOT NULL` | 非空 |
| `UNIQUE` | 唯一 |
| `DEFAULT 值` | 默认值 |
| `AUTO_INCREMENT` | 自增 |
| `FOREIGN KEY` | 外键 |
| `CHECK` | 检查约束（MySQL 8.0+） |

**完整示例：**
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    age TINYINT UNSIGNED DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0.00,
    status TINYINT DEFAULT 1 COMMENT '状态：1正常 0禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

---

### ALTER - 修改

#### 修改表结构

```sql
-- 添加列
ALTER TABLE 表名 ADD [COLUMN] 列名 数据类型 [约束] [AFTER 列名|FIRST];

-- 修改列类型
ALTER TABLE 表名 MODIFY [COLUMN] 列名 新数据类型 [约束];

-- 修改列名和类型
ALTER TABLE 表名 CHANGE [COLUMN] 旧列名 新列名 数据类型 [约束];

-- 删除列
ALTER TABLE 表名 DROP [COLUMN] 列名;

-- 重命名表
ALTER TABLE 旧表名 RENAME TO 新表名;

-- 添加索引
ALTER TABLE 表名 ADD INDEX 索引名 (列名);

-- 添加唯一索引
ALTER TABLE 表名 ADD UNIQUE INDEX 索引名 (列名);

-- 添加主键
ALTER TABLE 表名 ADD PRIMARY KEY (列名);

-- 删除索引
ALTER TABLE 表名 DROP INDEX 索引名;

-- 删除主键
ALTER TABLE 表名 DROP PRIMARY KEY;
```

**示例：**
```sql
-- 添加手机号列，放在email后面
ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER email;

-- 修改username长度
ALTER TABLE users MODIFY COLUMN username VARCHAR(100) NOT NULL;

-- 将status改名为is_active
ALTER TABLE users CHANGE COLUMN status is_active TINYINT DEFAULT 1;

-- 删除age列
ALTER TABLE users DROP COLUMN age;

-- 添加联合索引
ALTER TABLE users ADD INDEX idx_phone_status (phone, is_active);
```

---

### DROP - 删除

```sql
-- 删除数据库
DROP DATABASE [IF EXISTS] 数据库名;

-- 删除表
DROP TABLE [IF EXISTS] 表名;

-- 删除多个表
DROP TABLE [IF EXISTS] 表名1, 表名2, ...;
```

---

### TRUNCATE - 清空

```sql
TRUNCATE TABLE 表名;
```

| 对比 | `TRUNCATE` | `DELETE` |
|------|-----------|----------|
| 速度 | 快（直接删除数据页） | 慢（逐行删除） |
| 日志 | 不记录行删除日志 | 记录每行删除日志 |
| 自增ID | 重置为1 | 不重置 |
| 事务 | 不可回滚 | 可回滚 |
| 触发器 | 不触发 | 触发 |

---

## 数据操作语言 (DML)

### INSERT - 插入

#### 基本语法

```sql
-- 插入单行（指定列）
INSERT INTO 表名 (列1, 列2, ...) VALUES (值1, 值2, ...);

-- 插入单行（全部列）
INSERT INTO 表名 VALUES (值1, 值2, ...);

-- 插入多行
INSERT INTO 表名 (列1, 列2, ...) VALUES 
    (值1, 值2, ...),
    (值1, 值2, ...),
    (值1, 值2, ...);

-- 从查询结果插入
INSERT INTO 表名 (列1, 列2, ...)
SELECT 列1, 列2, ... FROM 其他表 WHERE 条件;
```

**示例：**
```sql
-- 插入单个用户
INSERT INTO users (username, email, password) 
VALUES ('zhangsan', 'zhangsan@example.com', 'hashed_password');

-- 批量插入
INSERT INTO users (username, email, password) VALUES 
    ('lisi', 'lisi@example.com', 'pwd1'),
    ('wangwu', 'wangwu@example.com', 'pwd2'),
    ('zhaoliu', 'zhaoliu@example.com', 'pwd3');

-- 复制数据到另一个表
INSERT INTO users_backup (id, username, email)
SELECT id, username, email FROM users WHERE created_at < '2024-01-01';
```

#### INSERT ... ON DUPLICATE KEY UPDATE

```sql
INSERT INTO 表名 (列1, 列2, ...) VALUES (值1, 值2, ...)
ON DUPLICATE KEY UPDATE 列1 = 值1, 列2 = 值2;
```

**示例：**
```sql
-- 如果用户存在则更新，不存在则插入
INSERT INTO users (id, username, email, login_count) 
VALUES (1, 'zhangsan', 'new@example.com', 1)
ON DUPLICATE KEY UPDATE 
    email = VALUES(email),
    login_count = login_count + 1;
```

#### REPLACE INTO

```sql
REPLACE INTO 表名 (列1, 列2, ...) VALUES (值1, 值2, ...);
```

**与 INSERT 的区别：** 如果主键或唯一索引冲突，先删除旧行再插入新行。

---

### UPDATE - 更新

#### 基本语法

```sql
UPDATE 表名 
SET 列1 = 值1, 列2 = 值2, ...
[WHERE 条件]
[ORDER BY 排序]
[LIMIT 数量];
```

**示例：**
```sql
-- 更新单个用户
UPDATE users SET email = 'new@example.com' WHERE id = 1;

-- 更新多个字段
UPDATE users 
SET email = 'new@example.com', 
    updated_at = NOW() 
WHERE id = 1;

-- 批量更新
UPDATE users SET status = 0 WHERE last_login < '2024-01-01';

-- 使用表达式更新
UPDATE products SET price = price * 1.1 WHERE category = '电子产品';

-- 限制更新行数
UPDATE users SET status = 0 ORDER BY last_login ASC LIMIT 100;
```

#### 多表更新

```sql
UPDATE 表1 
JOIN 表2 ON 表1.列 = 表2.列
SET 表1.列 = 值
WHERE 条件;
```

**示例：**
```sql
-- 根据订单更新用户的消费总额
UPDATE users u
JOIN (
    SELECT user_id, SUM(amount) AS total 
    FROM orders 
    GROUP BY user_id
) o ON u.id = o.user_id
SET u.total_spent = o.total;
```

---

### DELETE - 删除

#### 基本语法

```sql
DELETE FROM 表名
[WHERE 条件]
[ORDER BY 排序]
[LIMIT 数量];
```

**示例：**
```sql
-- 删除单条记录
DELETE FROM users WHERE id = 1;

-- 批量删除
DELETE FROM users WHERE status = 0 AND created_at < '2023-01-01';

-- 限制删除数量（配合ORDER BY实现分批删除）
DELETE FROM logs WHERE created_at < '2024-01-01' ORDER BY id LIMIT 1000;
```

#### 多表删除

```sql
-- 删除表1中满足条件的记录
DELETE 表1 FROM 表1 JOIN 表2 ON 表1.列 = 表2.列 WHERE 条件;

-- 同时删除多个表的记录
DELETE 表1, 表2 FROM 表1 JOIN 表2 ON 表1.列 = 表2.列 WHERE 条件;
```

**示例：**
```sql
-- 删除没有订单的用户
DELETE u FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;
```

---

## 数据查询语言 (DQL)

### SELECT - 查询

#### 完整语法结构

```sql
SELECT [DISTINCT] 列名1, 列名2, ... | *
FROM 表名
[JOIN 其他表 ON 连接条件]
[WHERE 筛选条件]
[GROUP BY 分组列]
[HAVING 分组后条件]
[ORDER BY 排序列 [ASC|DESC]]
[LIMIT [偏移量,] 行数];
```

**执行顺序：**
```
FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

---

#### 基本查询

```sql
-- 查询所有列
SELECT * FROM users;

-- 查询指定列
SELECT id, username, email FROM users;

-- 使用别名
SELECT id AS 用户ID, username AS 用户名 FROM users;
SELECT id 用户ID, username 用户名 FROM users;  -- AS可省略

-- 去重
SELECT DISTINCT status FROM users;
SELECT DISTINCT status, city FROM users;  -- 组合去重

-- 计算列
SELECT id, price, quantity, price * quantity AS total FROM orders;
```

---

#### WHERE - 条件筛选

**比较运算符：**

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `=` | 等于 | `WHERE id = 1` |
| `<>` 或 `!=` | 不等于 | `WHERE status <> 0` |
| `>` | 大于 | `WHERE age > 18` |
| `>=` | 大于等于 | `WHERE age >= 18` |
| `<` | 小于 | `WHERE price < 100` |
| `<=` | 小于等于 | `WHERE price <= 100` |

**逻辑运算符：**

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `AND` | 与 | `WHERE age > 18 AND status = 1` |
| `OR` | 或 | `WHERE status = 0 OR status = 2` |
| `NOT` | 非 | `WHERE NOT status = 0` |

**范围与集合：**

```sql
-- BETWEEN ... AND（包含边界）
SELECT * FROM products WHERE price BETWEEN 100 AND 500;

-- IN
SELECT * FROM users WHERE id IN (1, 2, 3);
SELECT * FROM users WHERE city IN ('北京', '上海', '广州');

-- NOT IN
SELECT * FROM users WHERE id NOT IN (1, 2, 3);
```

**模糊查询：**

```sql
-- LIKE
SELECT * FROM users WHERE username LIKE '张%';    -- 以"张"开头
SELECT * FROM users WHERE username LIKE '%三';    -- 以"三"结尾
SELECT * FROM users WHERE username LIKE '%小%';   -- 包含"小"
SELECT * FROM users WHERE username LIKE '张_';    -- "张"后面一个字符
SELECT * FROM users WHERE username LIKE '张__';   -- "张"后面两个字符

-- 转义字符
SELECT * FROM products WHERE name LIKE '%\%%';    -- 包含%符号
SELECT * FROM products WHERE name LIKE '%10\%%' ESCAPE '\\';
```

**NULL 判断：**

```sql
-- IS NULL
SELECT * FROM users WHERE phone IS NULL;

-- IS NOT NULL
SELECT * FROM users WHERE phone IS NOT NULL;

-- 注意：= NULL 永远返回空！
SELECT * FROM users WHERE phone = NULL;  -- ❌ 错误写法
```

**EXISTS：**

```sql
-- 存在子查询结果
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- 不存在子查询结果
SELECT * FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);
```

---

#### ORDER BY - 排序

```sql
-- 单列排序
SELECT * FROM users ORDER BY created_at DESC;

-- 多列排序
SELECT * FROM users ORDER BY status ASC, created_at DESC;

-- 使用列别名排序
SELECT id, price * quantity AS total FROM orders ORDER BY total DESC;

-- 使用列序号排序
SELECT id, username, created_at FROM users ORDER BY 3 DESC;  -- 按第3列排序

-- NULL值排序
SELECT * FROM users ORDER BY phone IS NULL, phone;  -- NULL排在最后
SELECT * FROM users ORDER BY phone IS NOT NULL, phone;  -- NULL排在最前
```

---

#### LIMIT - 分页

```sql
-- 取前N条
SELECT * FROM users LIMIT 10;

-- 跳过M条，取N条
SELECT * FROM users LIMIT 10, 20;  -- 跳过10条，取20条
SELECT * FROM users LIMIT 20 OFFSET 10;  -- 等价写法

-- 分页公式：LIMIT (page-1)*pageSize, pageSize
-- 第1页：LIMIT 0, 10
-- 第2页：LIMIT 10, 10
-- 第3页：LIMIT 20, 10
```

**大数据量分页优化：**

```sql
-- ❌ 慢：LIMIT 1000000, 10 需要扫描100万行
SELECT * FROM users ORDER BY id LIMIT 1000000, 10;

-- ✅ 快：利用索引覆盖 + 延迟关联
SELECT * FROM users 
WHERE id > (SELECT id FROM users ORDER BY id LIMIT 1000000, 1)
ORDER BY id
LIMIT 10;

-- ✅ 游标分页（推荐）
SELECT * FROM users WHERE id > 上一页最后一条的ID ORDER BY id LIMIT 10;
```

---

#### GROUP BY - 分组

```sql
-- 单列分组
SELECT status, COUNT(*) AS count FROM users GROUP BY status;

-- 多列分组
SELECT status, city, COUNT(*) AS count 
FROM users 
GROUP BY status, city;

-- 分组统计
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount
FROM orders
GROUP BY DATE(created_at);
```

**聚合函数：**

| 函数 | 说明 | 示例 |
|------|------|------|
| `COUNT(*)` | 计数（包含NULL） | `COUNT(*)` |
| `COUNT(列)` | 计数（不含NULL） | `COUNT(phone)` |
| `COUNT(DISTINCT 列)` | 去重计数 | `COUNT(DISTINCT city)` |
| `SUM(列)` | 求和 | `SUM(amount)` |
| `AVG(列)` | 平均值 | `AVG(price)` |
| `MAX(列)` | 最大值 | `MAX(created_at)` |
| `MIN(列)` | 最小值 | `MIN(price)` |
| `GROUP_CONCAT(列)` | 拼接字符串 | `GROUP_CONCAT(name SEPARATOR ',')` |

---

#### HAVING - 分组后筛选

```sql
-- 筛选订单数大于5的用户
SELECT user_id, COUNT(*) AS order_count
FROM orders
GROUP BY user_id
HAVING order_count > 5;

-- HAVING 与 WHERE 的区别
SELECT user_id, COUNT(*) AS order_count
FROM orders
WHERE status = 1          -- WHERE: 分组前筛选，不能用聚合函数
GROUP BY user_id
HAVING order_count > 5;   -- HAVING: 分组后筛选，可以用聚合函数
```

---

## JOIN 连接查询

### 基本语法

```sql
SELECT 列名
FROM 表1
[INNER|LEFT|RIGHT|FULL] JOIN 表2 ON 表1.列 = 表2.列
[WHERE 条件];
```

### JOIN 类型对比

| 类型 | 说明 | 图示 |
|------|------|------|
| `INNER JOIN` | 返回两表匹配的行 | A ∩ B |
| `LEFT JOIN` | 返回左表全部 + 右表匹配的行 | A + (A ∩ B) |
| `RIGHT JOIN` | 返回右表全部 + 左表匹配的行 | B + (A ∩ B) |
| `CROSS JOIN` | 笛卡尔积，返回所有组合 | A × B |

### INNER JOIN - 内连接

```sql
-- 只返回两表都匹配的记录
SELECT u.id, u.username, o.id AS order_id, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- INNER 可省略
SELECT u.id, u.username, o.id AS order_id, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;
```

### LEFT JOIN - 左连接

```sql
-- 返回左表全部记录，右表无匹配则为NULL
SELECT u.id, u.username, o.id AS order_id, o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- 查询没有订单的用户
SELECT u.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;
```

### RIGHT JOIN - 右连接

```sql
-- 返回右表全部记录，左表无匹配则为NULL
SELECT u.id, u.username, o.id AS order_id, o.amount
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
```

### CROSS JOIN - 交叉连接

```sql
-- 返回两表的笛卡尔积
SELECT * FROM colors CROSS JOIN sizes;

-- 等价写法
SELECT * FROM colors, sizes;
```

### 多表连接

```sql
SELECT 
    u.username,
    o.id AS order_id,
    p.name AS product_name,
    oi.quantity
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.status = 1;
```

### 自连接

```sql
-- 查询员工及其上级
SELECT 
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- 查询同一城市的用户对
SELECT a.username AS user1, b.username AS user2, a.city
FROM users a
JOIN users b ON a.city = b.city AND a.id < b.id;
```

---

## 子查询

### 标量子查询（返回单值）

```sql
-- 查询比平均价格高的商品
SELECT * FROM products 
WHERE price > (SELECT AVG(price) FROM products);

-- SELECT 中使用
SELECT 
    id,
    username,
    (SELECT COUNT(*) FROM orders WHERE user_id = users.id) AS order_count
FROM users;
```

### 列子查询（返回一列）

```sql
-- IN 子查询
SELECT * FROM users 
WHERE id IN (SELECT DISTINCT user_id FROM orders);

-- NOT IN 子查询
SELECT * FROM users 
WHERE id NOT IN (SELECT DISTINCT user_id FROM orders WHERE status = 0);

-- ANY / SOME（满足任一）
SELECT * FROM products 
WHERE price > ANY (SELECT price FROM products WHERE category = '电子');

-- ALL（满足全部）
SELECT * FROM products 
WHERE price > ALL (SELECT price FROM products WHERE category = '服装');
```

### 行子查询（返回一行）

```sql
-- 查询与指定用户同城市同年龄的用户
SELECT * FROM users 
WHERE (city, age) = (SELECT city, age FROM users WHERE id = 1);
```

### 表子查询（返回多行多列）

```sql
-- FROM 子查询（派生表）
SELECT * FROM (
    SELECT user_id, COUNT(*) AS order_count, SUM(amount) AS total
    FROM orders
    GROUP BY user_id
) AS user_stats
WHERE order_count > 5;

-- JOIN 子查询
SELECT u.username, s.order_count, s.total
FROM users u
JOIN (
    SELECT user_id, COUNT(*) AS order_count, SUM(amount) AS total
    FROM orders
    GROUP BY user_id
) s ON u.id = s.user_id;
```

### 相关子查询

```sql
-- 外层每行都执行一次子查询
SELECT * FROM products p
WHERE price > (
    SELECT AVG(price) FROM products WHERE category = p.category
);

-- EXISTS 相关子查询
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.user_id = u.id AND o.amount > 1000
);
```

---

## 窗口函数

### 基本语法

```sql
函数名() OVER (
    [PARTITION BY 分组列]
    [ORDER BY 排序列]
    [ROWS/RANGE 窗口范围]
) AS 别名
```

### 排名函数

| 函数 | 特点 | 示例结果（相同值） |
|------|------|-------------------|
| `ROW_NUMBER()` | 唯一编号 | 1, 2, 3, 4, 5 |
| `RANK()` | 相同排名，跳过后续 | 1, 2, 2, 4, 5 |
| `DENSE_RANK()` | 相同排名，不跳过 | 1, 2, 2, 3, 4 |
| `NTILE(n)` | 分成n组 | 1, 1, 2, 2, 3 |

**示例：**
```sql
SELECT 
    id,
    username,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC) AS row_num,
    RANK() OVER (ORDER BY score DESC) AS rank_num,
    DENSE_RANK() OVER (ORDER BY score DESC) AS dense_num,
    NTILE(4) OVER (ORDER BY score DESC) AS quartile
FROM students;
```

**分组排名（Top-N）：**
```sql
-- 每个部门薪资前3名
SELECT * FROM (
    SELECT 
        id,
        name,
        department,
        salary,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
) AS ranked
WHERE rn <= 3;
```

### 聚合窗口函数

```sql
SELECT 
    id,
    amount,
    SUM(amount) OVER () AS total,                                    -- 总和
    SUM(amount) OVER (ORDER BY id) AS running_total,                 -- 累计和
    SUM(amount) OVER (PARTITION BY user_id) AS user_total,           -- 分组总和
    AVG(amount) OVER (ORDER BY id ROWS 2 PRECEDING) AS moving_avg,   -- 移动平均
    COUNT(*) OVER (PARTITION BY user_id) AS user_count               -- 分组计数
FROM orders;
```

### 偏移函数

| 函数 | 说明 |
|------|------|
| `LAG(列, n, 默认值)` | 取前n行的值 |
| `LEAD(列, n, 默认值)` | 取后n行的值 |
| `FIRST_VALUE(列)` | 窗口内第一个值 |
| `LAST_VALUE(列)` | 窗口内最后一个值 |
| `NTH_VALUE(列, n)` | 窗口内第n个值 |

**示例：**
```sql
SELECT 
    id,
    sale_date,
    amount,
    LAG(amount, 1, 0) OVER (ORDER BY sale_date) AS prev_amount,      -- 上一天销售额
    LEAD(amount, 1, 0) OVER (ORDER BY sale_date) AS next_amount,     -- 下一天销售额
    amount - LAG(amount, 1, 0) OVER (ORDER BY sale_date) AS diff,    -- 环比
    FIRST_VALUE(amount) OVER (
        PARTITION BY MONTH(sale_date) ORDER BY sale_date
    ) AS month_first                                                  -- 月初销售额
FROM daily_sales;
```

### 窗口范围

```sql
-- ROWS：物理行
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW    -- 开始到当前行
ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING            -- 前2行到后2行
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING    -- 当前行到结束

-- RANGE：逻辑范围
RANGE BETWEEN INTERVAL 7 DAY PRECEDING AND CURRENT ROW  -- 前7天到当前
```

---

## 常用函数

### 字符串函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `CONCAT(s1, s2, ...)` | 拼接字符串 | `CONCAT('Hello', ' ', 'World')` → 'Hello World' |
| `CONCAT_WS(sep, s1, s2)` | 用分隔符拼接 | `CONCAT_WS(',', 'a', 'b', 'c')` → 'a,b,c' |
| `LENGTH(s)` | 字节长度 | `LENGTH('中文')` → 6 |
| `CHAR_LENGTH(s)` | 字符长度 | `CHAR_LENGTH('中文')` → 2 |
| `UPPER(s)` | 转大写 | `UPPER('abc')` → 'ABC' |
| `LOWER(s)` | 转小写 | `LOWER('ABC')` → 'abc' |
| `TRIM(s)` | 去两端空格 | `TRIM('  ab  ')` → 'ab' |
| `LTRIM(s)` | 去左空格 | `LTRIM('  ab')` → 'ab' |
| `RTRIM(s)` | 去右空格 | `RTRIM('ab  ')` → 'ab' |
| `SUBSTRING(s, start, len)` | 截取子串 | `SUBSTRING('Hello', 2, 3)` → 'ell' |
| `LEFT(s, n)` | 左边n个字符 | `LEFT('Hello', 2)` → 'He' |
| `RIGHT(s, n)` | 右边n个字符 | `RIGHT('Hello', 2)` → 'lo' |
| `REPLACE(s, from, to)` | 替换 | `REPLACE('aaa', 'a', 'b')` → 'bbb' |
| `INSTR(s, sub)` | 查找位置 | `INSTR('Hello', 'l')` → 3 |
| `LOCATE(sub, s)` | 查找位置 | `LOCATE('l', 'Hello')` → 3 |
| `REVERSE(s)` | 反转 | `REVERSE('abc')` → 'cba' |
| `LPAD(s, len, pad)` | 左填充 | `LPAD('1', 3, '0')` → '001' |
| `RPAD(s, len, pad)` | 右填充 | `RPAD('1', 3, '0')` → '100' |

### 数值函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `ABS(n)` | 绝对值 | `ABS(-5)` → 5 |
| `CEIL(n)` / `CEILING(n)` | 向上取整 | `CEIL(1.2)` → 2 |
| `FLOOR(n)` | 向下取整 | `FLOOR(1.8)` → 1 |
| `ROUND(n, d)` | 四舍五入 | `ROUND(1.567, 2)` → 1.57 |
| `TRUNCATE(n, d)` | 截断小数 | `TRUNCATE(1.567, 2)` → 1.56 |
| `MOD(n, m)` | 取模 | `MOD(10, 3)` → 1 |
| `POW(x, y)` | x的y次方 | `POW(2, 3)` → 8 |
| `SQRT(n)` | 平方根 | `SQRT(16)` → 4 |
| `RAND()` | 随机数0-1 | `RAND()` → 0.123... |
| `SIGN(n)` | 符号 | `SIGN(-5)` → -1 |

### 日期时间函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `NOW()` | 当前日期时间 | '2024-12-17 10:30:00' |
| `CURDATE()` | 当前日期 | '2024-12-17' |
| `CURTIME()` | 当前时间 | '10:30:00' |
| `DATE(dt)` | 提取日期 | `DATE('2024-12-17 10:30:00')` → '2024-12-17' |
| `TIME(dt)` | 提取时间 | `TIME('2024-12-17 10:30:00')` → '10:30:00' |
| `YEAR(dt)` | 提取年 | `YEAR('2024-12-17')` → 2024 |
| `MONTH(dt)` | 提取月 | `MONTH('2024-12-17')` → 12 |
| `DAY(dt)` | 提取日 | `DAY('2024-12-17')` → 17 |
| `HOUR(dt)` | 提取时 | `HOUR('10:30:45')` → 10 |
| `MINUTE(dt)` | 提取分 | `MINUTE('10:30:45')` → 30 |
| `SECOND(dt)` | 提取秒 | `SECOND('10:30:45')` → 45 |
| `DAYOFWEEK(dt)` | 星期几(1-7) | `DAYOFWEEK('2024-12-17')` → 3 (周二) |
| `DAYOFYEAR(dt)` | 年的第几天 | `DAYOFYEAR('2024-12-17')` → 352 |
| `WEEK(dt)` | 年的第几周 | `WEEK('2024-12-17')` → 51 |
| `QUARTER(dt)` | 季度 | `QUARTER('2024-12-17')` → 4 |

**日期计算：**

```sql
-- 日期加减
DATE_ADD('2024-12-17', INTERVAL 7 DAY)     -- 加7天
DATE_ADD('2024-12-17', INTERVAL 1 MONTH)   -- 加1月
DATE_SUB('2024-12-17', INTERVAL 1 YEAR)    -- 减1年

-- 日期差
DATEDIFF('2024-12-31', '2024-12-17')       -- 相差天数：14
TIMESTAMPDIFF(MONTH, '2024-01-01', '2024-12-17')  -- 相差月数：11

-- 日期格式化
DATE_FORMAT('2024-12-17', '%Y年%m月%d日')  -- '2024年12月17日'
DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')    -- '2024-12-17 10:30:00'

-- 字符串转日期
STR_TO_DATE('2024-12-17', '%Y-%m-%d')      -- DATE类型
```

**格式化符号：**

| 符号 | 说明 | 示例 |
|------|------|------|
| `%Y` | 四位年份 | 2024 |
| `%y` | 两位年份 | 24 |
| `%m` | 月份(01-12) | 12 |
| `%d` | 日(01-31) | 17 |
| `%H` | 小时(00-23) | 10 |
| `%i` | 分钟(00-59) | 30 |
| `%s` | 秒(00-59) | 45 |
| `%W` | 星期名 | Tuesday |
| `%w` | 星期(0-6) | 2 |

### 条件函数

#### IF

```sql
IF(条件, 真值, 假值)

-- 示例
SELECT IF(score >= 60, '及格', '不及格') AS result FROM students;
```

#### IFNULL / COALESCE

```sql
-- 如果为NULL则返回默认值
IFNULL(值, 默认值)
COALESCE(值1, 值2, ...)  -- 返回第一个非NULL值

-- 示例
SELECT IFNULL(phone, '未填写') FROM users;
SELECT COALESCE(phone, email, '无联系方式') FROM users;
```

#### CASE WHEN

```sql
-- 简单CASE
CASE 表达式
    WHEN 值1 THEN 结果1
    WHEN 值2 THEN 结果2
    ELSE 默认结果
END

-- 搜索CASE
CASE 
    WHEN 条件1 THEN 结果1
    WHEN 条件2 THEN 结果2
    ELSE 默认结果
END

-- 示例
SELECT 
    id,
    score,
    CASE 
        WHEN score >= 90 THEN '优秀'
        WHEN score >= 80 THEN '良好'
        WHEN score >= 60 THEN '及格'
        ELSE '不及格'
    END AS grade
FROM students;

-- 行转列
SELECT 
    user_id,
    SUM(CASE WHEN month = 1 THEN amount ELSE 0 END) AS jan,
    SUM(CASE WHEN month = 2 THEN amount ELSE 0 END) AS feb,
    SUM(CASE WHEN month = 3 THEN amount ELSE 0 END) AS mar
FROM orders
GROUP BY user_id;
```

### 转换函数

```sql
-- 类型转换
CAST(表达式 AS 类型)
CONVERT(表达式, 类型)

-- 示例
CAST('123' AS SIGNED)           -- 转整数
CAST('2024-12-17' AS DATE)      -- 转日期
CAST(123.456 AS DECIMAL(10,2))  -- 转定点数
CONVERT('123', SIGNED)          -- 等价于CAST
```

### JSON 函数（MySQL 5.7+）

```sql
-- 创建JSON
JSON_OBJECT('name', '张三', 'age', 25)   -- {"name": "张三", "age": 25}
JSON_ARRAY(1, 2, 3)                       -- [1, 2, 3]

-- 提取JSON
JSON_EXTRACT(json列, '$.name')           -- 提取name字段
json列->'$.name'                          -- 简写
json列->>'$.name'                         -- 去引号

-- 修改JSON
JSON_SET(json列, '$.age', 26)            -- 设置/更新
JSON_INSERT(json列, '$.email', 'a@b.c')  -- 仅插入（不覆盖）
JSON_REPLACE(json列, '$.age', 26)        -- 仅替换（必须存在）
JSON_REMOVE(json列, '$.phone')           -- 删除

-- 查询JSON
SELECT * FROM users WHERE json列->'$.age' > 18;
SELECT * FROM users WHERE JSON_CONTAINS(tags, '"mysql"');
```

---

## 索引

### 创建索引

```sql
-- 创建表时
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    status TINYINT,
    created_at DATETIME,
    
    INDEX idx_username (username),
    UNIQUE INDEX idx_email (email),
    INDEX idx_status_created (status, created_at)
);

-- 单独创建
CREATE INDEX 索引名 ON 表名 (列名);
CREATE UNIQUE INDEX 索引名 ON 表名 (列名);
CREATE INDEX 索引名 ON 表名 (列1, 列2);  -- 联合索引

-- ALTER 方式
ALTER TABLE 表名 ADD INDEX 索引名 (列名);
ALTER TABLE 表名 ADD UNIQUE INDEX 索引名 (列名);
ALTER TABLE 表名 ADD PRIMARY KEY (列名);
```

### 索引类型

| 类型 | 说明 | 创建语法 |
|------|------|---------|
| 普通索引 | 最基本的索引 | `INDEX idx_name (col)` |
| 唯一索引 | 值必须唯一，允许NULL | `UNIQUE INDEX idx_name (col)` |
| 主键索引 | 唯一且非NULL | `PRIMARY KEY (col)` |
| 联合索引 | 多列组合索引 | `INDEX idx_name (col1, col2)` |
| 全文索引 | 文本搜索 | `FULLTEXT INDEX idx_name (col)` |
| 前缀索引 | 取列前N个字符 | `INDEX idx_name (col(10))` |

### 删除索引

```sql
DROP INDEX 索引名 ON 表名;
ALTER TABLE 表名 DROP INDEX 索引名;
ALTER TABLE 表名 DROP PRIMARY KEY;
```

### 查看索引

```sql
SHOW INDEX FROM 表名;
SHOW CREATE TABLE 表名;
```

### 执行计划

```sql
EXPLAIN SELECT * FROM users WHERE username = 'zhangsan';
```

**EXPLAIN 关键字段：**

| 字段 | 说明 |
|------|------|
| `type` | 访问类型，性能从好到差：system > const > eq_ref > ref > range > index > ALL |
| `key` | 实际使用的索引 |
| `rows` | 预估扫描行数 |
| `Extra` | 额外信息（Using index, Using filesort, Using temporary 等） |

### 索引使用原则

**索引失效的常见情况：**

```sql
-- 1. 对索引列使用函数
WHERE YEAR(created_at) = 2024     -- ❌ 失效
WHERE created_at >= '2024-01-01'  -- ✅ 有效

-- 2. 隐式类型转换
WHERE phone = 13800138000         -- ❌ phone是VARCHAR，数字会转换
WHERE phone = '13800138000'       -- ✅ 有效

-- 3. LIKE 以通配符开头
WHERE name LIKE '%张'             -- ❌ 失效
WHERE name LIKE '张%'             -- ✅ 有效

-- 4. 联合索引不满足最左前缀
-- 索引：(a, b, c)
WHERE b = 1 AND c = 2             -- ❌ 失效
WHERE a = 1 AND c = 2             -- 部分有效，只用到a
WHERE a = 1 AND b = 2             -- ✅ 有效

-- 5. OR 条件中有非索引列
WHERE a = 1 OR b = 2              -- 如果b没有索引，整个条件失效

-- 6. NOT IN, NOT EXISTS, !=, <>
WHERE id NOT IN (1, 2, 3)         -- 可能失效

-- 7. IS NULL, IS NOT NULL
WHERE phone IS NULL               -- 视情况而定
```

---

## 事务控制

### 基本语法

```sql
-- 开启事务
START TRANSACTION;
-- 或
BEGIN;

-- 提交事务
COMMIT;

-- 回滚事务
ROLLBACK;

-- 设置保存点
SAVEPOINT 保存点名;

-- 回滚到保存点
ROLLBACK TO 保存点名;

-- 释放保存点
RELEASE SAVEPOINT 保存点名;
```

### 事务示例

```sql
START TRANSACTION;

-- 扣减账户A余额
UPDATE accounts SET balance = balance - 100 WHERE id = 1;

-- 增加账户B余额
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- 检查是否有负余额
SELECT balance INTO @balance FROM accounts WHERE id = 1;

IF @balance < 0 THEN
    ROLLBACK;  -- 余额不足，回滚
ELSE
    COMMIT;    -- 正常提交
END IF;
```

### 隔离级别

| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|------|-----------|------|
| READ UNCOMMITTED | ✓ | ✓ | ✓ |
| READ COMMITTED | ✗ | ✓ | ✓ |
| REPEATABLE READ（默认） | ✗ | ✗ | ✓ |
| SERIALIZABLE | ✗ | ✗ | ✗ |

```sql
-- 查看隔离级别
SELECT @@transaction_isolation;

-- 设置隔离级别
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SET GLOBAL TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### 自动提交

```sql
-- 查看自动提交状态
SELECT @@autocommit;

-- 关闭自动提交
SET autocommit = 0;

-- 开启自动提交
SET autocommit = 1;
```

---

## 视图

### 创建视图

```sql
CREATE [OR REPLACE] VIEW 视图名 AS
SELECT 列1, 列2, ...
FROM 表名
[WHERE 条件]
[WITH CHECK OPTION];
```

**示例：**
```sql
-- 创建活跃用户视图
CREATE VIEW active_users AS
SELECT id, username, email, created_at
FROM users
WHERE status = 1;

-- 创建订单统计视图
CREATE VIEW order_stats AS
SELECT 
    user_id,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount
FROM orders
GROUP BY user_id;

-- 使用视图
SELECT * FROM active_users WHERE created_at > '2024-01-01';

SELECT u.username, s.order_count, s.total_amount
FROM users u
JOIN order_stats s ON u.id = s.user_id;
```

### 修改视图

```sql
ALTER VIEW 视图名 AS
SELECT ...;
```

### 删除视图

```sql
DROP VIEW [IF EXISTS] 视图名;
```

### 查看视图

```sql
SHOW CREATE VIEW 视图名;
```

---

## 存储过程与函数

### 存储过程

```sql
-- 创建存储过程
DELIMITER //
CREATE PROCEDURE 过程名(
    [IN|OUT|INOUT] 参数名 数据类型,
    ...
)
BEGIN
    -- SQL语句
END //
DELIMITER ;

-- 调用存储过程
CALL 过程名(参数);

-- 删除存储过程
DROP PROCEDURE [IF EXISTS] 过程名;
```

**示例：**
```sql
DELIMITER //
CREATE PROCEDURE get_user_orders(
    IN p_user_id BIGINT,
    OUT p_order_count INT,
    OUT p_total_amount DECIMAL(10,2)
)
BEGIN
    SELECT COUNT(*), SUM(amount)
    INTO p_order_count, p_total_amount
    FROM orders
    WHERE user_id = p_user_id;
END //
DELIMITER ;

-- 调用
CALL get_user_orders(1, @count, @total);
SELECT @count, @total;
```

### 函数

```sql
-- 创建函数
DELIMITER //
CREATE FUNCTION 函数名(参数名 数据类型, ...)
RETURNS 返回类型
[DETERMINISTIC]
BEGIN
    DECLARE 变量 类型;
    -- SQL语句
    RETURN 值;
END //
DELIMITER ;

-- 调用函数
SELECT 函数名(参数);

-- 删除函数
DROP FUNCTION [IF EXISTS] 函数名;
```

**示例：**
```sql
DELIMITER //
CREATE FUNCTION get_user_level(p_amount DECIMAL(10,2))
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    IF p_amount >= 10000 THEN
        RETURN '钻石会员';
    ELSEIF p_amount >= 5000 THEN
        RETURN '金牌会员';
    ELSEIF p_amount >= 1000 THEN
        RETURN '银牌会员';
    ELSE
        RETURN '普通会员';
    END IF;
END //
DELIMITER ;

-- 使用
SELECT username, get_user_level(total_spent) AS level FROM users;
```

### 流程控制

```sql
-- IF语句
IF 条件 THEN
    语句;
ELSEIF 条件 THEN
    语句;
ELSE
    语句;
END IF;

-- CASE语句
CASE 表达式
    WHEN 值1 THEN 语句;
    WHEN 值2 THEN 语句;
    ELSE 语句;
END CASE;

-- WHILE循环
WHILE 条件 DO
    语句;
END WHILE;

-- LOOP循环
label: LOOP
    语句;
    IF 条件 THEN
        LEAVE label;  -- 跳出循环
    END IF;
END LOOP;

-- REPEAT循环
REPEAT
    语句;
UNTIL 条件
END REPEAT;
```

---

## 触发器

### 创建触发器

```sql
CREATE TRIGGER 触发器名
{BEFORE|AFTER} {INSERT|UPDATE|DELETE}
ON 表名
FOR EACH ROW
BEGIN
    -- SQL语句
    -- 使用 NEW.列名 获取新值
    -- 使用 OLD.列名 获取旧值
END;
```

**示例：**
```sql
-- 订单创建后自动更新用户消费总额
DELIMITER //
CREATE TRIGGER update_user_total
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    UPDATE users 
    SET total_spent = total_spent + NEW.amount
    WHERE id = NEW.user_id;
END //
DELIMITER ;

-- 评论删除时更新文章评论数
DELIMITER //
CREATE TRIGGER decrease_comment_count
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    UPDATE articles 
    SET comment_count = comment_count - 1
    WHERE id = OLD.article_id;
END //
DELIMITER ;

-- 更新前记录日志
DELIMITER //
CREATE TRIGGER log_user_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_logs (user_id, old_email, new_email, changed_at)
    VALUES (OLD.id, OLD.email, NEW.email, NOW());
END //
DELIMITER ;
```

### 查看触发器

```sql
SHOW TRIGGERS;
SHOW CREATE TRIGGER 触发器名;
```

### 删除触发器

```sql
DROP TRIGGER [IF EXISTS] 触发器名;
```

---

## 数据控制语言 (DCL)

### 用户管理

```sql
-- 创建用户
CREATE USER '用户名'@'主机' IDENTIFIED BY '密码';
CREATE USER 'admin'@'localhost' IDENTIFIED BY '123456';
CREATE USER 'admin'@'%' IDENTIFIED BY '123456';  -- %表示任意主机

-- 修改密码
ALTER USER '用户名'@'主机' IDENTIFIED BY '新密码';

-- 删除用户
DROP USER '用户名'@'主机';

-- 查看用户
SELECT user, host FROM mysql.user;
```

### 权限管理

```sql
-- 授予权限
GRANT 权限 ON 数据库.表 TO '用户名'@'主机';

-- 常用权限
GRANT SELECT ON mydb.* TO 'reader'@'%';                    -- 只读
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'app'@'%';  -- 增删改查
GRANT ALL PRIVILEGES ON mydb.* TO 'admin'@'%';             -- 全部权限
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;  -- 超级管理员

-- 撤销权限
REVOKE 权限 ON 数据库.表 FROM '用户名'@'主机';
REVOKE INSERT ON mydb.* FROM 'reader'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 查看权限
SHOW GRANTS FOR '用户名'@'主机';
```

**常用权限列表：**

| 权限 | 说明 |
|------|------|
| `SELECT` | 查询 |
| `INSERT` | 插入 |
| `UPDATE` | 更新 |
| `DELETE` | 删除 |
| `CREATE` | 创建表/数据库 |
| `DROP` | 删除表/数据库 |
| `ALTER` | 修改表结构 |
| `INDEX` | 创建/删除索引 |
| `EXECUTE` | 执行存储过程 |
| `ALL PRIVILEGES` | 所有权限 |

---

## 常用技巧

### 批量操作优化

```sql
-- 批量插入（比单条插入快很多）
INSERT INTO users (username, email) VALUES 
    ('user1', 'user1@example.com'),
    ('user2', 'user2@example.com'),
    ('user3', 'user3@example.com');

-- 分批删除（避免长事务）
DELETE FROM logs WHERE created_at < '2024-01-01' LIMIT 10000;

-- 批量更新用 CASE WHEN
UPDATE products 
SET price = CASE id
    WHEN 1 THEN 100
    WHEN 2 THEN 200
    WHEN 3 THEN 300
END
WHERE id IN (1, 2, 3);
```

### 锁

```sql
-- 共享锁（读锁）
SELECT * FROM users WHERE id = 1 LOCK IN SHARE MODE;

-- 排他锁（写锁）
SELECT * FROM users WHERE id = 1 FOR UPDATE;

-- 跳过锁定的行（MySQL 8.0+）
SELECT * FROM users WHERE status = 1 FOR UPDATE SKIP LOCKED;

-- 不等待锁（MySQL 8.0+）
SELECT * FROM users WHERE id = 1 FOR UPDATE NOWAIT;
```

### 常用查询模式

```sql
-- 查询重复数据
SELECT email, COUNT(*) AS cnt
FROM users
GROUP BY email
HAVING cnt > 1;

-- 删除重复数据（保留ID最小的）
DELETE u1 FROM users u1
INNER JOIN users u2 
ON u1.email = u2.email AND u1.id > u2.id;

-- 查询第N高的值
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET N-1;

-- 连续N天登录的用户
SELECT user_id
FROM (
    SELECT 
        user_id,
        login_date,
        DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (
            PARTITION BY user_id ORDER BY login_date
        ) DAY) AS grp
    FROM user_logins
) t
GROUP BY user_id, grp
HAVING COUNT(*) >= N;
```
