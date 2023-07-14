export interface ICacheInfo<T> {
  queryRunner: {query:any} | null;
  redis: {set:any} | null;
  data: T[];
  tableName: string | null;
  cachedKey: string[];
  count: number;
  deleted: {
    [key:string]: T[keyof T][]
  };
  tableColumns: string[];
  refKey: null | keyof T;
}

export interface SettingParams<T> {
  table: ICacheInfo<T>['tableName'],
  preloadData?: ICacheInfo<T>['data'], 
  queryRunner: ICacheInfo<T>['queryRunner'], 
  redis?: ICacheInfo<T>['redis'],
  refKey: keyof T,
}

export interface QueryForm {
  column?:string[];
  order?:string[];
  where?:{
    [key:string | "result"]:Condition | string[],
  };
  join?:string;
  offset?:number;
  limit?:number;
}


export type Operator = '=' | '==' | '!=' | '<>' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'ILIKE' | 'LIKE'

type Value = string | number | boolean | Date

export type ConditionValue = Value | Value[];

export type Condition = [string, Operator, ConditionValue]