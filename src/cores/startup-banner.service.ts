import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createConnection } from 'net';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ServiceStatus {
  name: string;
  status: string;
  port: string;
}

interface TcpEndpoint {
  host: string;
  port: number;
  portLabel: string;
  valid: boolean;
}

@Injectable()
export class StartupBannerService {
  constructor(private readonly configService: ConfigService) {}

  async printStartupInfo() {
    const port = this.configService.get<string>('APP_PORT') || '3000';
    const version = this.getAppVersion();

    const services = await this.checkServices();

    this.printBanner(port, version, services);
  }

  private getAppVersion(): string {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
      );
      return packageJson.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  private checkTcpService(host: string, port: number): Promise<string> {
    return new Promise((resolve) => {
      let socket: ReturnType<typeof createConnection>;
      try {
        socket = createConnection({ host, port });
      } catch {
        resolve('not found');
        return;
      }
      const finish = (status: string) => {
        socket.destroy();
        resolve(status);
      };

      socket.setTimeout(1500);
      socket.once('connect', () => finish('running'));
      socket.once('timeout', () => finish('not found'));
      socket.once('error', () => finish('not found'));
    });
  }

  private async checkServices(): Promise<ServiceStatus[]> {
    const postgres = this.getTcpEndpoint(
      this.configService.get<string>('DB_HOST') || 'localhost',
      this.configService.get<string>('DB_PORT'),
      5432,
    );
    const redis = this.getTcpEndpoint(
      this.configService.get<string>('REDIS_HOST') || 'localhost',
      this.configService.get<string>('REDIS_PORT'),
      6379,
    );
    const elastic = this.getElasticEndpoint(
      this.configService.get<string>('ELASTICSEARCH_NODE') || 'http://localhost:9200',
    );
    const [postgresStatus, redisStatus, elasticStatus] = await Promise.all([
      postgres.valid ? this.checkTcpService(postgres.host, postgres.port) : 'not found',
      redis.valid ? this.checkTcpService(redis.host, redis.port) : 'not found',
      elastic.valid ? this.checkTcpService(elastic.host, elastic.port) : 'not found',
    ]);

    return [
      { name: 'PostgreSQL', status: postgresStatus, port: postgres.portLabel },
      { name: 'Redis', status: redisStatus, port: redis.portLabel },
      { name: 'Elasticsearch', status: elasticStatus, port: elastic.portLabel },
    ];
  }

  private getTcpEndpoint(
    host: string,
    configuredPort: string | undefined,
    defaultPort: number,
  ): TcpEndpoint {
    const portLabel = configuredPort || String(defaultPort);
    const port = Number(portLabel);
    return {
      host,
      port,
      portLabel,
      valid: Number.isInteger(port) && port > 0 && port <= 65535,
    };
  }

  private getElasticEndpoint(node: string): TcpEndpoint {
    try {
      const url = new URL(node);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Unsupported Elasticsearch protocol');
      }
      return this.getTcpEndpoint(
        url.hostname,
        url.port || undefined,
        url.protocol === 'https:' ? 443 : 9200,
      );
    } catch {
      return { host: '', port: 0, portLabel: 'invalid', valid: false };
    }
  }

  private formatStatus(status: string): string {
    switch (status) {
      case 'running':
        return '\x1b[32m● RUNNING\x1b[0m';
      case 'exited':
      case 'stopped':
        return '\x1b[31m○ STOPPED\x1b[0m';
      case 'not found':
        return '\x1b[33m○ NOT FOUND\x1b[0m';
      default:
        return `\x1b[33m○ ${status.toUpperCase()}\x1b[0m`;
    }
  }

  private printBanner(
    port: string,
    version: string,
    services: ServiceStatus[],
  ) {
    const line = '═'.repeat(56);
    const env = process.env.NODE_ENV || 'development';

    console.log('');
    console.log(`\x1b[36m╔${line}╗\x1b[0m`);
    console.log(
      `\x1b[36m║\x1b[0m\x1b[1m   ChillFlix Backend API                                \x1b[0m\x1b[36m║\x1b[0m`,
    );
    console.log(`\x1b[36m╠${line}╣\x1b[0m`);
    console.log(
      `\x1b[36m║\x1b[0m  Version:       \x1b[1m${this.pad(version, 38)}\x1b[0m\x1b[36m║\x1b[0m`,
    );
    console.log(
      `\x1b[36m║\x1b[0m  Environment:   \x1b[1m${this.pad(env, 38)}\x1b[0m\x1b[36m║\x1b[0m`,
    );
    console.log(
      `\x1b[36m║\x1b[0m  API URL:       \x1b[1m${this.pad(`http://localhost:${port}`, 38)}\x1b[0m\x1b[36m║\x1b[0m`,
    );
    console.log(
      `\x1b[36m║\x1b[0m  API Versions:  \x1b[1m${this.pad('v1, v2', 38)}\x1b[0m\x1b[36m║\x1b[0m`,
    );
    console.log(`\x1b[36m╠${line}╣\x1b[0m`);
    console.log(
      `\x1b[36m║\x1b[0m\x1b[1m   Docker Services                                      \x1b[0m\x1b[36m║\x1b[0m`,
    );
    console.log(`\x1b[36m╠${line}╣\x1b[0m`);

    for (const service of services) {
      const statusStr = this.formatStatus(service.status);
      const label = `${service.name} (:${service.port})`;
      // Calculate visible length (without ANSI codes)
      const visibleStatus =
        service.status === 'running'
          ? '● RUNNING'
          : service.status === 'not found'
            ? '○ NOT FOUND'
            : service.status === 'exited' || service.status === 'stopped'
              ? '○ STOPPED'
              : `○ ${service.status.toUpperCase()}`;
      const padding = 38 - label.length - visibleStatus.length;
      const paddedContent = `${label}${' '.repeat(Math.max(1, padding))}${statusStr}`;
      // Recalculate total visible length for right border alignment
      const visibleLength = label.length + Math.max(1, padding) + visibleStatus.length;
      const rightPad = 38 - visibleLength;
      console.log(
        `\x1b[36m║\x1b[0m  ${paddedContent}${' '.repeat(Math.max(0, rightPad))}                \x1b[36m║\x1b[0m`,
      );
    }

    console.log(`\x1b[36m╚${line}╝\x1b[0m`);
    console.log('');
  }

  private pad(str: string, length: number): string {
    return str.length >= length ? str : str + ' '.repeat(length - str.length);
  }
}
