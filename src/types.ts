export interface ICacheInfo<T> {
  queryRunner: null | any;
  redis: null | Function;
  data: T[];
  tableName: null | string;
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
  preloadData: ICacheInfo<T>['data'], 
  queryRunner: ICacheInfo<T>['queryRunner'], 
  redis: ICacheInfo<T>['redis'],
  refKey: ICacheInfo<T>['refKey'],
}

export interface QueryForm {
  column?:string[];
  order?:string[];
  where?:{[key:string]:Condition} & {result:string[]};
  join?:string;
  offset?:number;
  limit?:number;
}


export type Operator = '=' | '==' | '!=' | '<>' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'ILIKE' | 'LIKE'

type Value = string | number | boolean | Date

export type ConditionValue = Value | Value[];

export type Condition = [string, Operator, ConditionValue]