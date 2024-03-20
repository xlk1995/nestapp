import { Exclude, Expose, Type } from 'class-transformer';
import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryColumn,
    Relation,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from './post.entity';

// 其中category-tree代表在直接查询这个分类树的时候显示的字段，而category-list代表在查询打平树并且分页后的数据时显示的字段
// 对于嵌套类型字段(比如一对多关联的其他模型或者树形嵌套的children)的序列化，需要添加上@Type装饰器

@Exclude()
@Tree('materialized-path')
@Entity('content_categories')
export class CategoryEntity extends BaseEntity {
    @Expose()
    @PrimaryColumn({
        type: 'varchar',
        generated: 'uuid',
        length: 36,
    })
    id: string;

    @Expose()
    @Column({
        comment: '分类名称',
        unique: true,
    })
    name: string;

    @Expose({ groups: ['category-tree', 'category-list', 'category-detail'] })
    @Column({
        comment: '分类排序',
        default: 0,
    })
    customOrder: number;

    // mpath: string

    // parentId: string
    @Expose({ groups: ['category-list'] })
    depth = 0;

    @Expose({ groups: ['category-detail', 'category-list'] })
    @TreeParent({ onDelete: 'NO ACTION' })
    parent: Relation<CategoryEntity> | null;

    @Expose({ groups: ['category-tree'] })
    @Type(() => CategoryEntity)
    @TreeChildren({ cascade: true })
    children: Relation<CategoryEntity>[];

    @OneToMany(() => PostEntity, (post) => post.category, {
        cascade: true,
    })
    posts: Relation<PostEntity>[];
}
