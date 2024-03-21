import { resolve } from 'path';

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const database = (): TypeOrmModuleOptions => ({
    type: 'better-sqlite3',
    database: resolve(__dirname, '../../back/database4.db'),
    // 因为我们目前没有涉及到数据迁移的命令编写，所以必须在启动数据库时自动根据加载的模型(Entity)来同步数据表到数据库
    synchronize: true,
    // 这样我们就不需要把每个模块的Entity逐个定死地添加到配置中的entities数组中了，因为你可以在每个模块中使用TypeOrmModule.forFeature来动态的加入Entity
    autoLoadEntities: true,
});
