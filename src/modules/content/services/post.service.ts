import { Injectable, NotFoundException } from '@nestjs/common';

import { isNil } from 'lodash';

import { CreatePostDto } from '../dtos/create-post.dto';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { PostEntity } from '../types';

@Injectable()
export class PostService {
    protected posts: PostEntity[] = [
        {
            title: '文章1',
            body: '这是文章1',
        },
        {
            title: '文章2',
            body: '这是文章2',
        },
        {
            title: '文章3',
            body: '这是文章3',
        },
        {
            title: '文章4',
            body: '这是文章4',
        },
    ].map((v, id) => ({ ...v, id }));

    async findAll() {
        return this.posts;
    }

    async findOne(id: number) {
        const post = this.posts.find((item) => item.id === id);
        if (isNil(post)) throw new NotFoundException(`this post with id ${id} is not found`);
        return post;
    }

    async create(data: CreatePostDto) {
        const newPost = {
            id: Math.max(...this.posts.map((v) => v.id + 1)),
            ...data,
        };
        this.posts.push(newPost);
    }

    async update(data: UpdatePostDto) {
        let toUpdate = this.posts.find((v) => v.id === data.id);
        if (isNil(toUpdate)) throw new NotFoundException(`this post with ${data.id} is not found`);
        toUpdate = { ...toUpdate, ...data };
        this.posts = this.posts.map((v) => (v.id === toUpdate.id ? toUpdate : v));
        return toUpdate;
    }

    async delete(id: number) {
        const toDelete = this.posts.find((v) => v.id === id);
        if (isNil(toDelete)) throw new NotFoundException(`this post with id ${id} is not found`);
        this.posts = this.posts.filter((v) => v.id !== id);
        return toDelete;
    }
}
