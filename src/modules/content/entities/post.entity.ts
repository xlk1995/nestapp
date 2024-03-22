import { Exclude, Expose, Type } from 'class-transformer';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    Relation,
} from 'typeorm';

import { PostBodyType } from '../constants';

import { CategoryEntity } from './category.entity';
import { CommentEntity } from './comment.entity';
import { TagEntity } from './tag.entity';

// 表名字
// 通过@Exclude首先把所有属性都排除，然后根据我们的需要来配置我们的组
@Exclude()
@Entity('content_posts')
export class PostEntity extends BaseEntity {
    @Expose()
    @PrimaryColumn({
        type: 'varchar',
        generated: 'uuid',
        length: 36,
    })
    id: string;

    @Expose()
    @Column({
        comment: '文章标题',
    })
    title: string;

    @Expose({ groups: ['post-detail'] })
    @Column({
        comment: '文章内容',
        type: 'text',
    })
    body: string;

    @Expose()
    @Column({
        comment: '文章描述',
        nullable: true,
    })
    summary?: string;

    // Expose暴露这个属性
    @Expose()
    @Column({
        comment: '关键字',
        type: 'simple-array',
        nullable: true,
    })
    keywords?: string[];

    @Expose()
    @Column({
        comment: '文章类型',
        type: 'varchar',
        default: PostBodyType.MD,
    })
    type: PostBodyType;

    @Expose()
    @Type(() => Date)
    @Column({
        comment: '发布时间',
        type: 'varchar',
        nullable: true,
    })
    publishedAt?: Date | null;

    @Expose()
    @Column({
        comment: '自定义文章排序',
        default: 0,
    })
    customOrder: number;

    @Expose()
    // Date类型的字段最好添加@Type(() => Date)序列化
    @Type(() => Date)
    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt: Date;

    @Expose()
    @Type(() => Date)
    @DeleteDateColumn({
        comment: '删除时间',
    })
    deletedAt: Date;

    /**
     * 通过queryBuilder生成的评论数量(虚拟字段)
     */
    @Expose()
    commentCount: number;

    /**
     * 软删除标志deletedAt为null时则数据处于正常状态，
     * 当deletedAt为一个时间时，则处于软删除状态（即处于回收站中），
     * 该字段由TypeORM自身通过@DeleteDateColumn装饰器进行维护，
     * 当使用Repository自带的soft Remove或者restore方法进行软删除或恢复数据时，它自己就会改变值，不需要手动设置
     */
    @Expose()
    @Type(() => Date)
    @DeleteDateColumn({
        comment: '删除时间',
    })
    deleteAt: Date;

    @Expose()
    @ManyToOne(() => CategoryEntity, (category) => category.posts, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    category: Relation<CategoryEntity>;

    // 多对多关联时，关联的一侧(比如这里的PostEntity的tags)必须加上@JoinTable装饰器
    @Expose()
    @Type(() => TagEntity)
    @ManyToMany(() => TagEntity, (tag) => tag.posts, {
        cascade: true,
    })
    @JoinTable()
    tags: Relation<TagEntity>[];

    @Expose()
    @OneToMany(() => CommentEntity, (comment) => comment.post, {
        cascade: true,
    })
    comments: Relation<CommentEntity>[];
}
