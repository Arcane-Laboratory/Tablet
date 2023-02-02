import { Table, tableData } from './Table';
interface loadFactory<T extends tableData, U extends Entity<T>> {
    (record: T): Promise<U>;
}
/**
 * abstract class Entity can be implemented to make classes integrated with a Table
 * the generic T is the type of data stored in and read from the table
 * extended classes must also initialize themselves by calling their
 *   .registerEntity method
 *
 */
export declare abstract class Entity<T extends tableData> implements tableData {
    private static tables;
    private static caches;
    private static loadFactories;
    readonly id: string;
    /**
     *
     * @param id the id of a given entity, if none exists, one is assigned
     */
    constructor(id?: string);
    /**
     * generate a record to be stored in a Table
     */
    abstract generateRecord(): T;
    /**
     *
     * @param table a Table which will store this Entity's records
     * @param loadFactory a function which takes a record and returns an instance of the Entity
     * @returns true if everything worked
     */
    static registerEntity<T extends tableData, U extends Entity<T>>(this: new (...args: any[]) => U, table: Table<T>, loadFactory: loadFactory<T, U>): boolean;
    /**
     *
     * @param id the id of the entity to fetch
     * @returns a promise, which will be the proper entity if it's found and null otherwise
     */
    static fetch<T extends tableData, U extends Entity<T>>(this: new (...args: any[]) => U, id: string): Promise<U | null>;
    /**
     *
     * @returns a promise of an array of all entities from the table
     */
    static fetchAll<T extends tableData, U extends Entity<T>>(this: new (...args: any[]) => U): Promise<Array<U> | null>;
    /**
     *
     * @param filterFn a function used to filter entity records
     * @returns an array of instantiated entities with a record which matches properly
     */
    static filterEntity<T extends tableData, U extends Entity<T>>(this: new (...args: any[]) => U, filterFn: (entity: T) => boolean): Promise<Array<U>>;
    /**
     *
     * @param findFn a function used to find an entity record
     * @returns an instantiated entity with a record matching the findFn
     */
    static findEntity<T extends tableData, U extends Entity<T>>(this: new (...args: any[]) => U, findFn: (entity: T) => boolean): Promise<U | undefined>;
    static findRecord<T extends tableData>(this: new (...args: any[]) => Entity<T>, findFn: (entity: T) => boolean): Promise<T | undefined>;
    /**
     * CReate or UPDATE a specific entity's record on the table
     * @param record the record to create or update on a table
     * @returns the record that has been updated
     */
    static crupdate<T extends tableData, U extends Entity<T>>(this: new (...args: any[]) => U, record: T): Promise<T | null>;
    /**
     * save this to the entity table
     * @returns the id of the written entity's record if successful, null otherwise
     */
    save(): Promise<string | null>;
    /**
     * delete the given entity from the table
     */
    delete(): Promise<boolean>;
    /**
     *
     * @returns a list of all instantiated entities
     */
    static entityCacheList(): Array<{
        ctorName: string;
        cacheSize: number;
        cache: Map<string, any>;
    }>;
    /**
     *
     * @returns the number of entities in the table cache
     */
    static numCached<T extends tableData>(this: new (...args: any[]) => Entity<T>): number;
    /**
     * find a table belonging to a child class given a child class
     * @param entityConstructor the child class
     * @returns the table which stores that child class's information
     */
    private static findTable;
    /**
     * find a cache belonging to a child class given a child class
     * @param entityConstructor the child class
     * @returns the cache which stores instance of the child class
     */
    private static findCache;
    /**
     * find the loadFactory of a child class
     * @param entityConstructor the child class
     * @returns the load factory
     */
    private static findLoadFactory;
    /**
     * extracts a constructor from an entity
     * @param entity the object to get the constructor of
     * @returns
     */
    private static ctorOf;
    private static build;
}
export {};
//# sourceMappingURL=Entity.d.ts.map