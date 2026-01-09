const IS_DEV = import.meta.env.DEV;

export const debug = {
  log: (...args: any[]) => {
    if (IS_DEV) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (IS_DEV) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  group: (label: string) => {
    if (IS_DEV) console.group(label);
  },
  groupEnd: () => {
    if (IS_DEV) console.groupEnd();
  },
  table: (data: any) => {
    if (IS_DEV) console.table(data);
  },
};
