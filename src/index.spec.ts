import 'jest'
import { TinyStore, getValue, setValue, Path } from './index'



// Testing Utils
const state = {
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
}
describe('utils: getValue', () => {
  it('should retrieve a top-level value', () => {
    const result = getValue(state, 'settings.theme')
    expect(result).toBe('dark')
  })

  it('should retrieve a nested value', () => {
    const result = getValue(state, 'user.address.city')
    expect(result).toBe('London')
  })

  it('should retrieve a deeply nested value', () => {
    const result = getValue(state, 'user.address.postalCode')
    expect(result).toBe('12345')
  })

  it('should retrieve a top-level object', () => {
    const result = getValue(state, 'user')
    expect(result).toEqual({
      name: 'Alex',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'London',
        postalCode: '12345',
      },
    })
  })

  it('should retrieve a nested object', () => {
    const result = getValue(state, 'user.address')
    expect(result).toEqual({
      street: '123 Main St',
      city: 'London',
      postalCode: '12345',
    })
  })

  it('should throw error on invalid path', () => {
    expect(() => getValue(state, 'user.invalid.path' as Path<typeof state>)).toThrowError()
  })
})

describe('utils: setValue', () => {
  it('should set a top-level value', () => {
    const localState = { ...state } // Clone state to avoid mutation
    setValue(localState, 'settings.theme', 'light')
    expect(localState.settings.theme).toBe('light')
  })

  it('should set a nested value', () => {
    const localState = { ...state }
    setValue(localState, 'user.address.city', 'New York')
    expect(localState.user.address.city).toBe('New York')
  })

  it('should set a deeply nested value', () => {
    const localState = { ...state }
    setValue(localState, 'user.address.postalCode', '54321')
    expect(localState.user.address.postalCode).toBe('54321')
  })

  it('should set a top-level object', () => {
    const localState = { ...state }
    setValue(localState, 'user', {
      name: 'Bob',
      age: 25,
      address: {
        street: '456 Another St',
        city: 'Paris',
        postalCode: '67890',
      },
    })
    expect(localState.user).toEqual({
      name: 'Bob',
      age: 25,
      address: {
        street: '456 Another St',
        city: 'Paris',
        postalCode: '67890',
      },
    })
  })

  it('should throw error on invalid path', () => {
    const localState = { ...state }
    expect(() =>
      setValue(localState, 'user.invalid.path' as Path<typeof state>, 'Some Value')
    ).toThrow()
  })
})




// some initial state
const initialState0 = {
  user: {
    name: 'Alex',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'London',
      postalCode: '12345'
    },
    hobbies: ['reading', 'coding', 'gaming']
  },
  settings: {
    theme: 'dark',
    notifications: true
  }
}

let initialState = JSON.parse(JSON.stringify(initialState0)) as typeof initialState0

describe('TinyStore', () => {

  beforeEach(() => {
    initialState = JSON.parse(JSON.stringify(initialState0)) as typeof initialState0
  })


  it('should initialize with the provided state', () => {
    const store = new TinyStore(initialState)
    expect(store.getState('user.name')).toBe('Alex')
    expect(store.getState('settings.theme')).toBe('dark')
  })


  it('should allow subscription to a specific path', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user.name', listener)
    store.update('user.name', 'Bob')
    expect(listener).toHaveBeenCalledWith('Bob')
  })


  it('should get new store state after updating a path', () => {
    const store = new TinyStore(initialState)
    store.update('user.name', 'Bob')
    expect(store.getStoreState().user.name).toBe('Bob')
  })


  it('should update the state and notify listeners on change', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user.address.city', listener)
    store.update('user.address.city', 'New York')
    expect(store.getState('user.address.city')).toBe('New York')
    expect(listener).toHaveBeenCalledWith('New York')
  })


  it('should allow multiple subscriptions for the same path', () => {
    const store = new TinyStore(initialState)
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    store.subscribe('settings.theme', listener1)
    store.subscribe('settings.theme', listener2)
    store.update('settings.theme', 'light')
    expect(listener1).toHaveBeenCalledWith('light')
    expect(listener2).toHaveBeenCalledWith('light')
  })


  it('should allow unsubscription from a path', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    const unsubscribe = store.subscribe('user.age', listener)
    unsubscribe()
    store.update('user.age', 31)
    expect(listener).not.toHaveBeenCalled()
  })


  it('should notify listeners with the updated value for deeply nested paths', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user.address.postalCode', listener)
    store.update('user.address.postalCode', '54321')
    expect(store.getState('user.address.postalCode')).toBe('54321')
    expect(listener).toHaveBeenCalledWith('54321')
  })


  it('should not throw errors for paths without listeners when updating', () => {
    const store = new TinyStore(initialState)
    // Update a path with no listeners
    store.update('settings.notifications', false)
    // Ensure no errors were thrown
    expect(store.getState('settings.notifications')).toBe(false)
  })


  it('should allow updating state for different paths independently', () => {
    const store = new TinyStore(initialState)
    const listener1 = jest.fn()
    const listener2 = jest.fn()
    store.subscribe('user.age', listener1)
    store.subscribe('settings.theme', listener2)
    store.update('user.age', 31)
    store.update('settings.theme', 'light')
    expect(listener1).toHaveBeenCalledWith(31)
    expect(listener2).toHaveBeenCalledWith('light')
  })


  it('should retrieve an array value', () => {
    const store = new TinyStore(initialState)
    const hobbies = store.getState('user.hobbies')
    expect(hobbies).toEqual(['reading', 'coding', 'gaming'])
  })


  it('should notify listeners when array element changes', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user.hobbies', listener)
    store.update('user.hobbies', ['travelling'])
    expect(listener).toHaveBeenCalledWith(['travelling'])
    expect(store.getState('user.hobbies')[0]).toBe('travelling')
  })


  it('should add a new element to the array and notify listeners', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user.hobbies', listener)
    const newHobbies = [...store.getState('user.hobbies'), 'hiking']
    store.update('user.hobbies', newHobbies)
    expect(listener).toHaveBeenCalledWith(newHobbies)
    expect(store.getState('user.hobbies')).toContain('hiking')
  })


  it('should not update if the new value is the same as the current value', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user.name', listener)
    store.update('user.name', 'Alex') // No change
    expect(listener).not.toHaveBeenCalled()
  })


  it('should update the value and notify direct subscribers', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user.age', listener)
    store.update('user.age', 31)
    expect(listener).toHaveBeenCalledWith(31)
    expect(store.getState('user.age')).toBe(31)
  })


  it('should notify parent path subscribers when a child path is updated', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user', listener)
    store.update('user.address.city', 'New York')
    expect(listener).toHaveBeenCalledWith({
      name: 'Alex',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'New York',
        postalCode: '12345'
      },
      hobbies: ['reading', 'coding', 'gaming']
    })
  })


  it('should notify child path subscribers when a parent path is updated', () => {
    const store = new TinyStore(initialState)
    const listener = jest.fn()
    store.subscribe('user.address.city', listener)
    store.update('user.address', {
      street: '456 Another St',
      city: 'Paris',
      postalCode: '67890'
    })
    expect(listener).toHaveBeenCalledWith('Paris')
    expect(store.getState('user.address.city')).toBe('Paris')
  })


  it('should notify both parent and child path subscribers when a nested value is updated', () => {
    const store = new TinyStore(initialState)
    const parentListener = jest.fn()
    const childListener = jest.fn()
    store.subscribe('user.address', parentListener)
    store.subscribe('user.address.city', childListener)
    store.update('user.address.city', 'Los Angeles')
    expect(parentListener).toHaveBeenCalledWith({
      street: '123 Main St',
      city: 'Los Angeles',
      postalCode: '12345'
    })
    expect(childListener).toHaveBeenCalledWith('Los Angeles')
  })


  it('should notify all relevant subscribers when deeply nested values are updated', () => {
    const store = new TinyStore(initialState)
    const grandparentListener = jest.fn()
    const parentListener = jest.fn()
    const childListener = jest.fn()
    store.subscribe('user', grandparentListener)
    store.subscribe('user.address', parentListener)
    store.subscribe('user.address.city', childListener)
    store.update('user.address.city', 'Chicago')
    expect(grandparentListener).toHaveBeenCalled()
    expect(parentListener).toHaveBeenCalled()
    expect(childListener).toHaveBeenCalledWith('Chicago')
  })


  it('should not notify other unrelated paths', () => {
    const store = new TinyStore(initialState)
    const unrelatedListener = jest.fn()
    store.subscribe('settings.theme', unrelatedListener)
    store.update('user.name', 'Sam')
    expect(unrelatedListener).not.toHaveBeenCalled()
  })


  it('should notify all relevant subscribers when manually update has been requested', () => {
    const store = new TinyStore(initialState)
    const cityListener = jest.fn()
    const userListener = jest.fn()
    store.update('user.address', { city: 'Chicago', postalCode: '54321', street: '123 Main St' })
    store.update('user.hobbies', ['travelling'])
    store.subscribe('user.address.city', cityListener)
    store.subscribe('user', userListener)
    store.notifyUpdates(['user.address.city', 'user.hobbies'])
    expect(cityListener).toHaveBeenCalledWith('Chicago')
    expect(userListener).toHaveBeenCalledWith({
      name: 'Alex',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Chicago',
        postalCode: '54321'
      },
      hobbies: ['travelling']
    })
  })

  it('should notify all relevant subscribers that they are array', () => {
    const store = new TinyStore(initialState)
    const hobbiesListener = jest.fn()
    store.update('user.hobbies', ['travelling'])
    store.subscribe('user.hobbies', hobbiesListener)
    store.notifyUpdates(['user'])
    expect(hobbiesListener).toHaveBeenCalledWith(['travelling'])
  })

  it('should notify all subscribers', () => {
    const store = new TinyStore(initialState)
    const cityListener = jest.fn()
    const hobiesListener = jest.fn()
    store.subscribe('user.address.city', cityListener)
    store.subscribe('user.hobbies', hobiesListener)
    store.getStoreState().user.address.city = 'Chicago'
    store.getStoreState().user.hobbies = ['travelling']
    store.notifyAll()
    expect(cityListener).toHaveBeenCalledWith('Chicago')
    expect(hobiesListener).toHaveBeenCalledWith(['travelling'])
  })

})




// Edge cases
describe('Edge Cases', () => {
  it('should handle empty objects', () => {
    const store = new TinyStore({});
    expect(store.getStoreState()).toEqual({});
  });

  it('should handle empty arrays', () => {
    const store = new TinyStore({ items: [] });
    expect(store.getState('items')).toEqual([]);
  });

  it('should handle non-string keys', () => {
    const initState = { 123: 'numberKey', '1234': 'stringKey' };
    const store = new TinyStore(initState);
    expect(store.getState('123')).toBe('numberKey');
  });

  it('should handle special characters in keys', () => {
    const store = new TinyStore({ 'user@name': 'Alex' });
    expect(store.getState('user@name')).toBe('Alex');
  });
});



// Error Handling Tests
describe('Error Handling', () => {
  it('should throw error for invalid path in getValue', () => {
    expect(() => getValue(state, 'invalid.path' as Path<typeof state>)).toThrow();
  });

  it('should throw error for invalid path in setValue', () => {
    const localState = { ...state };
    expect(() => setValue(localState, 'invalid.path' as Path<typeof state>, 'value')).toThrow();
  });

});



// Performance Tests
describe('Performance', () => {
  it('should handle large state objects efficiently', () => {
    const largeState = { items: Array.from({ length: 10000 }, (_, i) => i) };
    const store = new TinyStore(largeState);
    expect(store.getState('items').length).toBe(10000);
  });
  it('should measure the time taken to update a large number of state changes', () => {
    const items = Array
      .from({ length: 10000 }, (_, i) => i)
      .reduce((acc, a) => {
        acc[a] = a;
        return acc;
      }, {} as { [key: string]: number });
    const largeState = { items };
    const store = new TinyStore(largeState);

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      store.update(`items.${i}`, i + 1);
    }
    const end = performance.now();

    console.log(`Time taken for 10000 updates: ${end - start}ms`);
  });
});



// Concurrent Updates
describe('Concurrency', () => {
  it('should handle concurrent updates and subscriptions', () => {
    const store = new TinyStore(state);
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    store.subscribe('user.name', listener1);
    store.subscribe('user.age', listener2);

    store.update('user.name', 'Bob');
    store.update('user.age', 31);

    expect(listener1).toHaveBeenCalledWith('Bob');
    expect(listener2).toHaveBeenCalledWith(31);
  });
});




// Boundary Conditions
describe('Boundary Conditions', () => {
  it('should handle maximum depth of nested objects', () => {
    const deepState = { a: { b: { c: { d: { e: 'deep' } } } } };
    const store = new TinyStore(deepState);
    expect(store.getState('a.b.c.d.e')).toBe('deep');
  });

  it('should handle maximum length of arrays', () => {
    const longArrayState = { items: Array.from({ length: 100000 }, (_, i) => i) };
    const store = new TinyStore(longArrayState);
    expect(store.getState('items').length).toBe(100000);
  });
});



// Stress tests
describe('Stress Tests', () => {
  it('should handle a large number of subscriptions and updates', () => {
    const items = Array
      .from({ length: 10000 }, (_, i) => i)
      .reduce((acc, a) => {
        acc[a] = a;
        return acc;
      }, {} as { [key: string]: number });
    const largeState = { items };
    const store = new TinyStore(largeState);

    const listeners = Array.from({ length: 10000 }, () => jest.fn());
    listeners.forEach((listener, i) => {
      store.subscribe(`items.${i}`, listener);
    });

    for (let i = 0; i < 10000; i++) {
      store.update(`items.${i}`, i + 1);
    }

    listeners.forEach((listener, i) => {
      expect(listener).toHaveBeenCalledWith(i + 1);
    });
  });
});