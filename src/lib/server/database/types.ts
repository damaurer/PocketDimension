

export type SqlVariablePrefix = `$${string}`

export interface UpdateValues{
	[key: SqlVariablePrefix]: string | number | null | undefined
}

export interface InsertValues{
	[key: SqlVariablePrefix]: string | number | null | undefined
}

export interface QueryWhere {
	value: string,
	params: {[key: SqlVariablePrefix]: string | number | null | undefined}
}

export interface QueryParams {
	where?: QueryWhere,
}

export interface UpdateQueryParams extends QueryParams {
	values: UpdateValues
	where: QueryWhere,
}

export interface InsertQueryParams extends QueryParams {
	values: InsertValues
}

export interface Repository<T> {
	findAll: (queryParam: QueryWhere) => Promise<T[]>
	findBy: (queryParam: QueryWhere) => Promise<T | undefined>
	insert: (queryParam: InsertQueryParams) => Promise<T>
	update: (queryParam: UpdateQueryParams) => Promise<T>
	delete: (queryParam: QueryWhere) => Promise<void>
}
