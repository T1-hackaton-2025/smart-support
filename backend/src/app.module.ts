import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: +(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'myuser',
      password: process.env.DATABASE_PASSWORD || 'ChangeMe',
      database: process.env.DATABASE_NAME || 'api',
      entities: [],
      synchronize: false,
      logging: true,
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
