import { Interface } from '@ethersproject/abi';
import { CommandType, CommandDefinition } from '../utils/routerCommands';
export declare type Param = {
    readonly name: string;
    readonly value: any;
};
export declare type UniversalRouterCommand = {
    readonly commandName: string;
    readonly commandType: CommandType;
    readonly params: readonly Param[];
};
export declare type UniversalRouterCall = {
    readonly commands: readonly UniversalRouterCommand[];
};
export declare type V3PathItem = {
    readonly tokenIn: string;
    readonly tokenOut: string;
    readonly fee: number;
};
export interface CommandsDefinition {
    [key: number]: CommandDefinition;
}
export declare abstract class CommandParser {
    static INTERFACE: Interface;
    static parseCalldata(calldata: string): UniversalRouterCall;
}
export declare class GenericCommandParser {
    private readonly commandDefinition;
    constructor(commandDefinition: CommandsDefinition);
    parse(commands: string, inputs: string[]): UniversalRouterCall;
    private static getCommands;
}
export declare function parseV3PathExactIn(path: string): readonly V3PathItem[];
export declare function parseV3PathExactOut(path: string): readonly V3PathItem[];
