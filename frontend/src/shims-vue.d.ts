declare module 'vue' {
  export interface ComponentCustomProperties {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $t: (key: string, ...args: any[]) => string;
  }
}
