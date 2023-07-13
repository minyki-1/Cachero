import { QueryForm, SettingParams } from "./types.js";
export declare const createCachero: <T>() => {
    /**
     * @Tip Scheduler can set multiple time zones -
     * [[1,0],[12,0]] = 01:00, 12:00
     * */
    scheduler: (times: number[][], preloadData: T[]) => {
        cancel: () => void;
    };
    /** You should setting before use select | create | update | delete*/
    setting: (data: SettingParams<T>) => Promise<void>;
    /** @Tip Recommend importing columns of all data at once for data reuse*/
    select: (queryForm?: QueryForm, key?: string | null) => Promise<T[]>;
    /** @Tip Newly created data can be delivered immediately*/
    create: (newData: T) => void;
    /** @Tip Updated data will be applied immediately*/
    update: (newData: T[]) => void;
    delete: (condition: {
        [key: string]: T[keyof T];
    }) => void;
    batchSave: (preloadData: T[]) => Promise<void>;
};
