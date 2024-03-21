// src/modules/core/constraints/match.constraint.ts

import {
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    registerDecorator,
} from 'class-validator';

/**
 * 判断两个字段的值是否相等的验证规则
 */
// ValidatorConstraint 必须传入name 可以随意定义
@ValidatorConstraint({ name: 'isMatch' })
// 必须实现 ValidatorConstraintInterface
export class MatchConstraint implements ValidatorConstraintInterface {
    // validate用于定义验证逻辑，value代表客户端传入的请求数据中当前验证属性的值，args有多个属性
    validate(value: any, args: ValidationArguments) {
        // args的属性如下
        // value: 与value参数同
        // constraints: 绑定该验证规则时转入的自定义参数数组
        // targetName: 被验证类的名称，比如CreatePostDto
        // object: 被验证类在绑定请求数据后的实例(通过对请求数据使用plainToInstance序列化构建)
        // property: 待验证属性的名称,比如plainPassword

        // 该验证规则的逻辑为：获取传入的对比属性（数组结构后赋值给relatedProperty常量，比如password）
        // 通过args.object获取其值，然后与待验证的属性（比如plainPassword）的值进行对比判断是否相等，并返回结果
        const [relatedProperty, reverse] = args.constraints;
        const relatedValue = (args.object as any)[relatedProperty];
        return reverse ? value !== relatedValue : value === relatedValue;
    }

    // defaultMessage为验证失败是默认返回的错误消息，它也能获取到args参数，
    // 同时我们也可以在绑定验证规则时自定义错误消息，自定义的错误消息会覆盖defaultMessage的返回值
    defaultMessage(args: ValidationArguments) {
        const [relatedProperty, reverse] = args.constraints;
        return `${relatedProperty} and ${args.property} ${reverse ? `is` : `don't`} match`;
    }
}

/**
 * 判断DTO中两个属性的值是否相等的验证规则
 * @param relatedProperty 用于对比的属性名称
 * @param reverse 是否反转
 * @param validationOptions class-validator库的选项
 */

// IsMatch是一个用于绑定验证属性，然后通过MatchConstraint类来进行验证的作为桥梁使用的装饰器工厂，它的参数可以随便自定义（此处我们只定义一个需要进行对比的关联属性名，比如plainPassword），但是最后一个参数必定是ValidationOptions类型的验证选项。它的返回值是一个装饰器函数，该函数只有两个固定参数，其中object参数为我们验证的DTO类，propertyName为我们验证的属性。该装饰器内部使用registerDecorator函数来注册验证约束。registerDecorator接收一个选项对象的参数，其传入的值如下
// target: 为待验证的DTO类的构造器，一般我们传入在工厂函数（即IsMatch）中传入的object参数的object.contructor
// propertyName: 待验证属性的名称
// options: 通过工厂函数传入的验证选项
// constraints: 自定义参数数组，在这里有一个一个元素，就是在工厂函数传入的relatedProperty参数
// async: 是否为异步验证约束（下文会讲到）
// validator: 绑定的定义约束执行逻辑的类，此处为MatchConstraint（也可以是一个实现ValidatorConstraintInterface接口的普通对象）
export function IsMatch(
    relatedProperty: string,
    reverse = false,
    validationOptions?: ValidationOptions,
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [relatedProperty, reverse],
            validator: MatchConstraint,
        });
    };
}

// demo:使用方法如下 其中message中的$constraint1代表传入到registerDecorator函数中的constraints属性的第一个值，此处就是plainPassword

// @Length(8, 50, {
//     message: '密码长度不得少于$constraint1',
// })
// readonly password: string;

// @IsMatch('password', { message: '两次输入密码不同' })
// @IsNotEmpty({ message: '请再次输入密码以确认' })
// readonly plainPassword: string;
