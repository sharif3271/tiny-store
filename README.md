 # TinyStore

TinyStore is a lightweight state management library designed to manage application state efficiently. It provides a simple API to get, set, and subscribe to state changes, making it easy to keep your application state in sync.

## Features

- **Type-safe state management**: Leverages TypeScript to provide type-safe state operations.
- **Nested state updates**: Supports deep updates and subscriptions to nested state paths.
- **Efficient subscriptions**: Allows subscribing to specific state paths and notifies only relevant listeners.
- **Small footprint**: Minimalistic design with a focus on performance and simplicity.

## Installation

To install TinyStore, use npm:

```bash
npm install @asanflow/tinystore
```

## Usage

### Basic Usage

```typescript
import { TinyStore } from '@asanflow/tinystore';

const initialState = {
  user: {
    name: 'Alex',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'London',
      postalCode: '12345'
    }
  },
  settings: {
    theme: 'dark',
    notifications: true
  }
};

const store = new TinyStore(initialState);

// Get state
console.log(store.getState('user.name')); // Output: Alex

// Subscribe to state changes
const unsubscribe = store.subscribe('user.name', (newName) => {
  console.log(`User name changed to: ${newName}`);
});

// Update state
store.update('user.name', 'Bob'); // Console: User name changed to: Bob

// Unsubscribe from state changes
unsubscribe();
```

### Advanced Usage

#### Nested State Updates

TinyStore allows you to update nested state paths and notify relevant listeners.

```typescript
store.update('user.address.city', 'New York');
console.log(store.getState('user.address.city')); // Output: New York
```

#### Array Handling

TinyStore supports array state management and notifies listeners on array changes.

```typescript
store.update('user.hobbies', ['travelling']);
console.log(store.getState('user.hobbies')); // Output: ['travelling']
```

#### Notify All Subscribers

You can notify all subscribers manually if needed.

```typescript
store.notifyAll();
```

## Testing

TinyStore has been thoroughly tested to ensure reliability and performance. The test suite includes:

- **Basic functionality tests**: Ensuring correct state retrieval and updates.
- **Subscription tests**: Verifying that listeners are notified correctly on state changes.
- **Edge cases**: Handling empty objects, arrays, and special characters in keys.
- **Error handling**: Properly throwing errors for invalid paths.
- **Performance tests**: Efficiently managing large state objects and numerous updates.
- **Concurrency tests**: Handling concurrent updates and subscriptions.
- **Boundary conditions**: Managing maximum depth of nested objects and array lengths.
- **Stress tests**: Handling a large number of subscriptions and updates.

## Best Practices

- Avoid using the `update` function with values forced to `any` type.
- Prefer using TinyStore with specific types or objects.
- Avoid using nested objects with nullable values.

## Using in React

Custom hook that subscribes to a specific path in a TinyStore and provides state management for that path. It returns the current state at the given path and a function to update the state. The hook initializes the state using the store's `getState` method for the given path. It sets up an effect to subscribe to changes at the specified path and updates the state accordingly. The effect also cleans up the subscription when the component unmounts or when the store or path changes. The `updateState` function allows updating the state at the given path. It performs a shallow copy of the value before updating the store to ensure immutability.

```typescript
import { useState, useEffect } from 'react';
import { TinyStore, Path, InferType } from '@asanflow/tinystore';

export function useStore<T, P extends Path<T>>(store: TinyStore<T>, path: P): [InferType<T, P>, (value: InferType<T, P>) => void] {
  const [state, setState] = useState(() => store.getState(path));

  useEffect(() => {
    const unsubscribe = store.subscribe(path, setState);
    return () => unsubscribe();
  }, [store, path]);

  const updateState = (value: InferType<T, P>) => {
    if (Array.isArray(value)) {
      store.update(path, [...value]);
    } else if (typeof value === 'object' && value !== null) {
      store.update(path, { ...value });
    } else {
      store.update(path, value);
    }
  };

  return [state, updateState];
}

```

### Example Usage
You can add a helper hook `useUserStore` to simplify the usage of different stores.

```typescript
import React from 'react';
import { TinyStore, Path } from '@asanflow/tinystore';
import { useStore } from './useStore';

const userInitialState = {
  user: {
    name: 'Alex',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'London',
      postalCode: '12345'
    }
  },
  settings: {
    theme: 'dark',
    notifications: true
  }
};

const store = new TinyStore(userInitialState);
const useUserStore = <P extends Path<typeof userInitialState>>(path: P) => useStore(store, path);


function App() {
  const [name, setName] = useUserStore('user.name');
  const [city, setCity] = useUserStore('user.address.city');

  return (
    <div>
      <h1>{name}</h1>
      <p>City: {city}</p>
      <button onClick={() => setName('Bob')}>Change Name</button>
      <button onClick={() => setCity('New York')}>Change City</button>
    </div>
  );
}

export default App;
```

### Using Multiple Paths

You can use the `useStore` hook multiple times to subscribe to different paths in the store.

```typescript
function App() {
  const [name, setName] = useStore(store, 'user.name');
  const [city, setCity] = useStore(store, 'user.address.city');
  const [theme, setTheme] = useStore(store, 'settings.theme');

  return (
    <div>
      <h1>{name}</h1>
      <p>City: {city}</p>
      <p>Theme: {theme}</p>
      <button onClick={() => setName('Bob')}>Change Name</button>
      <button onClick={() => setCity('New York')}>Change City</button>
      <button onClick={() => setTheme('light')}>Change Theme</button>
    </div>
  );
}
```

### Using Nested Paths

You can subscribe to nested paths by specifying the full path to the desired state.

```typescript
const [street, setStreet] = useStore(store, 'user.address.street');
```

### Using Arrays

You can subscribe to array paths in the store.

```typescript
const [hobbies, setHobbies] = useStore(store, 'user.hobbies');
```


### Todo List Example

An example demonstrating the use of TinyStore to manage a todo list state.
Another significant advantage is that you can write helpers to interact with the store outside of the React lifecycle.

```typescript
import React, { useState } from 'react';
import { TinyStore } from 'tinystore';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const store = new TinyStore({
  todos: [] as Todo[]
});

const addTodo = (text: string) => {
  const todos = store.getState('todos');
  const newTodo = {
    id: todos.length + 1,
    text,
    completed: false
  };
  store.update('todos', [...todos, newTodo]);
};

const toggleTodo = (id: number) => {
  const todos = store.getState('todos');
  const updatedTodos = todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  store.update('todos', updatedTodos);
};

const App: React.FC = () => {
  const [todos, setTodos] = useStore(store, 'todos');
  const [newTodoText, setNewTodoText] = useState('');

  return (
    <div>
      <h1>Todo List</h1>
      <input
        type="text"
        value={newTodoText}
        onChange={(e) => setNewTodoText(e.target.value)}
        placeholder="Add a new todo"
      />
      <button onClick={() => {
        if (newTodoText.trim()) {
          addTodo(newTodoText);
          setNewTodoText('');
        }
      }}>Add Todo</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
              onClick={() => toggleTodo(todo.id)}
            >
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
```


### Intercepting sets and gets

You can intercept state `get` and `set` operations using a proxy. This allows you to add custom behavior, such as logging or persisting state changes. Here's a simple example:

```typescript
import { TinyStore } from '@asanflow/tinystore';

const createStateProxy = (state: any, persist: (state: any) => void, log: (message: string) => void) => {
  return new Proxy(state, {
    get(target, prop, receiver) {
      log(`Getting property ${String(prop)}`);
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      log(`Setting property ${String(prop)} to ${value}`);
      const result = Reflect.set(target, prop, value, receiver);
      persist(target);
      return result;
    }
  });
};

export const wrapTinyStoreState = (store: TinyStore<any>, persist: (state: any) => void, log: (message: string) => void) => {
  store.state = createStateProxy(store.getStoreState(), persist, log);
  return store;
};

// Usage example
const initialState = { user: { name: 'Alex' } };
const store = new TinyStore(initialState);

const persist = (state: any) => {
  console.log('Persisting state:', state);
};

const log = (message: string) => {
  console.log(message);
};

wrapTinyStoreState(store, persist, log);

// Interacting with the store
store.update('user.name', 'Bob'); // Logs: Setting property name to Bob, Persisting state: { user: { name: 'Bob' } }
console.log(store.getState('user.name')); // Logs: Getting property name, Output: Bob
```

This example demonstrates how to wrap the TinyStore state with a proxy to log and persist state changes.


## Alternative Usage

If you prefer not to add TinyStore as a dependency to your project, you can simply copy and paste the `index.ts` file into your codebase. This approach can help keep your project lightweight and avoid dependency bloat. 

In today's development environment, it's easy to accumulate numerous dependencies, which can lead to larger bundle sizes and potential maintenance headaches. By copying the `index.ts` file directly, you can integrate TinyStore without adding another package to your `node_modules`.

If you find TinyStore useful or appreciate the idea behind it, please consider giving this project a star on GitHub. Your support is greatly appreciated!

### Requirements

To use TinyStore by copying the `index.ts` file, ensure that your TypeScript version is 4.1 or above.



## License

TinyStore is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.