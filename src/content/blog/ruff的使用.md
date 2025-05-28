---
title: "Ruff：Python代码格式化工具"
description: "Ruff：Python代码格式化工具"
publishDate: 2025-05-22
tags: ["python", "代码格式化工具"]
---


# Ruff：Python代码格式化工具

## 什么是Ruff？

Ruff是一个高性能的Python代码检查和格式化工具，用Rust语言编写，比传统工具(如flake8、black、isort等)快10-100倍。它可以替代多个Python代码工具，一站式解决代码质量问题。

## 用途

1. **代码检查**：发现潜在问题、错误和不规范代码
2. **代码格式化**：统一代码风格，美化代码
3. **自动修复**：自动修复常见问题
4. **性能优化**：比传统工具快很多，适合大型项目

Ruff可替代：flake8、black、isort、pyupgrade、pydocstyle等多个工具。

## 如何使用

### 1. 安装

```bash
pip install ruff
```

### 2. 基本命令

```bash
# 检查代码
ruff check .

# 自动修复问题
ruff check --fix .

# 格式化代码
ruff format .
```

### 3. 配置方法

在`pyproject.toml`文件中配置：

```toml
[project]
name = "5py"
version = "0.1.0"
requires-python = ">=3.12"

[tool.ruff]
line-length = 150
target-version = "py312"
exclude = ["migrations", ".venv", "venv", ".vscode", ".git"]
fix = true  # 允许自动修复（等效于 ruff --fix）

[tool.ruff.lint]
preview = true  # 启用实验性规则
select = [
    "E",   # Pycodestyle 错误
    "F",   # Pyflakes
    "I",   # isort（导入排序）
    "B",   # Bug 预防
    "W",   # 警告
    "C",   # 复杂度
    "N",   # PEP 8 命名约定
    "UP",  # Pyupgrade（自动升级语法）
    "PT",  # Pytest
    "PTH", # 路径处理建议
    "SIM", # 简化表达式
    "C90", # 复杂度
]
ignore = [
    "F403",
    "B008",
    "B904",
    "E501",
    "N805",
    "SIM112",
]
fixable = ["ALL"]

[tool.ruff.lint.mccabe]
max-complexity = 15

[tool.ruff.format]
quote-style = "double"  # 统一引号风格
skip-magic-trailing-comma = false  # 跳过魔法尾随逗号
line-ending = "auto"  # 自动检测行尾
```

### 4. 与pre-commit集成

在`.pre-commit-config.yaml`中的配置：
```yaml
- repo: https://github.com/astral-sh/ruff-pre-commit
  rev: v0.11.4
  hooks:
    - id: ruff
      args: [--fix, --show-fixes]
    - id: ruff-format
```

每次提交代码前会自动运行ruff检查和格式化。

### 5. 常见使用场景

- 提交代码前检查
- CI/CD流程中的代码质量控制
- 批量格式化现有代码库
- 统一团队代码风格

Ruff既可以作为命令行工具使用，也可以集成到VS Code、PyCharm等编辑器中，极大提高开发效率。

