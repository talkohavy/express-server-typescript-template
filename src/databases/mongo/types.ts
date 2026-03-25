export type SchemaField = {
  type: any; // NumberConstructor | StringConstructor | Array<NumberConstructor> | Array<StringConstructor>;
  required: boolean;
  immutable?: boolean;
  default?: any;
  select?: boolean;
  needPermission?: boolean;
  unique?: boolean;
  index?: boolean;
  lowercase?: boolean;
  itemsType?: string;
  refPath?: string;
};

export type SchemaTemplate = Record<string, SchemaField | { type: SchemaTemplate; refPath?: string }>;
