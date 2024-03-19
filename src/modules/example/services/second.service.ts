import { Injectable } from '@nestjs/common';

@Injectable()
export class SecondService {
    useClass() {
        return 'second useClass';
    }

    useFactory() {
        return 'second 构造提供者';
    }

    useAsync() {
        return 'seconde 异步提供者';
    }
}
