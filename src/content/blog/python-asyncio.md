---
title: "彻底理解 asyncio：事件循环、Task、gather、线程池/进程池与常用模块全景"
description: "用可运行的例子把 asyncio 的事件循环心智模型、并发与并行、gather/wait/TaskGroup、取消与超时、同步原语、队列、线程池/进程池、流与子进程等常用能力一次讲透"
publishDate: 2025-12-29
tags: ["Python", "asyncio", "异步编程", "事件循环", "并发", "线程池", "进程池"]
---

这篇文章的目标是：**把 `asyncio` 在你脑子里变成一个“可运行的模型”**，你能清晰回答：

- **事件循环到底在做什么？**
- **`await` 到底让出了什么？**
- **Task / Future / 协程对象之间是什么关系？**
- **`gather`/`wait`/`as_completed`/`TaskGroup` 各适合什么？**
- **什么时候该用线程池/进程池，怎么跟 `asyncio` 正确协作？**
- **取消、超时、资源清理为什么总出坑？**

> 如果你已经看过一篇更聚焦的文章（比如[事件循环与 `run/create_task` 的区别](./python-asyncio-event-loop-and-run-create-task.md)），这篇会更像“全景地图 + 可执行范式库”，用来打通所有常用模块。

---

### 先建立一个正确的心智模型（最重要）

`asyncio` 的核心不是“更快”，而是：

- **在单线程里，把 CPU 时间切成很多小片**，在 I/O 等待期间切去干别的事情（并发）。
- **用事件循环（Event Loop）当调度员**：谁能跑就跑一小段，谁在等 I/O 就先挂起。

#### 并发 vs 并行（你后面会反复用到）

| 概念 | 关键词 | 典型用途 | 是否真的同时执行 |
|---|---|---|---|
| **并发** | “轮流推进多个任务” | I/O 密集（网络、磁盘、DB） | ❌（通常单线程） |
| **并行** | “真的同时跑多个任务” | CPU 密集（压缩、加密、图像处理） | ✅（多进程/多核） |

`asyncio` 默认擅长 **并发**，并不自动带来 CPU 并行。

---

### 1) 协程、Task、Future：三者关系一次讲清

先用一句话区分：

- **协程函数**：`async def f(): ...`（可被调用）
- **协程对象**：`f()` 的返回值（可 `await`，但不会自己“跑起来”）
- **Task**：把协程对象“登记到事件循环”，让它被调度执行
- **Future**：一个“未来会有结果”的容器，Task 是 Future 的一种（更具体：`asyncio.Task` 继承自 `Future`）

看一个最小示例：

```python
import asyncio

async def work():
    await asyncio.sleep(0.1)
    return 42

async def main():
    coro = work()                       # 协程对象（还没开始跑）
    task = asyncio.create_task(coro)    # 登记为 Task（开始被调度）
    result = await task                 # 等待结果
    print(result)

asyncio.run(main())
```

关键点：

- **“开始执行”这件事，通常发生在你把协程变成 Task，或者把它交给 `await` 的那一刻**（更精确：当控制权回到事件循环，它才会推进任务）。

---

### 2) 事件循环（Event Loop）到底在做什么？用一个可观测例子理解

事件循环可以理解为一个循环：

1. 从“就绪队列”里取能运行的任务，推进一点点（直到遇到 `await`）
2. 处理 I/O 就绪事件、定时器（比如 `sleep` 到点了）
3. 把完成/可继续的任务重新放回就绪队列
4. 重复直到没有任务或被停止

看一个“可观测”的例子（你能看到任务交替推进）：

```python
import asyncio

async def job(name: str, delay: float):
    print(f"{name}: start")
    await asyncio.sleep(delay)
    print(f"{name}: after first await")
    await asyncio.sleep(delay)
    print(f"{name}: done")

async def main():
    t1 = asyncio.create_task(job("A", 0.2))
    t2 = asyncio.create_task(job("B", 0.2))
    await asyncio.gather(t1, t2)

asyncio.run(main())
```

你会观察到：

- `A` 跑到第一个 `await` 就“让出控制权”
- `B` 也跑到 `await` 让出
- 计时器到点后，事件循环再把它们“唤醒”继续跑

#### 一个非常常见的误解：`await` ≠ 开新线程

`await` 的本质是：**当前协程暂停，把控制权交还事件循环**。它不会自动并行执行代码。

---

### 3) `asyncio.gather`：并发批量执行的“瑞士军刀”

`gather` 的心智模型很简单：

- 你给它一堆 awaitable（协程/Task/Future）
- 它并发推进它们
- 最终给你一个 **按传入顺序排列的结果列表**

#### 3.1 基本用法：并发执行 + 收集结果

```python
import asyncio

async def fetch(i: int):
    await asyncio.sleep(0.1 * i)
    return f"data-{i}"

async def main():
    results = await asyncio.gather(
        fetch(3),
        fetch(1),
        fetch(2),
    )
    print(results)  # ['data-3', 'data-1', 'data-2']（顺序=传入顺序）

asyncio.run(main())
```

#### 3.2 异常行为（重要）：默认遇到异常会“向外抛”

```python
import asyncio

async def ok():
    await asyncio.sleep(0.1)
    return "ok"

async def boom():
    await asyncio.sleep(0.05)
    raise ValueError("bad")

async def main():
    try:
        await asyncio.gather(ok(), boom())
    except Exception as e:
        print("gather raised:", repr(e))

asyncio.run(main())
```

你需要知道两点：

- **默认**：`gather` 会把第一个抛出的异常抛出来
- 其它子任务可能仍在运行或被取消（取决于版本与调度时序），所以你要对“清理/取消”有明确策略

#### 3.3 想“收集异常而不是抛出”：`return_exceptions=True`

```python
import asyncio

async def _boom():
    raise RuntimeError("boom")

async def main():
    results = await asyncio.gather(
        asyncio.sleep(0.05, result="ok"),
        asyncio.sleep(0.01),
        _boom(),
        return_exceptions=True,
    )
    for r in results:
        print(type(r), r)

asyncio.run(main())
```

当你在做“批量任务，允许部分失败”的场景（爬虫、批量请求）时，这个模式非常常见。

---

### 4) `asyncio.wait` / `asyncio.as_completed`：更细粒度地“等”

#### 4.1 `asyncio.wait`：返回 done/pending，让你决定下一步

典型场景：你想“谁先完成就先处理”，或者你只想等到第一个完成/第一个异常。

```python
import asyncio

async def job(name, t):
    await asyncio.sleep(t)
    return name

async def main():
    tasks = {asyncio.create_task(job("A", 0.3)),
             asyncio.create_task(job("B", 0.1)),
             asyncio.create_task(job("C", 0.2))}

    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    print("done:", [d.result() for d in done])
    print("pending:", len(pending))

    for p in pending:
        p.cancel()
    await asyncio.gather(*pending, return_exceptions=True)

asyncio.run(main())
```

#### 4.2 `asyncio.as_completed`：按完成顺序产出结果

```python
import asyncio

async def job(i):
    await asyncio.sleep(0.1 * (3 - i))
    return i

async def main():
    tasks = [asyncio.create_task(job(i)) for i in range(3)]
    for fut in asyncio.as_completed(tasks):
        print("got:", await fut)  # 2, 1, 0（按完成顺序）

asyncio.run(main())
```

---

### 5) 取消与超时：asyncio 的“地雷区”必须掌握

#### 5.1 取消是什么？

取消不是“杀线程”，而是：

- 给 Task 注入一个 `asyncio.CancelledError`
- 让它在下一个 `await`/调度点抛出
- 协程可以捕获它做清理，然后通常应当再抛出（否则取消就被吞了）

```python
import asyncio

async def worker():
    try:
        while True:
            await asyncio.sleep(0.2)
            print("tick")
    except asyncio.CancelledError:
        print("cleanup before cancel")
        raise

async def main():
    t = asyncio.create_task(worker())
    await asyncio.sleep(0.55)
    t.cancel()
    await asyncio.gather(t, return_exceptions=True)

asyncio.run(main())
```

#### 5.2 超时：`asyncio.wait_for`

```python
import asyncio

async def slow():
    await asyncio.sleep(10)
    return "done"

async def main():
    try:
        await asyncio.wait_for(slow(), timeout=0.5)
    except asyncio.TimeoutError:
        print("timeout")

asyncio.run(main())
```

注意：`wait_for` 超时会**取消被等待的任务**（这是很多人踩坑的原因），如果你不希望被取消，需要更谨慎地组织结构（例如自行创建 Task + 处理取消，或用 `shield`）。

#### 5.3 不想被取消：`asyncio.shield`

`shield` 让“外层取消/超时”不直接取消内层任务，但外层仍会收到取消/超时异常。

```python
import asyncio

async def critical():
    await asyncio.sleep(0.5)
    return "critical done"

async def main():
    t = asyncio.create_task(critical())
    try:
        await asyncio.wait_for(asyncio.shield(t), timeout=0.1)
    except asyncio.TimeoutError:
        print("outer timeout, but inner keeps running")
    print(await t)

asyncio.run(main())
```

---

### 6) 同步原语（Lock/Semaphore/Event/Condition）：控制并发的“交通规则”

#### 6.1 `asyncio.Lock`：保护共享资源（不要用 `threading.Lock`）

```python
import asyncio

async def main():
    lock = asyncio.Lock()
    counter = 0

    async def inc():
        nonlocal counter
        async with lock:
            tmp = counter
            await asyncio.sleep(0)  # 强行让出，模拟竞争窗口
            counter = tmp + 1

    await asyncio.gather(*(inc() for _ in range(1000)))
    print(counter)  # 1000

asyncio.run(main())
```

#### 6.2 `asyncio.Semaphore`：限流（爬虫/批量请求的核心）

```python
import asyncio

async def main():
    sem = asyncio.Semaphore(3)

    async def task(i):
        async with sem:
            print("start", i)
            await asyncio.sleep(0.2)
            print("done", i)

    await asyncio.gather(*(task(i) for i in range(10)))

asyncio.run(main())
```

#### 6.3 `asyncio.Event`：一个“开关”，用来广播通知

```python
import asyncio

async def main():
    ev = asyncio.Event()

    async def waiter():
        print("wait...")
        await ev.wait()
        print("go!")

    t = asyncio.create_task(waiter())
    await asyncio.sleep(0.2)
    ev.set()
    await t

asyncio.run(main())
```

#### 6.4 `asyncio.Condition`：更复杂的“等待某个条件成立”

当你有共享状态（比如“缓冲区里是否有数据”），并且希望“状态变化时唤醒等待者”，可以用 `Condition`：

```python
import asyncio

async def main():
    cond = asyncio.Condition()
    shared = {"ready": False}

    async def waiter():
        async with cond:
            await cond.wait_for(lambda: shared["ready"])
            print("condition met, continue")

    async def setter():
        await asyncio.sleep(0.2)
        async with cond:
            shared["ready"] = True
            cond.notify_all()

    await asyncio.gather(waiter(), setter())

asyncio.run(main())
```

---

### 7) `asyncio.Queue`：异步生产者/消费者（背压天然支持）

```python
import asyncio

async def producer(q: asyncio.Queue):
    for i in range(5):
        await asyncio.sleep(0.1)
        await q.put(i)
    await q.put(None)  # 结束信号

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()
        try:
            if item is None:
                return
            await asyncio.sleep(0.2)
            print("consume", item)
        finally:
            q.task_done()

async def main():
    q = asyncio.Queue(maxsize=2)  # maxsize 产生背压：生产者会在 put 上等待
    await asyncio.gather(producer(q), consumer(q))

asyncio.run(main())
```

---

### 8) 线程池与进程池：让 asyncio 与“阻塞/CPU”和平共处

这里是理解 asyncio 的最后一块拼图：**asyncio 只负责调度协程，不会让阻塞函数自动变异步。**

#### 8.1 I/O 阻塞（或第三方库阻塞）→ 用线程池（`to_thread` / `run_in_executor`）

Python 3.9+ 推荐 `asyncio.to_thread`（语义更清晰）：

```python
import asyncio
import time

def blocking_io():
    time.sleep(0.5)  # 模拟阻塞 I/O
    return "io"

async def main():
    r = await asyncio.to_thread(blocking_io)
    print(r)

asyncio.run(main())
```

更通用/更底层的方式是 `loop.run_in_executor`：

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

def blocking_io(i):
    time.sleep(0.2)
    return i

async def main():
    loop = asyncio.get_running_loop()
    with ThreadPoolExecutor(max_workers=4) as pool:
        tasks = [loop.run_in_executor(pool, blocking_io, i) for i in range(10)]
        print(await asyncio.gather(*tasks))

asyncio.run(main())
```

适用场景：

- requests、boto3、一些老旧 DB 驱动等“没有 async 版本”的阻塞库
- 文件 I/O（注意：Python 对文件 I/O 不提供真正的异步文件 API，常用做法是线程池或第三方库）

#### 8.2 CPU 密集 → 用进程池（`ProcessPoolExecutor`）

CPU 密集任务在 CPython 会被 GIL 限制，线程池不会让它并行，应该用进程池：

```python
import asyncio
from concurrent.futures import ProcessPoolExecutor

def cpu_heavy(n: int) -> int:
    s = 0
    for i in range(n):
        s += i * i
    return s

async def main():
    loop = asyncio.get_running_loop()
    with ProcessPoolExecutor() as pool:
        tasks = [
            loop.run_in_executor(pool, cpu_heavy, 8_000_000),
            loop.run_in_executor(pool, cpu_heavy, 8_000_000),
        ]
        a, b = await asyncio.gather(*tasks)
        print(a + b)

asyncio.run(main())
```

选择规则（背下来就不会选错）：

- **I/O 阻塞**：优先 `async` 版本库；否则 `to_thread`/线程池
- **CPU 密集**：进程池（或把逻辑移到 Rust/NumPy 等释放 GIL 的实现）

---

### 9) 异步网络 I/O（Streams）：不依赖第三方库也能写 TCP

你可以用 `asyncio` 原生的 streams 快速理解“真正的异步 I/O”是什么样：

#### 9.1 TCP 服务端：`asyncio.start_server`

```python
import asyncio

async def handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    data = await reader.readline()
    writer.write(b"echo: " + data)
    await writer.drain()
    writer.close()
    await writer.wait_closed()

async def main():
    server = await asyncio.start_server(handle, "127.0.0.1", 8888)
    async with server:
        await server.serve_forever()

asyncio.run(main())
```

#### 9.2 TCP 客户端：`asyncio.open_connection`

```python
import asyncio

async def main():
    reader, writer = await asyncio.open_connection("127.0.0.1", 8888)
    writer.write(b"hello\n")
    await writer.drain()
    print((await reader.readline()).decode().strip())
    writer.close()
    await writer.wait_closed()

asyncio.run(main())
```

---

### 10) 异步子进程：`asyncio.create_subprocess_exec`

当你要跑外部命令、又不想阻塞事件循环：

```python
import asyncio

async def main():
    proc = await asyncio.create_subprocess_exec(
        "python", "-c", "print('hi')",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate()
    print("rc:", proc.returncode)
    print("out:", out.decode().strip())
    print("err:", err.decode().strip())

asyncio.run(main())
```

---

### 11) Python 3.11+ 推荐：`asyncio.TaskGroup`（结构化并发）

`TaskGroup` 的价值在于：**生命周期更清晰、异常传播更可控、取消更一致**。

```python
import asyncio

async def work(i):
    await asyncio.sleep(0.1)
    return i

async def main():
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(work(i)) for i in range(5)]
    print([t.result() for t in tasks])

asyncio.run(main())
```

什么时候用它？

- 你想明确表达“这一组子任务必须一起成功/一起失败，并在 scope 结束前都被收束”

---

### 12) 常见坑与“正确姿势”

#### 坑 1：在协程里写了 CPU 大循环，整个事件循环“卡死”

```python
async def bad():
    # ❌ 这里没有任何 await，事件循环没有切换点
    for _ in range(100_000_000):
        pass
```

修复方向：

- 把 CPU 密集丢给进程池
- 或者在长循环中合理 `await asyncio.sleep(0)`（只是“让出”，不是变快）

#### 坑 2：创建了 Task 却没收尾（导致 “Task exception was never retrieved”）

原则：**你创建的 Task，你要负责 await 或处理异常/取消**。

常见收尾方式：

- `await task`
- `await asyncio.gather(*tasks, return_exceptions=True)`
- 在 Task 上加 `add_done_callback` 统一记录异常（更高级场景）

#### 坑 3：混用 `threading` 同步原语

在 `asyncio` 协程里用 `threading.Lock`/`queue.Queue` 往往会阻塞事件循环；优先用 `asyncio.Lock`/`asyncio.Queue`。

---

### 13) 一张“选型速查表”

| 你想做的事 | 优先工具 | 备注 |
|---|---|---|
| 批量并发执行并收集结果 | `asyncio.gather` | 结果按输入顺序 |
| 谁先完成先处理 | `asyncio.as_completed` | 流式处理更省内存 |
| 等到第一个完成/异常 | `asyncio.wait(..., return_when=...)` | 更可控 |
| 限制并发数（限流） | `asyncio.Semaphore` | 爬虫/请求必备 |
| 生产者/消费者（背压） | `asyncio.Queue` | `maxsize` 很关键 |
| 超时控制 | `asyncio.wait_for` | 默认会取消被等待任务 |
| 防止被取消 | `asyncio.shield` | 外层仍会收到取消/超时 |
| 阻塞 I/O 库（无 async 版） | `asyncio.to_thread` | 或 `run_in_executor` |
| CPU 密集并行 | `ProcessPoolExecutor` | 绕开 GIL |
| TCP/原生网络 I/O | `start_server/open_connection` | streams |
| 跑外部命令不阻塞 | `create_subprocess_exec` | 可异步读 stdout/stderr |
| 结构化并发（3.11+） | `asyncio.TaskGroup` | 推荐新代码用 |

---

### 14) 你可以用这 3 个练习“真正掌握 asyncio”

你做到这三题，基本就“会了”：

1. **限流爬虫/批量请求器**：`Semaphore` + `gather(return_exceptions=True)` + 超时 + 重试
2. **生产者/消费者流水线**：`Queue(maxsize)` + 多消费者 + 优雅结束信号 + `task_done/join`
3. **混合模型**：网络请求用 `async`，CPU 解析/压缩用进程池，阻塞库用 `to_thread`

如果你愿意，我可以基于你当前项目里最常见的实际场景（比如“批量抓取 + 解析 + 写入”），把它写成一份可直接复用的模板代码。

