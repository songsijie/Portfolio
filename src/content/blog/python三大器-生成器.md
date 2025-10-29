---
title: "Python三大器之生成器：高效的惰性求值利器"
description: "深入讲解Python生成器的概念、特点、使用方式和应用场景，掌握yield关键字和生成器表达式的使用"
publishDate: 2025-10-19
tags: ["Python", "生成器", "编程基础", "性能优化"]
---

# Python三大器之生成器：高效的惰性求值利器

Python 生成器是一个特殊类型的迭代器，用于生成序列中的一系列值。与普通函数不同，生成器函数使用 `yield` 关键字来返回值，而不是 `return`。当调用生成器函数时，它不会立即执行，而是返回一个生成器对象，该对象可以通过迭代来消费。

## 生成器的特点

### 1. 惰性求值

生成器在迭代时逐个生成值，而不是一次性生成所有值。这意味着它们可以处理大数据集而不会占用太多内存。

### 2. 状态保持

生成器可以在 `yield` 语句处暂停并保存状态。下次调用时，它将从上次暂停的地方继续执行，而不是从头开始。

### 3. 简洁性

生成器的语法通常比使用类实现迭代器要简单，并且能够更清晰地表达复杂的迭代逻辑。

### 4. 内存高效

由于惰性求值的特性，生成器非常适合处理大型数据集或无限序列。

## 创建生成器的方式

### 1. 使用生成器函数

```python
def my_generator():
    for i in range(5):
        yield i * 2  # 每次生成一个值

gen = my_generator()  # 创建生成器对象
for value in gen:
    print(value)  # 输出：0, 2, 4, 6, 8
```

### 2. 使用生成器表达式

生成器表达式类似于列表推导式，但会返回一个生成器对象而不是列表。

```python
# 列表推导式 - 立即创建列表
squares_list = [x * 2 for x in range(5)]

# 生成器表达式 - 返回生成器对象
gen_exp = (x * 2 for x in range(5))  # 注意：使用圆括号

for value in gen_exp:
    print(value)  # 输出：0, 2, 4, 6, 8
```

## yield 关键字详解

### 基本用法

```python
def simple_generator():
    print("开始执行")
    yield 1
    print("继续执行")
    yield 2
    print("再次执行")
    yield 3
    print("结束执行")

gen = simple_generator()
print(next(gen))  # 输出：开始执行 \n 1
print(next(gen))  # 输出：继续执行 \n 2
print(next(gen))  # 输出：再次执行 \n 3
# print(next(gen))  # 输出：结束执行 \n 抛出 StopIteration
```

### yield vs return

```python
# 使用 return - 函数结束
def function_with_return():
    return 1
    return 2  # 永远不会执行
    return 3

result = function_with_return()
print(result)  # 输出：1

# 使用 yield - 生成器暂停
def function_with_yield():
    yield 1
    yield 2
    yield 3

gen = function_with_yield()
print(list(gen))  # 输出：[1, 2, 3]
```

### yield 可以返回值并接收值

```python
def echo_generator():
    value = None
    while True:
        # yield 既可以产出值，也可以接收值
        value = yield value
        if value is not None:
            value = value * 2

gen = echo_generator()
next(gen)  # 启动生成器
print(gen.send(5))   # 输出：10
print(gen.send(10))  # 输出：20
print(gen.send(7))   # 输出：14
```

## 实际应用场景

### 1. 读取大文件

```python
def read_large_file(filename):
    """逐行读取大文件"""
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            yield line.strip()

# 使用
for line in read_large_file('large_file.txt'):
    process(line)  # 处理每一行
```

### 2. 斐波那契数列

```python
def fibonacci(n):
    """生成前n个斐波那契数"""
    a, b = 0, 1
    count = 0
    while count < n:
        yield a
        a, b = b, a + b
        count += 1

# 使用
for num in fibonacci(10):
    print(num, end=' ')  # 输出：0 1 1 2 3 5 8 13 21 34
```

### 3. 无限序列生成器

```python
def infinite_counter(start=0, step=1):
    """无限计数器"""
    current = start
    while True:
        yield current
        current += step

# 使用（需要手动停止）
counter = infinite_counter(0, 2)
for i, value in enumerate(counter):
    if i >= 10:
        break
    print(value, end=' ')  # 输出：0 2 4 6 8 10 12 14 16 18
```

### 4. 数据处理管道

```python
def read_data(filename):
    """读取数据"""
    with open(filename) as f:
        for line in f:
            yield line.strip()

def filter_data(lines):
    """过滤数据"""
    for line in lines:
        if line and not line.startswith('#'):
            yield line

def parse_data(lines):
    """解析数据"""
    for line in lines:
        fields = line.split(',')
        yield {'name': fields[0], 'value': int(fields[1])}

def process_data(items):
    """处理数据"""
    for item in items:
        item['value'] *= 2
        yield item

# 构建数据处理管道
pipeline = process_data(
    parse_data(
        filter_data(
            read_data('data.txt')
        )
    )
)

# 执行管道
for item in pipeline:
    print(item)
```

### 5. 批量数据处理

```python
def batch_generator(data, batch_size):
    """将数据分批处理"""
    for i in range(0, len(data), batch_size):
        yield data[i:i + batch_size]

# 使用
data = list(range(1, 101))  # 1到100
for batch in batch_generator(data, 10):
    print(f"处理批次: {batch[:3]}...{batch[-1]}")
    # 处理每个批次
```

### 6. 树的遍历

```python
class TreeNode:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

def inorder_traversal(node):
    """中序遍历二叉树"""
    if node:
        # 遍历左子树
        yield from inorder_traversal(node.left)
        # 访问当前节点
        yield node.value
        # 遍历右子树
        yield from inorder_traversal(node.right)

# 创建树
root = TreeNode(1,
    TreeNode(2, TreeNode(4), TreeNode(5)),
    TreeNode(3, TreeNode(6), TreeNode(7))
)

# 遍历
for value in inorder_traversal(root):
    print(value, end=' ')  # 输出：4 2 5 1 6 3 7
```

### 7. 排列组合生成器

```python
def permutations(items):
    """生成所有排列"""
    if len(items) <= 1:
        yield items
    else:
        for i in range(len(items)):
            rest = items[:i] + items[i+1:]
            for p in permutations(rest):
                yield [items[i]] + p

# 使用
for perm in permutations([1, 2, 3]):
    print(perm)
# 输出所有排列：[1,2,3], [1,3,2], [2,1,3], ...
```

### 8. 滑动窗口

```python
def sliding_window(iterable, window_size):
    """滑动窗口生成器"""
    from collections import deque
    
    window = deque(maxlen=window_size)
    
    for item in iterable:
        window.append(item)
        if len(window) == window_size:
            yield list(window)

# 使用
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
for window in sliding_window(data, 3):
    print(window)
# 输出：
# [1, 2, 3]
# [2, 3, 4]
# [3, 4, 5]
# ...
```

## 生成器表达式 vs 列表推导式

### 性能对比

```python
import sys

# 列表推导式 - 立即创建所有元素
squares_list = [x**2 for x in range(1000000)]
print(f"列表大小: {sys.getsizeof(squares_list)} 字节")

# 生成器表达式 - 按需生成
squares_gen = (x**2 for x in range(1000000))
print(f"生成器大小: {sys.getsizeof(squares_gen)} 字节")

# 输出：
# 列表大小: 8448728 字节
# 生成器大小: 112 字节
```

### 使用场景选择

```python
# 场景1：需要多次遍历 - 使用列表
numbers_list = [x for x in range(10)]
sum1 = sum(numbers_list)
sum2 = sum(numbers_list)  # 可以再次使用

# 场景2：只遍历一次 - 使用生成器
numbers_gen = (x for x in range(10))
sum1 = sum(numbers_gen)
# sum2 = sum(numbers_gen)  # 生成器已耗尽，结果为0

# 场景3：作为函数参数 - 生成器表达式更简洁
total = sum(x**2 for x in range(100))  # 不需要外层括号

# 场景4：链式操作 - 使用生成器
result = sum(
    x
    for x in (y**2 for y in range(100))
    if x % 2 == 0
)
```

## 高级特性

### 1. yield from 委托

```python
def sub_generator():
    yield 1
    yield 2
    yield 3

def main_generator():
    # 不使用 yield from
    for value in sub_generator():
        yield value
    
    # 使用 yield from（更简洁）
    yield from sub_generator()

# 使用
for value in main_generator():
    print(value)
```

### 2. 生成器的方法

```python
def my_generator():
    value = 0
    while True:
        try:
            # 接收外部发送的值
            received = yield value
            if received is not None:
                value = received
            else:
                value += 1
        except GeneratorExit:
            print("生成器关闭")
            break

gen = my_generator()
print(next(gen))      # 0
print(next(gen))      # 1
print(gen.send(10))   # 10
print(gen.send(20))   # 20
gen.close()           # 关闭生成器
```

### 3. 异常处理

```python
def generator_with_exception():
    try:
        yield 1
        yield 2
        yield 3
    except ValueError:
        yield 'ValueError caught'
    except Exception as e:
        yield f'Exception caught: {e}'
    finally:
        yield 'Cleanup'

gen = generator_with_exception()
print(next(gen))  # 1
print(gen.throw(ValueError))  # ValueError caught
```

### 4. 协程式生成器

```python
def averager():
    """计算移动平均值"""
    total = 0
    count = 0
    average = None
    
    while True:
        value = yield average
        total += value
        count += 1
        average = total / count

# 使用
avg = averager()
next(avg)  # 启动生成器
print(avg.send(10))  # 10.0
print(avg.send(20))  # 15.0
print(avg.send(30))  # 20.0
```

## 性能优化技巧

### 1. 使用生成器链

```python
# 不好：创建中间列表
def process_data_bad(data):
    filtered = [x for x in data if x > 0]
    squared = [x**2 for x in filtered]
    return [x for x in squared if x % 2 == 0]

# 好：使用生成器链
def process_data_good(data):
    filtered = (x for x in data if x > 0)
    squared = (x**2 for x in filtered)
    return (x for x in squared if x % 2 == 0)

# 结果相同，但内存使用更少
data = range(-100, 100)
result = list(process_data_good(data))
```

### 2. 避免过早物化

```python
# 不好：立即转换为列表
gen = (x**2 for x in range(1000000))
data = list(gen)  # 占用大量内存
first_10 = data[:10]

# 好：使用 itertools.islice
from itertools import islice
gen = (x**2 for x in range(1000000))
first_10 = list(islice(gen, 10))  # 只生成需要的部分
```

### 3. 生成器缓存

```python
class CachedGenerator:
    """带缓存的生成器"""
    def __init__(self, generator_func):
        self.generator_func = generator_func
        self.cache = []
        self.exhausted = False
    
    def __iter__(self):
        # 先返回缓存的值
        yield from self.cache
        
        # 如果未耗尽，继续生成新值
        if not self.exhausted:
            gen = self.generator_func()
            for item in gen:
                self.cache.append(item)
                yield item
            self.exhausted = True

# 使用
@CachedGenerator
def expensive_generator():
    for i in range(5):
        print(f"生成 {i}")
        yield i

gen = expensive_generator()
print(list(gen))  # 第一次：生成所有值
print(list(gen))  # 第二次：从缓存读取
```

## 最佳实践

### 1. 命名规范

```python
# 生成器函数使用动词或描述性名称
def generate_primes(n):
    pass

def read_lines(filename):
    pass

def filter_even(numbers):
    pass
```

### 2. 文档说明

```python
def fibonacci(n):
    """
    生成前n个斐波那契数。
    
    Args:
        n (int): 要生成的数字数量
    
    Yields:
        int: 下一个斐波那契数
    
    Examples:
        >>> list(fibonacci(5))
        [0, 1, 1, 2, 3]
    """
    a, b = 0, 1
    count = 0
    while count < n:
        yield a
        a, b = b, a + b
        count += 1
```

### 3. 资源管理

```python
def read_file_safely(filename):
    """安全地读取文件"""
    file = None
    try:
        file = open(filename, 'r')
        for line in file:
            yield line.strip()
    finally:
        if file:
            file.close()

# 更好的方式：使用上下文管理器
def read_file_better(filename):
    with open(filename, 'r') as file:
        for line in file:
            yield line.strip()
```

### 4. 异常处理

```python
def safe_generator(data):
    """带异常处理的生成器"""
    for item in data:
        try:
            result = process_item(item)
            yield result
        except Exception as e:
            # 记录错误但继续处理
            print(f"Error processing {item}: {e}")
            continue
```

## 总结

生成器是 Python 中非常强大且优雅的特性，它具有以下优势：

### 核心优势
- ✅ **内存高效**：惰性求值，按需生成，不占用大量内存
- ✅ **简洁优雅**：使用 `yield` 关键字，代码更简洁易读
- ✅ **状态保持**：自动保存和恢复执行状态
- ✅ **无限序列**：可以表示无限长的数据流
- ✅ **组合灵活**：易于构建数据处理管道

### 适用场景
- 📁 处理大文件或数据流
- 🔢 生成数学序列（斐波那契、素数等）
- 🔄 实现迭代器模式
- 🔗 构建数据处理管道
- 🎯 延迟计算和按需生成
- ♾️ 表示无限序列

### 关键要点
1. 理解 `yield` 关键字的工作原理
2. 区分生成器函数和生成器表达式
3. 合理选择列表推导式还是生成器表达式
4. 善用 `yield from` 简化代码
5. 注意资源管理和异常处理

掌握生成器将大大提升你编写高效Python代码的能力，它是Python中最实用的特性之一！

---

*最后更新: 2025年10月*
