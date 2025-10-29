---
title: "Python三大器之迭代器：深入理解迭代器协议"
description: "详细讲解Python迭代器的概念、特点、实现方式和应用场景，帮助你掌握Python的迭代机制"
publishDate: 2025-10-18
tags: ["Python", "迭代器", "编程基础", "数据结构"]
---

# Python三大器之迭代器：深入理解迭代器协议

Python 迭代器是一个实现了迭代器协议的对象，可以用于逐个访问集合中的元素。迭代器对象必须实现两个方法：`__iter__()` 和 `__next__()`。迭代器允许我们以一种统一的方式遍历不同类型的容器对象。

## 迭代器的特点

### 1. 迭代器协议

一个对象只要实现了 `__iter__()` 和 `__next__()` 方法，就可以被称为迭代器。

- **`__iter__()`**: 返回迭代器对象本身
- **`__next__()`**: 返回容器中的下一个值，如果没有更多元素，则抛出 `StopIteration` 异常

### 2. 惰性计算

迭代器不会一次性将所有元素加载到内存中，而是在需要时才计算和返回下一个元素。

### 3. 单向遍历

迭代器只能向前遍历，不能回退。一旦迭代完成，就无法重新开始（除非重新创建迭代器）。

### 4. 节省内存

由于惰性计算的特性，迭代器非常适合处理大型数据集。

## 创建迭代器的方式

### 1. 使用类实现迭代器协议

```python
class MyIterator:
    def __init__(self, max_num):
        self.max_num = max_num
        self.current = 0
    
    def __iter__(self):
        return self  # 返回迭代器对象本身
    
    def __next__(self):
        if self.current < self.max_num:
            result = self.current
            self.current += 1
            return result
        else:
            raise StopIteration  # 没有更多元素时抛出异常

# 使用自定义迭代器
my_iter = MyIterator(5)
for value in my_iter:
    print(value)  # 输出：0, 1, 2, 3, 4
```

### 2. 可迭代对象与迭代器的区别

- **可迭代对象（Iterable）**：实现了 `__iter__()` 方法的对象
- **迭代器（Iterator）**：实现了 `__iter__()` 和 `__next__()` 方法的对象

```python
class MyRange:
    def __init__(self, start, end):
        self.start = start
        self.end = end
    
    def __iter__(self):
        return MyRangeIterator(self.start, self.end)  # 返回一个新的迭代器

class MyRangeIterator:
    def __init__(self, start, end):
        self.current = start
        self.end = end
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.current < self.end:
            result = self.current
            self.current += 1
            return result
        raise StopIteration

# 使用可迭代对象
my_range = MyRange(0, 5)
for value in my_range:
    print(value)  # 输出：0, 1, 2, 3, 4

# 可以多次迭代
for value in my_range:
    print(value)  # 再次输出：0, 1, 2, 3, 4
```

### 3. 使用内置函数 iter() 和 next()

```python
my_list = [1, 2, 3, 4, 5]
my_iter = iter(my_list)  # 从可迭代对象创建迭代器

print(next(my_iter))  # 输出：1
print(next(my_iter))  # 输出：2
print(next(my_iter))  # 输出：3
```

## 实际应用示例

### 文件迭代器

读取大文件时非常有用：

```python
class FileIterator:
    def __init__(self, filename):
        self.file = open(filename, 'r')
    
    def __iter__(self):
        return self
    
    def __next__(self):
        line = self.file.readline()
        if line:
            return line.strip()
        else:
            self.file.close()
            raise StopIteration

# 使用文件迭代器
file_iter = FileIterator('data.txt')
for line in file_iter:
    print(line)
```

### 斐波那契数列迭代器

```python
class Fibonacci:
    def __init__(self, max_count):
        self.max_count = max_count
        self.count = 0
        self.a, self.b = 0, 1
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.count < self.max_count:
            result = self.a
            self.a, self.b = self.b, self.a + self.b
            self.count += 1
            return result
        raise StopIteration

# 生成前10个斐波那契数
fib = Fibonacci(10)
for num in fib:
    print(num, end=' ')  # 输出：0 1 1 2 3 5 8 13 21 34
```

### 无限序列迭代器

```python
class InfiniteCounter:
    def __init__(self, start=0, step=1):
        self.current = start
        self.step = step
    
    def __iter__(self):
        return self
    
    def __next__(self):
        result = self.current
        self.current += self.step
        return result

# 使用无限迭代器（注意：需要手动停止）
counter = InfiniteCounter(0, 2)
for i, value in enumerate(counter):
    if i >= 10:  # 只取前10个
        break
    print(value, end=' ')  # 输出：0 2 4 6 8 10 12 14 16 18
```

### 数据分页迭代器

```python
class Paginator:
    def __init__(self, data, page_size=10):
        self.data = data
        self.page_size = page_size
        self.current_index = 0
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.current_index < len(self.data):
            result = self.data[self.current_index:self.current_index + self.page_size]
            self.current_index += self.page_size
            return result
        raise StopIteration

# 使用分页迭代器
data = list(range(1, 26))  # 1到25的数字
paginator = Paginator(data, page_size=5)

for page_num, page_data in enumerate(paginator, 1):
    print(f"第{page_num}页: {page_data}")
# 输出：
# 第1页: [1, 2, 3, 4, 5]
# 第2页: [6, 7, 8, 9, 10]
# 第3页: [11, 12, 13, 14, 15]
# 第4页: [16, 17, 18, 19, 20]
# 第5页: [21, 22, 23, 24, 25]
```

## 应用场景

迭代器适用于以下场景：

1. **处理大型数据集**
   - 不想一次性加载到内存中
   - 逐行读取大文件

2. **实现自定义遍历逻辑**
   - 自定义序列的遍历方式
   - 实现特殊的数据访问模式

3. **处理数据流**
   - 网络数据流
   - 文件数据流
   - 传感器数据流

4. **创建无限序列**
   - 无限计数器
   - 随机数生成器
   - 延迟计算的序列

5. **保持遍历状态**
   - 在遍历过程中需要记录位置
   - 支持暂停和继续遍历

## 内置迭代器工具

Python的 `itertools` 模块提供了很多有用的迭代器工具：

```python
from itertools import count, cycle, repeat, chain, islice

# count - 无限计数器
for i in count(10, 2):  # 从10开始，步长为2
    if i > 20:
        break
    print(i, end=' ')  # 输出：10 12 14 16 18 20

print()

# cycle - 循环迭代
colors = ['red', 'green', 'blue']
color_cycle = cycle(colors)
for i, color in enumerate(color_cycle):
    if i >= 7:
        break
    print(color, end=' ')  # 输出：red green blue red green blue red

print()

# repeat - 重复元素
for item in repeat('Hello', 3):
    print(item)  # 输出3次 Hello

# chain - 连接多个迭代器
list1 = [1, 2, 3]
list2 = [4, 5, 6]
for item in chain(list1, list2):
    print(item, end=' ')  # 输出：1 2 3 4 5 6

print()

# islice - 切片迭代器
data = range(100)
for item in islice(data, 5, 10):
    print(item, end=' ')  # 输出：5 6 7 8 9
```

## 迭代器 vs 生成器

### 迭代器
- 需要手动实现 `__iter__()` 和 `__next__()` 方法
- 代码相对冗长
- 更加灵活，可以实现复杂的状态管理

### 生成器
- 使用 `yield` 关键字
- 语法更简洁
- 实际上是一种特殊的迭代器
- 是实现迭代器的更简单方式

```python
# 使用迭代器
class SquareIterator:
    def __init__(self, max_num):
        self.max_num = max_num
        self.current = 0
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.current < self.max_num:
            result = self.current ** 2
            self.current += 1
            return result
        raise StopIteration

# 使用生成器（更简洁）
def square_generator(max_num):
    for i in range(max_num):
        yield i ** 2

# 两者效果相同
for num in SquareIterator(5):
    print(num, end=' ')  # 输出：0 1 4 9 16

print()

for num in square_generator(5):
    print(num, end=' ')  # 输出：0 1 4 9 16
```

## 性能考虑

### 内存效率

```python
# 列表推导式 - 一次性创建所有元素
squares_list = [x**2 for x in range(1000000)]  # 占用大量内存

# 生成器表达式 - 按需生成
squares_gen = (x**2 for x in range(1000000))   # 占用很少内存

# 迭代器也是按需生成
class SquareIterator:
    def __init__(self, n):
        self.n = n
        self.current = 0
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.current < self.n:
            result = self.current ** 2
            self.current += 1
            return result
        raise StopIteration

squares_iter = SquareIterator(1000000)  # 也只占用很少内存
```

## 最佳实践

### 1. 实现可迭代对象而不是迭代器

```python
# 推荐：实现可迭代对象
class MyRange:
    def __init__(self, start, end):
        self.start = start
        self.end = end
    
    def __iter__(self):
        return MyRangeIterator(self.start, self.end)

class MyRangeIterator:
    def __init__(self, start, end):
        self.current = start
        self.end = end
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.current < self.end:
            result = self.current
            self.current += 1
            return result
        raise StopIteration

# 这样可以多次迭代
my_range = MyRange(0, 5)
list1 = list(my_range)
list2 = list(my_range)  # 可以再次迭代
```

### 2. 使用生成器简化代码

对于简单的迭代逻辑，优先使用生成器：

```python
# 复杂的迭代器类
class RangeIterator:
    def __init__(self, start, end):
        self.current = start
        self.end = end
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.current < self.end:
            result = self.current
            self.current += 1
            return result
        raise StopIteration

# 简洁的生成器
def range_generator(start, end):
    current = start
    while current < end:
        yield current
        current += 1
```

### 3. 资源清理

```python
class FileLineIterator:
    def __init__(self, filename):
        self.filename = filename
        self.file = None
    
    def __iter__(self):
        self.file = open(self.filename, 'r')
        return self
    
    def __next__(self):
        line = self.file.readline()
        if line:
            return line.strip()
        else:
            self.file.close()
            raise StopIteration
    
    def __del__(self):
        # 确保文件被关闭
        if self.file and not self.file.closed:
            self.file.close()
```

## 总结

迭代器是 Python 中处理序列数据的基础机制，它具有以下优势：

### 核心优势
- ✅ **内存高效**：惰性计算，按需生成
- ✅ **统一接口**：通过协议统一各种容器的遍历方式
- ✅ **灵活强大**：可以实现各种自定义遍历逻辑
- ✅ **支持无限序列**：可以表示无限长的数据流

### 关键要点
1. 理解迭代器协议（`__iter__` 和 `__next__`）
2. 区分可迭代对象和迭代器
3. 善用内置的迭代器工具
4. 对于简单场景优先使用生成器
5. 注意资源管理和清理

理解迭代器对于掌握 Python 的高级特性非常重要，它是生成器、列表推导式等特性的基础。

---

*最后更新: 2025年10月*
