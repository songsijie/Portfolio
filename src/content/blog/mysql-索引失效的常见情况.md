---
title: "MySQL索引失效的常见情况及优化方案"
description: "深入剖析MySQL中索引失效的10种常见情况，包括函数操作、类型转换、范围查询、OR条件等场景，提供详细的案例分析和优化建议"
pubDate: 2025-11-12
tags: ["MySQL", "索引优化", "数据库", "性能优化", "面试"]
---

# MySQL索引失效的常见情况及优化方案

索引是提升MySQL查询性能的关键，但在实际开发中，很多看似正常的SQL语句却无法利用索引，导致性能急剧下降。本文将详细介绍MySQL中索引失效的常见情况，帮助你写出更高效的SQL。

---

## 一、对索引列进行函数操作

### ❌ 失效案例

```sql
-- 在索引列上使用函数
SELECT * FROM users WHERE YEAR(create_time) = 2024;
SELECT * FROM users WHERE CONCAT(first_name, last_name) = 'John Doe';
SELECT * FROM users WHERE UPPER(username) = 'ADMIN';
```

### 原因分析

当对索引列使用函数时，MySQL无法直接使用索引树进行查找。因为索引存储的是原始值，而查询条件是函数处理后的值，两者无法匹配。

### ✅ 优化方案

```sql
-- 将函数移到等号右边
SELECT * FROM users WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01';

-- 或者使用计算列索引（MySQL 5.7+）
ALTER TABLE users ADD COLUMN full_name VARCHAR(100) 
    AS (CONCAT(first_name, ' ', last_name)) STORED;
CREATE INDEX idx_full_name ON users(full_name);
```

---

## 二、隐式类型转换

### ❌ 失效案例

```sql
-- phone字段是VARCHAR类型，但查询时使用数字
SELECT * FROM users WHERE phone = 13800138000;

-- id是INT类型，但查询时使用字符串
SELECT * FROM users WHERE id = '123';
```

### 原因分析

当SQL中的数据类型与列的实际类型不匹配时，MySQL会进行隐式类型转换。转换规则如下：
- **字符串与数字比较**：字符串会被转换为数字
- 相当于对索引列使用了函数：`CAST(phone AS SIGNED) = 13800138000`

### 类型转换规则

```sql
-- 字符串列与数字比较 -> 不走索引（相当于函数操作）
SELECT * FROM users WHERE phone = 13800138000;  -- phone是VARCHAR

-- 数字列与字符串比较 -> 走索引（MySQL会转换常量）
SELECT * FROM users WHERE id = '123';  -- id是INT，可以走索引
```

### ✅ 优化方案

```sql
-- 保持类型一致
SELECT * FROM users WHERE phone = '13800138000';
SELECT * FROM users WHERE id = 123;
```

---

## 三、使用 `OR` 连接条件

### ❌ 失效案例

```sql
-- 如果其中一个条件没有索引，整个查询都不走索引
SELECT * FROM users WHERE age = 25 OR address = '北京';

-- 即使两个字段都有索引，也可能不走索引
SELECT * FROM users WHERE name = '张三' OR phone = '13800138000';
```

### 原因分析

使用 `OR` 时，MySQL需要合并多个索引的结果集。如果任何一个条件没有索引，或者MySQL评估后认为全表扫描更快，就会放弃使用索引。

### ✅ 优化方案

```sql
-- 方案1：改用 UNION（两个条件都有索引时）
SELECT * FROM users WHERE name = '张三'
UNION
SELECT * FROM users WHERE phone = '13800138000';

-- 方案2：改用 IN（单字段多值查询）
SELECT * FROM users WHERE status IN ('active', 'pending');

-- 方案3：确保所有OR的条件都有索引
CREATE INDEX idx_name ON users(name);
CREATE INDEX idx_phone ON users(phone);
```

---

## 四、使用 `!=` 或 `<>` 操作符

### ❌ 失效案例

```sql
SELECT * FROM users WHERE status != 'deleted';
SELECT * FROM users WHERE age <> 0;
```

### 原因分析

不等于操作符需要扫描除了特定值之外的所有记录，这通常意味着大范围扫描。MySQL优化器可能认为全表扫描更高效，因此放弃使用索引。

### ✅ 优化方案

```sql
-- 如果符合条件的数据量较少，改用 IN
SELECT * FROM users WHERE status IN ('active', 'pending', 'suspended');

-- 或者拆分成多个查询
SELECT * FROM users WHERE status = 'active'
UNION ALL
SELECT * FROM users WHERE status = 'pending';

-- 使用范围查询（如果适用）
SELECT * FROM users WHERE age > 0;
```

---

## 五、`LIKE` 查询以 `%` 开头

### ❌ 失效案例

```sql
-- 前导通配符导致索引失效
SELECT * FROM users WHERE name LIKE '%张%';
SELECT * FROM users WHERE email LIKE '%@qq.com';
```

### 原因分析

索引是按照字段值从左到右排序的。当使用前导通配符 `%` 时，MySQL无法确定从索引的哪个位置开始扫描，只能进行全表扫描。

### ✅ 优化方案

```sql
-- 方案1：只在右边使用通配符（最佳）
SELECT * FROM users WHERE name LIKE '张%';

-- 方案2：使用全文索引
ALTER TABLE users ADD FULLTEXT INDEX ft_idx_name (name);
SELECT * FROM users WHERE MATCH(name) AGAINST('张' IN NATURAL LANGUAGE MODE);

-- 方案3：反向索引（针对后缀查询）
ALTER TABLE users ADD COLUMN reverse_email VARCHAR(100) 
    AS (REVERSE(email)) STORED;
CREATE INDEX idx_reverse_email ON users(reverse_email);
SELECT * FROM users WHERE reverse_email LIKE REVERSE('%@qq.com');
```

---

## 六、联合索引不满足最左前缀原则

### ❌ 失效案例

```sql
-- 假设有联合索引 INDEX(name, age, city)

-- 不走索引：跳过了第一个字段
SELECT * FROM users WHERE age = 25 AND city = '北京';

-- 不走索引：只使用了第二个字段
SELECT * FROM users WHERE age = 25;

-- 部分走索引：只能使用 name，后面的 city 无法使用
SELECT * FROM users WHERE name = '张三' AND city = '北京';
```

### 原因分析

联合索引遵循**最左前缀原则**：索引的使用必须从最左边的列开始，并且不能跳过中间的列。

### 联合索引使用规则

```sql
-- 联合索引：INDEX(a, b, c)

✅ WHERE a = 1                      -- 使用索引 a
✅ WHERE a = 1 AND b = 2            -- 使用索引 a, b
✅ WHERE a = 1 AND b = 2 AND c = 3  -- 使用索引 a, b, c
✅ WHERE a = 1 AND c = 3            -- 使用索引 a（c不能使用）

❌ WHERE b = 2                      -- 不走索引
❌ WHERE c = 3                      -- 不走索引
❌ WHERE b = 2 AND c = 3            -- 不走索引
```

### ✅ 优化方案

```sql
-- 方案1：调整查询条件，符合最左前缀
SELECT * FROM users WHERE name = '张三' AND age = 25 AND city = '北京';

-- 方案2：根据实际查询需求创建合适的索引
-- 如果经常查询 age + city，创建专门的索引
CREATE INDEX idx_age_city ON users(age, city);

-- 方案3：调整联合索引顺序（基于查询频率和区分度）
-- 区分度高的字段放前面
DROP INDEX idx_name_age_city ON users;
CREATE INDEX idx_age_name_city ON users(age, name, city);
```

---

## 七、使用 `IS NULL` 或 `IS NOT NULL`

### ❌ 可能失效的案例

```sql
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM users WHERE phone IS NOT NULL;
```

### 原因分析

- **`IS NULL`**：如果NULL值很多（比如超过30%），MySQL可能选择走索引
- **`IS NOT NULL`**：如果NULL值很少，意味着NOT NULL的数据很多，MySQL可能选择全表扫描

实际是否走索引取决于MySQL优化器的成本评估。

### ✅ 优化方案

```sql
-- 方案1：在设计时避免NULL值
ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NOT NULL DEFAULT '';

-- 方案2：使用默认值代替NULL
UPDATE users SET email = '' WHERE email IS NULL;

-- 方案3：如果确实需要NULL，且查询频繁，考虑添加标志字段
ALTER TABLE users ADD COLUMN has_email TINYINT(1) 
    AS (CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) STORED;
CREATE INDEX idx_has_email ON users(has_email);
```

---

## 八、范围查询后的列无法使用索引

### ❌ 失效案例

```sql
-- 联合索引：INDEX(name, age, city)

-- age使用了范围查询，city无法使用索引
SELECT * FROM users 
WHERE name = '张三' AND age > 25 AND city = '北京';
```

### 原因分析

在联合索引中，范围查询（`>`, `<`, `BETWEEN`, `LIKE '张%'`）会导致后面的列无法使用索引。因为范围查询后，索引的有序性被打破了。

### 使用情况分析

```sql
-- 联合索引：INDEX(a, b, c)

✅ WHERE a = 1 AND b = 2 AND c > 3    -- a, b, c都走索引
✅ WHERE a = 1 AND b > 2 AND c = 3    -- 只有a, b走索引（c不走）
❌ WHERE a > 1 AND b = 2 AND c = 3    -- 只有a走索引（b, c不走）
```

### ✅ 优化方案

```sql
-- 方案1：调整索引顺序，将范围查询列放在最后
DROP INDEX idx_name_age_city ON users;
CREATE INDEX idx_name_city_age ON users(name, city, age);

-- 现在可以完全利用索引
SELECT * FROM users 
WHERE name = '张三' AND city = '北京' AND age > 25;

-- 方案2：如果必须保持顺序，考虑创建多个索引
CREATE INDEX idx_name_age ON users(name, age);
CREATE INDEX idx_name_city ON users(name, city);
```

---

## 九、使用 `SELECT *`

### ❌ 失效案例

```sql
-- 即使有覆盖索引，SELECT * 也可能导致回表
SELECT * FROM users WHERE name = '张三';
```

### 原因分析

使用 `SELECT *` 通常需要回表查询，失去了**覆盖索引**的优化效果。覆盖索引是指查询的所有字段都包含在索引中，这样可以直接从索引树获取数据，无需回表。

### ✅ 优化方案

```sql
-- 只查询需要的字段
SELECT id, name, age FROM users WHERE name = '张三';

-- 如果经常查询某几个字段，创建覆盖索引
CREATE INDEX idx_name_age_email ON users(name, age, email);

-- 这样查询可以完全从索引获取数据，不需要回表
SELECT name, age, email FROM users WHERE name = '张三';
```

---

## 十、数据分布导致的索引失效

### ❌ 失效案例

```sql
-- 查询条件匹配了大部分数据（如80%以上）
SELECT * FROM users WHERE status = 'active';  -- 如果90%的用户都是active状态

-- 小表查询
SELECT * FROM small_table WHERE id > 100;  -- 表只有200条数据
```

### 原因分析

MySQL优化器会评估使用索引的成本。如果：
- 匹配的数据量太大（通常超过20-30%）
- 表的数据量太小
- 统计信息不准确

优化器可能认为全表扫描比使用索引更快，因为使用索引需要：
1. 在索引树中查找
2. 回表查询完整数据
这两步的成本可能高于直接全表扫描。

### ✅ 优化方案

```sql
-- 方案1：使用覆盖索引（避免回表）
CREATE INDEX idx_status_id_name ON users(status, id, name);
SELECT id, name FROM users WHERE status = 'active';

-- 方案2：调整查询条件，减少匹配数据量
SELECT * FROM users WHERE status = 'active' AND create_time > '2024-01-01';

-- 方案3：强制使用索引（谨慎使用）
SELECT * FROM users FORCE INDEX(idx_status) WHERE status = 'active';

-- 方案4：更新统计信息
ANALYZE TABLE users;
```

---

## 总结对比表

| 失效情况 | 示例 | 原因 | 优化方案 |
|:---|:---|:---|:---|
| **函数操作** | `WHERE YEAR(date) = 2024` | 对索引列使用函数 | 将函数移到右边或使用计算列 |
| **类型转换** | `WHERE phone = 13800138000` | 字符串列与数字比较 | 保持类型一致 |
| **OR条件** | `WHERE a = 1 OR b = 2` | 需要合并多个索引 | 改用UNION或IN |
| **不等于** | `WHERE status != 'deleted'` | 需要扫描大量数据 | 改用IN或正向匹配 |
| **前导通配符** | `WHERE name LIKE '%张%'` | 无法确定扫描起点 | 只在右边用%或全文索引 |
| **违反最左前缀** | `WHERE b = 1` | 未使用索引最左列 | 调整查询或创建合适索引 |
| **IS NOT NULL** | `WHERE email IS NOT NULL` | NULL值较少时成本高 | 避免NULL值或添加标志字段 |
| **范围查询** | `WHERE a = 1 AND b > 2 AND c = 3` | 范围后列无序 | 将范围列放最后 |
| **SELECT *** | `SELECT * FROM ...` | 需要回表查询 | 只查询需要的字段 |
| **数据分布** | 匹配80%数据 | 全表扫描成本更低 | 使用覆盖索引或缩小范围 |

---

## 实战建议

### 1. 使用 EXPLAIN 分析查询

```sql
EXPLAIN SELECT * FROM users WHERE name = '张三'\G
```

关键字段说明：
- **type**: 连接类型，效率从高到低：system > const > eq_ref > ref > range > index > ALL
- **key**: 实际使用的索引
- **key_len**: 使用的索引长度（联合索引中用了几列）
- **rows**: 估计扫描的行数
- **Extra**: 额外信息（如 Using index 表示覆盖索引）

### 2. 索引设计原则

1. **选择性原则**：为区分度高的列建索引（如身份证号 > 性别）
2. **最左前缀原则**：联合索引注意字段顺序
3. **覆盖索引原则**：将常查询的字段加入索引
4. **避免冗余**：不要创建太多重复的索引
5. **索引不是越多越好**：每个索引都会占用空间并影响写入性能

### 3. 定期维护

```sql
-- 分析表，更新统计信息
ANALYZE TABLE users;

-- 优化表，整理碎片
OPTIMIZE TABLE users;

-- 查看索引使用情况
SELECT * FROM sys.schema_unused_indexes;
```

### 4. 监控慢查询

```ini
# my.cnf配置
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = 1
```

---

## 总结

索引失效不仅仅是技术问题，更是需要在实际开发中不断积累经验的领域。掌握这些常见的索引失效情况，可以帮助你：

1. **写出更高效的SQL**：避免常见陷阱
2. **快速定位性能问题**：当SQL变慢时知道从哪里排查
3. **合理设计索引**：在索引数量和查询性能间找到平衡
4. **应对技术面试**：这是面试高频考点

记住：**索引优化是一个持续迭代的过程，需要结合实际业务场景和数据特点来调整。** 没有一劳永逸的方案，只有不断优化的实践。

