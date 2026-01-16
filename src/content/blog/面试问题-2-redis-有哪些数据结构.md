---
title: "面试问题：Redis 有哪些数据结构？"
description: "详解 Redis 的五种基本数据结构、特殊数据结构，以及常见模块扩展（JSON、TimeSeries），包括使用场景和常用命令"
pubDate: 2024-12-16
tags: ["Redis", "数据库", "面试", "后端"]
---

# Redis 有哪些数据结构？

Redis 是一个基于内存的高性能键值数据库，支持多种数据结构。核心内置主要包括 **5 种基本数据结构**、**3 种特殊数据结构**，并在 **Redis 5.0+** 引入了 **Stream**。另外在 **Redis Stack / 模块（Modules）** 生态中，还常见 **RedisJSON（JSON）**、**RedisTimeSeries（TimeSeries）** 等“模块数据类型”（需要安装对应模块才支持）。

---

## 一、五种基本数据结构

### 1. String（字符串）

**简介**：最基本的数据类型，可以存储字符串、整数或浮点数。最大存储 512MB。

**底层实现**：SDS（Simple Dynamic String，简单动态字符串）

**常用命令**：
```bash
SET key value           # 设置值
GET key                 # 获取值
INCR key                # 值自增1
INCRBY key increment    # 值增加指定数量
DECR key                # 值自减1
SETNX key value         # 只有key不存在时才设置（分布式锁常用）
SETEX key seconds value # 设置值并指定过期时间
MSET key1 v1 key2 v2    # 批量设置
MGET key1 key2          # 批量获取
```

**使用场景**：
- 缓存对象（JSON 序列化）
- 计数器（文章阅读量、点赞数）
- 分布式锁（SETNX + EXPIRE）
- 分布式 Session

---

### 2. Hash（哈希）

**简介**：键值对集合，适合存储对象。

**底层实现**：ziplist（压缩列表）或 hashtable（哈希表）

**常用命令**：
```bash
HSET key field value      # 设置单个字段
HGET key field            # 获取单个字段
HMSET key f1 v1 f2 v2     # 设置多个字段
HMGET key f1 f2           # 获取多个字段
HGETALL key               # 获取所有字段和值
HDEL key field            # 删除字段
HINCRBY key field incr    # 字段值增加
HKEYS key                 # 获取所有字段名
HVALS key                 # 获取所有字段值
HEXISTS key field         # 判断字段是否存在
```

**使用场景**：
- 存储对象信息（用户信息、商品信息）
- 购物车（用户ID为key，商品ID为field，数量为value）

**优点**：相比用 String 存储 JSON，Hash 可以对单个字段进行操作，节省网络开销。

---

### 3. List（列表）

**简介**：有序的字符串列表，按插入顺序排序，支持从两端操作。

**底层实现**：quicklist（快速列表，由多个 ziplist 组成的双向链表）

**常用命令**：
```bash
LPUSH key v1 v2           # 从左侧插入
RPUSH key v1 v2           # 从右侧插入
LPOP key                  # 从左侧弹出
RPOP key                  # 从右侧弹出
LRANGE key start stop     # 获取指定范围元素
LLEN key                  # 获取列表长度
LINDEX key index          # 获取指定索引元素
BLPOP key timeout         # 阻塞式左侧弹出
BRPOP key timeout         # 阻塞式右侧弹出
```

**使用场景**：
- 消息队列（LPUSH + BRPOP 实现阻塞队列）
- 文章列表、评论列表
- 最新消息排行（LPUSH + LTRIM）

---

### 4. Set（集合）

**简介**：无序的字符串集合，元素唯一，不允许重复。

**底层实现**：intset（整数集合）或 hashtable（哈希表）

**常用命令**：
```bash
SADD key member1 member2  # 添加元素
SREM key member           # 删除元素
SMEMBERS key              # 获取所有元素
SISMEMBER key member      # 判断元素是否存在
SCARD key                 # 获取元素数量
SRANDMEMBER key count     # 随机获取元素
SPOP key                  # 随机弹出元素

# 集合运算
SINTER key1 key2          # 交集
SUNION key1 key2          # 并集
SDIFF key1 key2           # 差集
```

**使用场景**：
- 标签系统（文章标签、用户标签）
- 共同好友（交集运算）
- 抽奖活动（SRANDMEMBER / SPOP）
- 点赞、收藏（用户ID存入Set，避免重复）

---

### 5. Sorted Set / ZSet（有序集合）

**简介**：有序的字符串集合，每个元素关联一个 score（分数），按 score 排序。

**底层实现**：ziplist（压缩列表）或 skiplist（跳跃表）+ hashtable

**常用命令**：
```bash
ZADD key score member         # 添加元素
ZREM key member               # 删除元素
ZSCORE key member             # 获取分数
ZRANK key member              # 获取排名（从小到大）
ZREVRANK key member           # 获取排名（从大到小）
ZRANGE key start stop         # 按排名范围获取（升序）
ZREVRANGE key start stop      # 按排名范围获取（降序）
ZRANGEBYSCORE key min max     # 按分数范围获取
ZINCRBY key increment member  # 增加分数
ZCARD key                     # 获取元素数量
ZCOUNT key min max            # 统计分数范围内元素数量
```

**使用场景**：
- 排行榜（游戏积分榜、文章热度榜）
- 延迟队列（score 存储执行时间戳）
- 带权重的消息队列

---

## 二、特殊数据结构与模块扩展

### 1. HyperLogLog

**简介**：用于基数统计的概率性数据结构，可以用极小的内存统计巨量数据的不重复元素数量。

**特点**：
- 固定占用 12KB 内存
- 标准误差 0.81%
- 只能统计数量，不能获取具体元素

**常用命令**：
```bash
PFADD key element1 element2   # 添加元素
PFCOUNT key                   # 获取基数估算值
PFMERGE destkey key1 key2     # 合并多个 HyperLogLog
```

**使用场景**：
- UV 统计（独立访客数）
- 统计注册 IP 数
- 统计在线用户数

---

### 2. Bitmap（位图）

**简介**：本质是 String 类型，但可以进行位操作。

**常用命令**：
```bash
SETBIT key offset value       # 设置指定位置的位值（0或1）
GETBIT key offset             # 获取指定位置的位值
BITCOUNT key [start end]      # 统计值为1的位数
BITOP operation destkey key1 key2  # 位运算（AND/OR/XOR/NOT）
```

**使用场景**：
- 用户签到（每天一个 bit，一年仅需 46 字节）
- 用户在线状态
- 统计活跃用户
- 布隆过滤器的底层实现

---

### 3. GEO（地理位置）

**简介**：存储地理位置信息，支持距离计算和范围查询。底层基于 Sorted Set 实现。

**常用命令**：
```bash
GEOADD key longitude latitude member  # 添加地理位置
GEOPOS key member                     # 获取位置坐标
GEODIST key member1 member2 [unit]    # 计算两点距离
GEORADIUS key longitude latitude radius unit  # 查找指定范围内的元素
GEOSEARCH key FROMMEMBER member BYRADIUS radius unit  # 范围搜索
```

**使用场景**：
- 附近的人/店铺
- 打车软件找附近司机
- 外卖平台找附近商家

---

### 4. RedisJSON（JSON，模块扩展）

**简介**：用于在 Redis 中原生存储/读取/局部更新 JSON 文档的数据类型（来自 **RedisJSON 模块**，常见于 **Redis Stack**），支持对嵌套字段进行路径级操作。

**特点**：
- 可对 JSON 的某个字段/数组元素进行局部读写（避免整段字符串反序列化/回写）
- 更适合“结构化对象 + 局部更新”的场景
- ⚠️ 需要安装模块；纯净 Redis 上会报 `unknown command 'JSON.*'`

**常用命令**：
```bash
JSON.SET key $ '{"name":"alice","age":20}'   # 写入 JSON 文档
JSON.GET key $                               # 读取 JSON 文档
JSON.GET key $.name                          # 读取某个字段
JSON.NUMINCRBY key $.age 1                   # 数值字段自增
JSON.ARRAPPEND key $.tags '"redis"'          # 数组追加
JSON.DEL key $.unused                        # 删除字段
```

**使用场景**：
- 缓存复杂对象（用户画像、配置、商品详情），并需要**频繁局部更新**
- 需要以 JSON 形态对外输出，但仍想保留字段级操作能力

---

### 5. RedisTimeSeries（TimeSeries，模块扩展）

**简介**：面向“时间戳 + 数值”的高频写入与时间窗口查询的时序数据类型（来自 **RedisTimeSeries 模块**，常见于 **Redis Stack**），内置保留策略、聚合与降采样能力。

**特点**：
- 适合监控/指标类数据：高吞吐写入、按时间范围查询、按窗口聚合（avg/sum/min/max 等）
- 支持 **Retention（保留期）** 自动淘汰旧数据、**Downsampling（降采样规则）** 自动生成分钟/小时级序列
- 支持 **Labels（标签）** 做多维度过滤与聚合
- ⚠️ 需要安装模块；纯净 Redis 上会报 `unknown command 'TS.*'`

**常用命令**：
```bash
TS.CREATE cpu:host1 RETENTION 604800000 LABELS host host1 metric cpu   # 创建序列并设置保留期（毫秒）
TS.ADD cpu:host1 * 0.32                                                # 写入点（* 为服务器时间戳）
TS.RANGE cpu:host1 - + AGGREGATION avg 60000                           # 范围查询并按 60s 求平均
TS.MRANGE - + FILTER metric=cpu                                        # 多序列查询（按标签过滤）
TS.CREATERULE cpu:host1 cpu:host1:1m AGGREGATION avg 60000             # 建降采样规则
```

**使用场景**：
- 监控指标/可观测性（QPS、延迟、错误率、CPU/内存等）
- IoT 传感器数据上报、业务实时看板曲线

---

## 三、Redis 5.0+ 新增数据结构

### Stream（流）

**简介**：Redis 5.0 引入，专门为消息队列设计的数据结构，支持消费者组。

**常用命令**：
```bash
XADD key * field value        # 添加消息
XREAD STREAMS key id          # 读取消息
XRANGE key start end          # 范围查询
XGROUP CREATE key group id    # 创建消费者组
XREADGROUP GROUP group consumer STREAMS key >  # 消费者组读取
XACK key group id             # 确认消息
```

**使用场景**：
- 消息队列（替代 List 实现的简单队列）
- 事件溯源
- 实时数据处理

---

## 四、数据结构对比总结

| 数据结构 | 特点 | 典型场景 |
|---------|------|---------|
| String | 简单键值 | 缓存、计数器、分布式锁 |
| Hash | 字段可独立操作 | 对象存储、购物车 |
| List | 有序、可重复 | 消息队列、最新列表 |
| Set | 无序、唯一 | 标签、共同好友、抽奖 |
| ZSet | 有序、唯一、带分数 | 排行榜、延迟队列 |
| HyperLogLog | 基数统计 | UV 统计 |
| Bitmap | 位操作 | 签到、在线状态 |
| GEO | 地理位置 | 附近的人/商家 |
| Stream | 消息流 | 消息队列 |
| RedisJSON（模块） | JSON 文档存储、字段级操作 | 复杂对象缓存、局部更新 |
| RedisTimeSeries（模块） | 时序写入、窗口聚合、降采样 | 监控指标、IoT、实时看板 |

---

## 五、面试回答技巧

回答这个问题时，建议按以下结构：

1. **先说五种基本类型**：String、Hash、List、Set、ZSet
2. **再提三种特殊类型**：HyperLogLog、Bitmap、GEO
3. **补充 Stream**（Redis 5.0+）
4. **加分：提模块扩展**（Redis Stack / Modules）：RedisJSON、RedisTimeSeries（强调“需要模块支持”）
5. **结合项目经验**：说明自己在项目中如何使用这些数据结构

> 💡 **加分项**：如果能说出底层实现（SDS、ziplist、skiplist 等），会给面试官留下更好的印象。
