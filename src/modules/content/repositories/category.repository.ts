import { pick, unset } from 'lodash';
import {
    FindOptionsUtils,
    FindTreeOptions,
    SelectQueryBuilder,
    TreeRepository,
    TreeRepositoryUtils,
} from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { CategoryEntity } from '../entities/category.entity';

@CustomRepository(CategoryEntity)
export class CategoryRepository extends TreeRepository<CategoryEntity> {
    buildBaseQB() {
        // leftJoinAndSelect('表名.关联属性', '别名')
        return this.createQueryBuilder('category').leftJoinAndSelect('category.parent', 'parent');
    }

    /**
     * 树形结构查询
     * Gets complete trees for all roots in the table.
     */
    async findTrees(options?: FindTreeOptions) {
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    /**
     * 查询顶级分类
     * Roots are entities that have no ancestors. Finds them all.
     */
    findRoots(options?: FindTreeOptions): Promise<CategoryEntity[]> {
        const escapeAlias = (alias: string) => this.manager.connection.driver.escape(alias);
        const escapeColumn = (column: string) => this.manager.connection.driver.escape(column);

        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;

        const qb = this.buildBaseQB().orderBy('category.customOrder', 'ASC');
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);

        return qb
            .where(`${escapeAlias('category')}.${escapeColumn(parentPropertyName)} IS NULL`)
            .getMany();
    }

    /**
     * 查询后代分类
     * Gets all children (descendants) of the given entity. Returns them all in a flat array.
     */
    findDescendants(entity: CategoryEntity, options?: FindTreeOptions) {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        return qb.getMany();
    }

    /**
     * 查询祖先分类
     * Gets all parents (ancestors) of the given entity. Returns them all in a flat array.
     */
    findAncestors(entity: CategoryEntity, options?: FindTreeOptions) {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        return qb.getMany();
    }

    /**
     * 查询后代树
     * Gets all children (descendants) of the given entity. Returns them in a tree - nested into each other.
     */
    async findDescendantsTree(entity: CategoryEntity, options?: FindTreeOptions) {
        // todo: throw exception if there is no column of this relation?

        const qb: SelectQueryBuilder<CategoryEntity> = this.createDescendantsQueryBuilder(
            'category',
            'treeClosure',
            entity,
        )
            .leftJoinAndSelect('category.parent', 'parent')
            .orderBy('category.customOrder', 'ASC');

        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));

        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            'category',
            entities.raw,
        );
        TreeRepositoryUtils.buildChildrenEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
            {
                depth: -1,
                ...options,
            },
        );

        return entity;
    }

    /**
     * 查询祖先树
     * Gets all parents (ancestors) of the given entity. Returns them in a tree - nested into each other.
     */
    async findAncestorsTree(entity: CategoryEntity, options?: FindTreeOptions) {
        // todo: throw exception if there is no column of this relation?
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity)
            .leftJoinAndSelect('category.parent', 'parent')
            .orderBy('category.customOrder', 'ASC');
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);

        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            'category',
            entities.raw,
        );
        TreeRepositoryUtils.buildParentEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
        );
        return entity;
    }

    /**
     * 统计后代的个数
     * Gets number of descendants of the entity.
     */
    countDescendants(entity: CategoryEntity): Promise<number> {
        return this.createDescendantsQueryBuilder('category', 'treeClosure', entity).getCount();
    }

    /**
     * 统计祖先元素数量
     * @param entity
     */
    async countAncestors(entity: CategoryEntity) {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        return qb.getCount();
    }

    async toFlatTrees(trees: CategoryEntity[], parent: CategoryEntity | null = null, depth = 0) {
        const data: Omit<CategoryEntity, 'children'>[] = [];
        for (const item of trees) {
            item.depth = depth;
            item.parent = parent;
            const { children } = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, item, depth + 1)));
        }
        return data as CategoryEntity[];
    }
}
