import { Controller, Get, Inject } from '@nestjs/common';

import { PostService } from '@/modules/content/services/post.service';

import { ConfigService } from '@/modules/core/services/config.service';

import { EighthService } from '../services/eighth.service';
import { FifthService } from '../services/fifth.service';
import { FirstService } from '../services/first.service';
import { FourthService } from '../services/fourth.service';
import { SecondService } from '../services/second.service';
import { SeventhService } from '../services/seventh.service';

@Controller('test')
export class TestController {
    constructor(
        private first: FirstService,
        @Inject('ID-EXAMPLE') private idExp: FirstService,
        private second: SecondService,
        @Inject('FACTORY-EXAMPLE') private ftExp: FourthService,
        @Inject('ALIAS-EXAMPLE') private asExp: FirstService,
        @Inject('ASYNC-EXAMPLE') private acExp: SecondService,
        private fifth: FifthService,
        private seventh: SeventhService,
        private eighth: EighthService,
        private postService: PostService,
        private configService: ConfigService,
    ) {}

    @Get('value')
    async useValue() {
        return this.first.useValue();
    }

    @Get('id')
    async useId() {
        return this.idExp.useId();
    }

    @Get('second')
    async getSecond() {
        return this.second.useFactory();
    }

    @Get('factory')
    async useFactory() {
        return this.ftExp.getContent();
    }

    @Get('as')
    async useAlias() {
        return this.asExp.useValue();
    }

    @Get('async')
    async useAsync() {
        return this.acExp.useAsync();
    }

    @Get('circular')
    async useCircular() {
        return this.fifth.circular();
    }

    @Get('scope')
    async echoScope() {
        await this.eighth.echo();
        await this.seventh.add();
        console.log(`in controller: ${await this.seventh.find()}`);
        return 'Scope Test';
    }

    @Get('post')
    async getPosts() {
        return this.postService.findAll();
    }

    @Get('name')
    async name() {
        return this.configService.get('name');
    }
}
