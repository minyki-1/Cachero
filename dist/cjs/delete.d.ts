import { ICacheInfo } from "types";
export declare function deleteData<T>(info: ICacheInfo<T>, condition: {
    [key: string]: T[keyof T];
}): void;
