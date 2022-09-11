import { _isNumberValue } from '@angular/cdk/coercion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SafeAny = any;

export function toNumber(value: number | string): number;
export function toNumber<D>(value: number | string, fallback: D): number | D;
export function toNumber(value: number | string, fallbackValue = 0): number {
  return _isNumberValue(value) ? Number(value) : fallbackValue;
}

function propDecoratorFactory<T, D>(name: string, fallback: (v: T) => D): (target: SafeAny, propName: string) => void {
  function propDecorator(
    target: SafeAny,
    propName: string,
    originalDescriptor?: TypedPropertyDescriptor<SafeAny>
  ): SafeAny {
    const privatePropName = `$$__propDecorator__${propName}`;

    Object.defineProperty(target, privatePropName, {
      configurable: true,
      writable: true
    });

    return {
      get(): string {
        return originalDescriptor && originalDescriptor.get
          ? originalDescriptor.get.bind(this)()
          : this[privatePropName];
      },
      set(value: T): void {
        if (originalDescriptor && originalDescriptor.set) {
          originalDescriptor.set.bind(this)(fallback(value));
        }
        this[privatePropName] = fallback(value);
      }
    };
  }

  return propDecorator;
}

export function InputNumber(fallbackValue?: SafeAny): SafeAny {
  return propDecoratorFactory('InputNumber', (value: string | number) => toNumber(value, fallbackValue));
}
