import { Injectable } from '@nestjs/common';

import { isFunction, isNil, omit } from 'lodash';
import { EntityNotFoundError, IsNull, Not, SelectQueryBuilder } from 'typeorm';

import { paginate } from '@/modules/database/helper';
import { PaginateOptions, QueryHook } from '@/modules/database/types';

import { PostOrderType } from '../constants';
import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
import { PostEntity } from '../entities/post.entity';
import { PostRepository } from '../repositories/post.repository';

@Injectable()
export class PostService {
    constructor(protected repository: PostRepository) {}

    /**
     * 分页
     * @param options
     * @param callback
     */
    async paginate(options: PaginateOptions, callback?: QueryHook<PostEntity>) {
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), options, callback);
        return paginate(qb, options);
    }

    /**
     * add
     * @param data
     */
    async create(data: CreatePostDto) {
        let publishedAt: Date | null;
        if (!isNil(data.publish)) {
            publishedAt = data.publish ? new Date() : null;
        }
        const item = await this.repository.save({ ...omit(data, ['publish']), publishedAt });
        return this.detail(item.id);
    }

    /**
     * update
     * @param data
     */
    async update(data: UpdatePostDto) {
        let publishedAt: Date | null;
        if (!isNil(data.publish)) {
            publishedAt = data.publish ? new Date() : null;
        }
        await this.repository.update(data.id, { ...omit(data, ['id, publish']), publishedAt });
        return this.detail(data.id);
    }

    /**
     * delete
     * @param id
     */
    async delete(id: string) {
        const item = await this.repository.findOneByOrFail({ id });
        return this.repository.remove(item);
    }

    /**
     *
     * @param id
     */
    async detail(id: string, callback?: QueryHook<PostEntity>) {
        let qb = this.repository.buildBaseQB();
        qb.where(`post.id = :id`, { id });
        qb = !isNil(callback) && isFunction(callback) ? await callback(qb) : qb;
        const item = await qb.getOne();
        if (!item) throw new EntityNotFoundError(PostEntity, `this post ${id} not exists`);
        return item;
    }

    /**
     *
     * @param qb 初始查询构造器
     * @param options 排查分页选项后的查询选项
     * @param callback 添加额外的查询
     */
    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: Record<string, any>,
        callback?: QueryHook<PostEntity>,
    ) {
        const { orderBy, isPublished } = options;
        console.log(orderBy, isPublished, '====');

        if (typeof isPublished === 'boolean') {
            isPublished
                ? qb.where({
                      publishedAt: Not(IsNull()),
                  })
                : qb.where({
                      publishedAt: IsNull(),
                  });
        }
        this.queryOrderBy(qb, orderBy);
        if (callback) return callback(qb);
        return qb;
    }

    /**
     * 对文章进行排序和Query构建
     * @param qb
     * @param orderBy 排序方式
     */
    protected queryOrderBy(qb: SelectQueryBuilder<PostEntity>, orderBy: PostOrderType) {
        switch (orderBy) {
            case PostOrderType.CREATED:
                return qb.orderBy('post.createAt', 'DESC');
            case PostOrderType.UPDATED:
                return qb.orderBy('post.updatedAt', 'DESC');
            case PostOrderType.PUBLISHED:
                return qb.orderBy('post.publishedAt', 'DESC');
            case PostOrderType.CUSTOM:
                return qb.orderBy('customOrder', 'DESC');
            default:
                return qb
                    .orderBy('post.createAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC');
        }
    }
}
