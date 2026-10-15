import React from 'react';

// Regular function
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function
const multiply = (a: number, b: number): number => a * b;

// Async function
async function fetchData(url: string): Promise<string> {
  return url;
}

// React component
const MyComponent = () => {
  return React.createElement('div', null, 'hello');
};

// React hook
const useCounter = (initial: number) => {
  return initial;
};

// Class method
class Calculator {
  divide(a: number, b: number): number {
    return a / b;
  }
}

// Nested functions
function outer() {
  function inner() {
    return 42;
  }
  return inner();
}

export { add, Calculator, fetchData, MyComponent, multiply, outer, useCounter };
