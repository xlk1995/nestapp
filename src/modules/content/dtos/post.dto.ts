import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsDefined,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsUUID,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';

import { isNil, toNumber } from 'lodash';

import { toBoolean } from '@/modules/core/helpers';
import { PaginateOptions } from '@/modules/database/types';

import { PostOrderType } from '../constants';

/**
 * 查询参数校验
 */
export class QueryDto implements PaginateOptions {
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    @IsEnum(PostOrderType, {
        message: `排序规则必须是${Object.values(PostOrderType).join(',')}其中一项`,
    })
    @IsOptional()
    orderBy?: PostOrderType;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '当前页必须大于1' })
    @IsNumber()
    @IsOptional()
    page = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示长度必须大于1' })
    @IsNumber()
    @IsOptional()
    limit = 10;
}

/**
 * 创建文章验证
 */
export class CreatePostDto {
    @MaxLength(255, {
        always: true,
        message: '文章最大长度为$container1',
    })
    @IsNotEmpty({
        groups: ['create'],
        message: '文章标题必须填写',
    })
    @IsOptional({
        groups: ['update'],
    })
    title: string;

    @MaxLength(500, {
        always: true,
        message: '文章描述最大长度为$container1',
    })
    @IsOptional({ always: true })
    summary?: string;

    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @ValidateIf((value) => !isNil(value.publish))
    @IsOptional({ always: true })
    publish?: boolean;

    @MaxLength(20, {
        each: true,
        always: true,
        message: '每个关键字长度不能大于$container1',
    })
    @IsOptional({ always: true })
    keywords?: string[];

    @Transform(({ value }) => toNumber(value))
    @Min(0, {
        always: true,
        message: '排序值必须大于0',
    })
    @IsNumber(undefined, { always: true })
    @IsOptional({ always: true })
    customOrder?: number = 0;
}

/**
 * 文章更新验证
 *
 */

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsUUID(undefined, { groups: ['update'], message: '文章ID格式错误' })
    @IsDefined({ groups: ['update'], message: '文章ID必须指定' })
    id: string;
}
