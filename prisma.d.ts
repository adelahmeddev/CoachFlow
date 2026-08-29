declare module "prisma" {
  export function defineConfig<T extends object>(config: T): T;
  export function env(key: string): string;
}
