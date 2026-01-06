---
title: "精通Django框架：深入理解底层机制"
description: "全面讲解Django框架的底层机制，包括ORM、中间件、信号、Admin扩展等核心组件的原理与实战应用"
pubDate: 2025-11-12
tags: ["Django", "Python", "Web框架", "ORM", "中间件", "后端开发"]
---

# 精通Django框架：深入理解底层机制

Django 是 Python 中最流行的全栈 Web 框架之一，它遵循 MTV（Model-Template-View）设计模式，提供了丰富的功能和优雅的 API。本文将深入探讨 Django 的核心底层机制。

## 一、Django ORM（对象关系映射）

Django ORM 是 Django 框架的核心组件之一，它提供了一个强大的数据库抽象层，让开发者可以使用 Python 对象来操作数据库。

### 1.1 ORM 基础原理

ORM 的核心思想是将数据库表映射为 Python 类，表中的每一行映射为类的实例，字段映射为实例属性。

```python
from django.db import models

class User(models.Model):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['username']),
        ]
```

### 1.2 查询集（QuerySet）机制

QuerySet 是 Django ORM 的核心，它采用惰性求值（Lazy Evaluation）机制。

```python
# 惰性求值：此时不会执行数据库查询
users = User.objects.filter(username__startswith='admin')

# 只有在实际使用时才会执行查询
for user in users:  # 此时才执行 SQL
    print(user.username)

# 常见查询方法
User.objects.all()  # 获取所有记录
User.objects.get(id=1)  # 获取单条记录
User.objects.filter(email__contains='@gmail.com')  # 过滤
User.objects.exclude(is_active=False)  # 排除
User.objects.order_by('-created_at')  # 排序
User.objects.values('username', 'email')  # 只获取指定字段
User.objects.values_list('username', flat=True)  # 返回列表
```

### 1.3 查询优化技巧

#### select_related 和 prefetch_related

```python
# select_related：适用于一对一和外键关系（使用 SQL JOIN）
# 一次查询获取关联数据，减少数据库访问次数
posts = Post.objects.select_related('author').all()
for post in posts:
    print(post.author.username)  # 不会产生额外查询

# prefetch_related：适用于多对多和反向外键关系（使用 IN 查询）
authors = Author.objects.prefetch_related('posts').all()
for author in authors:
    print(author.posts.all())  # 不会产生额外查询

# 嵌套预加载
posts = Post.objects.select_related('author').prefetch_related(
    'comments__user'
).all()
```

#### only 和 defer

```python
# only：只查询指定字段
users = User.objects.only('username', 'email')

# defer：延迟加载指定字段
users = User.objects.defer('description', 'profile_image')

# 注意：访问未加载的字段会触发额外查询
```

#### 批量操作

```python
# bulk_create：批量创建（单次 SQL）
users = [
    User(username=f'user{i}', email=f'user{i}@example.com')
    for i in range(1000)
]
User.objects.bulk_create(users, batch_size=100)

# bulk_update：批量更新
users = User.objects.all()[:100]
for user in users:
    user.is_active = True
User.objects.bulk_update(users, ['is_active'], batch_size=100)

# update：直接更新（不触发 save 信号）
User.objects.filter(is_active=False).update(is_active=True)

# delete：批量删除
User.objects.filter(created_at__lt='2020-01-01').delete()
```

### 1.4 原生 SQL 查询

```python
# raw：执行原生 SQL 返回模型实例
users = User.objects.raw('SELECT * FROM users WHERE username LIKE %s', ['admin%'])

# extra：添加额外 SQL 片段
User.objects.extra(
    select={'full_name': "first_name || ' ' || last_name"},
    where=['age > %s'],
    params=[18]
)

# 直接执行 SQL
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute('SELECT * FROM users WHERE id = %s', [1])
    row = cursor.fetchone()
```

### 1.5 查询表达式（Query Expressions）

```python
from django.db.models import F, Q, Count, Sum, Avg, Max, Min
from django.db.models.functions import Coalesce, Concat, Lower

# F 表达式：引用字段值
# 将价格提高 10%
Product.objects.update(price=F('price') * 1.1)

# 比较字段
User.objects.filter(login_count__gt=F('register_count'))

# Q 对象：复杂查询条件
from django.db.models import Q

# OR 查询
User.objects.filter(Q(username='admin') | Q(email='admin@example.com'))

# AND 查询
User.objects.filter(Q(is_active=True) & Q(is_staff=True))

# NOT 查询
User.objects.filter(~Q(username='guest'))

# 聚合查询
from django.db.models import Count, Avg, Sum

# 统计总数
User.objects.count()

# 聚合函数
stats = User.objects.aggregate(
    total=Count('id'),
    avg_age=Avg('age'),
    max_score=Max('score')
)

# 分组聚合
from django.db.models import Count

posts_by_author = Post.objects.values('author').annotate(
    post_count=Count('id')
).order_by('-post_count')
```

### 1.6 自定义管理器（Manager）

```python
class ActiveUserManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)
    
    def create_user(self, username, email, password):
        user = self.model(username=username, email=email)
        user.set_password(password)
        user.save(using=self._db)
        return user

class User(models.Model):
    username = models.CharField(max_length=100)
    email = models.EmailField()
    is_active = models.BooleanField(default=True)
    
    # 默认管理器
    objects = models.Manager()
    
    # 自定义管理器
    active_users = ActiveUserManager()
    
# 使用
active_users = User.active_users.all()
user = User.active_users.create_user('john', 'john@example.com', 'password')
```

### 1.7 模型继承

```python
# 1. 抽象基类（不创建数据库表）
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class Article(BaseModel):
    title = models.CharField(max_length=200)
    content = models.TextField()

# 2. 多表继承（每个模型都有独立的表）
class Place(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)

class Restaurant(Place):
    serves_pizza = models.BooleanField(default=False)
    serves_pasta = models.BooleanField(default=False)

# 3. 代理模型（使用相同的数据库表）
class PersonProxy(Person):
    class Meta:
        proxy = True
        ordering = ['name']
    
    def do_something(self):
        pass
```

### 1.8 数据库事务

```python
from django.db import transaction

# 装饰器方式
@transaction.atomic
def create_order(user, items):
    order = Order.objects.create(user=user)
    for item in items:
        OrderItem.objects.create(order=order, **item)
    return order

# 上下文管理器方式
def transfer_money(from_account, to_account, amount):
    with transaction.atomic():
        from_account.balance -= amount
        from_account.save()
        
        to_account.balance += amount
        to_account.save()

# 设置保存点
from django.db import transaction

def complex_operation():
    with transaction.atomic():
        # 创建保存点
        sid = transaction.savepoint()
        
        try:
            # 执行一些操作
            User.objects.create(username='test')
        except Exception:
            # 回滚到保存点
            transaction.savepoint_rollback(sid)
        else:
            # 提交保存点
            transaction.savepoint_commit(sid)
```

## 二、Django 中间件（Middleware）

中间件是 Django 请求/响应处理的钩子框架，它是一个轻量级的、底层的"插件"系统，用于全局改变 Django 的输入或输出。

### 2.1 中间件执行流程

```
请求 → SecurityMiddleware
     → SessionMiddleware
     → CommonMiddleware
     → CsrfViewMiddleware
     → AuthenticationMiddleware
     → MessageMiddleware
     → [View]
     ← MessageMiddleware
     ← AuthenticationMiddleware
     ← CsrfViewMiddleware
     ← CommonMiddleware
     ← SessionMiddleware
     ← SecurityMiddleware
← 响应
```

### 2.2 自定义中间件

```python
# middleware.py

# 函数式中间件（Django 1.10+）
def simple_middleware(get_response):
    # 一次性配置和初始化（服务器启动时执行）
    
    def middleware(request):
        # 在视图和后续中间件执行前的代码
        print('Before view')
        
        # 调用下一个中间件或视图
        response = get_response(request)
        
        # 在视图执行后的代码
        print('After view')
        
        return response
    
    return middleware

# 类式中间件（更灵活）
class CustomMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # 一次性配置和初始化
    
    def __call__(self, request):
        # 请求处理前
        request.custom_attribute = 'custom_value'
        
        response = self.get_response(request)
        
        # 响应处理后
        response['X-Custom-Header'] = 'Custom Value'
        
        return response
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """在视图执行前调用"""
        print(f"Processing view: {view_func.__name__}")
        return None  # 返回 None 继续执行，返回 HttpResponse 则短路
    
    def process_exception(self, request, exception):
        """视图抛出异常时调用"""
        print(f"Exception: {exception}")
        return None
    
    def process_template_response(self, request, response):
        """视图返回 TemplateResponse 时调用"""
        return response
```

### 2.3 实用中间件示例

#### 请求日志中间件

```python
import time
import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # 记录请求开始时间
        start_time = time.time()
        
        # 记录请求信息
        logger.info(f"Request: {request.method} {request.path}")
        
        response = self.get_response(request)
        
        # 计算处理时间
        duration = time.time() - start_time
        
        # 记录响应信息
        logger.info(
            f"Response: {response.status_code} "
            f"(Duration: {duration:.2f}s)"
        )
        
        return response
```

#### 认证中间件

```python
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class TokenAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # 白名单路径
        whitelist = ['/api/login/', '/api/register/']
        if request.path in whitelist:
            return None
        
        # 验证 Token
        token = request.META.get('HTTP_AUTHORIZATION')
        if not token:
            return JsonResponse({
                'error': 'Token required'
            }, status=401)
        
        try:
            # 验证 token 逻辑
            user = verify_token(token)
            request.user = user
        except Exception as e:
            return JsonResponse({
                'error': 'Invalid token'
            }, status=401)
        
        return None
```

#### 跨域中间件

```python
class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response
```

#### 限流中间件

```python
from django.core.cache import cache
from django.http import HttpResponse

class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # 获取客户端 IP
        ip = self.get_client_ip(request)
        
        # 限流检查：每分钟最多 60 次请求
        cache_key = f'rate_limit_{ip}'
        requests = cache.get(cache_key, 0)
        
        if requests >= 60:
            return HttpResponse('Rate limit exceeded', status=429)
        
        # 增加请求计数
        cache.set(cache_key, requests + 1, 60)
        
        return self.get_response(request)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
```

### 2.4 中间件配置

```python
# settings.py

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # 自定义中间件
    'myapp.middleware.RequestLoggingMiddleware',
    'myapp.middleware.TokenAuthMiddleware',
]
```

## 三、Django 信号（Signals）

信号是 Django 内置的观察者模式实现，允许解耦的应用在框架的其他地方发生操作时得到通知。

### 3.1 内置信号

#### 模型信号

```python
from django.db.models.signals import (
    pre_save, post_save, pre_delete, post_delete,
    m2m_changed
)
from django.dispatch import receiver

# pre_save：模型保存前
@receiver(pre_save, sender=User)
def user_pre_save(sender, instance, **kwargs):
    print(f"准备保存用户: {instance.username}")

# post_save：模型保存后
@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    if created:
        print(f"创建新用户: {instance.username}")
        # 创建用户配置
        UserProfile.objects.create(user=instance)
    else:
        print(f"更新用户: {instance.username}")

# pre_delete：模型删除前
@receiver(pre_delete, sender=User)
def user_pre_delete(sender, instance, **kwargs):
    print(f"准备删除用户: {instance.username}")
    # 清理相关数据
    instance.posts.all().delete()

# post_delete：模型删除后
@receiver(post_delete, sender=User)
def user_post_delete(sender, instance, **kwargs):
    print(f"已删除用户: {instance.username}")

# m2m_changed：多对多关系改变
@receiver(m2m_changed, sender=User.groups.through)
def user_groups_changed(sender, instance, action, **kwargs):
    if action == 'post_add':
        print(f"用户 {instance.username} 添加到组")
    elif action == 'post_remove':
        print(f"用户 {instance.username} 从组移除")
```

#### 请求/响应信号

```python
from django.core.signals import request_started, request_finished

@receiver(request_started)
def request_started_handler(sender, environ, **kwargs):
    print("请求开始")

@receiver(request_finished)
def request_finished_handler(sender, **kwargs):
    print("请求结束")
```

### 3.2 自定义信号

```python
from django.dispatch import Signal, receiver

# 定义自定义信号
user_logged_in = Signal()  # 提供参数: user, request

# 发送信号
def login_view(request):
    # 登录逻辑
    user = authenticate(username='admin', password='password')
    if user:
        # 发送信号
        user_logged_in.send(
            sender=user.__class__,
            user=user,
            request=request
        )
    return HttpResponse('Logged in')

# 接收信号
@receiver(user_logged_in)
def log_user_login(sender, user, request, **kwargs):
    print(f"用户 {user.username} 登录")
    # 记录登录日志
    LoginLog.objects.create(
        user=user,
        ip=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )
```

### 3.3 信号的应用场景

#### 自动创建关联对象

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """用户创建后自动创建用户配置"""
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """用户保存时同时保存配置"""
    instance.profile.save()
```

#### 缓存失效

```python
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete

@receiver([post_save, post_delete], sender=Article)
def invalidate_article_cache(sender, instance, **kwargs):
    """文章变更后清除缓存"""
    cache_keys = [
        f'article_{instance.id}',
        'article_list',
        f'category_{instance.category_id}_articles'
    ]
    cache.delete_many(cache_keys)
```

#### 发送通知

```python
@receiver(post_save, sender=Comment)
def notify_comment(sender, instance, created, **kwargs):
    """新评论通知"""
    if created:
        # 发送邮件通知
        send_mail(
            subject=f'新评论：{instance.post.title}',
            message=instance.content,
            from_email='noreply@example.com',
            recipient_list=[instance.post.author.email]
        )
```

### 3.4 信号注册方式

```python
# 方式1：使用装饰器
from django.dispatch import receiver

@receiver(post_save, sender=User)
def my_handler(sender, instance, **kwargs):
    pass

# 方式2：使用 connect 方法
from django.db.models.signals import post_save

def my_handler(sender, instance, **kwargs):
    pass

post_save.connect(my_handler, sender=User)

# 方式3：在 AppConfig 中注册
# apps.py
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp'
    
    def ready(self):
        import myapp.signals  # 导入信号处理器
```

### 3.5 信号的最佳实践

```python
# 1. 避免循环导入
# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender='myapp.User')  # 使用字符串引用
def user_saved(sender, instance, **kwargs):
    pass

# 2. 使用 dispatch_uid 避免重复注册
@receiver(post_save, sender=User, dispatch_uid="unique_user_save_handler")
def user_saved(sender, instance, **kwargs):
    pass

# 3. 条件性执行
@receiver(post_save, sender=User)
def user_saved(sender, instance, created, **kwargs):
    if created and instance.is_active:
        # 只在创建活跃用户时执行
        pass

# 4. 异常处理
@receiver(post_save, sender=User)
def user_saved(sender, instance, **kwargs):
    try:
        # 信号处理逻辑
        pass
    except Exception as e:
        # 记录错误但不影响主流程
        logger.error(f"Signal error: {e}")
```

## 四、Django Admin 扩展

Django Admin 是一个强大的后台管理系统，可以通过扩展来满足各种复杂需求。

### 4.1 基础 Admin 配置

```python
from django.contrib import admin
from .models import Article, Category

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    # 列表页显示的字段
    list_display = ['title', 'author', 'category', 'status', 'created_at']
    
    # 列表页可点击的字段
    list_display_links = ['title']
    
    # 列表页可编辑的字段
    list_editable = ['status']
    
    # 过滤器
    list_filter = ['status', 'category', 'created_at']
    
    # 搜索字段
    search_fields = ['title', 'content', 'author__username']
    
    # 排序
    ordering = ['-created_at']
    
    # 每页显示数量
    list_per_page = 20
    
    # 详情页字段分组
    fieldsets = [
        ('基本信息', {
            'fields': ['title', 'author', 'category']
        }),
        ('内容', {
            'fields': ['content', 'summary'],
            'classes': ['wide']
        }),
        ('设置', {
            'fields': ['status', 'is_featured'],
            'classes': ['collapse']
        }),
    ]
    
    # 只读字段
    readonly_fields = ['created_at', 'updated_at', 'view_count']
    
    # 日期层级导航
    date_hierarchy = 'created_at'
    
    # 自动补全
    autocomplete_fields = ['author', 'category']
    
    # 原始 ID 字段
    raw_id_fields = ['author']
```

### 4.2 自定义列表显示

```python
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        'colored_status',
        'author_link',
        'view_count_progress',
        'thumbnail_preview'
    ]
    
    @admin.display(description='状态', ordering='status')
    def colored_status(self, obj):
        """带颜色的状态显示"""
        colors = {
            'draft': 'gray',
            'published': 'green',
            'archived': 'red'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            obj.get_status_display()
        )
    
    @admin.display(description='作者')
    def author_link(self, obj):
        """可点击的作者链接"""
        url = reverse('admin:myapp_user_change', args=[obj.author.id])
        return format_html('<a href="{}">{}</a>', url, obj.author.username)
    
    @admin.display(description='阅读量')
    def view_count_progress(self, obj):
        """进度条显示阅读量"""
        max_views = 10000
        percent = min(100, (obj.view_count / max_views) * 100)
        return format_html(
            '<div style="width:100px; background:#f0f0f0;">'
            '<div style="width:{}%; background:#4CAF50; height:20px;"></div>'
            '</div> {}',
            percent,
            obj.view_count
        )
    
    @admin.display(description='缩略图')
    def thumbnail_preview(self, obj):
        """显示缩略图"""
        if obj.thumbnail:
            return format_html(
                '<img src="{}" width="50" height="50" />',
                obj.thumbnail.url
            )
        return '-'
```

### 4.3 自定义操作（Actions）

```python
from django.contrib import admin, messages

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    actions = ['make_published', 'make_draft', 'export_as_json']
    
    @admin.action(description='发布选中的文章')
    def make_published(self, request, queryset):
        """批量发布"""
        updated = queryset.update(status='published')
        self.message_user(
            request,
            f'成功发布 {updated} 篇文章',
            messages.SUCCESS
        )
    
    @admin.action(description='设为草稿')
    def make_draft(self, request, queryset):
        """批量设为草稿"""
        updated = queryset.update(status='draft')
        self.message_user(request, f'已将 {updated} 篇文章设为草稿')
    
    @admin.action(description='导出为 JSON')
    def export_as_json(self, request, queryset):
        """导出数据"""
        import json
        from django.http import HttpResponse
        
        data = list(queryset.values(
            'id', 'title', 'author__username', 'created_at'
        ))
        
        response = HttpResponse(
            json.dumps(data, indent=2, ensure_ascii=False),
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename=articles.json'
        return response
```

### 4.4 内联（Inline）编辑

```python
from django.contrib import admin

class CommentInline(admin.TabularInline):
    """表格式内联"""
    model = Comment
    extra = 1  # 额外空行数
    fields = ['user', 'content', 'created_at']
    readonly_fields = ['created_at']

class TagInline(admin.StackedInline):
    """堆叠式内联"""
    model = Article.tags.through
    extra = 1

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    inlines = [CommentInline, TagInline]
    
    def get_inline_instances(self, request, obj=None):
        """动态控制内联显示"""
        if obj and obj.status == 'published':
            return super().get_inline_instances(request, obj)
        return []
```

### 4.5 自定义表单

```python
from django import forms
from django.contrib import admin

class ArticleAdminForm(forms.ModelForm):
    # 自定义字段
    word_count = forms.IntegerField(
        label='字数',
        required=False,
        widget=forms.TextInput(attrs={'readonly': 'readonly'})
    )
    
    class Meta:
        model = Article
        fields = '__all__'
        widgets = {
            'content': forms.Textarea(attrs={'rows': 20, 'cols': 80}),
            'summary': forms.Textarea(attrs={'rows': 5}),
        }
    
    def clean_title(self):
        """字段验证"""
        title = self.cleaned_data['title']
        if len(title) < 5:
            raise forms.ValidationError('标题至少需要5个字符')
        return title
    
    def clean(self):
        """表单验证"""
        cleaned_data = super().clean()
        status = cleaned_data.get('status')
        content = cleaned_data.get('content')
        
        if status == 'published' and not content:
            raise forms.ValidationError('发布的文章必须有内容')
        
        return cleaned_data

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleAdminForm
    
    def save_model(self, request, obj, form, change):
        """保存时自动设置作者"""
        if not change:  # 新建时
            obj.author = request.user
        super().save_model(request, obj, form, change)
```

### 4.6 权限控制

```python
from django.contrib import admin

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    
    def has_add_permission(self, request):
        """控制添加权限"""
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        """控制修改权限"""
        if obj and obj.author != request.user:
            return request.user.is_superuser
        return True
    
    def has_delete_permission(self, request, obj=None):
        """控制删除权限"""
        return request.user.is_superuser
    
    def get_queryset(self, request):
        """根据用户过滤数据"""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(author=request.user)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """限制外键选项"""
        if db_field.name == 'category':
            kwargs['queryset'] = Category.objects.filter(is_active=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
```

### 4.7 自定义视图

```python
from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from django.http import HttpResponse

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    
    def get_urls(self):
        """添加自定义 URL"""
        urls = super().get_urls()
        custom_urls = [
            path(
                'statistics/',
                self.admin_site.admin_view(self.statistics_view),
                name='article_statistics'
            ),
            path(
                '<int:article_id>/preview/',
                self.admin_site.admin_view(self.preview_view),
                name='article_preview'
            ),
        ]
        return custom_urls + urls
    
    def statistics_view(self, request):
        """统计视图"""
        from django.db.models import Count, Avg
        
        stats = Article.objects.aggregate(
            total=Count('id'),
            avg_views=Avg('view_count')
        )
        
        context = {
            **self.admin_site.each_context(request),
            'title': '文章统计',
            'stats': stats,
        }
        return render(request, 'admin/article_statistics.html', context)
    
    def preview_view(self, request, article_id):
        """预览视图"""
        article = self.get_object(request, article_id)
        if article is None:
            return HttpResponse('文章不存在', status=404)
        
        return render(request, 'article_preview.html', {'article': article})
```

### 4.8 自定义过滤器

```python
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

class ViewCountFilter(admin.SimpleListFilter):
    """自定义过滤器"""
    title = _('阅读量')
    parameter_name = 'view_count'
    
    def lookups(self, request, model_admin):
        """过滤选项"""
        return (
            ('low', _('低于1000')),
            ('medium', _('1000-5000')),
            ('high', _('高于5000')),
        )
    
    def queryset(self, request, queryset):
        """过滤逻辑"""
        if self.value() == 'low':
            return queryset.filter(view_count__lt=1000)
        if self.value() == 'medium':
            return queryset.filter(view_count__gte=1000, view_count__lt=5000)
        if self.value() == 'high':
            return queryset.filter(view_count__gte=5000)

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_filter = [ViewCountFilter, 'status', 'created_at']
```

### 4.9 Admin 主题定制

```python
# settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    # 其他应用
]

# 自定义 Admin 站点
from django.contrib import admin

class MyAdminSite(admin.AdminSite):
    site_title = '我的管理后台'
    site_header = '管理系统'
    index_title = '欢迎使用管理后台'
    
    def each_context(self, request):
        context = super().each_context(request)
        context['custom_var'] = 'custom_value'
        return context

admin_site = MyAdminSite(name='myadmin')

# 使用自定义站点
admin_site.register(Article, ArticleAdmin)
```

## 五、其他重要底层机制

### 5.1 缓存系统

```python
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

# 基本缓存操作
cache.set('my_key', 'my_value', timeout=300)  # 缓存5分钟
value = cache.get('my_key')
cache.delete('my_key')

# 视图缓存
@cache_page(60 * 15)  # 缓存15分钟
def my_view(request):
    return HttpResponse('Hello')

# 模板片段缓存
{% load cache %}
{% cache 500 sidebar request.user.username %}
    <!-- 侧边栏内容 -->
{% endcache %}

# 低级缓存 API
from django.core.cache import caches

cache1 = caches['default']
cache2 = caches['alternate']
```

### 5.2 自定义模板标签和过滤器

```python
# templatetags/custom_tags.py
from django import template
from django.utils.html import format_html

register = template.Library()

# 简单标签
@register.simple_tag
def current_time(format_string):
    from datetime import datetime
    return datetime.now().strftime(format_string)

# 包含标签
@register.inclusion_tag('includes/user_info.html')
def show_user_info(user):
    return {'user': user}

# 自定义过滤器
@register.filter
def truncate_chars(value, max_length):
    if len(value) > max_length:
        return value[:max_length] + '...'
    return value

# 使用
{% load custom_tags %}
{% current_time "%Y-%m-%d %H:%M:%S" %}
{{ article.content|truncate_chars:100 }}
```

### 5.3 自定义管理命令

```python
# management/commands/import_data.py
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

class Command(BaseCommand):
    help = '导入数据'
    
    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='文件路径')
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='批量大小'
        )
    
    def handle(self, *args, **options):
        file_path = options['file_path']
        batch_size = options['batch_size']
        
        self.stdout.write(self.style.SUCCESS(f'开始导入: {file_path}'))
        
        try:
            with transaction.atomic():
                # 导入逻辑
                count = self.import_data(file_path, batch_size)
            
            self.stdout.write(
                self.style.SUCCESS(f'成功导入 {count} 条数据')
            )
        except Exception as e:
            raise CommandError(f'导入失败: {e}')
    
    def import_data(self, file_path, batch_size):
        # 实际导入逻辑
        pass
```

### 5.4 Context Processors

```python
# context_processors.py
def site_settings(request):
    """全局上下文处理器"""
    return {
        'SITE_NAME': 'My Site',
        'SITE_VERSION': '1.0.0',
        'current_user': request.user,
    }

# settings.py
TEMPLATES = [
    {
        'OPTIONS': {
            'context_processors': [
                'myapp.context_processors.site_settings',
            ],
        },
    },
]
```

## 总结

Django 的底层机制设计精良，提供了强大而灵活的功能：

### 核心要点

1. **ORM**：提供了强大的数据库抽象，支持复杂查询和优化
2. **中间件**：请求/响应处理的钩子系统，适合实现横切关注点
3. **信号**：解耦的事件通知机制，遵循观察者模式
4. **Admin**：功能丰富的后台管理系统，高度可定制

### 最佳实践

- ✅ 使用 `select_related` 和 `prefetch_related` 优化查询
- ✅ 合理使用中间件处理全局逻辑
- ✅ 通过信号实现解耦，但避免过度使用
- ✅ 充分利用 Admin 的扩展能力
- ✅ 使用事务保证数据一致性
- ✅ 合理使用缓存提升性能

### 性能优化建议

1. 使用 `only()` 和 `defer()` 减少字段加载
2. 批量操作使用 `bulk_create` 和 `bulk_update`
3. 避免 N+1 查询问题
4. 合理设置数据库索引
5. 使用缓存减少数据库访问
6. 异步任务使用 Celery

掌握这些底层机制将帮助你构建高性能、可维护的 Django 应用！

---

*最后更新: 2025年11月*

