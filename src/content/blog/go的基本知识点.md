---
title: "Go语言核心知识点：从入门到实践的完整指南"
description: "全面讲解Go语言的核心概念，包括基础语法、数据类型、并发编程、内存管理等关键知识点"
pubDate: 2025-12-15
tags: ["Go", "Golang", "并发编程", "后端开发"]
---

# Go语言核心知识点：从入门到实践的完整指南

Go（又称 Golang）是由 Google 开发的一种静态类型、编译型编程语言。它以简洁、高效、并发支持强大而著称，特别适合构建高性能的服务端应用。

## 一、Go 语言特点

### 1. 简洁性
- 语法简单，关键字只有 25 个
- 没有类继承、泛型（Go 1.18 后支持）、异常等复杂特性
- 代码风格统一（`gofmt` 工具强制格式化）

### 2. 高性能
- 编译型语言，执行速度快
- 静态类型，编译时检查错误
- 垃圾回收（GC）但延迟低

### 3. 原生并发支持
- 轻量级协程（Goroutine）
- 通道（Channel）进行协程间通信
- CSP（Communicating Sequential Processes）并发模型

### 4. 内置工具链
- `go build`：编译
- `go test`：测试
- `go fmt`：格式化
- `go mod`：模块管理

---

## 二、基础语法

### 1. Hello World

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

**解释：**
- `package main`：声明这是一个可执行程序（不是库）
- `import "fmt"`：导入格式化输出包
- `func main()`：程序入口点

### 2. 变量声明

Go 提供多种变量声明方式：

```go
package main

import "fmt"

func main() {
    // 方式一：完整声明
    var name string = "Go"
    
    // 方式二：类型推断
    var age = 15  // 自动推断为 int
    
    // 方式三：短声明（推荐，只能在函数内使用）
    city := "Beijing"
    
    // 方式四：批量声明
    var (
        height int     = 180
        weight float64 = 70.5
        active bool    = true
    )
    
    fmt.Println(name, age, city, height, weight, active)
}
```

### 3. 常量声明

```go
package main

import "fmt"

// 单个常量
const PI = 3.14159

// 批量常量
const (
    StatusOK    = 200
    StatusError = 500
)

// iota：常量生成器（从0开始自增）
const (
    Sunday    = iota // 0
    Monday           // 1
    Tuesday          // 2
    Wednesday        // 3
    Thursday         // 4
    Friday           // 5
    Saturday         // 6
)

// iota 的高级用法
const (
    _  = iota             // 忽略第一个值（0）
    KB = 1 << (10 * iota) // 1 << 10 = 1024
    MB                    // 1 << 20 = 1048576
    GB                    // 1 << 30
    TB                    // 1 << 40
)

func main() {
    fmt.Println("PI:", PI)
    fmt.Println("Monday:", Monday)
    fmt.Println("KB:", KB, "MB:", MB)
}
```

---

## 三、数据类型

### 1. 基本类型

```go
// 布尔型
var isActive bool = true

// 整数类型
var (
    a int     = 10      // 根据系统32位或64位
    b int8    = 127     // -128 ~ 127
    c int16   = 32767
    d int32   = 2147483647
    e int64   = 9223372036854775807
    f uint    = 10      // 无符号整数
    g uint8   = 255     // 别名：byte
    h uint32  = 4294967295  // 别名：rune（表示Unicode码点）
)

// 浮点数
var (
    f1 float32 = 3.14
    f2 float64 = 3.141592653589793  // 推荐使用
)

// 复数
var c1 complex64 = 1 + 2i
var c2 complex128 = 2 + 3i

// 字符串（不可变）
var str string = "Hello, Go!"
```

### 2. 零值（Zero Value）

Go 中未初始化的变量会有默认零值：

```go
var i int       // 0
var f float64   // 0.0
var b bool      // false
var s string    // ""（空字符串）
var p *int      // nil
var sl []int    // nil
var m map[string]int  // nil
var ch chan int       // nil
var fn func()         // nil
var iface interface{} // nil
```

### 3. 类型转换

Go 没有隐式类型转换，必须显式转换：

```go
package main

import (
    "fmt"
    "strconv"
)

func main() {
    // 数值类型转换
    var i int = 42
    var f float64 = float64(i)
    var u uint = uint(f)
    
    fmt.Printf("int: %d, float64: %f, uint: %d\n", i, f, u)
    
    // 字符串与数值转换
    str := strconv.Itoa(42)           // int -> string: "42"
    num, _ := strconv.Atoi("42")      // string -> int: 42
    
    fmt.Printf("string: %s, int: %d\n", str, num)
    
    // 字符串与字节切片转换
    s := "hello"
    bytes := []byte(s)    // string -> []byte
    s2 := string(bytes)   // []byte -> string
    
    fmt.Printf("bytes: %v, string: %s\n", bytes, s2)
}
```

---

## 四、复合数据类型

### 1. 数组（Array）

数组是**固定长度**的同类型元素集合：

```go
package main

import "fmt"

func main() {
    // 声明数组
    var arr1 [5]int                    // 默认零值 [0,0,0,0,0]
    arr2 := [5]int{1, 2, 3, 4, 5}      // 初始化
    arr3 := [...]int{1, 2, 3}          // 自动计算长度
    arr4 := [5]int{0: 100, 4: 400}     // 指定索引初始化
    
    fmt.Println(arr1, arr2, arr3, arr4)
    
    // 访问和修改
    arr1[0] = 10
    fmt.Println("第一个元素:", arr1[0])
    fmt.Println("数组长度:", len(arr1))
    
    // 遍历数组
    for i, v := range arr2 {
        fmt.Printf("索引: %d, 值: %d\n", i, v)
    }
}
```

> ⚠️ **注意**：数组是值类型，赋值和传参会复制整个数组！

### 2. 切片（Slice）

切片是**动态长度**的数组视图，是 Go 中最常用的数据结构：

```go
package main

import "fmt"

func main() {
    // 创建切片的方式
    // 方式一：从数组创建
    arr := [5]int{1, 2, 3, 4, 5}
    slice1 := arr[1:4]  // [2, 3, 4]，左闭右开
    
    // 方式二：直接声明
    slice2 := []int{1, 2, 3}
    
    // 方式三：make 创建（推荐）
    slice3 := make([]int, 5)     // 长度5，容量5
    slice4 := make([]int, 3, 10) // 长度3，容量10
    
    fmt.Println(slice1, slice2, slice3, slice4)
    fmt.Printf("slice4 - 长度: %d, 容量: %d\n", len(slice4), cap(slice4))
    
    // 追加元素
    slice2 = append(slice2, 4, 5, 6)
    fmt.Println("追加后:", slice2)
    
    // 合并切片
    slice5 := []int{7, 8, 9}
    slice2 = append(slice2, slice5...)  // ... 展开切片
    fmt.Println("合并后:", slice2)
    
    // 复制切片
    dest := make([]int, len(slice2))
    copy(dest, slice2)
    fmt.Println("复制:", dest)
}
```

**切片的底层结构：**

```go
// 切片的内部结构（伪代码）
type slice struct {
    ptr *array  // 指向底层数组的指针
    len int     // 切片长度
    cap int     // 切片容量
}
```

### 3. 映射（Map）

Map 是键值对的无序集合：

```go
package main

import "fmt"

func main() {
    // 创建 Map
    // 方式一：make 创建
    m1 := make(map[string]int)
    m1["age"] = 25
    m1["score"] = 100
    
    // 方式二：字面量创建
    m2 := map[string]string{
        "name":    "Go",
        "version": "1.21",
    }
    
    fmt.Println(m1, m2)
    
    // 访问元素
    age := m1["age"]
    fmt.Println("Age:", age)
    
    // 检查键是否存在（推荐写法）
    if value, exists := m1["score"]; exists {
        fmt.Println("Score exists:", value)
    }
    
    // 删除元素
    delete(m1, "score")
    fmt.Println("删除后:", m1)
    
    // 遍历 Map（顺序随机）
    for key, value := range m2 {
        fmt.Printf("%s: %s\n", key, value)
    }
    
    // 获取长度
    fmt.Println("Map 长度:", len(m2))
}
```

> ⚠️ **注意**：Map 不是并发安全的，并发读写需要加锁或使用 `sync.Map`

### 4. 结构体（Struct）

结构体是自定义的复合类型：

```go
package main

import "fmt"

// 定义结构体
type Person struct {
    Name string
    Age  int
    City string
}

// 嵌入结构体（类似继承）
type Employee struct {
    Person          // 匿名嵌入
    Company  string
    Position string
}

func main() {
    // 创建结构体实例
    // 方式一：按字段顺序
    p1 := Person{"Alice", 25, "Beijing"}
    
    // 方式二：指定字段名（推荐）
    p2 := Person{
        Name: "Bob",
        Age:  30,
        City: "Shanghai",
    }
    
    // 方式三：零值初始化
    var p3 Person
    p3.Name = "Charlie"
    
    // 方式四：指针
    p4 := &Person{Name: "David", Age: 28}
    
    fmt.Println(p1, p2, p3, p4)
    
    // 访问字段
    fmt.Println("Name:", p2.Name)
    
    // 嵌入结构体
    emp := Employee{
        Person:   Person{Name: "Eve", Age: 26, City: "Shenzhen"},
        Company:  "Tech Corp",
        Position: "Engineer",
    }
    
    // 可以直接访问嵌入结构体的字段
    fmt.Println("Employee Name:", emp.Name)  // 等同于 emp.Person.Name
    fmt.Println("Company:", emp.Company)
}
```

---

## 五、函数

### 1. 基本函数

```go
package main

import "fmt"

// 基本函数
func add(a, b int) int {
    return a + b
}

// 多返回值
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("除数不能为0")
    }
    return a / b, nil
}

// 命名返回值
func rectangle(width, height float64) (area, perimeter float64) {
    area = width * height
    perimeter = 2 * (width + height)
    return  // 裸返回
}

// 可变参数
func sum(nums ...int) int {
    total := 0
    for _, num := range nums {
        total += num
    }
    return total
}

func main() {
    fmt.Println("Add:", add(3, 5))
    
    result, err := divide(10, 3)
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Printf("Divide: %.2f\n", result)
    }
    
    area, perimeter := rectangle(5, 3)
    fmt.Printf("Area: %.2f, Perimeter: %.2f\n", area, perimeter)
    
    fmt.Println("Sum:", sum(1, 2, 3, 4, 5))
}
```

### 2. 匿名函数与闭包

```go
package main

import "fmt"

func main() {
    // 匿名函数
    square := func(n int) int {
        return n * n
    }
    fmt.Println("Square:", square(5))
    
    // 立即执行函数
    result := func(a, b int) int {
        return a + b
    }(3, 4)
    fmt.Println("IIFE Result:", result)
    
    // 闭包：捕获外部变量
    counter := func() func() int {
        count := 0
        return func() int {
            count++
            return count
        }
    }()
    
    fmt.Println(counter())  // 1
    fmt.Println(counter())  // 2
    fmt.Println(counter())  // 3
}
```

### 3. defer 延迟执行

`defer` 语句会在函数返回前执行，常用于资源清理：

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // 基本用法：LIFO（后进先出）
    defer fmt.Println("第一个 defer")
    defer fmt.Println("第二个 defer")
    defer fmt.Println("第三个 defer")
    
    fmt.Println("正常执行")
    
    // 输出顺序：
    // 正常执行
    // 第三个 defer
    // 第二个 defer
    // 第一个 defer
}

// 典型应用：文件操作
func readFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()  // 确保文件关闭
    
    // 读取文件内容...
    return nil
}

// defer 与返回值
func deferReturn() (result int) {
    defer func() {
        result++  // 可以修改命名返回值
    }()
    return 0  // 实际返回 1
}
```

---

## 六、方法与接口

### 1. 方法（Method）

方法是带有接收者的函数：

```go
package main

import (
    "fmt"
    "math"
)

type Circle struct {
    Radius float64
}

// 值接收者（不修改原对象）
func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

// 指针接收者（可修改原对象）
func (c *Circle) Scale(factor float64) {
    c.Radius *= factor
}

func main() {
    c := Circle{Radius: 5}
    
    fmt.Printf("面积: %.2f\n", c.Area())
    
    c.Scale(2)
    fmt.Printf("缩放后半径: %.2f\n", c.Radius)
    fmt.Printf("缩放后面积: %.2f\n", c.Area())
}
```

**值接收者 vs 指针接收者：**

| 特性 | 值接收者 | 指针接收者 |
|------|---------|-----------|
| 是否修改原对象 | 否（操作副本） | 是 |
| 适用场景 | 小对象、只读操作 | 大对象、需要修改 |
| nil 安全性 | 是 | 需要处理 nil |

### 2. 接口（Interface）

接口定义了一组方法签名，是 Go 实现多态的方式：

```go
package main

import (
    "fmt"
    "math"
)

// 定义接口
type Shape interface {
    Area() float64
    Perimeter() float64
}

// 圆形
type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

// 矩形
type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

// 使用接口
func PrintShapeInfo(s Shape) {
    fmt.Printf("面积: %.2f, 周长: %.2f\n", s.Area(), s.Perimeter())
}

func main() {
    c := Circle{Radius: 5}
    r := Rectangle{Width: 4, Height: 3}
    
    // 多态
    PrintShapeInfo(c)
    PrintShapeInfo(r)
    
    // 接口类型切片
    shapes := []Shape{c, r}
    for _, shape := range shapes {
        PrintShapeInfo(shape)
    }
}
```

### 3. 空接口与类型断言

```go
package main

import "fmt"

func main() {
    // 空接口可以存储任意类型
    var any interface{}
    
    any = 42
    fmt.Println(any)
    
    any = "hello"
    fmt.Println(any)
    
    any = []int{1, 2, 3}
    fmt.Println(any)
    
    // 类型断言
    str, ok := any.(string)
    if ok {
        fmt.Println("是字符串:", str)
    } else {
        fmt.Println("不是字符串")
    }
    
    // 类型选择（Type Switch）
    checkType := func(i interface{}) {
        switch v := i.(type) {
        case int:
            fmt.Printf("整数: %d\n", v)
        case string:
            fmt.Printf("字符串: %s\n", v)
        case bool:
            fmt.Printf("布尔值: %t\n", v)
        default:
            fmt.Printf("未知类型: %T\n", v)
        }
    }
    
    checkType(42)
    checkType("hello")
    checkType(true)
    checkType(3.14)
}
```

---

## 七、并发编程

### 1. Goroutine

Goroutine 是 Go 的轻量级协程，由 Go 运行时管理：

```go
package main

import (
    "fmt"
    "time"
)

func sayHello(name string) {
    for i := 0; i < 3; i++ {
        fmt.Printf("Hello, %s! (%d)\n", name, i)
        time.Sleep(100 * time.Millisecond)
    }
}

func main() {
    // 启动 Goroutine
    go sayHello("Alice")
    go sayHello("Bob")
    
    // 主 Goroutine
    sayHello("Main")
    
    // 等待其他 Goroutine 完成
    time.Sleep(500 * time.Millisecond)
}
```

**Goroutine vs 线程：**

| 特性 | Goroutine | 线程 |
|------|-----------|------|
| 初始栈大小 | 2KB（动态增长） | 1-8MB |
| 创建开销 | 极低 | 高 |
| 调度 | Go 运行时（用户态） | OS 内核 |
| 数量限制 | 可创建数十万个 | 数千个 |

### 2. Channel

Channel 是 Goroutine 间通信的管道：

```go
package main

import "fmt"

func main() {
    // 创建无缓冲 Channel
    ch := make(chan int)
    
    // 发送数据（在 Goroutine 中）
    go func() {
        ch <- 42
    }()
    
    // 接收数据
    value := <-ch
    fmt.Println("Received:", value)
    
    // 创建有缓冲 Channel
    bufferedCh := make(chan string, 3)
    
    bufferedCh <- "A"
    bufferedCh <- "B"
    bufferedCh <- "C"
    // bufferedCh <- "D"  // 会阻塞，因为缓冲区已满
    
    fmt.Println(<-bufferedCh)  // A
    fmt.Println(<-bufferedCh)  // B
    fmt.Println(<-bufferedCh)  // C
}
```

### 3. Channel 的高级用法

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // 关闭 Channel
    ch := make(chan int, 5)
    
    go func() {
        for i := 1; i <= 5; i++ {
            ch <- i
        }
        close(ch)  // 关闭 Channel
    }()
    
    // 使用 range 遍历（直到 Channel 关闭）
    for value := range ch {
        fmt.Println("Value:", value)
    }
    
    // 单向 Channel
    // chan<- int：只能发送
    // <-chan int：只能接收
    
    // Select 多路复用
    ch1 := make(chan string)
    ch2 := make(chan string)
    
    go func() {
        time.Sleep(100 * time.Millisecond)
        ch1 <- "消息1"
    }()
    
    go func() {
        time.Sleep(200 * time.Millisecond)
        ch2 <- "消息2"
    }()
    
    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("收到:", msg1)
        case msg2 := <-ch2:
            fmt.Println("收到:", msg2)
        case <-time.After(500 * time.Millisecond):
            fmt.Println("超时")
        }
    }
}
```

### 4. 并发同步

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    // WaitGroup：等待一组 Goroutine 完成
    var wg sync.WaitGroup
    
    for i := 1; i <= 3; i++ {
        wg.Add(1)  // 计数器 +1
        go func(id int) {
            defer wg.Done()  // 计数器 -1
            fmt.Printf("Worker %d 完成\n", id)
        }(i)
    }
    
    wg.Wait()  // 等待计数器归零
    fmt.Println("所有 Worker 完成")
    
    // Mutex：互斥锁
    var (
        mu      sync.Mutex
        counter int
    )
    
    var wg2 sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg2.Add(1)
        go func() {
            defer wg2.Done()
            mu.Lock()
            counter++
            mu.Unlock()
        }()
    }
    wg2.Wait()
    fmt.Println("Counter:", counter)
    
    // Once：只执行一次
    var once sync.Once
    for i := 0; i < 3; i++ {
        once.Do(func() {
            fmt.Println("只会打印一次")
        })
    }
}
```

---

## 八、错误处理

### 1. error 接口

```go
package main

import (
    "errors"
    "fmt"
)

// error 是内置接口
// type error interface {
//     Error() string
// }

func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("除数不能为零")
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 0)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }
    fmt.Println("结果:", result)
}
```

### 2. 自定义错误

```go
package main

import "fmt"

// 自定义错误类型
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("验证错误 [%s]: %s", e.Field, e.Message)
}

func validateAge(age int) error {
    if age < 0 {
        return &ValidationError{
            Field:   "age",
            Message: "年龄不能为负数",
        }
    }
    if age > 150 {
        return &ValidationError{
            Field:   "age",
            Message: "年龄不能超过150",
        }
    }
    return nil
}

func main() {
    err := validateAge(-5)
    if err != nil {
        // 类型断言获取详细信息
        if ve, ok := err.(*ValidationError); ok {
            fmt.Printf("字段: %s, 消息: %s\n", ve.Field, ve.Message)
        }
        fmt.Println(err)
    }
}
```

### 3. 错误包装与解包（Go 1.13+）

```go
package main

import (
    "errors"
    "fmt"
)

var ErrNotFound = errors.New("资源未找到")

func findUser(id int) error {
    // 包装错误，添加上下文
    return fmt.Errorf("查找用户 %d 失败: %w", id, ErrNotFound)
}

func main() {
    err := findUser(123)
    
    // 检查错误链中是否包含特定错误
    if errors.Is(err, ErrNotFound) {
        fmt.Println("是 NotFound 错误")
    }
    
    // 解包获取原始错误
    fmt.Println("原始错误:", errors.Unwrap(err))
    
    fmt.Println("完整错误:", err)
}
```

### 4. panic 与 recover

```go
package main

import "fmt"

func riskyOperation() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("恢复自 panic:", r)
        }
    }()
    
    panic("发生严重错误！")
}

func main() {
    fmt.Println("开始")
    riskyOperation()
    fmt.Println("程序继续执行")
}
```

> ⚠️ **最佳实践**：
> - 尽量使用 `error` 返回值处理错误
> - `panic` 只用于不可恢复的错误
> - `recover` 只在 `defer` 中有效

---

## 九、包管理（Go Modules）

### 1. 初始化模块

```bash
# 创建新模块
go mod init github.com/username/project

# 添加依赖
go get github.com/gin-gonic/gin

# 整理依赖
go mod tidy

# 下载依赖
go mod download

# 查看依赖图
go mod graph
```

### 2. go.mod 文件

```go
module github.com/username/myproject

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/go-redis/redis/v8 v8.11.5
)

// 替换依赖（用于本地开发）
replace github.com/old/package => ../local/package
```

### 3. 包的组织

```
myproject/
├── go.mod
├── go.sum
├── main.go
├── internal/           # 私有包（不能被外部导入）
│   └── config/
│       └── config.go
├── pkg/                # 公开包
│   └── utils/
│       └── utils.go
└── cmd/                # 命令行应用
    └── server/
        └── main.go
```

---

## 十、常用标准库

### 1. fmt - 格式化 I/O

```go
package main

import "fmt"

func main() {
    name := "Go"
    age := 15
    pi := 3.14159
    
    // 常用格式化动词
    fmt.Printf("字符串: %s\n", name)
    fmt.Printf("整数: %d\n", age)
    fmt.Printf("浮点数: %f, 精度控制: %.2f\n", pi, pi)
    fmt.Printf("布尔值: %t\n", true)
    fmt.Printf("类型: %T\n", pi)
    fmt.Printf("值（默认格式）: %v\n", map[string]int{"a": 1})
    fmt.Printf("值（带字段名）: %+v\n", struct{ Name string }{"Go"})
    fmt.Printf("Go 语法表示: %#v\n", []int{1, 2, 3})
    fmt.Printf("指针: %p\n", &age)
    fmt.Printf("二进制: %b, 十六进制: %x\n", 10, 255)
    
    // Sprintf 返回字符串
    s := fmt.Sprintf("Hello, %s!", name)
    fmt.Println(s)
}
```

### 2. strings - 字符串操作

```go
package main

import (
    "fmt"
    "strings"
)

func main() {
    s := "Hello, World!"
    
    fmt.Println(strings.Contains(s, "World"))       // true
    fmt.Println(strings.HasPrefix(s, "Hello"))      // true
    fmt.Println(strings.HasSuffix(s, "!"))          // true
    fmt.Println(strings.Index(s, "o"))              // 4
    fmt.Println(strings.ToUpper(s))                 // HELLO, WORLD!
    fmt.Println(strings.ToLower(s))                 // hello, world!
    fmt.Println(strings.Replace(s, "World", "Go", 1)) // Hello, Go!
    fmt.Println(strings.Split("a,b,c", ","))        // [a b c]
    fmt.Println(strings.Join([]string{"a", "b"}, "-")) // a-b
    fmt.Println(strings.TrimSpace("  hello  "))     // hello
    fmt.Println(strings.Repeat("Go", 3))            // GoGoGo
}
```

### 3. time - 时间处理

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // 当前时间
    now := time.Now()
    fmt.Println("当前时间:", now)
    
    // 时间组件
    fmt.Printf("年: %d, 月: %d, 日: %d\n", now.Year(), now.Month(), now.Day())
    fmt.Printf("时: %d, 分: %d, 秒: %d\n", now.Hour(), now.Minute(), now.Second())
    
    // 格式化时间（使用固定参考时间：2006-01-02 15:04:05）
    fmt.Println(now.Format("2006-01-02 15:04:05"))
    fmt.Println(now.Format("2006/01/02"))
    fmt.Println(now.Format(time.RFC3339))
    
    // 解析时间
    t, _ := time.Parse("2006-01-02", "2025-12-15")
    fmt.Println("解析:", t)
    
    // 时间计算
    tomorrow := now.Add(24 * time.Hour)
    fmt.Println("明天:", tomorrow.Format("2006-01-02"))
    
    duration := tomorrow.Sub(now)
    fmt.Println("间隔:", duration)
    
    // Unix 时间戳
    fmt.Println("Unix 秒:", now.Unix())
    fmt.Println("Unix 毫秒:", now.UnixMilli())
    
    // 定时器
    timer := time.NewTimer(1 * time.Second)
    <-timer.C
    fmt.Println("1秒后执行")
    
    // Ticker（周期性）
    ticker := time.NewTicker(500 * time.Millisecond)
    go func() {
        for t := range ticker.C {
            fmt.Println("Tick at", t.Format("15:04:05.000"))
        }
    }()
    time.Sleep(2 * time.Second)
    ticker.Stop()
}
```

### 4. encoding/json - JSON 处理

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    Name    string   `json:"name"`
    Age     int      `json:"age"`
    Email   string   `json:"email,omitempty"` // 空值时省略
    Active  bool     `json:"-"`               // 忽略该字段
    Hobbies []string `json:"hobbies"`
}

func main() {
    // 结构体 -> JSON
    user := User{
        Name:    "Alice",
        Age:     25,
        Email:   "",
        Active:  true,
        Hobbies: []string{"reading", "coding"},
    }
    
    jsonBytes, _ := json.Marshal(user)
    fmt.Println("JSON:", string(jsonBytes))
    
    // 美化输出
    prettyJson, _ := json.MarshalIndent(user, "", "  ")
    fmt.Println("Pretty JSON:\n", string(prettyJson))
    
    // JSON -> 结构体
    jsonStr := `{"name":"Bob","age":30,"hobbies":["music"]}`
    var user2 User
    json.Unmarshal([]byte(jsonStr), &user2)
    fmt.Printf("User: %+v\n", user2)
    
    // JSON -> map（动态解析）
    var result map[string]interface{}
    json.Unmarshal([]byte(jsonStr), &result)
    fmt.Println("Map:", result)
}
```

### 5. net/http - HTTP 服务

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
}

func jsonHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    response := map[string]interface{}{
        "status":  "success",
        "message": "Hello from Go!",
    }
    json.NewEncoder(w).Encode(response)
}

func main() {
    // 路由注册
    http.HandleFunc("/", helloHandler)
    http.HandleFunc("/api/hello", jsonHandler)
    
    // 启动服务器
    fmt.Println("Server starting on :8080...")
    http.ListenAndServe(":8080", nil)
}
```

---

## 十一、泛型（Go 1.18+）

Go 1.18 引入了泛型支持：

```go
package main

import "fmt"

// 泛型函数
func Min[T int | float64](a, b T) T {
    if a < b {
        return a
    }
    return b
}

// 类型约束接口
type Number interface {
    int | int32 | int64 | float32 | float64
}

func Sum[T Number](nums []T) T {
    var total T
    for _, n := range nums {
        total += n
    }
    return total
}

// 泛型结构体
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T
        return zero, false
    }
    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item, true
}

func main() {
    // 使用泛型函数
    fmt.Println(Min(3, 5))       // 3
    fmt.Println(Min(3.14, 2.71)) // 2.71
    
    // 求和
    ints := []int{1, 2, 3, 4, 5}
    fmt.Println("Sum:", Sum(ints))
    
    // 泛型栈
    stack := &Stack[string]{}
    stack.Push("Go")
    stack.Push("Rust")
    stack.Push("Python")
    
    for {
        item, ok := stack.Pop()
        if !ok {
            break
        }
        fmt.Println("Pop:", item)
    }
}
```

---

## 十二、常见设计模式

### 1. 单例模式

```go
package main

import (
    "fmt"
    "sync"
)

type Database struct {
    connection string
}

var (
    instance *Database
    once     sync.Once
)

func GetInstance() *Database {
    once.Do(func() {
        instance = &Database{
            connection: "mysql://localhost:3306",
        }
        fmt.Println("Database instance created")
    })
    return instance
}

func main() {
    db1 := GetInstance()
    db2 := GetInstance()
    db3 := GetInstance()
    
    fmt.Printf("db1: %p\n", db1)
    fmt.Printf("db2: %p\n", db2)
    fmt.Printf("db3: %p\n", db3)
    // 三个指针相同，只创建了一个实例
}
```

### 2. 工厂模式

```go
package main

import "fmt"

// 产品接口
type Animal interface {
    Speak() string
}

// 具体产品
type Dog struct{}
func (d Dog) Speak() string { return "Woof!" }

type Cat struct{}
func (c Cat) Speak() string { return "Meow!" }

// 工厂函数
func NewAnimal(animalType string) Animal {
    switch animalType {
    case "dog":
        return Dog{}
    case "cat":
        return Cat{}
    default:
        return nil
    }
}

func main() {
    dog := NewAnimal("dog")
    cat := NewAnimal("cat")
    
    fmt.Println("Dog says:", dog.Speak())
    fmt.Println("Cat says:", cat.Speak())
}
```

### 3. 选项模式（Functional Options）

```go
package main

import "fmt"

type Server struct {
    host    string
    port    int
    timeout int
    maxConn int
}

// 选项函数类型
type ServerOption func(*Server)

// 选项函数
func WithPort(port int) ServerOption {
    return func(s *Server) {
        s.port = port
    }
}

func WithTimeout(timeout int) ServerOption {
    return func(s *Server) {
        s.timeout = timeout
    }
}

func WithMaxConn(maxConn int) ServerOption {
    return func(s *Server) {
        s.maxConn = maxConn
    }
}

// 构造函数
func NewServer(host string, opts ...ServerOption) *Server {
    // 默认值
    s := &Server{
        host:    host,
        port:    8080,
        timeout: 30,
        maxConn: 100,
    }
    
    // 应用选项
    for _, opt := range opts {
        opt(s)
    }
    
    return s
}

func main() {
    // 使用默认值
    s1 := NewServer("localhost")
    fmt.Printf("Server 1: %+v\n", s1)
    
    // 自定义选项
    s2 := NewServer("localhost",
        WithPort(9090),
        WithTimeout(60),
        WithMaxConn(500),
    )
    fmt.Printf("Server 2: %+v\n", s2)
}
```

---

## 十三、测试

### 1. 单元测试

```go
// math.go
package math

func Add(a, b int) int {
    return a + b
}

func Multiply(a, b int) int {
    return a * b
}
```

```go
// math_test.go
package math

import "testing"

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    if result != 5 {
        t.Errorf("Add(2, 3) = %d; want 5", result)
    }
}

// 表驱动测试
func TestMultiply(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 2, 3, 6},
        {"zero", 0, 5, 0},
        {"negative", -2, 3, -6},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Multiply(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Multiply(%d, %d) = %d; want %d",
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

### 2. 基准测试

```go
// math_test.go
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(100, 200)
    }
}
```

运行测试：

```bash
# 运行所有测试
go test ./...

# 运行特定测试
go test -run TestAdd

# 显示详细输出
go test -v

# 运行基准测试
go test -bench=.

# 测试覆盖率
go test -cover
go test -coverprofile=coverage.out
go tool cover -html=coverage.out
```

---

## 十四、最佳实践

### 1. 代码组织
- 使用有意义的包名（小写、简短）
- `internal` 包用于私有代码
- `cmd` 目录放置可执行程序入口

### 2. 错误处理
- 总是检查错误返回值
- 使用 `%w` 包装错误以保留上下文
- 定义哨兵错误用于比较

### 3. 并发编程
- 不要通过共享内存来通信，通过通信来共享内存
- 使用 `context` 控制 Goroutine 生命周期
- 注意 Goroutine 泄漏

### 4. 性能优化
- 预分配切片容量：`make([]int, 0, expectedSize)`
- 使用 `strings.Builder` 拼接字符串
- 避免不必要的内存分配
- 使用 `sync.Pool` 复用对象

### 5. 接口设计
- 接口应该小而精
- 在消费端定义接口，而非提供端
- 接受接口，返回结构体

---

## 总结

Go 语言以其简洁、高效、并发友好的特性，成为云原生时代的首选语言之一。掌握上述核心知识点，能够帮助你：

1. **编写高效代码**：理解类型系统和内存管理
2. **构建并发程序**：熟练使用 Goroutine 和 Channel
3. **处理错误**：遵循 Go 的错误处理惯例
4. **组织项目**：使用 Go Modules 管理依赖

继续学习建议：
- 深入阅读 [Go 官方文档](https://go.dev/doc/)
- 学习 [Effective Go](https://go.dev/doc/effective_go)
- 实践标准库，如 `context`、`io`、`database/sql`
- 探索流行框架：Gin、Echo、GORM 等
