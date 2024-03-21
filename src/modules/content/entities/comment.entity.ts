import { Exclude, Expose, Type } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryColumn,
    Relation,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from './post.entity';

@Exclude()
@Tree('materialized-path')
@Entity('content_comment')
export class CommentEntity {
    @Exclude()
    @PrimaryColumn({
        type: 'varchar',
        generated: 'uuid',
        length: 36,
    })
    id: string;

    @Exclude()
    @Column({
        comment: '评论内容',
        type: 'text',
    })
    body: string;

    @Exclude()
    @Type(() => Date)
    @CreateDateColumn()
    createAt: Date;

    @Expose({ groups: ['comment-list'] })
    depth = 0;

    // 删除父评论时，我们把这条评论的子孙评论一并删除，所以把oneDelete设置成CASCADE
    @Expose({ groups: ['comment-list', 'comment-detail'] })
    @TreeParent({
        onDelete: 'CASCADE',
    })
    parent: Relation<CommentEntity> | null;

    @Expose({ groups: ['comment-tree'] })
    @Type(() => CommentEntity)
    @TreeChildren({
        cascade: true,
    })
    children: Relation<CommentEntity>[];

    @ManyToOne(() => PostEntity, (post) => post.comments, {
        nullable: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    posts: Relation<PostEntity>;
}
