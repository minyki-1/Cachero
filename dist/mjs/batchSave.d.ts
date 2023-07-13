import { ICacheInfo } from "types";
export declare function batchSave<T>(info: ICacheInfo<T>, preloadData?: T[]): Promise<void>;
