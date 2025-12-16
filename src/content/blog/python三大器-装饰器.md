---
title: "Python三大器之装饰器：优雅的函数增强利器"
description: "全面讲解Python装饰器的原理、使用方法和实战应用，掌握@语法糖和高阶函数的强大功能"
pubDate: 2025-10-17
tags: ["Python", "装饰器", "编程基础", "设计模式"]
---

# Python三大器之装饰器：优雅的函数增强利器

Python 装饰器是一种特殊的语法，用于在不修改原函数代码的情况下，为函数添加额外的功能。装饰器本质上是一个接受函数作为参数并返回一个新函数的高阶函数。装饰器使用 `@decorator_name` 语法糖来应用。

## 装饰器的特点

### 1. 不修改原函数

装饰器可以在不改变原函数代码的情况下增强函数功能。

### 2. 可复用性

同一个装饰器可以应用到多个函数上，提高代码复用性。

### 3. 链式调用

可以同时应用多个装饰器，形成装饰器链。

### 4. 语法糖

使用 `@` 符号提供了简洁优雅的语法。

## 创建装饰器的方式

### 1. 基本装饰器

```python
def my_decorator(func):
    def wrapper():
        print("函数执行前的操作")
        func()  # 调用原函数
        print("函数执行后的操作")
    return wrapper

@my_decorator
def say_hello():
    print("Hello!")

say_hello()
# 输出：
# 函数执行前的操作
# Hello!
# 函数执行后的操作

# 等价于：say_hello = my_decorator(say_hello)
```

### 2. 装饰带参数的函数

使用 `*args` 和 `**kwargs` 来处理任意参数：

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"调用函数: {func.__name__}")
        print(f"参数: args={args}, kwargs={kwargs}")
        result = func(*args, **kwargs)
        print(f"返回值: {result}")
        return result
    return wrapper

@my_decorator
def add(a, b):
    return a + b

@my_decorator
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

result1 = add(3, 5)  # 输出调用信息，返回 8
result2 = greet("Alice", greeting="Hi")  # 输出调用信息
```

### 3. 带参数的装饰器

装饰器本身可以接受参数：

```python
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def say_hi():
    print("Hi!")

say_hi()
# 输出：
# Hi!
# Hi!
# Hi!
```

### 4. 使用 functools.wraps 保留原函数元数据

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)  # 保留原函数的名称、文档字符串等元数据
    def wrapper(*args, **kwargs):
        print("装饰器执行")
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def example_function():
    """这是一个示例函数"""
    pass

print(example_function.__name__)  # 输出：example_function（而不是 wrapper）
print(example_function.__doc__)   # 输出：这是一个示例函数
```

### 5. 类装饰器

使用类来实现装饰器：

```python
class CountCalls:
    def __init__(self, func):
        self.func = func
        self.count = 0
    
    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"函数 {self.func.__name__} 被调用了 {self.count} 次")
        return self.func(*args, **kwargs)

@CountCalls
def say_hello():
    print("Hello!")

say_hello()  # 输出：函数 say_hello 被调用了 1 次
say_hello()  # 输出：函数 say_hello 被调用了 2 次
```

### 6. 多个装饰器的叠加使用

```python
def decorator1(func):
    def wrapper(*args, **kwargs):
        print("装饰器1 - 前")
        result = func(*args, **kwargs)
        print("装饰器1 - 后")
        return result
    return wrapper

def decorator2(func):
    def wrapper(*args, **kwargs):
        print("装饰器2 - 前")
        result = func(*args, **kwargs)
        print("装饰器2 - 后")
        return result
    return wrapper

@decorator1
@decorator2
def my_function():
    print("原函数执行")

my_function()
# 输出：
# 装饰器1 - 前
# 装饰器2 - 前
# 原函数执行
# 装饰器2 - 后
# 装饰器1 - 后

# 执行顺序：从下往上装饰，从上往下执行
```

## 常见的装饰器应用场景

### 1. 计时装饰器

```python
import time
from functools import wraps

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} 执行时间: {end_time - start_time:.4f} 秒")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    print("函数执行完成")

slow_function()  # 会显示执行时间
```

### 2. 日志装饰器

```python
import logging
from functools import wraps
from datetime import datetime

logging.basicConfig(level=logging.INFO)

def log(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        logging.info(f"[{datetime.now()}] 调用函数: {func.__name__}")
        logging.info(f"[{datetime.now()}] 参数: args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logging.info(f"[{datetime.now()}] 返回值: {result}")
            return result
        except Exception as e:
            logging.error(f"[{datetime.now()}] 异常: {e}")
            raise
    return wrapper

@log
def divide(a, b):
    return a / b

divide(10, 2)  # 正常执行，记录日志
# divide(10, 0)  # 抛出异常，记录异常日志
```

### 3. 缓存装饰器

```python
from functools import wraps

def cache(func):
    cached_results = {}
    
    @wraps(func)
    def wrapper(*args):
        if args in cached_results:
            print(f"从缓存中获取结果: {args}")
            return cached_results[args]
        result = func(*args)
        cached_results[args] = result
        return result
    return wrapper

@cache
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))  # 第一次计算
print(fibonacci(10))  # 从缓存获取

# Python内置的缓存装饰器
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci_cached(n):
    if n < 2:
        return n
    return fibonacci_cached(n-1) + fibonacci_cached(n-2)
```

### 4. 权限检查装饰器

```python
from functools import wraps

def require_auth(func):
    @wraps(func)
    def wrapper(user, *args, **kwargs):
        if not user.get('is_authenticated'):
            print("错误：需要登录")
            return None
        return func(user, *args, **kwargs)
    return wrapper

def require_role(role):
    def decorator(func):
        @wraps(func)
        def wrapper(user, *args, **kwargs):
            if user.get('role') != role:
                print(f"错误：需要 {role} 权限")
                return None
            return func(user, *args, **kwargs)
        return wrapper
    return decorator

@require_auth
def view_profile(user):
    print(f"查看用户资料: {user['name']}")

@require_role('admin')
def delete_account(user):
    print(f"删除用户账户: {user['name']}")

user1 = {'name': 'Alice', 'is_authenticated': True, 'role': 'admin'}
user2 = {'name': 'Bob', 'is_authenticated': False, 'role': 'user'}

view_profile(user1)  # 成功执行
view_profile(user2)  # 提示需要登录
delete_account(user1)  # 成功执行
```

### 5. 重试装饰器

```python
import time
from functools import wraps

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts >= max_attempts:
                        print(f"重试{max_attempts}次后仍然失败")
                        raise
                    print(f"第{attempts}次尝试失败: {e}, {delay}秒后重试...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2)
def unstable_function():
    import random
    if random.random() < 0.7:  # 70%概率失败
        raise Exception("随机失败")
    return "成功"

# result = unstable_function()
```

### 6. 限流装饰器

```python
import time
from functools import wraps
from collections import deque

def rate_limit(calls=5, period=60):
    """限制函数在period秒内最多调用calls次"""
    def decorator(func):
        timestamps = deque(maxlen=calls)
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            
            # 清理过期的时间戳
            while timestamps and now - timestamps[0] > period:
                timestamps.popleft()
            
            # 检查是否超过限制
            if len(timestamps) >= calls:
                wait_time = period - (now - timestamps[0])
                raise Exception(f"请求过于频繁，请等待 {wait_time:.1f} 秒")
            
            timestamps.append(now)
            return func(*args, **kwargs)
        return wrapper
    return decorator

@rate_limit(calls=3, period=10)
def api_call():
    print("API调用成功")
    return "数据"

# 测试
# for i in range(5):
#     try:
#         api_call()
#     except Exception as e:
#         print(f"错误: {e}")
#     time.sleep(2)
```

### 7. 参数验证装饰器

```python
from functools import wraps

def validate_types(**type_checks):
    """验证参数类型"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 获取函数参数名
            import inspect
            sig = inspect.signature(func)
            bound_args = sig.bind(*args, **kwargs)
            bound_args.apply_defaults()
            
            # 验证类型
            for param_name, expected_type in type_checks.items():
                if param_name in bound_args.arguments:
                    value = bound_args.arguments[param_name]
                    if not isinstance(value, expected_type):
                        raise TypeError(
                            f"参数 {param_name} 应该是 {expected_type.__name__} 类型，"
                            f"但得到了 {type(value).__name__}"
                        )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

@validate_types(x=int, y=int)
def add(x, y):
    return x + y

print(add(1, 2))      # 正常执行
# print(add(1, "2"))  # 抛出 TypeError
```

### 8. 单例装饰器

```python
from functools import wraps

def singleton(cls):
    """单例模式装饰器"""
    instances = {}
    
    @wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    
    return get_instance

@singleton
class Database:
    def __init__(self):
        print("初始化数据库连接")
        self.connection = "数据库连接"

# 测试
db1 = Database()  # 输出：初始化数据库连接
db2 = Database()  # 不输出，使用已有实例
print(db1 is db2)  # True
```

### 9. 调试装饰器

```python
from functools import wraps
import sys

def debug(func):
    """打印函数调用的详细信息"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # 打印调用信息
        args_repr = [repr(a) for a in args]
        kwargs_repr = [f"{k}={v!r}" for k, v in kwargs.items()]
        signature = ", ".join(args_repr + kwargs_repr)
        print(f"调用 {func.__name__}({signature})")
        
        # 执行函数
        result = func(*args, **kwargs)
        
        # 打印返回值
        print(f"{func.__name__}() 返回 {result!r}")
        return result
    return wrapper

@debug
def make_greeting(name, age=None):
    if age is None:
        return f"你好, {name}!"
    else:
        return f"你好, {name}! 你{age}岁了。"

make_greeting("Alice")
make_greeting("Bob", age=25)
```

### 10. 废弃警告装饰器

```python
import warnings
from functools import wraps

def deprecated(reason="此函数已废弃", version=""):
    """标记函数为废弃状态"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            message = f"{func.__name__} 已废弃"
            if version:
                message += f" (自版本 {version})"
            message += f". {reason}"
            warnings.warn(message, DeprecationWarning, stacklevel=2)
            return func(*args, **kwargs)
        return wrapper
    return decorator

@deprecated(reason="请使用 new_function() 代替", version="2.0")
def old_function():
    print("这是旧函数")

# old_function()  # 会显示警告
```

## 装饰器的执行时机

```python
print("模块加载开始")

def decorator(func):
    print(f"装饰器应用于 {func.__name__}")
    def wrapper():
        print(f"包装器调用 {func.__name__}")
        return func()
    return wrapper

@decorator
def function1():
    print("function1 执行")

@decorator
def function2():
    print("function2 执行")

print("模块加载结束")

# 输出：
# 模块加载开始
# 装饰器应用于 function1
# 装饰器应用于 function2
# 模块加载结束

# 装饰器在导入时就执行（函数定义时），而不是在调用时
```

## 最佳实践

### 1. 始终使用 @wraps

```python
from functools import wraps

# 不好：丢失原函数信息
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

# 好：保留原函数信息
def good_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

### 2. 装饰器应该是通用的

```python
# 不好：只能装饰特定签名的函数
def bad_decorator(func):
    def wrapper(x, y):
        return func(x, y)
    return wrapper

# 好：可以装饰任意函数
def good_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

### 3. 装饰器应该是可配置的

```python
# 好的可配置装饰器
def configurable_decorator(config_param='default'):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 使用 config_param
            print(f"配置: {config_param}")
            return func(*args, **kwargs)
        return wrapper
    return decorator

@configurable_decorator(config_param='custom')
def my_function():
    pass
```

### 4. 处理装饰器的副作用

```python
def safe_decorator(func):
    """处理异常的装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f"捕获异常: {e}")
            # 可以选择重新抛出或返回默认值
            raise
    return wrapper
```

## 应用场景总结

装饰器适用于以下场景：

- 📝 **日志记录**：记录函数的调用、参数和返回值
- ⏱️ **性能测试**：测量函数执行时间
- 🔐 **权限验证**：检查用户权限
- 💾 **缓存**：缓存函数结果以提高性能
- ✅ **输入验证**：验证函数参数的有效性
- 🔄 **重试机制**：自动重试失败的函数调用
- 💳 **事务处理**：数据库事务的自动提交和回滚
- 🚦 **限流**：限制函数调用频率
- 🐛 **调试**：打印函数调用信息
- ⚠️ **废弃警告**：标记过时的函数

## 总结

装饰器是 Python 中非常强大且优雅的特性，它具有以下优势：

### 核心优势
- ✅ **不修改原函数**：遵循开闭原则（对扩展开放，对修改关闭）
- ✅ **代码复用**：同一个装饰器可应用于多个函数
- ✅ **关注点分离**：将横切关注点（如日志、缓存）与业务逻辑分离
- ✅ **可组合性**：多个装饰器可以链式组合
- ✅ **语法优雅**：@语法糖使代码更清晰易读

### 关键要点
1. 装饰器本质是高阶函数
2. 理解装饰器的执行时机（定义时）
3. 使用 `@wraps` 保留原函数元数据
4. 设计通用的、可配置的装饰器
5. 注意装饰器的顺序和组合

掌握装饰器将让你的 Python 代码更加模块化、可维护和优雅！

---

*最后更新: 2025年10月*
