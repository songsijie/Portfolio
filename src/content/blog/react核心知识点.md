---
title: "React核心知识点：从基础到进阶的完全指南"
description: "深入讲解React的核心概念、Hooks、性能优化、状态管理和工程化实践，掌握现代React开发的最佳实践"
pubDate: 2025-10-31
tags: ["React", "JavaScript", "前端框架", "Hooks", "性能优化"]
---

# React核心知识点：从基础到进阶的完全指南

## 什么是React？

React是一个用于构建用户界面的JavaScript库，由Facebook开发和维护。它采用组件化的开发方式，通过虚拟DOM实现高效的界面更新。

### 核心特点

- 🎯 **声明式UI**：描述UI应该是什么样子，而不是如何修改
- 🧩 **组件化**：将UI拆分为独立、可复用的组件
- ⚡ **虚拟DOM**：高效的DOM diff算法，最小化实际DOM操作
- 🔄 **单向数据流**：数据自顶向下流动，易于理解和调试
- 🌐 **Learn Once, Write Anywhere**：可用于Web、移动端（React Native）、VR等

## 一、JSX与组件基础

### JSX是什么？

JSX是JavaScript的语法扩展，让你在JavaScript中编写类似HTML的代码。

```jsx
// JSX语法
const element = <h1>Hello, {name}!</h1>;

// 编译后的JavaScript
const element = React.createElement('h1', null, 'Hello, ', name, '!');
```

### JSX的规则

```jsx
// 1. 必须有一个根元素
// ❌ 错误
return (
  <h1>Title</h1>
  <p>Content</p>
);

// ✅ 正确 - 使用Fragment
return (
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);

// 2. 所有标签必须闭合
<input type="text" /> // 自闭合标签
<div></div> // 成对标签

// 3. 使用驼峰命名法
<div className="container" onClick={handleClick}>
  <label htmlFor="name">Name:</label>
  <input type="text" id="name" />
</div>

// 4. 嵌入JavaScript表达式
const user = { name: 'John', age: 25 };
const element = (
  <div>
    <h1>{user.name}</h1>
    <p>Age: {user.age * 2}</p>
    {user.age >= 18 && <span>Adult</span>}
  </div>
);
```

### 函数组件 vs 类组件

```jsx
// 函数组件（推荐）
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// 箭头函数形式
const Welcome = ({ name }) => {
  return <h1>Hello, {name}</h1>;
};

// 类组件（旧式写法）
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

### Props：组件通信

```jsx
// 父组件向子组件传递数据
function Parent() {
  const user = { name: 'John', age: 25 };
  
  return (
    <Child 
      name={user.name} 
      age={user.age}
      onUpdate={(newName) => console.log(newName)}
    />
  );
}

// 子组件接收props
function Child({ name, age, onUpdate }) {
  return (
    <div>
      <h1>{name} - {age}</h1>
      <button onClick={() => onUpdate('New Name')}>
        Update
      </button>
    </div>
  );
}

// props默认值和类型检查
import PropTypes from 'prop-types';

function Greeting({ name = 'Guest', age }) {
  return <h1>Hello, {name}!</h1>;
}

Greeting.propTypes = {
  name: PropTypes.string,
  age: PropTypes.number.isRequired
};
```

## 二、State与Hooks

### useState：状态管理

```jsx
import { useState } from 'react';

function Counter() {
  // 声明状态变量
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(prev => prev + 1)}>+1 (函数式)</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// 多个状态变量
function Form() {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  const [email, setEmail] = useState('');
  
  // 或使用对象管理
  const [form, setForm] = useState({
    name: '',
    age: 0,
    email: ''
  });
  
  const handleChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <form>
      <input 
        value={form.name} 
        onChange={(e) => handleChange('name', e.target.value)}
      />
    </form>
  );
}
```

### 状态更新的注意事项

```jsx
function Example() {
  const [count, setCount] = useState(0);
  
  // ❌ 错误：基于旧值的多次更新
  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1); // 两次都是基于相同的count值
    // 最终只增加1
  };
  
  // ✅ 正确：使用函数式更新
  const handleClickCorrect = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1); // 基于上一次的结果
    // 最终增加2
  };
  
  // ❌ 错误：直接修改对象/数组
  const [user, setUser] = useState({ name: 'John', age: 25 });
  const updateWrong = () => {
    user.age = 26; // 不会触发重新渲染
    setUser(user);
  };
  
  // ✅ 正确：创建新对象
  const updateCorrect = () => {
    setUser({ ...user, age: 26 });
  };
  
  return <button onClick={handleClickCorrect}>Click</button>;
}
```

### useEffect：副作用处理

```jsx
import { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);
  
  // 1. 每次渲染后都执行（无依赖数组）
  useEffect(() => {
    console.log('组件渲染了');
  });
  
  // 2. 仅在挂载时执行（空依赖数组）
  useEffect(() => {
    console.log('组件挂载了');
    
    // 清理函数：在组件卸载时执行
    return () => {
      console.log('组件卸载了');
    };
  }, []);
  
  // 3. 依赖项变化时执行
  useEffect(() => {
    console.log(`Count变化了: ${count}`);
  }, [count]);
  
  // 4. 数据获取示例
  useEffect(() => {
    let cancelled = false;
    
    async function fetchData() {
      try {
        const response = await fetch(`/api/data/${count}`);
        const data = await response.json();
        
        if (!cancelled) {
          setData(data);
        }
      } catch (error) {
        console.error(error);
      }
    }
    
    fetchData();
    
    // 清理函数：取消请求
    return () => {
      cancelled = true;
    };
  }, [count]);
  
  return <div>Count: {count}</div>;
}
```

### useEffect常见陷阱

```jsx
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  // ❌ 陷阱1：缺少依赖项
  useEffect(() => {
    fetchResults(query); // ESLint会警告
  }, []); // 缺少query依赖
  
  // ❌ 陷阱2：无限循环
  useEffect(() => {
    setResults([...results, newItem]); // 每次更新results都会触发
  }, [results]); // 导致无限循环
  
  // ✅ 解决方案：使用函数式更新
  useEffect(() => {
    setResults(prev => [...prev, newItem]);
  }, []); // 不依赖results
  
  // ✅ 防抖搜索示例
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 500);
    
    return () => clearTimeout(timer); // 清理定时器
  }, [query]);
}
```

### useRef：引用DOM和保存值

```jsx
import { useRef, useEffect } from 'react';

function TextInput() {
  const inputRef = useRef(null);
  
  useEffect(() => {
    // 自动聚焦
    inputRef.current.focus();
  }, []);
  
  return <input ref={inputRef} type="text" />;
}

// 保存可变值（不触发重新渲染）
function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);
  
  const start = () => {
    if (intervalRef.current !== null) return;
    
    intervalRef.current = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  };
  
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  useEffect(() => {
    return () => stop(); // 清理
  }, []);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

### useReducer：复杂状态管理

```jsx
import { useReducer } from 'react';

// 定义reducer
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    case 'set':
      return { count: action.payload };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      <button onClick={() => dispatch({ type: 'set', payload: 10 })}>Set 10</button>
    </div>
  );
}

// 复杂表单管理
function FormWithReducer() {
  const [form, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'update':
          return { ...state, [action.field]: action.value };
        case 'reset':
          return { name: '', email: '', age: 0 };
        default:
          return state;
      }
    },
    { name: '', email: '', age: 0 }
  );
  
  return (
    <form>
      <input
        value={form.name}
        onChange={(e) => dispatch({ 
          type: 'update', 
          field: 'name', 
          value: e.target.value 
        })}
      />
    </form>
  );
}
```

### useMemo和useCallback：性能优化

```jsx
import { useState, useMemo, useCallback } from 'react';

function ExpensiveComponent() {
  const [count, setCount] = useState(0);
  const [input, setInput] = useState('');
  
  // ❌ 每次渲染都会重新计算
  const expensiveValue = calculateExpensiveValue(count);
  
  // ✅ 只在count变化时重新计算
  const memoizedValue = useMemo(() => {
    console.log('计算中...');
    return calculateExpensiveValue(count);
  }, [count]);
  
  // ❌ 每次渲染都创建新函数
  const handleClick = () => {
    console.log(count);
  };
  
  // ✅ 缓存函数引用
  const memoizedCallback = useCallback(() => {
    console.log(count);
  }, [count]);
  
  return (
    <div>
      <p>Value: {memoizedValue}</p>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <ChildComponent onClick={memoizedCallback} />
    </div>
  );
}

// 子组件使用React.memo避免不必要的渲染
const ChildComponent = React.memo(({ onClick }) => {
  console.log('ChildComponent渲染');
  return <button onClick={onClick}>Click</button>;
});
```

### useContext：跨组件通信

```jsx
import { createContext, useContext, useState } from 'react';

// 创建Context
const ThemeContext = createContext();
const UserContext = createContext();

// Provider组件
function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState({ name: 'John' });
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <UserContext.Provider value={{ user, setUser }}>
        <Header />
        <Main />
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

// 消费Context
function Header() {
  const { theme, setTheme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);
  
  return (
    <header style={{ background: theme === 'dark' ? '#333' : '#fff' }}>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </header>
  );
}

// 自定义Hook封装Context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

function Component() {
  const { theme } = useTheme();
  return <div>Current theme: {theme}</div>;
}
```

### 自定义Hooks

```jsx
// 1. useFetch：数据获取
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url);
        const json = await response.json();
        
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [url]);
  
  return { data, loading, error };
}

// 使用
function UserList() {
  const { data, loading, error } = useFetch('/api/users');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 2. useLocalStorage：本地存储
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setStoredValue = (newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [value, setStoredValue];
}

// 使用
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current: {theme}
    </button>
  );
}

// 3. useDebounce：防抖
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// 使用
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      // 执行搜索
      fetchResults(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## 三、列表渲染与条件渲染

### 列表渲染

```jsx
function UserList() {
  const users = [
    { id: 1, name: 'John', age: 25 },
    { id: 2, name: 'Jane', age: 30 },
    { id: 3, name: 'Bob', age: 35 }
  ];
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}> {/* key必须唯一且稳定 */}
          {user.name} - {user.age}
        </li>
      ))}
    </ul>
  );
}

// ❌ 错误：使用index作为key（列表可能变化时）
{users.map((user, index) => (
  <li key={index}>{user.name}</li> // 可能导致性能问题和bug
))}

// ✅ 正确：使用稳定的唯一标识
{users.map(user => (
  <li key={user.id}>{user.name}</li>
))}
```

### 条件渲染

```jsx
function LoginStatus({ isLoggedIn, user }) {
  // 1. if/else
  if (isLoggedIn) {
    return <h1>Welcome back, {user.name}!</h1>;
  } else {
    return <h1>Please sign in.</h1>;
  }
  
  // 2. 三元运算符
  return (
    <div>
      {isLoggedIn ? (
        <h1>Welcome back, {user.name}!</h1>
      ) : (
        <h1>Please sign in.</h1>
      )}
    </div>
  );
  
  // 3. 逻辑与运算符
  return (
    <div>
      {isLoggedIn && <h1>Welcome back, {user.name}!</h1>}
      {!isLoggedIn && <button>Login</button>}
    </div>
  );
  
  // 4. 立即执行函数
  return (
    <div>
      {(() => {
        if (user.role === 'admin') {
          return <AdminPanel />;
        } else if (user.role === 'user') {
          return <UserPanel />;
        } else {
          return <GuestPanel />;
        }
      })()}
    </div>
  );
}
```

## 四、表单处理

### 受控组件

```jsx
function Form() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    gender: 'male',
    interests: [],
    agree: false
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleCheckboxGroup = (e) => {
    const { value, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      interests: checked
        ? [...prev.interests, value]
        : prev.interests.filter(item => item !== value)
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('提交数据:', formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 文本输入 */}
      <input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="Username"
      />
      
      {/* 邮箱输入 */}
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      
      {/* 密码输入 */}
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
      />
      
      {/* 数字输入 */}
      <input
        type="number"
        name="age"
        value={formData.age}
        onChange={handleChange}
        placeholder="Age"
      />
      
      {/* 单选框 */}
      <label>
        <input
          type="radio"
          name="gender"
          value="male"
          checked={formData.gender === 'male'}
          onChange={handleChange}
        />
        Male
      </label>
      <label>
        <input
          type="radio"
          name="gender"
          value="female"
          checked={formData.gender === 'female'}
          onChange={handleChange}
        />
        Female
      </label>
      
      {/* 复选框组 */}
      <label>
        <input
          type="checkbox"
          value="reading"
          checked={formData.interests.includes('reading')}
          onChange={handleCheckboxGroup}
        />
        Reading
      </label>
      <label>
        <input
          type="checkbox"
          value="sports"
          checked={formData.interests.includes('sports')}
          onChange={handleCheckboxGroup}
        />
        Sports
      </label>
      
      {/* 单个复选框 */}
      <label>
        <input
          type="checkbox"
          name="agree"
          checked={formData.agree}
          onChange={handleChange}
        />
        I agree to terms
      </label>
      
      {/* 下拉选择 */}
      <select
        name="country"
        value={formData.country}
        onChange={handleChange}
      >
        <option value="">Select country</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
        <option value="cn">China</option>
      </select>
      
      {/* 文本域 */}
      <textarea
        name="bio"
        value={formData.bio}
        onChange={handleChange}
        placeholder="Tell us about yourself"
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 表单验证

```jsx
function FormWithValidation() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) {
          return 'Email is required';
        }
        if (!/\S+@\S+\.\S+/.test(value)) {
          return 'Email is invalid';
        }
        return '';
      
      case 'password':
        if (!value) {
          return 'Password is required';
        }
        if (value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        return '';
      
      default:
        return '';
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 实时验证
    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证所有字段
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validate(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    setTouched({
      email: true,
      password: true
    });
    
    // 如果没有错误，提交表单
    if (Object.keys(newErrors).length === 0) {
      console.log('Submit:', formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Email"
        />
        {touched.email && errors.email && (
          <span className="error">{errors.email}</span>
        )}
      </div>
      
      <div>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Password"
        />
        {touched.password && errors.password && (
          <span className="error">{errors.password}</span>
        )}
      </div>
      
      <button type="submit">Login</button>
    </form>
  );
}
```

## 五、性能优化

### React.memo：避免不必要的渲染

```jsx
// 子组件
const ChildComponent = React.memo(({ count, onClick }) => {
  console.log('ChildComponent渲染');
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={onClick}>Click</button>
    </div>
  );
});

// 自定义比较函数
const ChildComponent = React.memo(
  ({ user }) => {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // 返回true表示不需要重新渲染
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### 虚拟列表：处理大量数据

```jsx
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 代码分割与懒加载

```jsx
import { lazy, Suspense } from 'react';

// 懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}

// 路由懒加载
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### 性能监控

```jsx
import { Profiler } from 'react';

function onRenderCallback(
  id, // 组件标识
  phase, // "mount" 或 "update"
  actualDuration, // 渲染耗时
  baseDuration, // 估计的渲染时间
  startTime, // 开始渲染的时间
  commitTime, // 提交渲染的时间
  interactions // 导致渲染的交互集合
) {
  console.log(`${id} ${phase} took ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <MyComponent />
    </Profiler>
  );
}
```

## 六、状态管理

### Context + useReducer（轻量方案）

```jsx
import { createContext, useContext, useReducer } from 'react';

// 定义状态和actions
const initialState = {
  user: null,
  theme: 'light',
  notifications: []
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload] 
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    default:
      return state;
  }
}

// 创建Context
const AppStateContext = createContext();
const AppDispatchContext = createContext();

// Provider组件
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// 自定义Hooks
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppProvider');
  }
  return context;
}

// 使用
function UserProfile() {
  const { user, theme } = useAppState();
  const dispatch = useAppDispatch();
  
  const handleLogin = () => {
    dispatch({
      type: 'SET_USER',
      payload: { id: 1, name: 'John' }
    });
  };
  
  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };
  
  return (
    <div style={{ background: theme === 'dark' ? '#333' : '#fff' }}>
      {user ? (
        <h1>Welcome, {user.name}!</h1>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Zustand（推荐的轻量状态库）

```jsx
import create from 'zustand';

// 创建store
const useStore = create((set) => ({
  count: 0,
  user: null,
  
  // Actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}));

// 使用
function Counter() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);
  const decrement = useStore((state) => state.decrement);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}

// 带中间件的store
import { devtools, persist } from 'zustand/middleware';

const useStore = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),
        logout: () => set({ user: null })
      }),
      {
        name: 'user-storage', // localStorage key
      }
    )
  )
);
```

## 七、路由（React Router v6）

### 基础路由

```jsx
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/users">Users</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 动态路由和参数

```jsx
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

// 路径参数
function UserDetail() {
  const { id } = useParams(); // 获取路径参数
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>User {id}</h1>
      <button onClick={() => navigate('/users')}>Back</button>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
}

// 查询参数
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const query = searchParams.get('q') || '';
  const page = searchParams.get('page') || '1';
  
  const handleSearch = (newQuery) => {
    setSearchParams({ q: newQuery, page: '1' });
  };
  
  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <p>Searching for: {query}, Page: {page}</p>
    </div>
  );
}
```

### 嵌套路由和布局

```jsx
import { Outlet } from 'react-router-dom';

// 布局组件
function Layout() {
  return (
    <div>
      <Header />
      <Sidebar />
      <main>
        <Outlet /> {/* 子路由渲染位置 */}
      </main>
      <Footer />
    </div>
  );
}

// 路由配置
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="users" element={<Users />}>
            <Route index element={<UserList />} />
            <Route path=":id" element={<UserDetail />} />
            <Route path="new" element={<NewUser />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 路由守卫

```jsx
function ProtectedRoute({ children }) {
  const { user } = useAppState();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// 使用
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// 角色权限守卫
function RoleProtectedRoute({ children, requiredRole }) {
  const { user } = useAppState();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}
```

## 八、数据获取

### Fetch API + useEffect

```jsx
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (!cancelled) {
          setUsers(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchUsers();
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### React Query（推荐）

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 数据获取
function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      return response.json();
    }
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 数据修改
function CreateUser() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (newUser) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      return response.json();
    },
    onSuccess: () => {
      // 使缓存失效，重新获取数据
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ name: 'New User' });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Creating...' : 'Create User'}
      </button>
      {mutation.isError && <div>Error: {mutation.error.message}</div>}
      {mutation.isSuccess && <div>User created!</div>}
    </form>
  );
}

// 带参数的查询
function UserDetail({ userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId], // 依赖userId
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    enabled: !!userId // 只在userId存在时执行
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{data.name}</div>;
}
```

## 九、错误处理

### Error Boundary

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    // 记录错误到日志服务
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error && this.state.error.toString()}</pre>
            <pre>{this.state.errorInfo.componentStack}</pre>
          </details>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}

// 函数式包装（使用react-error-boundary库）
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // 重置应用状态
      }}
      onError={(error, errorInfo) => {
        // 记录到日志服务
        logErrorToService(error, errorInfo);
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## 十、测试

### Jest + React Testing Library

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

// 基础渲染测试
test('renders counter with initial value', () => {
  render(<Counter initialValue={0} />);
  expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
});

// 交互测试
test('increments counter on button click', () => {
  render(<Counter initialValue={0} />);
  
  const button = screen.getByRole('button', { name: /increment/i });
  fireEvent.click(button);
  
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});

// 用户事件测试（更接近真实用户行为）
test('handles form submission', async () => {
  const handleSubmit = jest.fn();
  render(<Form onSubmit={handleSubmit} />);
  
  const user = userEvent.setup();
  const input = screen.getByPlaceholderText(/username/i);
  const button = screen.getByRole('button', { name: /submit/i });
  
  await user.type(input, 'John');
  await user.click(button);
  
  expect(handleSubmit).toHaveBeenCalledWith({ username: 'John' });
});

// 异步测试
test('loads and displays user data', async () => {
  render(<UserProfile userId={1} />);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });
});

// Mock API
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(ctx.json({ id: 1, name: 'John Doe' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 自定义Hook测试

```jsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

test('should increment counter', () => {
  const { result } = renderHook(() => useCounter(0));
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.count).toBe(1);
});

test('should reset counter', () => {
  const { result } = renderHook(() => useCounter(10));
  
  act(() => {
    result.current.reset();
  });
  
  expect(result.current.count).toBe(0);
});
```

## 十一、TypeScript与React

### 组件类型定义

```typescript
import { FC, ReactNode } from 'react';

// 函数组件类型
interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};

// 或使用更推荐的方式
function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

### Hooks类型

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

// useState
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);

// useRef
const inputRef = useRef<HTMLInputElement>(null);
const timerRef = useRef<number | null>(null);

// useCallback
const handleClick = useCallback((id: number) => {
  console.log(id);
}, []);

// 自定义Hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // ...
  }, [url]);
  
  return { data, loading, error };
}

// 使用
interface User {
  id: number;
  name: string;
}

const { data, loading, error } = useFetch<User[]>('/api/users');
```

### 事件类型

```typescript
import { ChangeEvent, FormEvent, MouseEvent } from 'react';

function Form() {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };
  
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
  };
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    console.log(e.clientX, e.clientY);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <select onChange={handleSelectChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
```

## 十二、常见模式与最佳实践

### 组合 vs 继承

```jsx
// ❌ 不推荐：继承
class FancyButton extends Button {
  // ...
}

// ✅ 推荐：组合
function FancyButton(props) {
  return (
    <Button {...props} className="fancy">
      {props.children}
    </Button>
  );
}
```

### 高阶组件（HOC）

```jsx
// 创建HOC
function withAuth(Component) {
  return function AuthComponent(props) {
    const { user } = useAppState();
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    return <Component {...props} user={user} />;
  };
}

// 使用
const ProtectedPage = withAuth(Dashboard);

// 多个HOC组合
const EnhancedComponent = withAuth(withTheme(withRouter(MyComponent)));
```

### Render Props

```jsx
// Render Props组件
function Mouse({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return render(position);
}

// 使用
function App() {
  return (
    <Mouse
      render={({ x, y }) => (
        <h1>鼠标位置: ({x}, {y})</h1>
      )}
    />
  );
}

// 使用children函数
function Mouse({ children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // ...
  return children(position);
}

<Mouse>
  {({ x, y }) => <h1>({x}, {y})</h1>}
</Mouse>
```

### Compound Components（复合组件）

```jsx
// 创建Context
const TabsContext = createContext();

// 主组件
function Tabs({ children, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

// 子组件
function TabList({ children }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ id, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  
  return (
    <button
      className={activeTab === id ? 'active' : ''}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

function TabPanel({ id, children }) {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== id) return null;
  
  return <div className="tab-panel">{children}</div>;
}

// 组合到Tabs上
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// 使用
function App() {
  return (
    <Tabs defaultTab="home">
      <Tabs.List>
        <Tabs.Tab id="home">Home</Tabs.Tab>
        <Tabs.Tab id="about">About</Tabs.Tab>
      </Tabs.List>
      
      <Tabs.Panel id="home">
        <h1>Home Content</h1>
      </Tabs.Panel>
      
      <Tabs.Panel id="about">
        <h1>About Content</h1>
      </Tabs.Panel>
    </Tabs>
  );
}
```

## 十三、React 18新特性

### Concurrent Features

```jsx
import { startTransition, useDeferredValue, useTransition } from 'react';

// useTransition：标记低优先级更新
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value); // 高优先级更新
    
    startTransition(() => {
      // 低优先级更新
      setResults(filterResults(value));
    });
  };
  
  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultList results={results} />
    </div>
  );
}

// useDeferredValue：延迟值的更新
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => {
    return filterResults(deferredQuery);
  }, [deferredQuery]);
  
  return (
    <div>
      {query !== deferredQuery && <Spinner />}
      <ResultList results={results} />
    </div>
  );
}
```

### Automatic Batching

```jsx
// React 18之前：只在事件处理器中批量更新
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 只触发一次重新渲染
}

// React 18：所有更新都自动批量处理
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 也只触发一次重新渲染
}, 1000);

// 如果需要退出批量更新
import { flushSync } from 'react-dom';

flushSync(() => {
  setCount(c => c + 1);
}); // 立即重新渲染

setFlag(f => !f); // 再次重新渲染
```

### Suspense for Data Fetching

```jsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
      <Suspense fallback={<PostsLoading />}>
        <Posts />
      </Suspense>
    </Suspense>
  );
}

// 使用支持Suspense的数据获取库（如React Query、SWR）
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile() {
  const { data } = useSuspenseQuery({
    queryKey: ['user'],
    queryFn: fetchUser
  });
  
  return <div>{data.name}</div>;
}
```

## 十四、性能调试与优化技巧

### React DevTools

```jsx
// 1. Profiler录制性能
// 在DevTools的Profiler标签中点击录制按钮

// 2. 高亮更新的组件
// 在DevTools设置中启用"Highlight updates when components render"

// 3. 查看组件的props和state
// 在Components标签中选择组件

// 4. 查看组件的渲染原因
// 在Profiler中查看"Why did this render?"
```

### 常见性能问题

```jsx
// 问题1：在渲染中创建新对象/数组/函数
function Parent() {
  return (
    <Child
      user={{ name: 'John' }} // ❌ 每次都是新对象
      items={[1, 2, 3]} // ❌ 每次都是新数组
      onClick={() => console.log('click')} // ❌ 每次都是新函数
    />
  );
}

// 解决方案
function Parent() {
  const user = useMemo(() => ({ name: 'John' }), []);
  const items = useMemo(() => [1, 2, 3], []);
  const handleClick = useCallback(() => console.log('click'), []);
  
  return <Child user={user} items={items} onClick={handleClick} />;
}

// 问题2：使用index作为key
{items.map((item, index) => (
  <div key={index}>{item}</div> // ❌ 列表可能重排
))}

// 解决方案：使用稳定的唯一标识
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// 问题3：大列表渲染
function LargeList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />); // ❌ 可能卡顿
}

// 解决方案：使用虚拟滚动
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          <Item {...items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

## 总结与学习建议

### 学习路径

1. **基础阶段**
   - JSX语法和组件基础
   - Props和State
   - 事件处理和表单
   - 列表渲染和条件渲染

2. **进阶阶段**
   - Hooks深入（useEffect、useRef、useCallback等）
   - 自定义Hooks
   - Context API
   - 性能优化

3. **高级阶段**
   - 状态管理（Zustand/Redux）
   - 路由（React Router）
   - 数据获取（React Query）
   - TypeScript集成
   - 测试

4. **工程化阶段**
   - 构建工具（Vite/Webpack）
   - 代码规范（ESLint/Prettier）
   - CI/CD
   - SSR/SSG（Next.js）

### 最佳实践总结

✅ **DO（推荐）**
- 使用函数组件和Hooks
- 保持组件小而专注
- 使用TypeScript增强类型安全
- 合理使用memo、useMemo、useCallback
- 编写测试覆盖关键逻辑
- 使用React DevTools调试
- 遵循命名规范（组件大写，函数小写）

❌ **DON'T（不推荐）**
- 在渲染中执行副作用
- 直接修改state
- 过度优化（premature optimization）
- 在循环/条件中使用Hooks
- 忘记清理副作用（定时器、订阅等）
- 使用index作为key（动态列表）

### 参考资源

- 📚 [React官方文档](https://react.dev/)
- 📺 [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools)
- 📖 [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- 🎓 [React Patterns](https://reactpatterns.com/)
- 🔧 [Vite](https://vitejs.dev/) - 推荐的构建工具
- 📦 [React Query](https://tanstack.com/query/latest) - 数据获取
- 🗂️ [Zustand](https://github.com/pmndrs/zustand) - 状态管理

---

> 持续学习，关注React RFC和生态发展，在实战中不断总结和优化！
