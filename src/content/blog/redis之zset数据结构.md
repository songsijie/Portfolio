---
title: "Redis之Zset数据结构：有序集合的深度解析"
description: "深入解析Redis的Zset（有序集合）数据结构，包括底层实现、使用场景、性能优化和实战案例"
pubDate: 2025-10-20
tags: ["Redis", "数据结构", "Zset", "性能优化", "后端开发"]
---

# Redis之Zset数据结构：有序集合的深度解析

## 什么是Zset？

Zset（Sorted Set，有序集合）是Redis中一个非常强大的数据结构，它结合了Set（集合）和Hash（哈希）的特性：

- **唯一性**：像Set一样，每个成员都是唯一的
- **有序性**：每个成员都关联一个分数（score），根据分数排序
- **快速访问**：可以快速通过成员或分数范围进行查询

## Zset的底层实现

### 双重数据结构

Redis的Zset在底层使用了两种数据结构的组合：

#### 1. 跳表（Skip List）

跳表是Zset的主要数据结构，用于维护元素的有序性：

```
层级4:  1 -----------------------> 7
层级3:  1 --------> 4 -----------> 7
层级2:  1 --> 3 --> 4 --> 5 -----> 7 --> 9
层级1:  1 --> 3 --> 4 --> 5 --> 6 --> 7 --> 9
```

**跳表的特点**：
- 插入/删除/查找的时间复杂度：O(log N)
- 空间复杂度：O(N)
- 实现相对简单，无需复杂的平衡操作
- 支持范围查询

#### 2. 哈希表（Hash Table）

哈希表用于快速通过成员查找分数：

```
member -> score 映射
"user1" -> 100
"user2" -> 95
"user3" -> 87
```

**哈希表的作用**：
- 时间复杂度O(1)查询成员的分数
- 时间复杂度O(1)判断成员是否存在

### 编码方式

Redis根据Zset的大小自动选择不同的编码方式：

#### ziplist（压缩列表）

当满足以下条件时使用ziplist：
- 元素数量小于128个（`zset-max-ziplist-entries`）
- 所有成员的长度都小于64字节（`zset-max-ziplist-value`）

**优点**：
- 内存占用少
- 数据连续存储，缓存友好

**缺点**：
- 操作性能随元素增多而降低

#### skiplist + hashtable

当不满足ziplist条件时，使用skiplist+hashtable：

**优点**：
- 操作性能稳定
- 支持高效的范围查询

**缺点**：
- 内存占用相对较大

## 基本操作命令

### 添加和更新元素

```bash
# 添加单个元素
ZADD leaderboard 100 "player1"

# 添加多个元素
ZADD leaderboard 95 "player2" 87 "player3" 92 "player4"

# 只在成员不存在时添加（NX选项）
ZADD leaderboard NX 99 "player5"

# 只在成员存在时更新（XX选项）
ZADD leaderboard XX 101 "player1"

# 添加时返回被改变的成员数量（CH选项）
ZADD leaderboard CH 98 "player2"

# 递增分数（INCR选项）
ZADD leaderboard INCR 5 "player1"  # 等同于 ZINCRBY
```

### 查询元素

```bash
# 获取成员的分数
ZSCORE leaderboard "player1"

# 获取成员的排名（从0开始，分数从低到高）
ZRANK leaderboard "player1"

# 获取成员的排名（从0开始，分数从高到低）
ZREVRANK leaderboard "player1"

# 获取集合中元素数量
ZCARD leaderboard

# 获取指定分数范围内的元素数量
ZCOUNT leaderboard 80 100
```

### 范围查询

```bash
# 按索引范围查询（分数从低到高）
ZRANGE leaderboard 0 9          # 前10名（分数最低的10个）
ZRANGE leaderboard 0 9 WITHSCORES  # 包含分数

# 按索引范围查询（分数从高到低）
ZREVRANGE leaderboard 0 9       # 前10名（分数最高的10个）
ZREVRANGE leaderboard 0 9 WITHSCORES

# 按分数范围查询（从低到高）
ZRANGEBYSCORE leaderboard 80 100
ZRANGEBYSCORE leaderboard 80 100 WITHSCORES
ZRANGEBYSCORE leaderboard (80 100  # 不包含80
ZRANGEBYSCORE leaderboard 80 (100  # 不包含100
ZRANGEBYSCORE leaderboard -inf +inf  # 所有元素

# 按分数范围查询（从高到低）
ZREVRANGEBYSCORE leaderboard 100 80
ZREVRANGEBYSCORE leaderboard 100 80 WITHSCORES

# 限制返回数量
ZRANGEBYSCORE leaderboard 80 100 LIMIT 0 10  # 前10个

# 按字典序范围查询（当分数相同时）
ZRANGEBYLEX leaderboard [a [z
```

### 删除操作

```bash
# 删除指定成员
ZREM leaderboard "player1"

# 删除多个成员
ZREM leaderboard "player1" "player2" "player3"

# 按排名范围删除
ZREMRANGEBYRANK leaderboard 0 9  # 删除排名0-9的成员

# 按分数范围删除
ZREMRANGEBYSCORE leaderboard 0 60  # 删除分数在0-60的成员

# 按字典序范围删除
ZREMRANGEBYLEX leaderboard [a [c
```

### 分数操作

```bash
# 增加成员的分数
ZINCRBY leaderboard 10 "player1"

# 减少成员的分数（使用负数）
ZINCRBY leaderboard -5 "player1"
```

### 集合运算

```bash
# 交集
ZINTERSTORE destination 2 set1 set2          # 分数相加
ZINTERSTORE destination 2 set1 set2 WEIGHTS 2 3  # 分数加权
ZINTERSTORE destination 2 set1 set2 AGGREGATE MAX  # 取最大分数

# 并集
ZUNIONSTORE destination 2 set1 set2
ZUNIONSTORE destination 2 set1 set2 WEIGHTS 2 3
ZUNIONSTORE destination 2 set1 set2 AGGREGATE MIN

# Redis 6.2+支持的新命令
ZDIFF 2 set1 set2       # 差集
ZINTER 2 set1 set2      # 交集（不存储）
ZUNION 2 set1 set2      # 并集（不存储）
```

### 弹出操作（Redis 5.0+）

```bash
# 弹出分数最低的元素
ZPOPMIN leaderboard
ZPOPMIN leaderboard 3   # 弹出3个

# 弹出分数最高的元素
ZPOPMAX leaderboard
ZPOPMAX leaderboard 3   # 弹出3个

# 阻塞式弹出（Redis 5.0+）
BZPOPMIN leaderboard 10  # 10秒超时
BZPOPMAX leaderboard 10
```

## 常见使用场景

### 1. 排行榜系统

最经典的应用场景：

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# 更新玩家分数
def update_score(player_id, score):
    r.zadd('game:leaderboard', {player_id: score})

# 获取排行榜前N名
def get_top_players(n=10):
    return r.zrevrange('game:leaderboard', 0, n-1, withscores=True)

# 获取玩家排名
def get_player_rank(player_id):
    rank = r.zrevrank('game:leaderboard', player_id)
    return rank + 1 if rank is not None else None

# 获取玩家周围的排名
def get_nearby_players(player_id, range=5):
    rank = r.zrevrank('game:leaderboard', player_id)
    if rank is None:
        return []
    start = max(0, rank - range)
    end = rank + range
    return r.zrevrange('game:leaderboard', start, end, withscores=True)

# 示例使用
update_score('player1', 1000)
update_score('player2', 950)
update_score('player3', 1200)

print("前10名:", get_top_players(10))
print("player2的排名:", get_player_rank('player2'))
```

### 2. 延迟队列

使用时间戳作为分数实现延迟任务：

```python
import time
import json

# 添加延迟任务
def add_delayed_task(task_id, task_data, delay_seconds):
    execute_time = time.time() + delay_seconds
    task = json.dumps(task_data)
    r.zadd('delayed:tasks', {task: execute_time})

# 获取到期任务
def get_due_tasks():
    now = time.time()
    tasks = r.zrangebyscore('delayed:tasks', 0, now)
    if tasks:
        # 删除已获取的任务
        r.zremrangebyscore('delayed:tasks', 0, now)
    return [json.loads(task) for task in tasks]

# 示例：发送延迟邮件
add_delayed_task('email1', {
    'to': 'user@example.com',
    'subject': 'Welcome',
    'body': 'Thank you for registering!'
}, 60)  # 60秒后执行

# 定期检查
while True:
    due_tasks = get_due_tasks()
    for task in due_tasks:
        print(f"执行任务: {task}")
        # 处理任务...
    time.sleep(1)
```

### 3. 热门文章/商品

根据浏览量、点赞数等维度排序：

```python
# 记录文章热度（浏览量 * 1 + 点赞数 * 10）
def update_article_hotness(article_id, views, likes):
    score = views + likes * 10
    r.zadd('articles:hot', {f'article:{article_id}': score})

# 获取热门文章
def get_hot_articles(n=20):
    return r.zrevrange('articles:hot', 0, n-1, withscores=True)

# 结合时间衰减的热度算法
def update_article_score_with_decay(article_id, views, likes, publish_time):
    # 时间衰减因子
    age_hours = (time.time() - publish_time) / 3600
    decay_factor = 1 / (age_hours + 2) ** 1.5
    
    score = (views + likes * 10) * decay_factor
    r.zadd('articles:trending', {f'article:{article_id}': score})
```

### 4. 限流器（滑动窗口）

使用时间戳实现精确的滑动窗口限流：

```python
def is_rate_limited(user_id, max_requests=100, window_seconds=60):
    now = time.time()
    key = f'rate_limit:{user_id}'
    
    # 使用事务保证原子性
    pipe = r.pipeline()
    
    # 移除窗口之外的请求记录
    pipe.zremrangebyscore(key, 0, now - window_seconds)
    
    # 统计窗口内的请求数
    pipe.zcard(key)
    
    # 添加当前请求
    pipe.zadd(key, {now: now})
    
    # 设置过期时间
    pipe.expire(key, window_seconds + 1)
    
    results = pipe.execute()
    request_count = results[1]
    
    return request_count >= max_requests

# 使用示例
if is_rate_limited('user123', max_requests=100, window_seconds=60):
    print("请求过于频繁，请稍后再试")
else:
    print("处理请求...")
```

### 5. 自动补全/搜索建议

结合分数实现智能搜索建议：

```python
# 添加搜索词及其权重（搜索次数）
def add_search_term(term, weight=1):
    r.zincrby('search:suggestions', weight, term)

# 获取搜索建议（按热度）
def get_search_suggestions(prefix, limit=10):
    # 注意：这是简化版本，实际可能需要更复杂的前缀匹配
    suggestions = r.zrevrange('search:suggestions', 0, -1, withscores=True)
    matched = [term for term, score in suggestions if term.startswith(prefix)]
    return matched[:limit]
```

### 6. 优先级队列

不同优先级的任务处理：

```python
# 添加任务（优先级越高，分数越高）
def add_task(task_id, priority):
    r.zadd('task:queue', {task_id: priority})

# 获取最高优先级的任务
def get_next_task():
    tasks = r.zpopmax('task:queue', 1)
    return tasks[0] if tasks else None

# 批量获取任务
def get_next_tasks(count=10):
    return r.zpopmax('task:queue', count)
```

### 7. 时间线/Feed流

社交媒体的时间线功能：

```python
# 发布动态
def publish_post(user_id, post_id):
    timestamp = time.time()
    # 添加到用户的时间线
    r.zadd(f'timeline:{user_id}', {post_id: timestamp})
    
    # 添加到粉丝的feed中（推模式）
    followers = get_followers(user_id)
    for follower_id in followers:
        r.zadd(f'feed:{follower_id}', {post_id: timestamp})
        # 限制feed长度
        r.zremrangebyrank(f'feed:{follower_id}', 0, -1001)

# 获取用户的feed
def get_user_feed(user_id, page=1, per_page=20):
    start = (page - 1) * per_page
    end = start + per_page - 1
    return r.zrevrange(f'feed:{user_id}', start, end, withscores=True)
```

## 性能特点

### 时间复杂度

| 操作 | 时间复杂度 | 说明 |
|-----|-----------|------|
| ZADD | O(log N) | 插入元素 |
| ZREM | O(M log N) | M为删除的元素数 |
| ZSCORE | O(1) | 获取分数 |
| ZRANK/ZREVRANK | O(log N) | 获取排名 |
| ZRANGE/ZREVRANGE | O(log N + M) | M为返回的元素数 |
| ZRANGEBYSCORE | O(log N + M) | 按分数范围查询 |
| ZCARD | O(1) | 获取元素数量 |
| ZCOUNT | O(log N) | 统计范围内元素 |

### 内存优化技巧

#### 1. 合理设置ziplist阈值

```bash
# redis.conf
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
```

#### 2. 定期清理过期数据

```python
# 清理旧数据
def cleanup_old_data(key, keep_count=1000):
    # 只保留前N个元素
    r.zremrangebyrank(key, 0, -(keep_count + 1))

# 定期任务
import schedule

schedule.every().day.at("03:00").do(
    cleanup_old_data, 'articles:hot', 1000
)
```

#### 3. 使用合适的成员名称

```python
# 不好：使用完整的JSON字符串
r.zadd('users', {json.dumps({'id': 123, 'name': 'John'}): 100})

# 好：只存储必要的ID
r.zadd('users:scores', {'user:123': 100})
# 详细信息存在其他结构中
r.hset('user:123', mapping={'name': 'John', 'email': '...'})
```

## 高级技巧

### 1. 分段存储大型Zset

当Zset过大时，可以分段存储：

```python
def get_shard_key(key, user_id, shard_count=10):
    shard = hash(user_id) % shard_count
    return f'{key}:shard:{shard}'

def zadd_sharded(key, mapping, shard_count=10):
    for member, score in mapping.items():
        shard_key = get_shard_key(key, member, shard_count)
        r.zadd(shard_key, {member: score})

def zrange_sharded(key, start, end, shard_count=10):
    results = []
    for shard in range(shard_count):
        shard_key = f'{key}:shard:{shard}'
        results.extend(r.zrange(shard_key, start, end, withscores=True))
    # 合并并排序
    results.sort(key=lambda x: x[1])
    return results[start:end+1]
```

### 2. 多维度排行榜

实现复杂的多维度排序：

```python
# 按多个维度计算综合分数
def calculate_comprehensive_score(views, likes, comments, shares):
    return views * 1 + likes * 10 + comments * 5 + shares * 20

def update_article_metrics(article_id, views, likes, comments, shares):
    score = calculate_comprehensive_score(views, likes, comments, shares)
    r.zadd('articles:comprehensive', {f'article:{article_id}': score})
    
    # 同时维护单维度排行榜
    r.zadd('articles:by_views', {f'article:{article_id}': views})
    r.zadd('articles:by_likes', {f'article:{article_id}': likes})
```

### 3. 实时更新排行榜

使用Redis的发布订阅配合Zset：

```python
# 更新分数并发布消息
def update_and_notify(player_id, score):
    r.zadd('leaderboard', {player_id: score})
    
    # 发布更新消息
    rank = r.zrevrank('leaderboard', player_id)
    r.publish('leaderboard:updates', json.dumps({
        'player_id': player_id,
        'score': score,
        'rank': rank + 1
    }))
```

### 4. 分数归一化

当不同来源的分数范围不同时：

```python
def normalize_score(score, min_score, max_score, target_min=0, target_max=100):
    """将分数归一化到目标范围"""
    if max_score == min_score:
        return target_min
    
    normalized = (score - min_score) / (max_score - min_score)
    return target_min + normalized * (target_max - target_min)

def update_normalized_score(key, member, score, stats):
    normalized = normalize_score(
        score, 
        stats['min'], 
        stats['max'],
        0, 
        1000
    )
    r.zadd(key, {member: normalized})
```

## 常见问题和注意事项

### 1. 分数精度问题

Redis使用双精度浮点数存储分数，注意精度问题：

```python
# 避免直接使用浮点数
r.zadd('set', {'member': 0.1 + 0.2})  # 可能不等于0.3

# 解决方案：使用整数或字符串比较
r.zadd('set', {'member': int((0.1 + 0.2) * 1000)})  # 转为整数
```

### 2. 分数相同时的排序

当分数相同时，按字典序排序：

```python
# 确保分数不同
def create_unique_score(base_score, timestamp):
    # 使用时间戳作为小数部分
    return base_score + (timestamp % 1) / 1000000
```

### 3. 大key问题

避免单个Zset过大：

```python
# 监控Zset大小
def check_zset_size(key, max_size=10000):
    size = r.zcard(key)
    if size > max_size:
        print(f"警告: {key} 大小为 {size}, 超过阈值 {max_size}")
        return True
    return False

# 定期清理
def cleanup_if_needed(key, max_size=10000, keep_size=5000):
    if check_zset_size(key, max_size):
        # 只保留前N个
        r.zremrangebyrank(key, 0, -(keep_size + 1))
```

### 4. 内存占用估算

```python
# 粗略估算内存占用
def estimate_zset_memory(member_count, avg_member_size=20):
    """
    skiplist: 每个元素约需要 member_size + 32字节
    hashtable: 每个元素约需要 member_size + 16字节
    """
    skiplist_memory = member_count * (avg_member_size + 32)
    hashtable_memory = member_count * (avg_member_size + 16)
    total = skiplist_memory + hashtable_memory
    return total / (1024 * 1024)  # 转为MB

print(f"10万条数据约占用内存: {estimate_zset_memory(100000):.2f}MB")
```

## 性能测试

### 基准测试脚本

```python
import time
import random
import string

def benchmark_zadd(count=100000):
    """测试ZADD性能"""
    key = 'benchmark:zadd'
    r.delete(key)
    
    start = time.time()
    for i in range(count):
        member = ''.join(random.choices(string.ascii_letters, k=10))
        score = random.randint(0, 1000000)
        r.zadd(key, {member: score})
    
    elapsed = time.time() - start
    print(f"ZADD {count} 条数据耗时: {elapsed:.2f}秒")
    print(f"平均每次操作: {elapsed/count*1000:.4f}毫秒")

def benchmark_zrange(count=10000):
    """测试ZRANGE性能"""
    key = 'benchmark:zrange'
    
    # 准备数据
    data = {f'member{i}': i for i in range(count)}
    r.zadd(key, data)
    
    # 测试不同范围的查询
    ranges = [10, 100, 1000, 10000]
    for size in ranges:
        if size > count:
            continue
        start = time.time()
        for _ in range(1000):
            r.zrange(key, 0, size-1)
        elapsed = time.time() - start
        print(f"ZRANGE查询{size}条数据(1000次): {elapsed:.4f}秒")

# 运行测试
benchmark_zadd()
benchmark_zrange()
```

## 总结

Redis的Zset是一个功能强大且高效的数据结构，它的特点包括：

### 优势
- ✅ 自动排序，无需手动维护顺序
- ✅ 高效的范围查询
- ✅ O(1)复杂度的成员查找
- ✅ 丰富的操作命令
- ✅ 支持集合运算

### 适用场景
- 📊 排行榜系统
- ⏰ 延迟队列/定时任务
- 🔥 热门内容排序
- 🚦 限流器
- 📝 时间线/Feed流
- 🎯 优先级队列

### 注意事项
- ⚠️ 注意大key问题
- ⚠️ 合理设置ziplist阈值
- ⚠️ 定期清理过期数据
- ⚠️ 注意分数精度
- ⚠️ 考虑分片存储大型数据集

掌握Zset的使用，能够帮助我们更好地解决实际业务中的排序和排名问题，大大简化开发复杂度并提升系统性能。

---

*最后更新: 2025年10月*

