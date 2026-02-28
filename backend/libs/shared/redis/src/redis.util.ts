// @ts-nocheck
import { Redis, Cluster } from 'ioredis';

import { RedisConfig } from '@lib/config/redis.config';

export class RedisUtility {
  static get instance(): any {
    return this._instance;
  }
  private static _instance: any;
  private static initializing: Promise<any> | null = null;

  private static async createInstance(): Promise<any> {
    const [config] = await Promise.all([RedisConfig()]);
    if (config.mode === 'cluster') {
      this._instance = new Redis.Cluster(
        config.cluster.map((node: any) => ({
          host: node.host,
          port: node.port,
          password: node.password,
        })),
        {
          redisOptions: {
            password: config.cluster[0].password,
            db: config.standalone.db,
          },
        },
      );
    } else {
      this._instance = new Redis({
        host: config.standalone.host,
        port: config.standalone.port,
        password: config.standalone.password,
        db: config.standalone.db,
      });
    }
    return this._instance;
  }

  public static async client(): Promise<any> {
    if (!this._instance) {
      if (!this.initializing) {
        this.initializing = this.createInstance();
      }
      this._instance = await this.initializing;
      this.initializing = null;
    }
    return this._instance;
  }
}
