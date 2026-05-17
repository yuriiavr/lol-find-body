"use client";

import { useEffect, useState } from "react";

interface Options<T> {
  validate?: (value: unknown) => value is T;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
}

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options: Options<T> = {},
): [T, (value: T) => void] {
  const { validate, serialize, deserialize } = options;
  const [value, setValueState] = useState<T>(defaultValue);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    try {
      const parsed = deserialize ? deserialize(raw) : (JSON.parse(raw) as T);
      if (!validate || validate(parsed)) {
        setValueState(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
  }, [key]);

  const setValue = (next: T) => {
    setValueState(next);
    try {
      localStorage.setItem(
        key,
        serialize ? serialize(next) : JSON.stringify(next),
      );
    } catch {
      // ignore quota / privacy-mode errors
    }
  };

  return [value, setValue];
}
