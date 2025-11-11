---
title: "Vue 3 核心知识点：深入理解现代前端框架"
description: "全面讲解 Vue 3 的核心概念、响应式系统、Composition API、组件化开发和最佳实践，帮助你掌握现代前端开发"
publishDate: 2025-11-10
tags: ["Vue", "Vue3", "前端框架", "JavaScript", "Composition API"]
---

# Vue 3 核心知识点：深入理解现代前端框架

Vue 3 是一个渐进式 JavaScript 框架，用于构建用户界面。它采用声明式渲染、组件化思想和响应式数据绑定，让前端开发更加高效和优雅。Vue 3 相比 Vue 2 进行了全面重构，引入了 Composition API、更好的 TypeScript 支持和性能优化。

## 响应式系统

Vue 3 的响应式系统是框架的核心，基于 ES6 Proxy 实现，能够自动追踪依赖并在数据变化时更新视图。

### Proxy vs Object.defineProperty

Vue 3 使用 Proxy 替代了 Vue 2 的 Object.defineProperty：

```javascript
// Vue 2 的响应式实现（简化版）
function defineReactive(obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集
      return val;
    },
    set(newVal) {
      if (newVal !== val) {
        val = newVal;
        // 触发更新
      }
    }
  });
}

// Vue 3 的响应式实现（简化版）
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      // 依赖收集
      const result = Reflect.get(target, key, receiver);
      return result;
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      // 触发更新
      return result;
    }
  });
}
```

**Proxy 的优势**：
- ✅ 可以监听数组索引和 length 的变化
- ✅ 可以监听对象属性的新增和删除
- ✅ 性能更好，不需要递归遍历所有属性
- ✅ 支持 Map、Set 等数据结构

### ref 和 reactive

Vue 3 提供了两种创建响应式数据的方式：

```vue
<script setup>
import { ref, reactive } from 'vue';

// ref：适合基本类型数据
const count = ref(0);
const message = ref('Hello Vue');

// 访问和修改 ref 需要使用 .value
console.log(count.value); // 0
count.value++;

// reactive：适合对象和数组
const state = reactive({
  name: 'Vue 3',
  version: '3.4',
  features: ['Composition API', 'TypeScript']
});

// 直接访问和修改属性
console.log(state.name); // Vue 3
state.version = '3.5';

// 在模板中，ref 会自动解包
</script>

<template>
  <div>
    <!-- 不需要写 count.value -->
    <p>Count: {{ count }}</p>
    <p>{{ state.name }} - {{ state.version }}</p>
  </div>
</template>
```

### toRefs 保持响应性

解构 reactive 对象时会失去响应性，需要使用 `toRefs`：

```javascript
import { reactive, toRefs } from 'vue';

const state = reactive({
  count: 0,
  message: 'Hello'
});

// ❌ 错误：失去响应性
const { count, message } = state;

// ✅ 正确：保持响应性
const { count, message } = toRefs(state);

// 现在 count 和 message 都是 ref
count.value++;
```

### 依赖追踪原理

```javascript
import { reactive, effect } from 'vue';

const state = reactive({
  count: 0,
  doubleCount: 0
});

// effect 会自动追踪依赖
effect(() => {
  // 当 state.count 变化时，这个函数会重新执行
  state.doubleCount = state.count * 2;
  console.log('计算 doubleCount:', state.doubleCount);
});

state.count++; // 触发 effect 重新执行
// 输出：计算 doubleCount: 2
```

### 响应式最佳实践

```javascript
import { ref, reactive, readonly, shallowRef, triggerRef } from 'vue';

// 1. 使用 readonly 创建只读响应式对象
const original = reactive({ count: 0 });
const copy = readonly(original);

// copy.count++; // 警告：无法修改只读属性

// 2. 使用 shallowRef 优化性能（只追踪 .value 的变化）
const state = shallowRef({
  deeply: {
    nested: {
      value: 1
    }
  }
});

// 修改深层属性不会触发更新
state.value.deeply.nested.value = 2; // 不会触发更新

// 需要整体替换才会触发更新
state.value = {
  deeply: {
    nested: {
      value: 2
    }
  }
}; // 触发更新

// 或者手动触发更新
triggerRef(state);

// 3. 避免在响应式对象中存储不需要响应的数据
const user = reactive({
  name: 'John',
  age: 30,
  // ❌ 不好：大量静态数据
  largeStaticData: new Array(10000).fill(0)
});

// ✅ 更好：将静态数据分离
const largeStaticData = new Array(10000).fill(0);
const user2 = reactive({
  name: 'John',
  age: 30
});
```

## Composition API

Composition API 是 Vue 3 最重要的新特性之一，它提供了一种更灵活的方式来组织组件逻辑。

### setup 函数

```vue
<script>
import { ref, computed, onMounted } from 'vue';

export default {
  props: {
    title: String
  },
  setup(props, context) {
    // props 是响应式的
    console.log(props.title);
    
    // context 包含 attrs, slots, emit, expose
    const { attrs, slots, emit, expose } = context;
    
    // 定义响应式状态
    const count = ref(0);
    
    // 定义计算属性
    const doubleCount = computed(() => count.value * 2);
    
    // 定义方法
    const increment = () => {
      count.value++;
      emit('update', count.value);
    };
    
    // 生命周期钩子
    onMounted(() => {
      console.log('组件已挂载');
    });
    
    // 暴露给模板的数据和方法
    return {
      count,
      doubleCount,
      increment
    };
  }
};
</script>
```

### script setup 语法糖

更简洁的写法，推荐使用：

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';

// defineProps 是编译器宏，不需要导入
const props = defineProps({
  title: String,
  initialCount: {
    type: Number,
    default: 0
  }
});

// defineEmits 也是编译器宏
const emit = defineEmits(['update', 'delete']);

// 直接定义变量，会自动暴露给模板
const count = ref(props.initialCount);

const doubleCount = computed(() => count.value * 2);

const increment = () => {
  count.value++;
  emit('update', count.value);
};

onMounted(() => {
  console.log('组件已挂载');
});

// defineExpose 显式暴露给父组件
defineExpose({
  count,
  increment
});
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">增加</button>
  </div>
</template>
```

### 组合式函数（Composables）

将可复用的逻辑提取到独立的函数中：

```javascript
// composables/useCounter.js
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const doubleCount = computed(() => count.value * 2);
  
  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => count.value = initialValue;
  
  return {
    count,
    doubleCount,
    increment,
    decrement,
    reset
  };
}

// composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useMouse() {
  const x = ref(0);
  const y = ref(0);
  
  const update = (event) => {
    x.value = event.pageX;
    y.value = event.pageY;
  };
  
  onMounted(() => {
    window.addEventListener('mousemove', update);
  });
  
  onUnmounted(() => {
    window.removeEventListener('mousemove', update);
  });
  
  return { x, y };
}

// composables/useFetch.js
import { ref, watchEffect } from 'vue';

export function useFetch(url) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);
  
  watchEffect(async () => {
    loading.value = true;
    data.value = null;
    error.value = null;
    
    try {
      const response = await fetch(url.value);
      data.value = await response.json();
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  });
  
  return { data, error, loading };
}
```

在组件中使用：

```vue
<script setup>
import { useCounter } from '@/composables/useCounter';
import { useMouse } from '@/composables/useMouse';
import { useFetch } from '@/composables/useFetch';
import { ref } from 'vue';

// 使用计数器逻辑
const { count, doubleCount, increment, decrement } = useCounter(10);

// 使用鼠标位置追踪
const { x, y } = useMouse();

// 使用数据获取
const url = ref('https://api.example.com/data');
const { data, error, loading } = useFetch(url);
</script>

<template>
  <div>
    <div>
      <p>Count: {{ count }}, Double: {{ doubleCount }}</p>
      <button @click="increment">+</button>
      <button @click="decrement">-</button>
    </div>
    
    <p>鼠标位置: {{ x }}, {{ y }}</p>
    
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <div v-else>{{ data }}</div>
  </div>
</template>
```

### computed 和 watch

```vue
<script setup>
import { ref, computed, watch, watchEffect } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');

// 计算属性：自动追踪依赖，有缓存
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});

// 可写的计算属性
const fullNameWritable = computed({
  get() {
    return `${firstName.value} ${lastName.value}`;
  },
  set(value) {
    [firstName.value, lastName.value] = value.split(' ');
  }
});

// watch：监听特定数据源
watch(firstName, (newValue, oldValue) => {
  console.log(`firstName 从 ${oldValue} 变为 ${newValue}`);
});

// 监听多个数据源
watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  console.log('名字改变了');
});

// 监听 reactive 对象
const state = reactive({
  count: 0,
  nested: {
    value: 1
  }
});

// 深度监听
watch(
  () => state.nested,
  (newValue) => {
    console.log('nested 改变了');
  },
  { deep: true }
);

// watchEffect：自动追踪依赖
watchEffect(() => {
  // 自动追踪 firstName 和 lastName
  console.log(`Full name: ${firstName.value} ${lastName.value}`);
});

// 立即执行的 watch
watch(
  firstName,
  (newValue) => {
    console.log('firstName:', newValue);
  },
  { immediate: true }
);

// 停止监听
const stop = watch(firstName, (newValue) => {
  console.log(newValue);
});

// 调用返回的函数可以停止监听
// stop();
</script>
```

## 组件化开发

### 组件通信

#### Props 和 Emits

```vue
<!-- 子组件 ChildComponent.vue -->
<script setup>
// 定义 props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  items: {
    type: Array,
    default: () => []
  },
  // 对象类型的默认值必须从函数返回
  user: {
    type: Object,
    default: () => ({ name: 'Guest' })
  },
  // 自定义验证
  status: {
    type: String,
    validator: (value) => {
      return ['success', 'warning', 'error'].includes(value);
    }
  }
});

// 定义事件
const emit = defineEmits({
  // 基本声明
  submit: null,
  // 带验证的声明
  update: (value) => {
    if (typeof value === 'number') {
      return true;
    }
    console.warn('update 事件的值必须是数字');
    return false;
  }
});

const handleClick = () => {
  emit('submit');
  emit('update', props.count + 1);
};
</script>

<template>
  <div>
    <h3>{{ title }}</h3>
    <p>Count: {{ count }}</p>
    <button @click="handleClick">提交</button>
  </div>
</template>

<!-- 父组件 -->
<script setup>
import { ref } from 'vue';
import ChildComponent from './ChildComponent.vue';

const count = ref(0);

const handleSubmit = () => {
  console.log('提交了');
};

const handleUpdate = (newValue) => {
  count.value = newValue;
};
</script>

<template>
  <ChildComponent
    title="标题"
    :count="count"
    @submit="handleSubmit"
    @update="handleUpdate"
  />
</template>
```

#### v-model 双向绑定

```vue
<!-- 自定义输入组件 CustomInput.vue -->
<script setup>
// Vue 3 中 v-model 默认是 modelValue 和 update:modelValue
const props = defineProps({
  modelValue: String
});

const emit = defineEmits(['update:modelValue']);

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<template>
  <input
    :value="modelValue"
    @input="handleInput"
    class="custom-input"
  />
</template>

<!-- 使用组件 -->
<script setup>
import { ref } from 'vue';
import CustomInput from './CustomInput.vue';

const text = ref('');
</script>

<template>
  <!-- 等价于 :model-value="text" @update:model-value="text = $event" -->
  <CustomInput v-model="text" />
  <p>输入的内容: {{ text }}</p>
</template>
```

多个 v-model：

```vue
<!-- MultiInput.vue -->
<script setup>
defineProps({
  firstName: String,
  lastName: String
});

defineEmits(['update:firstName', 'update:lastName']);
</script>

<template>
  <div>
    <input
      :value="firstName"
      @input="$emit('update:firstName', $event.target.value)"
      placeholder="名"
    />
    <input
      :value="lastName"
      @input="$emit('update:lastName', $event.target.value)"
      placeholder="姓"
    />
  </div>
</template>

<!-- 使用 -->
<script setup>
import { ref } from 'vue';
import MultiInput from './MultiInput.vue';

const firstName = ref('');
const lastName = ref('');
</script>

<template>
  <MultiInput
    v-model:first-name="firstName"
    v-model:last-name="lastName"
  />
  <p>全名: {{ firstName }} {{ lastName }}</p>
</template>
```

#### Provide / Inject

跨层级组件通信：

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref, readonly } from 'vue';

const theme = ref('dark');
const userInfo = ref({
  name: 'John',
  role: 'admin'
});

// 提供响应式数据
provide('theme', readonly(theme));
provide('userInfo', readonly(userInfo));

// 提供方法
provide('updateTheme', (newTheme) => {
  theme.value = newTheme;
});

// 使用 Symbol 作为 key 避免冲突
const ThemeSymbol = Symbol('theme');
provide(ThemeSymbol, theme);
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue';

// 注入数据
const theme = inject('theme');
const userInfo = inject('userInfo');
const updateTheme = inject('updateTheme');

// 提供默认值
const locale = inject('locale', 'zh-CN');

// 使用工厂函数作为默认值
const config = inject('config', () => ({ mode: 'development' }));

const changeTheme = () => {
  updateTheme('light');
};
</script>

<template>
  <div :class="`theme-${theme}`">
    <p>用户: {{ userInfo.name }}</p>
    <button @click="changeTheme">切换主题</button>
  </div>
</template>
```

#### Slots 插槽

```vue
<!-- Card.vue -->
<script setup>
defineProps({
  title: String
});
</script>

<template>
  <div class="card">
    <!-- 具名插槽 -->
    <header v-if="$slots.header">
      <slot name="header"></slot>
    </header>
    
    <!-- 默认插槽 -->
    <main>
      <slot></slot>
    </main>
    
    <!-- 作用域插槽：向插槽传递数据 -->
    <footer v-if="$slots.footer">
      <slot name="footer" :title="title"></slot>
    </footer>
  </div>
</template>

<!-- 使用插槽 -->
<template>
  <Card title="卡片标题">
    <!-- 具名插槽 -->
    <template #header>
      <h2>这是头部</h2>
    </template>
    
    <!-- 默认插槽 -->
    <p>这是卡片内容</p>
    
    <!-- 作用域插槽：接收数据 -->
    <template #footer="{ title }">
      <p>底部 - {{ title }}</p>
    </template>
  </Card>
</template>
```

动态插槽：

```vue
<script setup>
import { ref } from 'vue';

const slotName = ref('header');
</script>

<template>
  <Card>
    <template #[slotName]>
      动态插槽内容
    </template>
  </Card>
</template>
```

### 动态组件和异步组件

```vue
<script setup>
import { ref, defineAsyncComponent, shallowRef } from 'vue';
import ComponentA from './ComponentA.vue';
import ComponentB from './ComponentB.vue';

// 动态组件
const currentComponent = shallowRef(ComponentA);

const switchComponent = () => {
  currentComponent.value = 
    currentComponent.value === ComponentA ? ComponentB : ComponentA;
};

// 异步组件：懒加载
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);

// 带选项的异步组件
const AsyncComponentWithOptions = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200, // 显示加载组件前的延迟
  timeout: 3000 // 超时时间
});
</script>

<template>
  <button @click="switchComponent">切换组件</button>
  
  <!-- 动态组件 -->
  <component :is="currentComponent" />
  
  <!-- keep-alive 缓存组件状态 -->
  <keep-alive>
    <component :is="currentComponent" />
  </keep-alive>
  
  <!-- 异步组件 -->
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>
```

## 生命周期

### 生命周期钩子对比

```vue
<script setup>
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onActivated,
  onDeactivated
} from 'vue';

// 组件挂载前
onBeforeMount(() => {
  console.log('组件即将挂载');
});

// 组件挂载后（可以访问 DOM）
onMounted(() => {
  console.log('组件已挂载');
  // 适合：
  // - 访问 DOM
  // - 发起网络请求
  // - 设置定时器
  // - 添加事件监听
});

// 组件更新前
onBeforeUpdate(() => {
  console.log('组件即将更新');
});

// 组件更新后
onUpdated(() => {
  console.log('组件已更新');
  // 注意：避免在这里修改状态，可能导致无限循环
});

// 组件卸载前
onBeforeUnmount(() => {
  console.log('组件即将卸载');
  // 适合清理工作
});

// 组件卸载后
onUnmounted(() => {
  console.log('组件已卸载');
  // 适合：
  // - 清除定时器
  // - 移除事件监听
  // - 取消网络请求
});

// 捕获子组件错误
onErrorCaptured((err, instance, info) => {
  console.error('捕获到错误:', err, info);
  // 返回 false 可以阻止错误继续传播
  return false;
});

// keep-alive 组件激活时
onActivated(() => {
  console.log('组件被激活');
});

// keep-alive 组件停用时
onDeactivated(() => {
  console.log('组件被停用');
});
</script>
```

### 实际应用示例

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const width = ref(window.innerWidth);

// 响应窗口大小变化
const handleResize = () => {
  width.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div>窗口宽度: {{ width }}px</div>
</template>
```

自动清理的副作用：

```vue
<script setup>
import { watchEffect, onMounted } from 'vue';

onMounted(() => {
  // watchEffect 返回的停止函数会在组件卸载时自动调用
  const stop = watchEffect(() => {
    console.log('执行副作用');
  });
  
  // 或者手动停止
  // onUnmounted(stop);
});
</script>
```

## 状态管理（Pinia）

Pinia 是 Vue 3 推荐的状态管理库，比 Vuex 更轻量、更符合 Composition API 的设计。

### 定义 Store

```javascript
// stores/counter.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 选项式 API
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    // 访问其他 getter
    doubleCountPlusOne() {
      return this.doubleCount + 1;
    }
  },
  actions: {
    increment() {
      this.count++;
    },
    async fetchCount() {
      const response = await fetch('/api/count');
      const data = await response.json();
      this.count = data.count;
    }
  }
});

// 组合式 API（推荐）
export const useCounterStore2 = defineStore('counter2', () => {
  // state
  const count = ref(0);
  const name = ref('Counter');
  
  // getters
  const doubleCount = computed(() => count.value * 2);
  
  // actions
  const increment = () => {
    count.value++;
  };
  
  const fetchCount = async () => {
    const response = await fetch('/api/count');
    const data = await response.json();
    count.value = data.count;
  };
  
  return {
    count,
    name,
    doubleCount,
    increment,
    fetchCount
  };
});

// stores/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null);
  const token = ref(localStorage.getItem('token'));
  
  const isLoggedIn = computed(() => !!token.value);
  
  const login = async (username, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    token.value = data.token;
    userInfo.value = data.user;
    localStorage.setItem('token', data.token);
  };
  
  const logout = () => {
    token.value = null;
    userInfo.value = null;
    localStorage.removeItem('token');
  };
  
  return {
    userInfo,
    token,
    isLoggedIn,
    login,
    logout
  };
});
```

### 使用 Store

```vue
<script setup>
import { storeToRefs } from 'pinia';
import { useCounterStore } from '@/stores/counter';
import { useUserStore } from '@/stores/user';

const counterStore = useCounterStore();
const userStore = useUserStore();

// 直接访问
console.log(counterStore.count);
counterStore.increment();

// 使用 storeToRefs 解构（保持响应性）
const { count, doubleCount } = storeToRefs(counterStore);
// 方法可以直接解构
const { increment } = counterStore;

// 批量更新状态
counterStore.$patch({
  count: 10,
  name: 'New Counter'
});

// 使用函数批量更新
counterStore.$patch((state) => {
  state.count++;
  state.name = 'Updated';
});

// 重置状态
counterStore.$reset();

// 订阅状态变化
counterStore.$subscribe((mutation, state) => {
  console.log('状态改变了', mutation, state);
  // 持久化到 localStorage
  localStorage.setItem('counter', JSON.stringify(state));
});

// 订阅 actions
counterStore.$onAction(({ name, args, after, onError }) => {
  console.log(`开始执行 ${name}`, args);
  
  after((result) => {
    console.log(`${name} 执行完成`, result);
  });
  
  onError((error) => {
    console.error(`${name} 执行出错`, error);
  });
});
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">增加</button>
    
    <div v-if="userStore.isLoggedIn">
      <p>欢迎, {{ userStore.userInfo.name }}</p>
      <button @click="userStore.logout">登出</button>
    </div>
  </div>
</template>
```

### Store 组合

```javascript
// stores/cart.js
import { defineStore } from 'pinia';
import { useUserStore } from './user';

export const useCartStore = defineStore('cart', () => {
  const items = ref([]);
  const userStore = useUserStore();
  
  // 可以使用其他 store 的状态
  const canCheckout = computed(() => {
    return userStore.isLoggedIn && items.value.length > 0;
  });
  
  const addItem = (item) => {
    items.value.push(item);
  };
  
  return {
    items,
    canCheckout,
    addItem
  };
});
```

## Vue Router

### 基本配置

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    // 路由元信息
    meta: { requiresAuth: true }
  },
  {
    // 动态路由参数
    path: '/user/:id',
    name: 'User',
    component: () => import('@/views/User.vue'),
    // props: true 会将路由参数作为 props 传递给组件
    props: true
  },
  {
    // 嵌套路由
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue'),
    children: [
      {
        path: '',
        component: () => import('@/views/DashboardHome.vue')
      },
      {
        path: 'profile',
        component: () => import('@/views/Profile.vue')
      },
      {
        path: 'settings',
        component: () => import('@/views/Settings.vue')
      }
    ]
  },
  {
    // 捕获所有路由（404）
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

export default router;
```

### 导航守卫

```javascript
// 全局前置守卫
router.beforeEach((to, from, next) => {
  console.log('导航到:', to.path);
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      // 重定向到登录页
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

// 全局解析守卫
router.beforeResolve(async (to) => {
  if (to.meta.requiresCamera) {
    try {
      await askForCameraPermission();
    } catch (error) {
      return false; // 取消导航
    }
  }
});

// 全局后置钩子
router.afterEach((to, from) => {
  // 发送页面浏览统计
  sendAnalytics(to.path);
  
  // 更新页面标题
  document.title = to.meta.title || 'My App';
});
```

组件内守卫：

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

// 离开当前路由时
onBeforeRouteLeave((to, from) => {
  const answer = window.confirm('确定要离开吗？未保存的更改将丢失。');
  if (!answer) return false; // 取消导航
});

// 路由参数变化时（同一个组件被复用）
onBeforeRouteUpdate((to, from) => {
  console.log('路由参数更新:', to.params);
});
</script>
```

### 在组件中使用路由

```vue
<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const router = useRouter();

// 访问路由信息
const userId = computed(() => route.params.id);
const query = computed(() => route.query);

// 编程式导航
const goToHome = () => {
  router.push('/');
};

const goToUser = (id) => {
  router.push({
    name: 'User',
    params: { id }
  });
};

const goBack = () => {
  router.back();
};

const goForward = () => {
  router.forward();
};

// 替换当前历史记录
const replaceRoute = () => {
  router.replace('/new-path');
};
</script>

<template>
  <div>
    <p>当前路由: {{ route.path }}</p>
    <p>用户 ID: {{ userId }}</p>
    
    <!-- 声明式导航 -->
    <router-link to="/">首页</router-link>
    <router-link :to="{ name: 'User', params: { id: 123 } }">
      用户 123
    </router-link>
    
    <!-- 路由出口 -->
    <router-view />
    
    <!-- 命名视图 -->
    <router-view name="sidebar" />
  </div>
</template>
```

## 性能优化

### 组件懒加载

```javascript
// 路由懒加载
const routes = [
  {
    path: '/heavy',
    component: () => import('@/views/HeavyComponent.vue')
  }
];

// 组件懒加载
const AsyncComp = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);
```

### v-memo 优化渲染

```vue
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
    <!-- 只有 item.id 或 item.selected 变化时才重新渲染 -->
    <p>{{ item.name }}</p>
    <button @click="select(item)">
      {{ item.selected ? '已选' : '选择' }}
    </button>
  </div>
</template>
```

### 虚拟滚动

```vue
<script setup>
import { ref, computed } from 'vue';

const items = ref(new Array(10000).fill(0).map((_, i) => ({
  id: i,
  text: `Item ${i}`
})));

const containerHeight = 600;
const itemHeight = 50;
const visibleCount = Math.ceil(containerHeight / itemHeight);

const scrollTop = ref(0);

const visibleItems = computed(() => {
  const start = Math.floor(scrollTop.value / itemHeight);
  const end = start + visibleCount;
  return items.value.slice(start, end).map((item, index) => ({
    ...item,
    top: (start + index) * itemHeight
  }));
});

const totalHeight = computed(() => items.value.length * itemHeight);

const handleScroll = (e) => {
  scrollTop.value = e.target.scrollTop;
};
</script>

<template>
  <div
    class="virtual-scroll-container"
    :style="{ height: `${containerHeight}px`, overflow: 'auto' }"
    @scroll="handleScroll"
  >
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        :style="{
          position: 'absolute',
          top: `${item.top}px`,
          height: `${itemHeight}px`,
          width: '100%'
        }"
      >
        {{ item.text }}
      </div>
    </div>
  </div>
</template>
```

### shallowRef 和 shallowReactive

```javascript
import { shallowRef, shallowReactive, triggerRef } from 'vue';

// shallowRef：只追踪 .value 的变化
const state = shallowRef({
  count: 0,
  nested: {
    value: 1
  }
});

// 不会触发更新
state.value.count++;

// 会触发更新
state.value = { ...state.value, count: state.value.count + 1 };

// 手动触发更新
triggerRef(state);

// shallowReactive：只追踪第一层属性
const state2 = shallowReactive({
  count: 0, // 响应式
  nested: { // 第一层响应式
    value: 1 // 非响应式
  }
});

// 会触发更新
state2.count++;

// 不会触发更新
state2.nested.value++;

// 会触发更新（替换整个对象）
state2.nested = { value: 2 };
```

## 最佳实践

### 1. 组件设计原则

```vue
<!-- ✅ 好的组件设计：单一职责 -->
<script setup>
// UserCard.vue - 只负责展示用户信息
defineProps({
  user: {
    type: Object,
    required: true
  }
});

defineEmits(['edit', 'delete']);
</script>

<!-- ❌ 不好的组件设计：职责过多 -->
<script setup>
// BadComponent.vue - 混合了数据获取、状态管理、展示等多个职责
const users = ref([]);
const selectedUser = ref(null);

onMounted(async () => {
  users.value = await fetchUsers();
});

const editUser = () => { /* ... */ };
const deleteUser = () => { /* ... */ };
const exportData = () => { /* ... */ };
</script>
```

### 2. 合理使用 computed vs methods

```vue
<script setup>
import { ref, computed } from 'vue';

const count = ref(0);

// ✅ 使用 computed：有缓存，依赖不变时不重新计算
const doubleCount = computed(() => {
  console.log('计算 doubleCount');
  return count.value * 2;
});

// ❌ 使用 methods：每次渲染都会执行
const getDoubleCount = () => {
  console.log('执行 getDoubleCount');
  return count.value * 2;
};
</script>

<template>
  <div>
    <!-- doubleCount 只在 count 变化时重新计算 -->
    <p>{{ doubleCount }}</p>
    <p>{{ doubleCount }}</p>
    
    <!-- getDoubleCount 每次都会执行 -->
    <p>{{ getDoubleCount() }}</p>
    <p>{{ getDoubleCount() }}</p>
  </div>
</template>
```

### 3. 避免在模板中使用复杂表达式

```vue
<!-- ❌ 不好：模板中有复杂逻辑 -->
<template>
  <div>
    {{ user.firstName.toUpperCase() + ' ' + user.lastName.toUpperCase() }}
  </div>
</template>

<!-- ✅ 好：使用计算属性 -->
<script setup>
const fullName = computed(() => {
  return `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`;
});
</script>

<template>
  <div>{{ fullName }}</div>
</template>
```

### 4. 合理拆分组件

```vue
<!-- ❌ 不好：单个巨大的组件 -->
<template>
  <div class="page">
    <header>...</header>
    <nav>...</nav>
    <main>...</main>
    <aside>...</aside>
    <footer>...</footer>
  </div>
</template>

<!-- ✅ 好：拆分为多个小组件 -->
<script setup>
import AppHeader from './AppHeader.vue';
import AppNav from './AppNav.vue';
import AppMain from './AppMain.vue';
import AppAside from './AppAside.vue';
import AppFooter from './AppFooter.vue';
</script>

<template>
  <div class="page">
    <AppHeader />
    <AppNav />
    <AppMain />
    <AppAside />
    <AppFooter />
  </div>
</template>
```

### 5. 使用 TypeScript

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Component.vue
<script setup lang="ts">
import type { User } from '@/types';

interface Props {
  user: User;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
});

interface Emits {
  (e: 'update', value: number): void;
  (e: 'delete', id: number): void;
}

const emit = defineEmits<Emits>();

// 类型安全的 ref
const count = ref<number>(0);
const user = ref<User | null>(null);

// 类型安全的 computed
const userName = computed<string>(() => {
  return props.user.name;
});
</script>
```

### 6. 错误处理

```vue
<script setup>
import { ref, onErrorCaptured } from 'vue';

const error = ref(null);

// 捕获子组件错误
onErrorCaptured((err, instance, info) => {
  console.error('捕获到错误:', err);
  console.error('错误信息:', info);
  error.value = err;
  
  // 返回 false 阻止错误继续传播
  return false;
});

// 异步错误处理
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('获取数据失败:', err);
    error.value = err;
  }
};
</script>

<template>
  <div v-if="error">
    <p>出错了: {{ error.message }}</p>
    <button @click="error = null">重试</button>
  </div>
  <div v-else>
    <!-- 正常内容 -->
  </div>
</template>
```

## 总结

Vue 3 带来了许多重大改进和新特性：

### 核心优势
- ✅ **性能提升**：更快的渲染速度和更小的打包体积
- ✅ **Composition API**：更好的逻辑复用和代码组织
- ✅ **TypeScript 支持**：完整的类型推导和检查
- ✅ **响应式系统**：基于 Proxy 的全面响应式追踪
- ✅ **更好的树摇**：未使用的功能不会被打包

### 关键要点
1. 掌握响应式系统（ref、reactive、computed、watch）
2. 熟练使用 Composition API 组织代码
3. 理解组件通信机制（props、emits、provide/inject、slots）
4. 善用生命周期钩子处理副作用
5. 使用 Pinia 进行状态管理
6. 掌握 Vue Router 进行路由管理
7. 注重性能优化（懒加载、虚拟滚动、memo）
8. 遵循最佳实践（组件设计、TypeScript、错误处理）

### 学习建议
- 📖 阅读官方文档和 RFC
- 🔧 使用 Vite 快速搭建项目
- 💻 实践 Composition API 重构项目
- 🎯 结合 TypeScript 提升开发体验
- 🚀 关注 Vue 生态（Nuxt、Vitepress 等）

---

*最后更新: 2025年11月*
