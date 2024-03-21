import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    SerializeOptions,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';

import { AppIntercepter } from '@/modules/core/providers/app.interceptor';
import { PaginateOptions } from '@/modules/database/types';

import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
import { PostService } from '../services/post.service';

@UseInterceptors(AppIntercepter)
@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    @Get()
    @SerializeOptions({ groups: ['post-list'] })
    async list(
        @Query()
        options: PaginateOptions,
    ) {
        return this.postService.paginate(options);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.detail(id);
    }

    @Post()
    @SerializeOptions({ groups: ['post-detail'] })
    async store(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreatePostDto,
    ) {
        return this.postService.create(data);
    }

    @Patch()
    @SerializeOptions({ groups: ['post-detail'] })
    async update(
        @Body(
            new ValidationPipe({
                // transform如果设置成true则代码在验证前先把请求数据转换为DTO的实例
                transform: true,
                // 用于过滤掉没有添加验证的器的多余属性（但是如果该属性存在于DTO中且没有添加验证器，但又不想被过滤，你可以加上@Allow装饰器）
                whitelist: true,
                // 设置为true时，当请求中有DTO中不存在的多余属性被传入，则nestjs会抛出403异常（前提是whitelist必须设置成true)
                forbidNonWhitelisted: true,
                // 代表被验证的DTO类上必须至少有一个属性使用了class-validator中的验证规则（此选项是否设置无关紧要）
                forbidUnknownValues: true,
                // 代表不会在响应数据中使我们的验证类也暴露传来
                validationError: { target: false },
                // groups用于设置验证组
                groups: ['update'],
            }),
        )
        data: UpdatePostDto,
    ) {
        return this.postService.update(data);
    }

    @Delete(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.delete(id);
    }
}
