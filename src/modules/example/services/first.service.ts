import { Injectable } from '@nestjs/common';

@Injectable()
export class FirstService {
    useValue() {
        return '我是1111';
    }

    useId() {
        return '字符串提供者2222';
    }

    useAlias() {
        return '别名提供者';
    }
}
