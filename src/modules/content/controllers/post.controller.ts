import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
} from '@nestjs/common';

import { isNil } from 'lodash';

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
    async store(@Body() data: PostEntity) {
        const newPost = {
            id: Math.max(...posts.map(({ id }) => id + 1)),
            ...data,
        };
        posts.push(newPost);
        return newPost;
    }

    @Patch()
    async update(@Body() data: PostEntity) {
        const toUpdate = posts.find(({ id }) => id === Number(data.id));
        console.log(toUpdate, '====');

        if (isNil(toUpdate))
            throw new NotFoundException(`the post with id ${data.id} is not found`);
        posts = posts.map((item) => (item.id === Number(toUpdate.id) ? data : item));
        return data;
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        const toDelete = posts.find(({ id: old }) => old === Number(id));
        console.log(toDelete, '0000');

        if (isNil(toDelete)) throw new NotFoundException(`the post with id ${id} is not found`);
        posts = posts.filter((item) => item.id !== Number(id));
        return toDelete;
    }
}
