import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    ValidationPipe,
} from '@nestjs/common';

import { isNil } from 'lodash';

import { CreatePostDto } from '../dtos/create-post.dto';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { PostEntity } from '../types';

let posts: PostEntity[] = [
    {
        title: '第一篇',
        body: '我是第一篇啊',
    },
    {
        title: '第2篇',
        body: '我是第2篇啊',
    },
    {
        title: '第3篇',
        body: '我是第3篇啊',
    },
    {
        title: '第4篇',
        body: '我是第4篇啊',
    },
].map((item, id) => ({ ...item, id }));

@Controller('posts')
export class PostController {
    @Get()
    async index() {
        return posts;
    }

    @Get(':id')
    async show(@Param('id') id: number) {
        const post = posts.find((item) => item.id === Number(id));

        if (isNil(post)) throw new NotFoundException(`the post with ${id} not exits`);
        return post;
    }

    @Post()
    async store(
        @Body(
            new ValidationPipe({
                transform: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreatePostDto,
    ) {
        const newPost = {
            id: Math.max(...posts.map(({ id }) => id + 1)),
            ...data,
        };
        posts.push(newPost);
        return newPost;
    }

    @Patch()
    async update(
        @Body(
            new ValidationPipe({
                transform: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['update'],
            }),
        )
        { id, ...data }: UpdatePostDto,
    ) {
        let toUpdate = posts.find((item) => item.id === Number(id));
        if (isNil(toUpdate)) throw new NotFoundException(`the post with id ${id} is not found`);
        toUpdate = { ...toUpdate, ...data };
        posts = posts.map((item) => (item.id === Number(id) ? toUpdate : item));
        return toUpdate;
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        const toDelete = posts.find(({ id: old }) => old === Number(id));
        if (isNil(toDelete)) throw new NotFoundException(`the post with id ${id} is not found`);
        posts = posts.filter((item) => item.id !== Number(id));
        return toDelete;
    }
}
