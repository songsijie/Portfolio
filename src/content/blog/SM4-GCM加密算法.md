---
title: "SM4-GCM 算法完整总结"
description: "SM4-GCM（Galois/Counter Mode）是一种结合加密与认证的对称加密算法，适用于高性能和高安全性场景。以下是其核心要点"
publishDate: 2025-05-23
tags: ["SM4-GCM","加密算法🔐"]
---


### **1. 核心参数及意义**
| 参数                | 作用与要求                                                                 | 长度要求                   | 是否保密 |
|---------------------|--------------------------------------------------------------------------|--------------------------|--------|
| **密钥（Key）**      | 加密和解密的唯一凭证，直接影响安全性。                                     | 128 位（16 字节）         | ✅ 必须保密 |
| **初始化向量（IV）** | 初始化计数器块，确保同一密钥下每次加密的密钥流不同。                       | 推荐 12 字节（96 位）      | ❌ 可明文传输（需唯一） |
| **附加数据（AAD）**  | 提供额外数据的完整性保护（如协议头、元数据），不加密但参与认证。           | 任意长度（包括 0 字节）    | ❌ 可明文传输 |
| **认证标签（Tag）**  | 验证密文和 AAD 的完整性与真实性，防止篡改。                                | 推荐 16 字节（128 位）     | ❌ 可明文传输（需防篡改） |
| **明文/密文**        | 待加密的原始数据（明文）或加密后的结果（密文）。                           | 与输入长度一致（无填充）   | 明文需保密，密文明文传输 |

---

### **2. 加密流程**
1. **生成 IV**  
   - 使用随机数或计数器生成 **唯一** 的 IV（推荐 12 字节）。
2. **初始化计数器块**  
   - 基于 IV 生成初始计数器块（Counter Block）。
3. **生成密钥流**  
   - 使用 SM4 算法加密计数器块，生成密钥流。
4. **加密明文**  
   - 明文与密钥流按位异或（XOR），生成密文。
5. **生成认证标签（Tag）**  
   - 对 AAD 和密文进行 GHASH 哈希计算。
   - 加密初始计数器块，与 GHASH 结果异或，截断为指定长度（如 16 字节）。

**伪代码**：
```python
def sm4_gcm_encrypt(key, iv, plaintext, aad):
    counter_block = generate_counter_block(iv)
    keystream = sm4_encrypt(key, counter_block)
    ciphertext = plaintext ^ keystream
    ghash_result = ghash(aad, ciphertext)
    tag = truncate(ghash_result ^ sm4_encrypt(key, initial_counter_block))
    return ciphertext, tag
```

---

### **3. 解密流程**
1. **提取 IV**  
   - 从输入数据中解析出 IV（需与加密时的 IV 一致）。
2. **生成密钥流**  
   - 使用相同的密钥和 IV 生成密钥流。
3. **解密密文**  
   - 密文与密钥流异或，恢复明文。
4. **重新计算 Tag**  
   - 使用相同的密钥、IV、AAD 和密文重新生成 Tag。
5. **验证 Tag**  
   - 比对输入的 Tag 与重新计算的 Tag，一致则输出明文，否则拒绝解密。

**伪代码**：
```python
def sm4_gcm_decrypt(key, iv, ciphertext, tag, aad):
    counter_block = generate_counter_block(iv)
    keystream = sm4_encrypt(key, counter_block)
    plaintext = ciphertext ^ keystream
    recalculated_tag = generate_tag(key, iv, ciphertext, aad)
    if tag != recalculated_tag:
        raise AuthenticationError("Tag 验证失败")
    return plaintext
```

---

### **4. 一般约定规则**
#### **IV 的生成与管理**
- **唯一性**：同一密钥下 IV 必须全局唯一（推荐使用强随机数或计数器）。
- **推荐长度**：12 字节（96 位），避免 GHASH 转换带来的性能损耗。
- **传输方式**：IV 可明文传输，但需与密文和 Tag 绑定。

#### **数据序列化格式**
- **常见格式**：`[IV][密文][Tag]`（紧凑型）或 `[IV长度][IV][Tag长度][Tag][AAD长度][AAD][密文]`（自描述型）。
- **标准协议**：参考 TLS 1.3 或 AWS 加密 SDK 的序列化方式。

#### **AAD 的使用**
- **可选性**：若加密时未使用 AAD，解密时可不提供。
- **完整性保护**：AAD 需与加密时完全一致，否则 Tag 验证失败。

#### **错误处理**
- **Tag 验证失败**：必须立即终止解密，不输出任何明文。
- **IV 重复**：系统应拒绝重复 IV 的加密请求。

---

### **5. 安全注意事项**
1. **密钥管理**  
   - 密钥需通过安全渠道分发，避免硬编码或日志泄露。
2. **IV 唯一性**  
   - 禁止重复使用 IV（同一密钥下），否则导致密钥流复用攻击。
3. **Tag 验证**  
   - 未经验证的明文不可信，需在解密前完成 Tag 校验。
4. **随机数生成**  
   - 使用密码学安全的随机数生成器（CSPRNG）生成 IV。
5. **协议兼容性**  
   - 跨系统通信时需严格统一数据格式和参数长度。

---

### **6. 典型应用场景**
- **网络通信**：TLS 加密、API 请求保护。
- **数据存储**：加密数据库字段或文件。
- **物联网（IoT）**：设备间安全通信。

---

### **7. 示例数据包结构**
#### **紧凑型（无 AAD）**
```text
[IV:12字节][密文][Tag:16字节]
```
#### **自描述型（含 AAD）**
```text
[IV长度:1字节][IV][Tag长度:1字节][Tag][AAD长度:2字节][AAD][密文]
```

---

### **总结**
SM4-GCM 通过结合加密与认证，提供高效且安全的通信保障。其核心依赖**密钥保密性**、**IV 唯一性**和**Tag 验证**。实际应用中需严格遵循协议规范，避免因参数错误或协议歧义导致的安全漏洞。