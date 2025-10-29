---
title: "Celery完全指南：Python分布式任务队列深度解析"
description: "全面讲解Celery的核心概念、工作原理、使用场景、配置优化和最佳实践，帮助你掌握Python异步任务处理"
publishDate: 2025-10-23
tags: ["Python", "Celery", "异步任务", "消息队列", "分布式系统"]
---

# Celery完全指南：Python分布式任务队列深度解析

## 什么是Celery？

Celery是一个基于分布式消息传递的异步任务队列/作业队列，它专注于实时处理，同时也支持任务调度。

### 核心特点

- ⚡ **异步执行**：将耗时任务放到后台执行，立即返回响应
- 📊 **分布式**：支持多个worker并行处理任务
- 🔄 **定时任务**：类似Linux的crontab，支持周期性任务
- 💪 **高可用**：支持失败重试、任务结果持久化
- 🔌 **灵活**：支持多种消息代理（RabbitMQ、Redis等）

### 为什么需要Celery？

在Web应用中，有些操作非常耗时：

```python
# 问题：这些操作会阻塞请求
def send_email_view(request):
    # 发送邮件可能需要3-5秒
    send_email(to='user@example.com', subject='Welcome')
    return JsonResponse({'status': 'ok'})

def generate_report_view(request):
    # 生成报表可能需要30秒甚至更长
    report = generate_large_report()
    return JsonResponse({'report': report})
```

使用Celery后：

```python
# 解决方案：异步执行，立即返回
@celery.task
def send_email_task(to, subject):
    send_email(to=to, subject=subject)

def send_email_view(request):
    # 将任务发送到队列，立即返回
    send_email_task.delay(to='user@example.com', subject='Welcome')
    return JsonResponse({'status': 'pending'})
```

## Celery架构和组件

### 核心组件

```
┌─────────────┐
│  Producer   │  生产者（Django/Flask等Web应用）
│ (发送任务)  │
└──────┬──────┘
       │ 发送任务
       ▼
┌─────────────┐
│   Broker    │  消息代理（RabbitMQ/Redis）
│ (消息队列)  │
└──────┬──────┘
       │ 获取任务
       ▼
┌─────────────┐
│   Worker    │  工作节点（执行任务）
│  (消费者)   │
└──────┬──────┘
       │ 存储结果
       ▼
┌─────────────┐
│   Backend   │  结果后端（Redis/数据库）
│ (存储结果)  │
└─────────────┘
```

#### 1. Producer（生产者）
- 发送任务到队列的应用程序
- 通常是Web应用（Django、Flask等）

#### 2. Broker（消息代理）
- 存储和传递任务消息
- 常用的Broker：
  - **RabbitMQ**：功能完善，推荐生产环境使用
  - **Redis**：简单易用，适合中小型应用
  - Amazon SQS、Kafka等

#### 3. Worker（工作节点）
- 执行任务的进程
- 可以启动多个worker实现并行处理
- 支持多种并发模型（多进程、线程、协程）

#### 4. Backend（结果后端）
- 存储任务执行结果
- 支持Redis、数据库、MongoDB等

## 快速开始

### 安装

```bash
# 基础安装
pip install celery

# 使用Redis作为broker和backend
pip install celery[redis]

# 使用RabbitMQ
pip install celery[amqp]

# 安装所有依赖
pip install "celery[redis,msgpack,auth,amqp]"
```

### 最简单的示例

#### 1. 创建Celery应用

```python
# celery_app.py
from celery import Celery

# 创建Celery实例
app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

# 定义任务
@app.task
def add(x, y):
    return x + y

@app.task
def multiply(x, y):
    return x * y
```

#### 2. 启动Worker

```bash
# 启动worker
celery -A celery_app worker --loglevel=info

# 在Windows上需要使用eventlet
celery -A celery_app worker --loglevel=info --pool=solo
```

#### 3. 调用任务

```python
# main.py
from celery_app import add, multiply

# 异步调用
result = add.delay(4, 6)

# 获取任务ID
print(f"Task ID: {result.id}")

# 检查任务状态
print(f"Status: {result.status}")

# 等待结果（会阻塞）
print(f"Result: {result.get(timeout=10)}")

# 不等待结果，立即返回
result = multiply.delay(3, 7)
print("Task sent!")
```

## 核心概念详解

### 1. 任务（Task）

#### 基本任务定义

```python
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379')

# 最简单的任务
@app.task
def simple_task():
    return "Hello, Celery!"

# 带参数的任务
@app.task
def send_email(to, subject, body):
    # 发送邮件的逻辑
    print(f"Sending email to {to}")
    return f"Email sent to {to}"
```

#### 任务选项配置

```python
@app.task(
    name='tasks.send_notification',  # 任务名称
    bind=True,                        # 绑定实例，可以访问self
    max_retries=3,                    # 最大重试次数
    default_retry_delay=60,           # 重试延迟（秒）
    acks_late=True,                   # 任务完成后才确认
    reject_on_worker_lost=True,       # worker丢失时拒绝任务
    time_limit=300,                   # 硬性时间限制（秒）
    soft_time_limit=240,              # 软时间限制（秒）
)
def send_notification(self, user_id):
    try:
        # 执行任务
        result = notify_user(user_id)
        return result
    except Exception as exc:
        # 重试任务
        raise self.retry(exc=exc, countdown=60)
```

#### 任务类（Class-based Tasks）

```python
from celery import Task

class CallbackTask(Task):
    """支持回调的任务基类"""
    
    def on_success(self, retval, task_id, args, kwargs):
        """任务成功时的回调"""
        print(f'Task {task_id} succeeded: {retval}')
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """任务失败时的回调"""
        print(f'Task {task_id} failed: {exc}')
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """任务重试时的回调"""
        print(f'Task {task_id} retrying: {exc}')

@app.task(base=CallbackTask)
def important_task(data):
    # 处理重要任务
    return process_data(data)
```

### 2. 任务调用方式

```python
from celery_app import add, send_email

# 方式1：delay() - 最常用
result = add.delay(4, 6)

# 方式2：apply_async() - 更多选项
result = add.apply_async(
    args=(4, 6),
    countdown=10,              # 10秒后执行
    expires=3600,              # 1小时后过期
    retry=True,                # 允许重试
    retry_policy={
        'max_retries': 3,
        'interval_start': 0,
        'interval_step': 0.2,
        'interval_max': 0.2,
    },
    priority=5,                # 优先级（0-9，9最高）
    queue='high_priority',     # 指定队列
)

# 方式3：直接调用 - 同步执行（不推荐）
result = add(4, 6)

# 发送到特定队列
send_email.apply_async(
    args=('user@example.com', 'Hello', 'Welcome!'),
    queue='email_queue'
)

# 设置ETA（指定时间执行）
from datetime import datetime, timedelta

eta = datetime.utcnow() + timedelta(hours=1)
add.apply_async(args=(4, 6), eta=eta)
```

### 3. 任务结果

```python
# 发送任务
result = add.delay(4, 6)

# 检查状态
print(result.ready())      # 是否完成
print(result.successful()) # 是否成功
print(result.failed())     # 是否失败

# 获取结果（阻塞等待）
try:
    value = result.get(timeout=10)
    print(f"Result: {value}")
except TimeoutError:
    print("Task timed out")
except Exception as e:
    print(f"Task failed: {e}")

# 不传播异常
value = result.get(propagate=False)

# 获取任务信息
print(result.id)           # 任务ID
print(result.status)       # 任务状态
print(result.traceback)    # 错误堆栈
```

### 4. 任务状态

Celery任务有以下几种状态：

- **PENDING**：任务等待执行
- **STARTED**：任务已开始执行
- **SUCCESS**：任务成功完成
- **FAILURE**：任务执行失败
- **RETRY**：任务将被重试
- **REVOKED**：任务被撤销

```python
from celery.result import AsyncResult

# 通过任务ID获取结果
result = AsyncResult(task_id, app=app)

# 检查状态
if result.state == 'PENDING':
    response = {'state': 'PENDING', 'status': 'Task is waiting...'}
elif result.state == 'SUCCESS':
    response = {'state': 'SUCCESS', 'result': result.result}
elif result.state == 'FAILURE':
    response = {'state': 'FAILURE', 'error': str(result.info)}
```

## 常见使用场景

### 1. 发送邮件

```python
@app.task(bind=True, max_retries=3)
def send_email_task(self, to, subject, body):
    """异步发送邮件"""
    try:
        import smtplib
        from email.mime.text import MIMEText
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = 'noreply@example.com'
        msg['To'] = to
        
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login('user@example.com', 'password')
            server.send_message(msg)
        
        return f"Email sent to {to}"
    except Exception as exc:
        # 60秒后重试
        raise self.retry(exc=exc, countdown=60)

# 使用
send_email_task.delay('user@example.com', 'Welcome', 'Hello!')
```

### 2. 图片处理

```python
from PIL import Image
import os

@app.task
def resize_image(image_path, width, height):
    """调整图片大小"""
    img = Image.open(image_path)
    img = img.resize((width, height), Image.LANCZOS)
    
    # 保存处理后的图片
    filename, ext = os.path.splitext(image_path)
    new_path = f"{filename}_resized{ext}"
    img.save(new_path)
    
    return new_path

@app.task
def generate_thumbnails(image_path):
    """生成多个缩略图"""
    sizes = [(100, 100), (200, 200), (400, 400)]
    thumbnails = []
    
    for width, height in sizes:
        thumb_path = resize_image(image_path, width, height)
        thumbnails.append(thumb_path)
    
    return thumbnails
```

### 3. 数据处理和报表生成

```python
import pandas as pd

@app.task
def generate_sales_report(start_date, end_date):
    """生成销售报表"""
    # 从数据库查询数据
    data = fetch_sales_data(start_date, end_date)
    
    # 使用pandas处理数据
    df = pd.DataFrame(data)
    
    # 统计分析
    summary = {
        'total_sales': df['amount'].sum(),
        'average_order': df['amount'].mean(),
        'order_count': len(df),
        'top_products': df.groupby('product')['amount'].sum().nlargest(10).to_dict()
    }
    
    # 生成Excel报表
    report_path = f'/reports/sales_{start_date}_{end_date}.xlsx'
    df.to_excel(report_path, index=False)
    
    return {
        'summary': summary,
        'report_path': report_path
    }
```

### 4. 爬虫任务

```python
import requests
from bs4 import BeautifulSoup

@app.task(bind=True, max_retries=5)
def crawl_website(self, url):
    """爬取网站内容"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 提取信息
        title = soup.find('h1').text if soup.find('h1') else 'No title'
        links = [a['href'] for a in soup.find_all('a', href=True)]
        
        return {
            'url': url,
            'title': title,
            'links_count': len(links),
            'links': links[:10]  # 只返回前10个链接
        }
    except Exception as exc:
        # 指数退避重试
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

### 5. 视频处理

```python
import subprocess

@app.task
def convert_video(input_path, output_format='mp4'):
    """转换视频格式"""
    output_path = input_path.rsplit('.', 1)[0] + f'.{output_format}'
    
    # 使用ffmpeg转换
    command = [
        'ffmpeg',
        '-i', input_path,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        output_path
    ]
    
    subprocess.run(command, check=True)
    
    return output_path

@app.task
def extract_thumbnail(video_path, time='00:00:01'):
    """提取视频缩略图"""
    thumbnail_path = video_path.rsplit('.', 1)[0] + '_thumb.jpg'
    
    command = [
        'ffmpeg',
        '-i', video_path,
        '-ss', time,
        '-vframes', '1',
        thumbnail_path
    ]
    
    subprocess.run(command, check=True)
    
    return thumbnail_path
```

## 定时任务（Celery Beat）

### 基本配置

```python
from celery import Celery
from celery.schedules import crontab

app = Celery('tasks', broker='redis://localhost:6379')

# 配置定时任务
app.conf.beat_schedule = {
    # 每30秒执行一次
    'add-every-30-seconds': {
        'task': 'tasks.add',
        'schedule': 30.0,
        'args': (16, 16)
    },
    
    # 每天早上7:30执行
    'send-daily-report': {
        'task': 'tasks.send_daily_report',
        'schedule': crontab(hour=7, minute=30),
    },
    
    # 每周一早上8:00执行
    'weekly-cleanup': {
        'task': 'tasks.cleanup_old_data',
        'schedule': crontab(hour=8, minute=0, day_of_week=1),
    },
    
    # 每小时执行一次
    'hourly-sync': {
        'task': 'tasks.sync_data',
        'schedule': crontab(minute=0),
    },
    
    # 每个月1号凌晨执行
    'monthly-billing': {
        'task': 'tasks.generate_monthly_bill',
        'schedule': crontab(hour=0, minute=0, day_of_month=1),
    },
}

app.conf.timezone = 'Asia/Shanghai'
```

### 启动Beat调度器

```bash
# 启动worker
celery -A celery_app worker --loglevel=info

# 启动beat调度器
celery -A celery_app beat --loglevel=info

# 或者在一个命令中启动（适合开发环境）
celery -A celery_app worker --beat --loglevel=info
```

### crontab表达式

```python
from celery.schedules import crontab

# 每分钟执行
schedule=crontab()

# 每小时的第15分钟执行
schedule=crontab(minute=15)

# 每天早上8:00执行
schedule=crontab(hour=8, minute=0)

# 每周一早上8:00执行
schedule=crontab(hour=8, minute=0, day_of_week=1)

# 每个月1号执行
schedule=crontab(hour=0, minute=0, day_of_month=1)

# 每隔15分钟执行
schedule=crontab(minute='*/15')

# 工作日每小时执行
schedule=crontab(minute=0, hour='*', day_of_week='1-5')

# 多个时间点执行
schedule=crontab(minute=0, hour='*/3')  # 每3小时执行
```

## 高级特性

### 1. 任务链（Chain）

任务按顺序依次执行，前一个任务的结果作为后一个任务的输入：

```python
from celery import chain

@app.task
def add(x, y):
    return x + y

@app.task
def multiply(x, y):
    return x * y

# 创建任务链：(4 + 4) * 8
result = chain(
    add.s(4, 4),
    multiply.s(8)
).apply_async()

# 简写形式
result = (add.s(4, 4) | multiply.s(8))()

print(result.get())  # 64
```

### 2. 任务组（Group）

多个任务并行执行：

```python
from celery import group

@app.task
def add(x, y):
    return x + y

# 并行执行多个任务
job = group([
    add.s(2, 2),
    add.s(4, 4),
    add.s(8, 8),
    add.s(16, 16),
])

result = job.apply_async()
print(result.get())  # [4, 8, 16, 32]
```

### 3. 和弦（Chord）

先并行执行多个任务，然后将结果传给回调函数：

```python
from celery import chord

@app.task
def add(x, y):
    return x + y

@app.task
def sum_results(results):
    return sum(results)

# 先并行执行加法，然后求和
result = chord([
    add.s(2, 2),
    add.s(4, 4),
    add.s(8, 8),
])(sum_results.s())

print(result.get())  # 28 (4 + 8 + 16)
```

### 4. 任务映射（Map）

对列表中的每个元素执行相同的任务：

```python
from celery import group

@app.task
def square(x):
    return x * x

# 对每个数字求平方
numbers = [1, 2, 3, 4, 5]
job = group(square.s(i) for i in numbers)
result = job.apply_async()

print(result.get())  # [1, 4, 9, 16, 25]
```

### 5. 任务取消和撤销

```python
# 发送任务
result = long_running_task.delay()

# 撤销任务
result.revoke()

# 强制终止（如果任务已经在执行）
result.revoke(terminate=True)

# 撤销任务并从队列中移除
result.revoke(terminate=True, signal='SIGKILL')

# 检查是否被撤销
if result.state == 'REVOKED':
    print("Task was revoked")
```

### 6. 任务进度更新

```python
@app.task(bind=True)
def process_large_file(self, file_path):
    """处理大文件并更新进度"""
    total_lines = count_lines(file_path)
    
    with open(file_path) as f:
        for i, line in enumerate(f):
            # 处理每一行
            process_line(line)
            
            # 更新进度
            if i % 100 == 0:
                self.update_state(
                    state='PROGRESS',
                    meta={
                        'current': i,
                        'total': total_lines,
                        'percent': int(i / total_lines * 100)
                    }
                )
    
    return {'status': 'completed', 'lines_processed': total_lines}

# 查询进度
from celery.result import AsyncResult

result = AsyncResult(task_id, app=app)
if result.state == 'PROGRESS':
    info = result.info
    print(f"Progress: {info['percent']}%")
```

## 与Web框架集成

### Django集成

#### 1. 安装和配置

```bash
pip install celery django-celery-results django-celery-beat
```

```python
# myproject/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

app = Celery('myproject')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# myproject/__init__.py
from .celery import app as celery_app

__all__ = ('celery_app',)
```

#### 2. Django settings配置

```python
# settings.py

# Celery配置
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/1'

# 或使用django-celery-results存储结果
CELERY_RESULT_BACKEND = 'django-db'

# 时区
CELERY_TIMEZONE = 'Asia/Shanghai'

# 任务序列化
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']

# 任务结果过期时间（秒）
CELERY_RESULT_EXPIRES = 3600

# 任务路由
CELERY_TASK_ROUTES = {
    'myapp.tasks.send_email': {'queue': 'email'},
    'myapp.tasks.process_image': {'queue': 'image'},
}

# 安装apps
INSTALLED_APPS = [
    ...
    'django_celery_results',
    'django_celery_beat',
]
```

#### 3. 创建任务

```python
# myapp/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from .models import User

@shared_task
def send_welcome_email(user_id):
    """发送欢迎邮件"""
    user = User.objects.get(id=user_id)
    send_mail(
        'Welcome!',
        f'Hello {user.username}, welcome to our site!',
        'noreply@example.com',
        [user.email],
    )
    return f"Email sent to {user.email}"

@shared_task
def cleanup_old_sessions():
    """清理过期的会话"""
    from django.contrib.sessions.models import Session
    Session.objects.filter(expire_date__lt=timezone.now()).delete()
```

#### 4. 在视图中调用

```python
# myapp/views.py
from django.shortcuts import render
from django.http import JsonResponse
from .tasks import send_welcome_email

def register(request):
    # 处理用户注册
    user = create_user(request.POST)
    
    # 异步发送欢迎邮件
    send_welcome_email.delay(user.id)
    
    return JsonResponse({'status': 'success'})

def check_task_status(request, task_id):
    """检查任务状态"""
    from celery.result import AsyncResult
    result = AsyncResult(task_id)
    
    return JsonResponse({
        'state': result.state,
        'result': result.result if result.ready() else None
    })
```

### Flask集成

```python
# app.py
from flask import Flask
from celery import Celery

def make_celery(app):
    celery = Celery(
        app.import_name,
        broker=app.config['CELERY_BROKER_URL'],
        backend=app.config['CELERY_RESULT_BACKEND']
    )
    celery.conf.update(app.config)
    
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery

app = Flask(__name__)
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/1'

celery = make_celery(app)

@celery.task
def send_email(to, subject, body):
    # 发送邮件
    pass

@app.route('/send-email')
def send_email_route():
    send_email.delay('user@example.com', 'Hello', 'World')
    return 'Email task sent!'
```

## 性能优化

### 1. Worker并发配置

```bash
# 多进程模式（默认，CPU密集型任务）
celery -A myapp worker --concurrency=4

# 协程模式（IO密集型任务，推荐）
celery -A myapp worker --pool=gevent --concurrency=100

# 线程模式
celery -A myapp worker --pool=threads --concurrency=10

# 单线程模式（Windows）
celery -A myapp worker --pool=solo
```

### 2. 任务优先级

```python
# 配置不同优先级的队列
app.conf.task_routes = {
    'tasks.critical_task': {'queue': 'critical', 'priority': 10},
    'tasks.high_task': {'queue': 'high', 'priority': 7},
    'tasks.normal_task': {'queue': 'normal', 'priority': 5},
    'tasks.low_task': {'queue': 'low', 'priority': 3},
}

# 启动worker时指定队列
celery -A myapp worker -Q critical,high,normal,low
```

### 3. 任务批处理

```python
@app.task
def process_item(item):
    # 处理单个项目
    pass

# 不好：为每个项目创建一个任务
for item in items:
    process_item.delay(item)  # 创建1000个任务

# 好：批量处理
@app.task
def process_items_batch(items):
    for item in items:
        process_item_logic(item)

# 分批发送
batch_size = 100
for i in range(0, len(items), batch_size):
    batch = items[i:i+batch_size]
    process_items_batch.delay(batch)  # 只创建10个任务
```

### 4. 结果过期策略

```python
# 配置结果过期时间
app.conf.result_expires = 3600  # 1小时后过期

# 不需要结果的任务
@app.task(ignore_result=True)
def log_action(action):
    logger.info(f"Action: {action}")

# 使用后立即清理结果
result = task.delay()
value = result.get()
result.forget()  # 立即删除结果
```

### 5. 连接池优化

```python
# 配置Redis连接池
app.conf.broker_pool_limit = 10
app.conf.broker_connection_max_retries = None

# 配置result backend连接
app.conf.redis_max_connections = 50
```

## 监控和管理

### 1. Flower - Web监控工具

```bash
# 安装
pip install flower

# 启动
celery -A myapp flower --port=5555

# 访问 http://localhost:5555
```

Flower提供：
- 实时任务监控
- Worker状态查看
- 任务历史记录
- 任务撤销和重试
- 性能图表

### 2. 日志配置

```python
from celery.signals import after_setup_logger
import logging

@after_setup_logger.connect
def setup_loggers(logger, *args, **kwargs):
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 文件处理器
    fh = logging.FileHandler('celery.log')
    fh.setFormatter(formatter)
    logger.addHandler(fh)

# 任务中使用logger
@app.task(bind=True)
def my_task(self):
    self.get_logger().info('Task started')
    # 处理任务
    self.get_logger().info('Task completed')
```

### 3. 事件监控

```python
from celery import Celery

app = Celery('tasks', broker='redis://localhost:6379')

# 启用事件
app.conf.worker_send_task_events = True
app.conf.task_send_sent_event = True

# 监听事件
from celery.events import EventReceiver

def monitor_events():
    with app.connection() as connection:
        recv = EventReceiver(connection, handlers={
            'task-received': lambda event: print(f"Task received: {event}"),
            'task-started': lambda event: print(f"Task started: {event}"),
            'task-succeeded': lambda event: print(f"Task succeeded: {event}"),
            'task-failed': lambda event: print(f"Task failed: {event}"),
        })
        recv.capture(limit=None, timeout=None)
```

## 最佳实践

### 1. 任务设计原则

```python
# ✅ 好的做法：任务是幂等的
@app.task
def send_notification(user_id, message_id):
    # 检查是否已发送
    if is_already_sent(user_id, message_id):
        return "Already sent"
    
    send_notification_logic(user_id, message_id)
    mark_as_sent(user_id, message_id)

# ✅ 好的做法：任务参数简单
@app.task
def process_order(order_id):  # 只传ID
    order = Order.objects.get(id=order_id)
    # 处理订单

# ❌ 不好的做法：传递复杂对象
@app.task
def process_order(order):  # 传递整个对象
    # 对象可能包含不可序列化的内容
    pass
```

### 2. 错误处理

```python
@app.task(bind=True, max_retries=3, default_retry_delay=60)
def risky_task(self, data):
    try:
        # 可能失败的操作
        result = external_api_call(data)
        return result
    except TemporaryError as exc:
        # 临时错误，重试
        raise self.retry(exc=exc)
    except PermanentError as exc:
        # 永久错误，不重试，记录日志
        logger.error(f"Permanent error: {exc}")
        return None
    finally:
        # 清理资源
        cleanup()
```

### 3. 避免长时间运行的任务

```python
# ❌ 不好：一个任务处理所有数据
@app.task
def process_all_users():
    users = User.objects.all()  # 可能有百万条记录
    for user in users:
        process_user(user)

# ✅ 好：分批处理
@app.task
def process_users_batch(user_ids):
    users = User.objects.filter(id__in=user_ids)
    for user in users:
        process_user(user)

def schedule_user_processing():
    user_ids = User.objects.values_list('id', flat=True)
    batch_size = 100
    
    for i in range(0, len(user_ids), batch_size):
        batch = user_ids[i:i+batch_size]
        process_users_batch.delay(batch)
```

### 4. 使用合适的序列化方式

```python
# 配置序列化
app.conf.task_serializer = 'json'  # 推荐
app.conf.result_serializer = 'json'
app.conf.accept_content = ['json']

# 或使用pickle（更灵活但不安全）
app.conf.task_serializer = 'pickle'
app.conf.result_serializer = 'pickle'
app.conf.accept_content = ['pickle', 'json']
```

### 5. 任务超时设置

```python
@app.task(
    time_limit=300,        # 硬限制：5分钟后强制终止
    soft_time_limit=240,   # 软限制：4分钟后抛出异常
)
def long_running_task():
    try:
        # 长时间运行的操作
        process_data()
    except SoftTimeLimitExceeded:
        # 软超时处理
        cleanup_and_save_progress()
        raise
```

## 生产环境部署

### 1. 使用Supervisor管理进程

```ini
; /etc/supervisor/conf.d/celery.conf

[program:celery_worker]
command=/path/to/venv/bin/celery -A myapp worker --loglevel=info
directory=/path/to/project
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker.error.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600
killasgroup=true
priority=998

[program:celery_beat]
command=/path/to/venv/bin/celery -A myapp beat --loglevel=info
directory=/path/to/project
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/beat.log
stderr_logfile=/var/log/celery/beat.error.log
autostart=true
autorestart=true
startsecs=10
priority=999
```

### 2. 使用systemd管理

```ini
# /etc/systemd/system/celery.service

[Unit]
Description=Celery Worker
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/path/to/project
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/celery -A myapp worker --loglevel=info --logfile=/var/log/celery/worker.log --pidfile=/var/run/celery/worker.pid
ExecStop=/bin/kill -s TERM $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

### 3. Docker部署

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["celery", "-A", "myapp", "worker", "--loglevel=info"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  celery_worker:
    build: .
    command: celery -A myapp worker --loglevel=info
    volumes:
      - .:/app
    depends_on:
      - redis
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
  
  celery_beat:
    build: .
    command: celery -A myapp beat --loglevel=info
    volumes:
      - .:/app
    depends_on:
      - redis
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
  
  flower:
    build: .
    command: celery -A myapp flower --port=5555
    ports:
      - "5555:5555"
    depends_on:
      - redis
      - celery_worker
```

## 常见问题和解决方案

### 1. 任务重复执行

**原因**：
- Worker崩溃后任务被重新分配
- 网络问题导致任务确认失败

**解决方案**：
```python
# 使用幂等性设计
@app.task
def process_payment(payment_id):
    payment = Payment.objects.get(id=payment_id)
    if payment.status == 'processed':
        return "Already processed"
    
    # 处理支付
    payment.status = 'processed'
    payment.save()

# 使用锁机制
from redis import Redis
from redis.lock import Lock

redis_client = Redis()

@app.task
def unique_task(task_id):
    lock = Lock(redis_client, f'lock:task:{task_id}', timeout=60)
    if not lock.acquire(blocking=False):
        return "Task already running"
    
    try:
        # 执行任务
        pass
    finally:
        lock.release()
```

### 2. 任务丢失

**原因**：
- Broker宕机
- 消息未持久化

**解决方案**：
```python
# 配置消息持久化
app.conf.task_acks_late = True
app.conf.task_reject_on_worker_lost = True

# 使用RabbitMQ的持久化队列
app.conf.task_default_queue = 'default'
app.conf.task_default_exchange = 'default'
app.conf.task_default_routing_key = 'default'
app.conf.task_queue_ha_policy = 'all'
```

### 3. 内存泄漏

**原因**：
- 任务中创建的对象未释放
- 结果缓存过多

**解决方案**：
```python
# 定期重启worker
celery -A myapp worker --max-tasks-per-child=1000

# 不保存不必要的结果
@app.task(ignore_result=True)
def log_task():
    pass

# 及时清理结果
result = task.delay()
value = result.get()
result.forget()
```

## 总结

Celery是Python生态中最强大的异步任务队列系统，它能够：

### 核心优势
- ✅ 简化异步任务处理
- ✅ 提升应用响应速度
- ✅ 支持分布式处理
- ✅ 提供灵活的任务调度
- ✅ 易于扩展和维护

### 适用场景
- 📧 邮件发送
- 🖼️ 图片/视频处理
- 📊 报表生成
- 🕷️ 网络爬虫
- 📈 数据分析
- ⏰ 定时任务
- 🔄 数据同步

### 关键要点
1. **任务设计**：保持任务简单、幂等、可重试
2. **性能优化**：合理配置并发、使用批处理、设置超时
3. **监控运维**：使用Flower监控、配置日志、设置告警
4. **错误处理**：实现重试机制、记录异常、优雅降级

掌握Celery将大大提升你处理异步任务和后台作业的能力，是构建高性能Web应用的必备技能！

---

*最后更新: 2025年10月*

