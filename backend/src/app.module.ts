import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RagModule } from './rag/rag.module';
import { SupportModule } from './support/support.module';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'myuser'),
        password: configService.get('DATABASE_PASSWORD', 'ChangeMe'),
        database: configService.get('DATABASE_NAME', 'api'),
        entities: [],
        synchronize: false,
        logging: true,
      }),
    }),
    RagModule,
    SupportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      const sqlPath = path.join(process.cwd(), 'src/database/init.sql');
      const sqlScript = fs.readFileSync(sqlPath, 'utf8');
      
      await this.dataSource.query(sqlScript);
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }
}
