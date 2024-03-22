import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { useContainer } from 'class-validator';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
        // 允许跨域访问
        cors: true,
        // 只打印error 和warn
        logger: ['error', 'warn'],
    });
    // 设置访问前缀
    app.setGlobalPrefix('api');
    useContainer(app.select(AppModule), {
        fallbackOnErrors: true,
    });

    // 启动后输出
    await app.listen(3100, () => {
        console.log('api: http://localhost:3100');
    });
}
bootstrap();
