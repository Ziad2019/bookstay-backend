import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: config.get<number>('DB_PORT', 5432),
  username: config.get<string>('DB_USERNAME'),
  password: config.get<string>('DB_PASSWORD'),
  database: config.get<string>('DB_NAME'),

  // each module registers its own entities via TypeOrmModule.forFeature([...])
  autoLoadEntities: true,

  // dev only: auto-creates tables from entities. Switch to migrations before production.
  synchronize: config.get<string>('NODE_ENV') !== 'production',
});