import { Injectable } from '@nestjs/common';

@Injectable()
export class ThirdService {
    useClass() {
        return 'Third';
    }

    useFactory() {
        return 'Third  构造器提供者2';
    }
}
