import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import { PostController } from './controllers/post.controller';
import { PostEntity } from './entities/post.entity';
import { PostRepository } from './repositories/post.repository';
import { PostService } from './services/post.service';
import { SanitizeService } from './services/sanitize.service';
import { PostSubscriber } from './subscribers/post.subscriber';

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity]),
        DatabaseModule.forRepository([PostRepository]),
    ],

    providers: [PostService, PostSubscriber, SanitizeService],
    controllers: [PostController],
    exports: [PostService, DatabaseModule.forRepository([PostRepository])],
})
export class ContentModule {}
