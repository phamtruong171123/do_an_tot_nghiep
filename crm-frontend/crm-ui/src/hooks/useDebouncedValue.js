import { useState, useEffect } from "react";

export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value);
    }, delay);

    // nếu value thay đổi trước khi hết delay thì clear timeout cũ
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
