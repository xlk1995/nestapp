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

import { DtoValidation } from '@/modules/core/decorators/dto-validation.decorator';
import { toBoolean } from '@/modules/core/helpers';
import { PaginateOptions } from '@/modules/database/types';

import { PostOrderType } from '../constants';

/**
 * 查询参数校验
 */
@DtoValidation({ groups: ['query'] })
export class QueryPostDto implements PaginateOptions {
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
    page? = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示长度必须大于1' })
    @IsNumber()
    @IsOptional()
    limit? = 10;

    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    category?: string;

    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    tag?: string;
}

/**
 * 创建文章验证
 */
@DtoValidation({ groups: ['create'] })
export class CreatePostDto {
    @MaxLength(255, {
        always: true,
        message: '文章标题最大长度为$constraint1',
    })
    @IsNotEmpty({
        groups: ['create'],
        message: '文章标题必须填写',
    })
    @IsOptional({
        groups: ['update'],
    })
    title: string;

    @MaxLength(1000, {
        always: true,
        message: '文章内容最大长度为$constraint1',
    })
    @IsNotEmpty({
        groups: ['create'],
        message: '文章内容必须填写',
    })
    @IsOptional({
        groups: ['update'],
    })
    body: string;

    @MaxLength(500, {
        always: true,
        message: '文章描述最大长度为$constraint1',
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
        message: '每个关键字长度不能大于$constraint1',
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

    @IsUUID(undefined, {
        always: true,
        message: 'ID格式错误',
    })
    @IsOptional({ always: true })
    category?: string;

    /**
     * 根据标签ID查询
     */
    @IsUUID(undefined, {
        always: true,
        each: true,
        message: 'ID格式错误',
    })
    @IsOptional({ always: true })
    tags?: string[];
}

/**
 * 文章更新验证
 *
 */

@DtoValidation({ groups: ['update'] })
export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsUUID(undefined, { groups: ['update'], message: '文章ID格式错误' })
    @IsDefined({ groups: ['update'], message: '文章ID必须指定' })
    id: string;
}
