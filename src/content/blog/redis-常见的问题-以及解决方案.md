---
title: "Redis 常见问题与解决方案（含 Python 示例）"
description: "从连接超时、bigkey/hotkey、缓存击穿/穿透/雪崩，到淘汰策略、持久化、分布式锁、SCAN/KEYS，按“现象-原因-解决-代码”总结 Redis 高频坑点。"
pubDate: 2026-01-09
tags: ["Redis", "缓存", "分布式", "性能优化", "Python"]
---

# Redis 常见问题与解决方案（含 Python 示例）

把 Redis 想成一个**高速仓库**：
- **优点**：取货快（内存）、操作简单（KV/数据结构）。
- **代价**：仓库容量有限（内存）、叉车/通道有限（单线程 + IO）、断电后要靠账本找回（持久化）。

本文按 **“现象 → 原因 → 解决方案 → Python 示例”** 组织，覆盖你在开发/线上最常碰到的 Redis 问题。

> Python 代码示例默认使用 `redis-py`（`pip install redis`）。示例以 Redis 6/7 的常见行为为基准。

---

## 0. 建议的 Python 连接方式（连接池 + 超时）

**现象**：偶发卡住、请求线程堆积、连接数暴涨、短连接频繁创建导致 CPU 抖动。  
**原因**：默认连接参数不合理、未使用连接池、无 socket 超时、无重试策略。  
**解决方案**：
- 使用连接池；设置 `socket_connect_timeout`/`socket_timeout`
- 适度启用 `retry_on_timeout`
- 业务侧设置总超时，避免“下游卡住，上游一直等”

**Python 示例**：

```python
import redis

pool = redis.ConnectionPool(
    host="127.0.0.1",
    port=6379,
    db=0,
    max_connections=50,
    decode_responses=True,
    socket_connect_timeout=1.0,  # 连接建立超时
    socket_timeout=1.0,          # 单次读写超时
)

r = redis.Redis(connection_pool=pool, retry_on_timeout=True)

def ping():
    return r.ping()
```

---

## 1. 连接不上 / 认证失败 / `NOAUTH` / `WRONGPASS`

**现象**：
- `ConnectionError: Error 111 connecting...`
- `redis.exceptions.AuthenticationError: WRONGPASS invalid username-password pair`
- `NOAUTH Authentication required.`

**原因**：
- Redis 未启动、端口不通、防火墙/安全组阻断
- `requirepass` / ACL 用户名密码未配置或写错
- 使用了错误的 DB/地址（容器网络、K8s Service、主从地址混淆）

**解决方案**：
- 先用 `redis-cli -h host -p port ping` 验证网络
- Redis 6+ 优先用 ACL：用户名 + 密码
- 在应用里显式设置 `username/password`

**Python 示例**：

```python
import redis

r = redis.Redis(
    host="127.0.0.1",
    port=6379,
    username="default",   # Redis 6+ ACL
    password="your-pass",
    decode_responses=True,
)
print(r.ping())
```

---

## 2. 超时与慢：请求偶发很慢 / P99 飙升 / `TimeoutError`

**现象**：
- 应用侧超时、P99 升高
- Redis CPU 不高但仍然慢，或瞬间慢一阵

**常见原因（按优先级排）**：
- **慢命令**：`KEYS`、对大集合 `LRANGE 0 -1`、`SMEMBERS`、`HGETALL`、`ZRANGE 0 -1 WITHSCORES` 等
- **bigkey/hotkey**（后面单独讲）：单 key 太大或太热
- **持久化阻塞**：RDB/AOF rewrite 触发 fork、磁盘抖动
- **网络/连接池**：连接耗尽排队，或 TCP 重传

**解决方案**：
- 开启并查看 `SLOWLOG`，定位慢命令
- 避免 O(N) 命令；用分页/游标（SCAN 系列）替代
- bigkey 拆分；hotkey 加本地缓存/分片/读扩展
- 连接池容量与线程数匹配；设置超时

**Python 示例：查看慢日志**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def print_slowlog(n=10):
    for item in r.slowlog_get(n):
        # item: {'id':..., 'start_time':..., 'duration':..., 'command':..., ...}
        print(item["duration"], item["command"])

print_slowlog(5)
```

---

## 3. `KEYS` 把 Redis 打挂：线上“突然卡死”

把 `KEYS pattern` 想成“**让仓库管理员把所有货架挨个数一遍**”，库存越多，卡得越久，并且 Redis 单线程执行期间别的请求都要排队。

**现象**：执行 `KEYS xxx*` 后 Redis QPS 暴跌，延迟飙升。  
**原因**：`KEYS` 是全量遍历，时间复杂度与 key 数量相关。  
**解决方案**：用 `SCAN`（渐进式迭代），并控制每次返回数量。

**Python 示例：用 SCAN 代替 KEYS**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def iter_keys(pattern: str, count: int = 500):
    cursor = 0
    while True:
        cursor, keys = r.scan(cursor=cursor, match=pattern, count=count)
        for k in keys:
            yield k
        if cursor == 0:
            break

for k in iter_keys("user:*"):
    print(k)
```

---

## 4. bigkey（大 key）导致慢、阻塞、甚至 OOM

把 bigkey 想成“**一个超大箱子**”：搬运一次就要占用通道很久（序列化/网络传输/Redis 操作）。

**现象**：
- 某些请求特别慢
- 单次 `GET` 返回很大内容
- AOF 重写慢、复制 backlog 压力大

**常见原因**：
- 把大对象 JSON 整体塞进一个 key
- 列表/集合/哈希无限增长（无上限、无分页）

**解决方案**：
- **拆分**：按用户、时间、分片维度拆 key
- **限制长度**：队列用 `LTRIM`；集合按业务限额
- **避免一次性全取**：分页读取（`LRANGE` 分页、`HSCAN`/`SSCAN`/`ZSCAN`）

**Python 示例：大列表分页 + 限制长度**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

key = "feed:42"

# 写入（示例）：push 后裁剪，只保留最新 1000 条
r.lpush(key, *[f"item-{i}" for i in range(100)])
r.ltrim(key, 0, 999)

def list_page(k: str, page: int, page_size: int = 50):
    start = (page - 1) * page_size
    end = start + page_size - 1
    return r.lrange(k, start, end)

print(list_page(key, page=1, page_size=10))
```

---

## 5. hotkey（热 key）导致单点瓶颈

把 hotkey 想成“**爆款货架前排队的人太多**”，通道就被堵住了。

**现象**：Redis 单机 CPU 飙高、某个 key QPS 极高、延迟抖动。  
**原因**：大量请求集中打到同一个 key（活动页、配置、token 计数）。  
**解决方案**（组合拳）：
- **本地缓存**：短 TTL 的进程内缓存（如 1~5 秒）削峰
- **分片**：把一个 key 拆成 N 个 key（随机/一致性哈希）
- **读扩展**：读走从库（注意一致性与延迟）

**Python 示例：分片计数（把一个 counter 拆成 16 片）**：

```python
import random
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

SHARDS = 16

def incr_sharded(base_key: str, delta: int = 1):
    shard = random.randint(0, SHARDS - 1)
    return r.incrby(f"{base_key}:{shard}", delta)

def get_sharded(base_key: str):
    keys = [f"{base_key}:{i}" for i in range(SHARDS)]
    vals = r.mget(keys)
    return sum(int(v or 0) for v in vals)

for _ in range(1000):
    incr_sharded("pv:home")
print(get_sharded("pv:home"))
```

---

## 6. 内存爆了 / `OOM command not allowed when used memory > 'maxmemory'`

**现象**：写入失败、业务报错、Redis 日志出现 OOM。  
**原因**：
- 没有设置 `maxmemory`
- 淘汰策略不合理（如 `noeviction`）
- key 无 TTL，缓存永不回收

**解决方案**：
- 为缓存类 key 设置 TTL（强烈建议）
- 设置 `maxmemory` + 合理 `maxmemory-policy`（常见：`allkeys-lru`、`volatile-ttl` 等）
- 识别 bigkey/hotkey；限制集合长度

**Python 示例：写缓存务必设置 TTL**：

```python
import json
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def cache_user(uid: int, data: dict, ttl_seconds: int = 300):
    key = f"user:{uid}"
    r.set(key, json.dumps(data), ex=ttl_seconds)

cache_user(1, {"id": 1, "name": "Lilith"}, ttl_seconds=60)
```

---

## 7. 缓存穿透：一直查不到的数据把 DB 打爆

把缓存想成“**门口保安**”。穿透就是：每次来的人都不在名单里，保安只能次次去楼上问（打 DB）。

**现象**：某些不存在的 id 被频繁请求，Redis 命中率低，DB 压力大。  
**原因**：请求参数恶意/异常，或业务天然存在大量不存在查询。  
**解决方案**：
- **缓存空值**（短 TTL）
- **布隆过滤器**（前置判断大概率存在）
- 参数校验/限流

**Python 示例：缓存空值**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

NULL = "__NULL__"

def get_user(uid: int):
    key = f"user:{uid}"
    v = r.get(key)
    if v is not None:
        return None if v == NULL else v

    # 模拟 DB 查询
    db_value = None  # 假设不存在

    if db_value is None:
        r.set(key, NULL, ex=30)  # 空值短 TTL，避免长期污染
        return None

    r.set(key, db_value, ex=300)
    return db_value
```

---

## 8. 缓存击穿：热点 key 过期瞬间把 DB 打爆

击穿像“**一个热门窗口突然关门**”，所有人同时涌去人工柜台（DB）。

**现象**：单个热点 key 过期时 DB QPS 暴涨。  
**原因**：热点 key 的 TTL 同步到点过期，且没有互斥重建机制。  
**解决方案**：
- **互斥锁（单飞）**：只有一个请求去回源更新，其它等/兜底
- **逻辑过期**：值里带过期时间，过期后先返回旧值并异步刷新

**Python 示例：互斥锁重建（简化版）**：

```python
import time
import uuid
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def get_with_mutex(key: str, ttl: int = 60):
    v = r.get(key)
    if v is not None:
        return v

    lock_key = f"lock:{key}"
    token = str(uuid.uuid4())
    got = r.set(lock_key, token, nx=True, ex=5)  # 5s 锁
    if not got:
        # 没拿到锁：短暂等待后再读（避免一直打 DB）
        time.sleep(0.05)
        return r.get(key)

    try:
        # Double-check，避免“锁等待期间别人已写入”
        v = r.get(key)
        if v is not None:
            return v

        # 模拟 DB 回源
        fresh = f"data:{int(time.time())}"
        r.set(key, fresh, ex=ttl)
        return fresh
    finally:
        # 安全释放（Lua 保证原子：只删自己持有的锁）
        lua = """
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('DEL', KEYS[1])
        else
          return 0
        end
        """
        r.eval(lua, 1, lock_key, token)
```

---

## 9. 缓存雪崩：大量 key 同时过期 / Redis 故障导致 DB 崩

雪崩像“**整个小区同时停电**”，所有人同时去超市抢蜡烛（DB）。

**现象**：某个时间点命中率突然掉到很低，DB 瞬间被打爆。  
**原因**：
- 大量 key 使用相同 TTL，集中到点过期
- Redis 集群故障、网络隔离导致缓存整体不可用

**解决方案**：
- **TTL 加随机抖动**：把过期时间打散
- 多级缓存：本地缓存兜底
- 限流/熔断：缓存不可用时保护 DB

**Python 示例：TTL 抖动**：

```python
import random
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def set_with_jitter(key: str, value: str, base_ttl: int = 300, jitter: int = 60):
    ttl = base_ttl + random.randint(0, jitter)
    r.set(key, value, ex=ttl)

set_with_jitter("cfg:home", "v1", base_ttl=300, jitter=120)
```

---

## 10. 分布式锁常见坑：死锁、误删、续期、羊群效应

把分布式锁想成“**把唯一钥匙放在前台**”。你拿到钥匙才能进机房，但必须确保：
- 钥匙不会永远丢在你手里（死锁）
- 你不会把别人钥匙扔掉（误删）
- 你加班太久钥匙不会自动失效（续期/看门狗）

**常见坑点**：
- 只用 `SETNX` 不设置过期：进程挂了死锁
- 释放锁直接 `DEL`：可能删掉别人后来拿到的锁
- 业务耗时超过锁 TTL：锁过期后别人进入临界区 → 并发写

**解决方案**：
- `SET key token NX EX ttl` 获取锁
- Lua 校验 token 后再删锁（原子）
- 长任务需要续期（看门狗）或把临界区拆小

**Python 示例：加锁/解锁（带 token）**：

```python
import uuid
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

UNLOCK_LUA = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end
"""

def try_lock(lock_key: str, ttl: int = 10):
    token = str(uuid.uuid4())
    ok = r.set(lock_key, token, nx=True, ex=ttl)
    return (token if ok else None)

def unlock(lock_key: str, token: str) -> bool:
    return r.eval(UNLOCK_LUA, 1, lock_key, token) == 1

token = try_lock("lock:order:1001", ttl=5)
if token:
    try:
        # do work
        pass
    finally:
        unlock("lock:order:1001", token)
```

---

## 11. 事务（MULTI/EXEC）不是“数据库事务”，别误会

**现象**：以为 Redis 事务能回滚、能隔离并发，结果数据仍然被别的客户端改了。  
**原因**：Redis 的事务更像“**把一串命令打包顺序执行**”，不提供传统 DB 的隔离级别/回滚语义。  
**解决方案**：
- 需要“读-改-写”原子：优先用 Lua 脚本
- 或使用 `WATCH` + CAS（乐观锁）

**Python 示例：WATCH 实现 CAS**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def incr_if_not_changed(key: str):
    with r.pipeline() as pipe:
        while True:
            try:
                pipe.watch(key)
                cur = int(pipe.get(key) or 0)
                pipe.multi()
                pipe.set(key, cur + 1)
                pipe.execute()
                return cur + 1
            except redis.WatchError:
                continue

print(incr_if_not_changed("counter"))
```

---

## 12. Pipeline：吞吐提升很大，但也有坑

把 pipeline 想成“**把 100 次跑腿合并成 1 次快递**”，网络往返（RTT）大幅减少。  
**现象**：单条命令很快，但大量小命令整体慢。  
**原因**：RTT 叠加。  
**解决方案**：对批量操作使用 pipeline，但注意：
- pipeline 缓冲太大可能占用内存
- 不要把慢命令塞进 pipeline 以为就不慢了（单线程仍会执行）

**Python 示例：批量 set/get**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

with r.pipeline(transaction=False) as pipe:
    for i in range(1000):
        pipe.set(f"k:{i}", i, ex=60)
    pipe.execute()

with r.pipeline(transaction=False) as pipe:
    for i in range(1000):
        pipe.get(f"k:{i}")
    values = pipe.execute()

print(values[:5])
```

---

## 13. 序列化与兼容：JSON/Msgpack/Pickle 的取舍

**现象**：上线后反序列化失败、不同语言读不出来、字段变更导致旧值报错。  
**原因**：Redis 只存字节，你的序列化协议决定了可维护性。  
**解决方案**：
- 跨语言：优先 JSON/MsgPack/Protobuf
- 版本演进：在 value 中加入 `version` 字段或使用 key versioning（如 `user:v2:1`）
- 避免 Pickle（安全风险 + 语言绑定）

**Python 示例：key versioning**：

```python
import json
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def set_user_v2(uid: int, data: dict):
    key = f"user:v2:{uid}"
    r.set(key, json.dumps({"version": 2, **data}), ex=300)

set_user_v2(1, {"name": "Lilith", "age": 18})
```

---

## 14. TTL 相关坑：为什么 key “没过期/提前过期/一直存在”

**现象**：
- 以为写了 TTL 但 key 一直在
- 续写覆盖时 TTL 被清掉

**原因**：
- 某些写法会覆盖 TTL（例如旧版本 `SET` + `EXPIRE` 分两步，第二步失败就没 TTL）
- 对 key 做 `SET` 会重置 TTL（除非使用 `KEEPTTL`）

**解决方案**：
- 用原子写法：`SET key val EX ttl`
- 更新值但保留 TTL：Redis 6+ 用 `SET ... KEEPTTL`

**Python 示例：保留 TTL 更新值**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

r.set("session:1", "a", ex=60)
ttl1 = r.ttl("session:1")

# Redis 6+：keepttl=True
r.set("session:1", "b", keepttl=True)
ttl2 = r.ttl("session:1")

print(ttl1, ttl2)
```

---

## 15. 持久化（RDB/AOF）导致抖动：fork、磁盘、重写

**现象**：周期性延迟上升、fork 时间长、磁盘 IO 飙高。  
**原因**：
- RDB 触发 fork：数据集越大，fork 越重；写放大影响 COW
- AOF rewrite：重写期间 IO 压力大

**解决方案**：
- 评估是否需要持久化；缓存场景可弱化持久化
- 合理配置 `appendfsync`（`everysec` 常用折中）
- 大内存实例关注 `fork` 开销；避免 bigkey 以及突发大量写

**Python 示例：观察 INFO（持久化/内存/延迟线索）**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)
info = r.info()
print("used_memory_human:", info.get("used_memory_human"))
print("aof_enabled:", info.get("aof_enabled"))
print("rdb_last_save_time:", info.get("rdb_last_save_time"))
```

---

## 16. 主从复制与一致性：读从库“读到旧数据”

**现象**：刚写入后立即读取却拿到旧值（读从库时）。  
**原因**：复制是异步的，有延迟；网络抖动会放大延迟。  
**解决方案**：
- 强一致场景：读主库
- 或关键读走主，非关键读走从
- 使用 `WAIT` 在写后等待一定复制确认（会增加写延迟）

**Python 示例：写后 WAIT**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

r.set("k", "v")
ack = r.wait(num_replicas=1, timeout=200)  # 等 200ms，至少 1 个副本确认
print("replica_ack:", ack)
```

---

## 17. Pub/Sub 不可靠：消息丢失、离线收不到

**现象**：消费者断开后重连，错过离线期间的消息。  
**原因**：Redis Pub/Sub 是“广播电台”，**不存档**。  
**解决方案**：
- 需要可靠投递：用 Redis Streams（XADD/XREADGROUP）或 Kafka/RabbitMQ
- Pub/Sub 适合实时通知、无所谓丢失的场景

**Python 示例：Streams 可靠消费（消费者组）**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)
stream = "mystream"
group = "g1"
consumer = "c1"

try:
    r.xgroup_create(stream, group, id="0-0", mkstream=True)
except redis.exceptions.ResponseError as e:
    if "BUSYGROUP" not in str(e):
        raise

r.xadd(stream, {"type": "order", "id": "1001"})

msgs = r.xreadgroup(groupname=group, consumername=consumer, streams={stream: ">"}, count=10, block=1000)
for s, entries in msgs:
    for msg_id, fields in entries:
        print(msg_id, fields)
        r.xack(stream, group, msg_id)
```

---

## 18. 删除大 key 很慢：`DEL` 卡顿

**现象**：删除某个大集合 key 时，延迟明显上升。  
**原因**：`DEL` 是同步释放内存，释放量大就会阻塞主线程。  
**解决方案**：
- 使用 `UNLINK`（异步删除，后台线程回收）

**Python 示例：优先 UNLINK**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

# 大 key 删除用 unlink
r.unlink("some:big:key")
```

---

## 19. 线上排查套路：从“症状”到“证据”

当你怀疑 Redis 有问题时，建议用一套固定流程，像医生一样先量体温再开药：

- **看延迟**：应用侧 P95/P99 是否升高？是否集中在某接口？
- **看慢命令**：`SLOWLOG GET`、监控 top N 命令
- **看内存**：`INFO memory`、keyspace 命中率（`INFO stats` 的 `keyspace_hits/misses`）
- **看持久化/复制**：`INFO persistence`、`INFO replication`
- **看网络/连接**：连接数、连接池等待、timeout 计数

**Python 示例：快速打印关键指标**：

```python
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)

def quick_report():
    info = r.info()
    stats = {
        "used_memory_human": info.get("used_memory_human"),
        "connected_clients": info.get("connected_clients"),
        "instantaneous_ops_per_sec": info.get("instantaneous_ops_per_sec"),
        "keyspace_hits": info.get("keyspace_hits"),
        "keyspace_misses": info.get("keyspace_misses"),
        "evicted_keys": info.get("evicted_keys"),
        "expired_keys": info.get("expired_keys"),
    }
    print(stats)

quick_report()
```

---

## 20. 一页总结：你应该默认遵循的实践清单

- **默认用连接池 + 超时**：避免线程被“卡死”
- **缓存必须带 TTL**：防止内存无限增长
- **避免全量命令**：用 `SCAN` 系列代替 `KEYS`
- **bigkey 拆分 + 分页读取**：减少单次阻塞
- **hotkey 削峰**：本地缓存 / 分片 / 读扩展
- **雪崩用 TTL 抖动 + 限流熔断**：保护 DB
- **击穿用互斥/逻辑过期**：热点重建单飞
- **锁要带 token + Lua 解锁**：防误删；长任务考虑续期
- **大 key 删除用 UNLINK**：减少阻塞

如果你愿意，我也可以根据你目前项目的实际使用场景（比如：用 Redis 做会话、排行榜、分布式锁、缓存 DB 查询结果等），把上面的模板进一步改成**更贴合你业务的“可直接复制粘贴”版本**（包括 key 设计、TTL 策略、监控告警指标建议）。

