---
title: "Docker 网络模式完全指南"
description: "深入解析 Docker 的 Bridge、Host、None、Container、Overlay 和 Macvlan 六种网络模式，掌握容器网络通信原理"
publishDate: 2025-11-11
tags: ["Docker", "网络", "容器", "微服务", "DevOps"]
---

Docker 网络是容器化应用通信的基础。正确理解和配置网络模式，对于构建高性能、安全的分布式系统至关重要。本文将详细介绍 Docker 的六种网络模式及其应用场景。

---

## 一、Docker 网络模式概览

| 网络模式 | 说明 | 网络隔离 | 性能 | 使用场景 |
|---------|------|---------|------|---------|
| **bridge** | 桥接模式（默认） | 容器间隔离，NAT访问外网 | ⭐⭐⭐⭐ | 单机容器通信 |
| **host** | 主机模式 | 与宿主机共享网络栈 | ⭐⭐⭐⭐⭐ | 高性能需求、网络调试 |
| **none** | 无网络模式 | 完全隔离 | N/A | 安全隔离、自定义网络 |
| **container** | 容器模式 | 共享其他容器网络 | ⭐⭐⭐⭐ | 紧密耦合的容器组 |
| **overlay** | 覆盖网络 | 跨主机容器通信 | ⭐⭐⭐ | Docker Swarm、跨主机通信 |
| **macvlan** | MAC地址虚拟化 | 容器直接连接物理网络 | ⭐⭐⭐⭐⭐ | 需要物理网络直连 |

---

## 二、Bridge 模式（桥接模式）

### 1. 工作原理

- 🔹 Docker 创建虚拟网桥 `docker0`（默认 172.17.0.0/16）
- 🔹 每个容器分配独立的虚拟网卡和 IP 地址
- 🔹 容器通过 NAT 访问外部网络
- 🔹 外部访问容器需要端口映射（-p）

### 2. 默认 Bridge 网络

```bash
# 查看网络列表
docker network ls

# 查看默认 bridge 详情
docker network inspect bridge

# 使用默认 bridge（不推荐）
docker run -d --name web1 nginx
docker run -d --name web2 nginx

# ❌ 默认 bridge 容器无法通过名称互访
docker exec web1 ping web2  # 失败
```

**默认 Bridge 的限制：**
- ❌ 容器只能通过 IP 通信，不支持服务发现
- ❌ 所有容器共享同一网络，安全性差
- ❌ 需要手动管理容器间通信

### 3. 自定义 Bridge 网络（推荐）

```bash
# 创建自定义网络
docker network create my-network

# 指定子网和网关
docker network create \
  --driver bridge \
  --subnet 192.168.100.0/24 \
  --gateway 192.168.100.1 \
  --opt com.docker.network.bridge.name=br-custom \
  custom-network

# 运行容器并连接到自定义网络
docker run -d \
  --name app1 \
  --network my-network \
  nginx

docker run -d \
  --name app2 \
  --network my-network \
  nginx

# ✅ 自定义 bridge 支持 DNS 解析
docker exec app1 ping app2  # 成功
```

### 4. 端口映射

```bash
# 随机端口映射
docker run -d -P nginx  # 自动映射所有 EXPOSE 端口

# 指定端口映射
docker run -d -p 8080:80 nginx  # 宿主机8080 -> 容器80
docker run -d -p 127.0.0.1:8080:80 nginx  # 仅本地访问
docker run -d -p 8080:80/udp nginx  # UDP 端口

# 多端口映射
docker run -d \
  -p 80:80 \
  -p 443:443 \
  -p 3000:3000 \
  myapp
```

### 5. Docker Compose 配置

```yaml
version: '3.8'

services:
  web:
    image: nginx
    networks:
      - frontend
    ports:
      - "80:80"

  app:
    image: myapp
    networks:
      - frontend
      - backend
    depends_on:
      - db

  db:
    image: postgres:14
    networks:
      - backend
    environment:
      POSTGRES_PASSWORD: example

networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
  backend:
    driver: bridge
    internal: true  # 内部网络，无法访问外网
```

---

## 三、Host 模式（主机模式）

### 1. 工作原理

- 🔹 容器直接使用宿主机的网络栈
- 🔹 容器与宿主机共享 IP 地址和端口空间
- 🔹 无需端口映射，性能最高
- ⚠️ 端口冲突风险高，安全性较低

### 2. 基本使用

```bash
# 使用 host 网络
docker run -d \
  --name web \
  --network host \
  nginx

# 查看容器网络配置（与宿主机相同）
docker exec web ip addr show

# ❌ host 模式下 -p 参数无效
docker run -d --network host -p 8080:80 nginx  # -p 被忽略
```

### 3. 适用场景

```bash
# ✅ 场景1：高性能网络应用
docker run -d \
  --network host \
  --name redis \
  redis:7

# ✅ 场景2：网络监控工具
docker run -d \
  --network host \
  --cap-add NET_ADMIN \
  nicolaka/netshoot

# ✅ 场景3：需要访问宿主机所有端口的应用
docker run -d \
  --network host \
  prometheus/prometheus
```

### 4. Docker Compose 配置

```yaml
version: '3.8'

services:
  monitoring:
    image: prometheus/prometheus
    network_mode: host
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  netdata:
    image: netdata/netdata
    network_mode: host
    cap_add:
      - SYS_PTRACE
    security_opt:
      - apparmor:unconfined
```

### 5. 注意事项

| 优点 | 缺点 |
|------|------|
| ✅ 网络性能最佳（无 NAT） | ❌ 端口冲突风险高 |
| ✅ 可以绑定到宿主机所有接口 | ❌ 容器网络不隔离，安全性低 |
| ✅ 适合需要大量网络连接的应用 | ❌ 不支持端口映射 |
| ✅ 简化网络配置 | ❌ 在 Docker Desktop（Mac/Win）上受限 |

---

## 四、None 模式（无网络模式）

### 1. 工作原理

- 🔹 容器拥有独立的网络命名空间
- 🔹 不配置任何网络接口（仅 loopback）
- 🔹 完全网络隔离

### 2. 基本使用

```bash
# 创建无网络容器
docker run -d \
  --name isolated \
  --network none \
  alpine sleep 3600

# 检查网络配置（仅有 lo）
docker exec isolated ip addr show
# 输出：
# 1: lo: <LOOPBACK,UP,LOWER_UP>
#     inet 127.0.0.1/8 scope host lo
```

### 3. 适用场景

```bash
# ✅ 场景1：安全敏感的批处理任务
docker run --rm \
  --network none \
  -v /data:/data:ro \
  myapp /scripts/process-data.sh

# ✅ 场景2：需要自定义网络配置
docker run -d \
  --name custom-net \
  --network none \
  --cap-add NET_ADMIN \
  alpine

# 手动配置网络
docker exec custom-net ip link add eth0 type veth
docker exec custom-net ip addr add 10.0.0.100/24 dev eth0

# ✅ 场景3：离线数据处理
docker run --rm \
  --network none \
  -v $(pwd)/data:/data \
  python:3.11 python /data/analyze.py
```

### 4. Docker Compose 配置

```yaml
version: '3.8'

services:
  batch-processor:
    image: myapp
    network_mode: none
    volumes:
      - ./data:/data:ro
      - ./output:/output
    command: python /app/process.py
```

---

## 五、Container 模式（容器模式）

### 1. 工作原理

- 🔹 新容器共享已存在容器的网络栈
- 🔹 两个容器使用相同的 IP 地址和端口空间
- 🔹 容器间通过 localhost 通信

### 2. 基本使用

```bash
# 创建基础容器
docker run -d \
  --name web \
  nginx

# 共享 web 容器的网络
docker run -d \
  --name sidecar \
  --network container:web \
  busybox sleep 3600

# 验证共享网络
docker exec sidecar wget -O- localhost:80  # 可以访问 nginx
```

### 3. Kubernetes Pod 模式模拟

```bash
# 模拟 Kubernetes Pod（多容器共享网络）

# 1. 创建 pause 容器（网络基础）
docker run -d \
  --name pod-infra \
  --network my-network \
  gcr.io/google_containers/pause:3.8

# 2. 应用容器（共享 pod-infra 网络）
docker run -d \
  --name app \
  --network container:pod-infra \
  -v /app:/app \
  myapp

# 3. Sidecar 容器（日志收集）
docker run -d \
  --name log-collector \
  --network container:pod-infra \
  -v /app/logs:/logs \
  fluentd

# 所有容器共享同一网络栈
docker exec app curl localhost:8080  # 访问 app
docker exec log-collector curl localhost:8080  # 同样可以访问
```

### 4. Docker Compose 配置

```yaml
version: '3.8'

services:
  app:
    image: myapp
    networks:
      - default
    ports:
      - "8080:8080"

  # Sidecar 共享 app 的网络
  monitoring:
    image: prometheus/node-exporter
    network_mode: "service:app"
    depends_on:
      - app

  # 日志收集 sidecar
  logging:
    image: fluentd
    network_mode: "service:app"
    volumes:
      - ./logs:/logs
```

### 5. 适用场景

- ✅ **Sidecar 模式**：日志收集、监控代理、服务网格
- ✅ **调试容器**：临时添加调试工具
- ✅ **紧密耦合的容器组**：需要 localhost 通信

---

## 六、Overlay 模式（覆盖网络）

### 1. 工作原理

- 🔹 跨多个 Docker 主机的虚拟网络
- 🔹 使用 VXLAN 封装实现二层网络
- 🔹 依赖键值存储（Swarm 内置，或外部 Consul/Etcd）
- 🔹 支持服务发现和负载均衡

### 2. Docker Swarm 环境

```bash
# 初始化 Swarm 集群
docker swarm init --advertise-addr 192.168.1.100

# 创建 overlay 网络
docker network create \
  --driver overlay \
  --attachable \
  my-overlay

# 在 Swarm 中部署服务
docker service create \
  --name web \
  --network my-overlay \
  --replicas 3 \
  nginx

# 查看网络详情
docker network inspect my-overlay
```

### 3. 加密 Overlay 网络

```bash
# 创建加密的 overlay 网络
docker network create \
  --driver overlay \
  --opt encrypted \
  --attachable \
  secure-overlay

# 部署服务
docker service create \
  --name secure-app \
  --network secure-overlay \
  myapp
```

### 4. Docker Compose（Swarm Stack）

```yaml
version: '3.8'

services:
  web:
    image: nginx
    networks:
      - frontend
    deploy:
      replicas: 3
      placement:
        max_replicas_per_node: 1

  app:
    image: myapp
    networks:
      - frontend
      - backend
    deploy:
      replicas: 5

  db:
    image: postgres:14
    networks:
      - backend
    environment:
      POSTGRES_PASSWORD: example
    deploy:
      placement:
        constraints:
          - node.role == manager

networks:
  frontend:
    driver: overlay
    attachable: true
  backend:
    driver: overlay
    internal: true  # 内部网络
```

### 5. 跨主机通信示例

```bash
# 主机1：创建并运行容器
docker network create -d overlay --attachable multi-host
docker run -d --name app1 --network multi-host alpine sleep 3600

# 主机2：运行容器并通信
docker run -d --name app2 --network multi-host alpine sleep 3600
docker exec app2 ping app1  # ✅ 跨主机通信成功
```

### 6. 适用场景

- ✅ **Docker Swarm 集群**：多节点服务编排
- ✅ **微服务架构**：跨主机服务通信
- ✅ **多租户环境**：网络隔离
- ⚠️ **性能考虑**：VXLAN 封装有一定开销

---

## 七、Macvlan 模式（MAC 地址虚拟化）

### 1. 工作原理

- 🔹 为容器分配独立的 MAC 地址
- 🔹 容器直接连接到物理网络
- 🔹 容器可以获得与宿主机同网段的 IP
- 🔹 无需 NAT，性能最佳

### 2. 基本配置

```bash
# 创建 macvlan 网络
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  macvlan-net

# 运行容器（获得物理网络 IP）
docker run -d \
  --name web \
  --network macvlan-net \
  --ip 192.168.1.100 \
  nginx

# 容器可以直接被物理网络访问
# 其他设备可以通过 192.168.1.100 访问
```

### 3. 子接口模式（VLAN）

```bash
# 创建 VLAN 子接口
ip link add link eth0 name eth0.10 type vlan id 10

# 创建 macvlan 网络（基于 VLAN 子接口）
docker network create -d macvlan \
  --subnet=192.168.10.0/24 \
  --gateway=192.168.10.1 \
  -o parent=eth0.10 \
  macvlan-vlan10

# 运行容器
docker run -d \
  --network macvlan-vlan10 \
  --ip 192.168.10.100 \
  myapp
```

### 4. Docker Compose 配置

```yaml
version: '3.8'

services:
  web:
    image: nginx
    networks:
      macvlan-net:
        ipv4_address: 192.168.1.100

  app:
    image: myapp
    networks:
      macvlan-net:
        ipv4_address: 192.168.1.101

networks:
  macvlan-net:
    driver: macvlan
    driver_opts:
      parent: eth0
    ipam:
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
          ip_range: 192.168.1.100/28  # 仅使用 .100-.111
```

### 5. 宿主机与容器通信

```bash
# ❌ 默认情况下宿主机无法访问 macvlan 容器

# ✅ 解决方案：创建 macvlan 子接口
ip link add macvlan-shim link eth0 type macvlan mode bridge
ip addr add 192.168.1.50/32 dev macvlan-shim
ip link set macvlan-shim up
ip route add 192.168.1.100/28 dev macvlan-shim

# 现在可以从宿主机访问容器
ping 192.168.1.100
```

### 6. 适用场景

- ✅ **传统应用迁移**：需要独立 IP 的应用
- ✅ **网络监控设备**：需要监听物理网络流量
- ✅ **DHCP 服务器**：容器提供 DHCP 服务
- ✅ **高性能网络**：绕过 Docker NAT
- ⚠️ **交换机支持**：某些交换机限制单端口 MAC 数量

---

## 八、网络模式对比

### 1. 性能对比

| 模式 | 延迟 | 吞吐量 | CPU开销 | 适用场景 |
|------|------|--------|---------|---------|
| **host** | ⭐⭐⭐⭐⭐ 最低 | ⭐⭐⭐⭐⭐ 最高 | ⭐⭐⭐⭐⭐ 最低 | 高性能应用 |
| **macvlan** | ⭐⭐⭐⭐⭐ 极低 | ⭐⭐⭐⭐⭐ 极高 | ⭐⭐⭐⭐⭐ 极低 | 物理网络直连 |
| **bridge** | ⭐⭐⭐⭐ 低 | ⭐⭐⭐⭐ 高 | ⭐⭐⭐⭐ 低 | 常规应用 |
| **overlay** | ⭐⭐⭐ 中 | ⭐⭐⭐ 中 | ⭐⭐⭐ 中 | 跨主机通信 |
| **container** | ⭐⭐⭐⭐⭐ 最低 | ⭐⭐⭐⭐⭐ 最高 | ⭐⭐⭐⭐⭐ 最低 | Sidecar模式 |

### 2. 安全隔离对比

| 模式 | 网络隔离 | 端口冲突 | 外部访问控制 | 安全评分 |
|------|---------|---------|-------------|---------|
| **bridge** | ✅ 完全隔离 | ❌ 无冲突 | ✅ 精细控制 | ⭐⭐⭐⭐⭐ |
| **host** | ❌ 无隔离 | ⚠️ 易冲突 | ❌ 共享宿主机 | ⭐⭐ |
| **none** | ✅ 完全隔离 | ❌ 无网络 | ✅ 无外部访问 | ⭐⭐⭐⭐⭐ |
| **overlay** | ✅ 逻辑隔离 | ❌ 无冲突 | ✅ 可配置 | ⭐⭐⭐⭐ |
| **macvlan** | ⚠️ 物理层隔离 | ⚠️ IP冲突风险 | ⚠️ 直接暴露 | ⭐⭐⭐ |

---

## 九、高级网络配置

### 1. 多网络连接

```bash
# 容器连接多个网络
docker network create frontend
docker network create backend

docker run -d --name app \
  --network frontend \
  myapp

# 动态连接到其他网络
docker network connect backend app

# 断开网络连接
docker network disconnect frontend app

# 查看容器网络
docker inspect app | grep -A 20 Networks
```

### 2. 网络别名（DNS）

```bash
# 设置网络别名
docker run -d \
  --name app \
  --network my-network \
  --network-alias api \
  --network-alias backend-api \
  myapp

# 其他容器可以通过别名访问
docker run --rm --network my-network alpine ping api
docker run --rm --network my-network alpine ping backend-api
```

### 3. Docker Compose 高级配置

```yaml
version: '3.8'

services:
  web:
    image: nginx
    networks:
      frontend:
        aliases:
          - web-server
          - nginx-proxy
        ipv4_address: 172.20.0.100
      backend:
        aliases:
          - web-backend

  app:
    image: myapp
    networks:
      backend:
        priority: 1000  # 默认路由优先级
      cache-network:
        priority: 100

  db:
    image: postgres:14
    networks:
      backend:
        ipv4_address: 172.21.0.100

networks:
  frontend:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
    driver_opts:
      com.docker.network.bridge.name: br-frontend
      com.docker.network.bridge.enable_icc: "true"
      com.docker.network.bridge.enable_ip_masquerade: "true"

  backend:
    driver: bridge
    internal: true  # 禁止访问外网
    ipam:
      config:
        - subnet: 172.21.0.0/16

  cache-network:
    driver: bridge
```

### 4. 端口发布模式

```bash
# 发布到所有接口
docker run -d -p 8080:80 nginx

# 发布到特定 IP
docker run -d -p 192.168.1.100:8080:80 nginx

# 发布 UDP 端口
docker run -d -p 53:53/udp dns-server

# 发布端口范围
docker run -d -p 8000-8010:8000-8010 myapp

# 随机主机端口
docker run -d -P nginx  # Docker 自动选择端口
docker port nginx       # 查看映射的端口
```

---

## 十、网络故障排查

### 1. 常用诊断命令

```bash
# 查看网络列表
docker network ls

# 查看网络详细信息
docker network inspect bridge

# 查看容器网络配置
docker inspect <container> | jq '.[0].NetworkSettings'

# 进入容器网络命名空间
docker exec -it <container> sh

# 测试容器间连通性
docker exec app1 ping app2
docker exec app1 curl http://app2:8080

# 查看容器监听端口
docker exec app netstat -tuln
# 或
docker exec app ss -tuln
```

### 2. 网络诊断工具容器

```bash
# nicolaka/netshoot：功能最全的网络诊断工具
docker run -it --rm --network container:<container-name> nicolaka/netshoot

# 常用工具
docker exec -it netshoot bash
> ping google.com
> traceroute 8.8.8.8
> nslookup example.com
> curl -I https://example.com
> tcpdump -i eth0
> iftop
> iperf3 -s
```

### 3. 常见问题排查

#### 容器无法访问外网

```bash
# 检查 DNS 配置
docker exec app cat /etc/resolv.conf

# 检查路由
docker exec app ip route

# 检查 NAT 规则
sudo iptables -t nat -L -n -v

# 检查 IP 转发
cat /proc/sys/net/ipv4/ip_forward  # 应该是 1

# 启用 IP 转发
sudo sysctl -w net.ipv4.ip_forward=1
```

#### 容器间无法通信

```bash
# 检查是否在同一网络
docker network inspect my-network

# 检查防火墙规则
sudo iptables -L DOCKER-ISOLATION-STAGE-1 -n

# 检查 bridge 设置
docker network inspect bridge | grep enable_icc  # 应该是 true

# 手动测试连接
docker exec app1 telnet app2 8080
docker exec app1 nc -zv app2 8080
```

#### 端口映射不生效

```bash
# 检查端口映射配置
docker port <container>

# 检查容器内服务是否监听
docker exec app netstat -tuln | grep 8080

# 检查 iptables NAT 规则
sudo iptables -t nat -L DOCKER -n

# 检查宿主机防火墙
sudo ufw status
sudo firewall-cmd --list-all
```

---

## 十一、安全最佳实践

### 1. 网络隔离策略

```yaml
version: '3.8'

services:
  # 前端：仅暴露 80/443
  frontend:
    image: nginx
    networks:
      - public
    ports:
      - "80:80"
      - "443:443"

  # 应用层：不暴露端口
  app:
    image: myapp
    networks:
      - public
      - private
    # 无 ports 配置

  # 数据库：完全隔离
  db:
    image: postgres:14
    networks:
      - private
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

networks:
  public:
    driver: bridge
  private:
    driver: bridge
    internal: true  # 禁止访问外网

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 2. 防火墙规则

```bash
# Docker 自定义防火墙规则
# /etc/docker/daemon.json
{
  "iptables": true,
  "ip-forward": true,
  "ip-masq": true,
  "userland-proxy": false,
  "fixed-cidr": "172.17.0.0/16"
}

# 限制容器访问特定 IP
sudo iptables -I DOCKER-USER -s 172.17.0.0/16 -d 10.0.0.0/8 -j DROP

# 限制容器访问宿主机服务
sudo iptables -I DOCKER-USER -i docker0 -d 172.17.0.1 -p tcp --dport 22 -j DROP
```

### 3. 加密网络通信

```bash
# 创建加密 overlay 网络
docker network create \
  --driver overlay \
  --opt encrypted \
  --subnet 10.0.9.0/24 \
  secure-network

# 使用 TLS 加密的服务通信
docker service create \
  --name secure-app \
  --network secure-network \
  --secret tls-cert \
  --secret tls-key \
  myapp
```

---

## 十二、生产环境实战案例

### 案例1：微服务架构

```yaml
version: '3.8'

services:
  # API 网关（公开访问）
  gateway:
    image: nginx:alpine
    networks:
      - public
      - service-mesh
    ports:
      - "80:80"
      - "443:443"
    configs:
      - source: nginx-config
        target: /etc/nginx/nginx.conf

  # 用户服务
  user-service:
    image: user-service:latest
    networks:
      service-mesh:
        aliases:
          - users
    deploy:
      replicas: 3

  # 订单服务
  order-service:
    image: order-service:latest
    networks:
      service-mesh:
        aliases:
          - orders
      database:
    deploy:
      replicas: 5

  # 数据库（完全隔离）
  postgres:
    image: postgres:14
    networks:
      - database
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_pass
    secrets:
      - db_pass
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Redis（服务间共享）
  redis:
    image: redis:7-alpine
    networks:
      - service-mesh
    command: redis-server --requirepass ${REDIS_PASSWORD}

networks:
  public:
    driver: bridge
  service-mesh:
    driver: overlay
    attachable: true
  database:
    driver: overlay
    internal: true

secrets:
  db_pass:
    external: true

configs:
  nginx-config:
    external: true

volumes:
  postgres-data:
```

### 案例2：多环境网络隔离

```yaml
# production.yml
version: '3.8'

services:
  app:
    image: myapp:prod
    networks:
      - prod-network
    deploy:
      placement:
        constraints:
          - node.labels.env == production

networks:
  prod-network:
    driver: overlay
    ipam:
      config:
        - subnet: 10.10.0.0/16

---

# staging.yml
version: '3.8'

services:
  app:
    image: myapp:staging
    networks:
      - staging-network
    deploy:
      placement:
        constraints:
          - node.labels.env == staging

networks:
  staging-network:
    driver: overlay
    ipam:
      config:
        - subnet: 10.20.0.0/16
```

---

## 十三、总结

### 1. 选择指南

| 使用场景 | 推荐模式 | 理由 |
|---------|---------|------|
| **单机开发环境** | 自定义 Bridge | 支持 DNS、易于管理、网络隔离 |
| **生产环境单机** | 自定义 Bridge + 内部网络 | 安全、稳定、可控 |
| **多主机集群** | Overlay | 原生跨主机支持、服务发现 |
| **高性能场景** | Host 或 Macvlan | 绕过网络栈、零开销 |
| **Sidecar 模式** | Container | 共享网络、简化通信 |
| **安全隔离任务** | None | 完全隔离、无网络访问 |
| **物理网络集成** | Macvlan | 独立 MAC/IP、直连物理网络 |

### 2. 核心要点

1. ✅ **默认使用自定义 Bridge**：比默认 bridge 更安全、支持 DNS
2. ✅ **生产环境使用内部网络**：数据库等服务不暴露到公网
3. ✅ **多网络分层设计**：前端、应用、数据库分别使用不同网络
4. ✅ **避免使用 Host 模式**：除非有明确的性能需求
5. ✅ **Overlay 用于跨主机**：Docker Swarm 或 Kubernetes 环境
6. ✅ **Macvlan 用于特殊场景**：需要物理网络直连时
7. ✅ **端口映射最小化**：仅暴露必要的端口
8. ✅ **使用网络别名**：简化服务发现和负载均衡
9. ✅ **定期审计网络配置**：检查未使用的网络和端口暴露
10. ✅ **监控网络流量**：及时发现异常通信

### 3. 性能优化建议

- 🚀 高性能场景优先使用 **Host** 或 **Macvlan**
- 🚀 容器间频繁通信使用 **自定义 Bridge**（同主机）或 **Overlay**（跨主机）
- 🚀 避免不必要的端口映射，使用容器名称直接通信
- 🚀 Linux 上禁用 `userland-proxy`，使用 iptables（更高效）
- 🚀 调整 MTU 避免分片（Overlay 默认 MTU 1450，可能需要调整）

通过正确选择和配置 Docker 网络模式，可以构建安全、高效、可扩展的容器化应用架构！

