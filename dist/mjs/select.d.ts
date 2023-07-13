import { ICacheInfo, QueryForm } from "./types";
export declare const select: <T>(info: ICacheInfo<T>, queryForm: QueryForm, key: string | null) => Promise<T[]>;
