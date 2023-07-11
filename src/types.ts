export interface ICacheInfo<T> {
  queryRunner: null | Function;
  redis: null | Function;
  data: T[];
  tableName: null | string;
  cachedKey: string[];
  count: number;
  deleted: {
    [P in keyof T]?: T[P]
  };
  tableColumns: string[];
}

export interface SettingParams<T> {
  table: ICacheInfo<T>['tableName'], 
  preloadData: ICacheInfo<T>['data'], 
  queryRunner: ICacheInfo<T>['queryRunner'], 
  redis: ICacheInfo<T>['redis']
}

export interface QueryForm {
  column?:string[];
  order?:string[];
  where?:{
    [key:string]:string[];
    result:string[];
  };
  join?:string;
  offset?:number;
  limit?:number;
}