import * as fs from 'fs';
import * as path from 'path';
import { loadEnv } from './loader';
import { EnvMap } from './types';

export type WatchCallback = (event: WatchEvent) => void;

export interface WatchEvent {
  file: string;
  type: 'change' | 'rename';
  previous: EnvMap;
  current: EnvMap;
  timestamp: Date;
}

export interface WatchHandle {
  stop: () => void;
  files: string[];
}

export function watchEnvFiles(
  files: string[],
  callback: WatchCallback,
  debounceMs = 300
): WatchHandle {
  const watchers: fs.FSWatcher[] = [];
  const cache = new Map<string, EnvMap>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  for (const file of files) {
    const absPath = path.resolve(file);
    try {
      cache.set(absPath, loadEnv(absPath));
    } catch {
      cache.set(absPath, {});
    }

    const watcher = fs.watch(absPath, (eventType) => {
      const existing = timers.get(absPath);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        const previous = cache.get(absPath) ?? {};
        let current: EnvMap = {};
        try {
          current = loadEnv(absPath);
        } catch {
          current = {};
        }
        cache.set(absPath, current);
        callback({
          file: absPath,
          type: eventType as 'change' | 'rename',
          previous,
          current,
          timestamp: new Date(),
        });
        timers.delete(absPath);
      }, debounceMs);

      timers.set(absPath, timer);
    });

    watchers.push(watcher);
  }

  return {
    stop: () => {
      for (const w of watchers) w.close();
      for (const t of timers.values()) clearTimeout(t);
    },
    files,
  };
}
