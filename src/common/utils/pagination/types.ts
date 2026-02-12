/** 1 = ascending, -1 = descending. Compatible with MongoDB/Mongoose and most ORMs. */
export type SortValue = 1 | -1;

export type QueryOptions = {
  sort?: Record<string, SortValue>;
  limit?: number;
  skip?: number;
};
