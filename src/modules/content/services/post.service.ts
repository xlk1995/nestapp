import { Injectable } from '@nestjs/common';

import { isArray, isFunction, isNil, omit } from 'lodash';

import { EntityNotFoundError, In, IsNull, Not, SelectQueryBuilder } from 'typeorm';

import { SelectTrashMode } from '@/modules/database/constants';
import { paginate } from '@/modules/database/helper';
import { QueryHook } from '@/modules/database/types';

import { PostOrderType } from '../constants';
import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dtos/post.dto';
import { PostEntity } from '../entities/post.entity';
import { CategoryRepository } from '../repositories/category.repository';
import { PostRepository } from '../repositories/post.repository';

import { TagRepository } from '../repositories/tag.repository';

import { CategoryService } from './category.service';

// 文章查询接口
type FindParams = {
    [key in keyof Omit<QueryPostDto, 'limit' | 'page'>]: QueryPostDto[key];
};

/**
 * 文章数据操作
 */
@Injectable()
export class PostService {
    constructor(
        protected repository: PostRepository,
        protected categoryRepository: CategoryRepository,
        protected categoryService: CategoryService,
        protected tagRepository: TagRepository,
    ) {}

    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     */
    async paginate(options: QueryPostDto, callback?: QueryHook<PostEntity>) {
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), options, callback);
        return paginate(qb, options);
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
     * 创建文章
     * @param data
     */
    async create(data: CreatePostDto) {
        let publishedAt: Date | null;
        if (!isNil(data.publish)) {
            publishedAt = data.publish ? new Date() : null;
        }
        const createPostDto = {
            ...omit(data, ['publish']),
            // 文章所属的分类
            category: !isNil(data.category)
                ? await this.categoryRepository.findOneOrFail({ where: { id: data.category } })
                : null,
            // 文章关联的标签
            tags: isArray(data.tags)
                ? await this.tagRepository.findBy({
                      id: In(data.tags),
                  })
                : [],
            publishedAt,
        };
        const item = await this.repository.save(createPostDto);

        return this.detail(item.id);
    }

    /**
     * 更新文章
     * @param data
     */
    async update(data: UpdatePostDto) {
        let publishedAt: Date | null;
        if (!isNil(data.publish)) {
            publishedAt = data.publish ? new Date() : null;
        }
        const post = await this.detail(data.id);
        if (data.category !== undefined) {
            // 更新分类
            const category = isNil(data.category)
                ? null
                : await this.categoryRepository.findOneByOrFail({ id: data.category });
            post.category = category;
            this.repository.save(post, { reload: true });
        }
        if (isArray(data.tags)) {
            // 更新文章关联标签
            await this.repository
                .createQueryBuilder('post')
                .relation(PostEntity, 'tags')
                .of(post)
                .addAndRemove(data.tags, post.tags ?? []);
        }
        await this.repository.update(data.id, {
            ...omit(data, ['id', 'tags', 'category', 'publish']),
            publishedAt,
        });
        return this.detail(data.id);
    }

    /**
     * delete 批量删除
     * @param ids
     */
    async delete(ids: string[], trash?: boolean) {
        const items = await this.repository
            .buildBaseQB()
            .where('post.id IN (:...ids)', { ids })
            .withDeleted()
            .getMany();
        let result: PostEntity[] = [];
        if (trash) {
            // 对软删除的数据再次删除时直接通过remove方法从数据库中清除
            const directs = items.filter((item) => !isNil(item.deletedAt));
            const softs = items.filter((item) => isNil(item.deletedAt));
            result = [
                ...(await this.repository.remove(directs)),
                ...(await this.repository.softRemove(softs)),
            ];
        } else {
            result = await this.repository.remove(items);
        }
        return result;
    }

    /**
     * 构建文章列表查询器
     * @param qb 初始查询构造器
     * @param options 排查分页选项后的查询选项
     * @param callback 添加额外的查询
     */
    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: FindParams,
        callback?: QueryHook<PostEntity>,
    ) {
        const { category, tag, orderBy, isPublished, trashed } = options;
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
        if (category) await this.queryByCategory(category, qb);
        // 查询某个标签关联的文章
        if (tag) qb.where('tags.id = :id', { id: tag });
        // 是否查询回收站
        if (trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY) {
            qb.withDeleted();
            if (trashed === SelectTrashMode.ONLY) qb.where(`post.deletedAt is not null`);
        }
        if (callback) return callback(qb);
        return qb;
    }

    /**
     *  对文章进行排序的Query构建
     * @param qb
     * @param orderBy 排序方式
     */
    protected queryOrderBy(qb: SelectQueryBuilder<PostEntity>, orderBy?: PostOrderType) {
        switch (orderBy) {
            case PostOrderType.CREATED:
                return qb.orderBy('post.createdAt', 'DESC');
            case PostOrderType.UPDATED:
                return qb.orderBy('post.updatedAt', 'DESC');
            case PostOrderType.PUBLISHED:
                return qb.orderBy('post.publishedAt', 'DESC');
            case PostOrderType.COMMENTCOUNT:
                return qb.orderBy('commentCount', 'DESC');
            case PostOrderType.CUSTOM:
                return qb.orderBy('customOrder', 'DESC');
            default:
                return qb
                    .orderBy('post.createdAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC')
                    .addOrderBy('commentCount', 'DESC');
        }
    }

    /**
     * 查询出分类及其后代分类下的所有文章的Query构建
     * @param id
     * @param qb
     */
    protected async queryByCategory(id: string, qb: SelectQueryBuilder<PostEntity>) {
        const root = await this.categoryService.detail(id);
        const tree = await this.categoryRepository.findDescendantsTree(root);
        const flatDes = await this.categoryRepository.toFlatTrees(tree.children);
        const ids = [tree.id, ...flatDes.map((item) => item.id)];
        return qb.where('category.id IN (:...ids)', {
            ids,
        });
    }

    /**
     * 恢复文章
     * @param ids
     */
    async restore(ids: string[]) {
        const items = await this.repository
            .buildBaseQB()
            .where('post.id IN (:...ids)', { ids })
            .withDeleted()
            .getMany();
        // 过滤掉不在回收站中的数据
        const trasheds = items.filter((item) => !isNil(item));
        const trashedsIds = trasheds.map((item) => item.id);
        if (trasheds.length < 1) return [];
        await this.repository.restore(trashedsIds);
        const qb = await this.buildListQuery(this.repository.buildBaseQB(), {}, async (qbuilder) =>
            qbuilder.andWhereInIds(trashedsIds),
        );
        return qb.getMany();
    }
}
