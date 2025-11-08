
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Models
 * 
 */
export type Models = $Result.DefaultSelection<Prisma.$ModelsPayload>
/**
 * Model Invocations
 * 
 */
export type Invocations = $Result.DefaultSelection<Prisma.$InvocationsPayload>
/**
 * Model ToolCalls
 * 
 */
export type ToolCalls = $Result.DefaultSelection<Prisma.$ToolCallsPayload>
/**
 * Model PortfolioSize
 * 
 */
export type PortfolioSize = $Result.DefaultSelection<Prisma.$PortfolioSizePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ToolCallType: {
  CREATE_POSITION: 'CREATE_POSITION',
  CLOSE_POSITION: 'CLOSE_POSITION'
};

export type ToolCallType = (typeof ToolCallType)[keyof typeof ToolCallType]

}

export type ToolCallType = $Enums.ToolCallType

export const ToolCallType: typeof $Enums.ToolCallType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Models
 * const models = await prisma.models.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Models
   * const models = await prisma.models.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.models`: Exposes CRUD operations for the **Models** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Models
    * const models = await prisma.models.findMany()
    * ```
    */
  get models(): Prisma.ModelsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.invocations`: Exposes CRUD operations for the **Invocations** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Invocations
    * const invocations = await prisma.invocations.findMany()
    * ```
    */
  get invocations(): Prisma.InvocationsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.toolCalls`: Exposes CRUD operations for the **ToolCalls** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ToolCalls
    * const toolCalls = await prisma.toolCalls.findMany()
    * ```
    */
  get toolCalls(): Prisma.ToolCallsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.portfolioSize`: Exposes CRUD operations for the **PortfolioSize** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PortfolioSizes
    * const portfolioSizes = await prisma.portfolioSize.findMany()
    * ```
    */
  get portfolioSize(): Prisma.PortfolioSizeDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.0
   * Query Engine version: 2ba551f319ab1df4bc874a89965d8b3641056773
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Models: 'Models',
    Invocations: 'Invocations',
    ToolCalls: 'ToolCalls',
    PortfolioSize: 'PortfolioSize'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "models" | "invocations" | "toolCalls" | "portfolioSize"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Models: {
        payload: Prisma.$ModelsPayload<ExtArgs>
        fields: Prisma.ModelsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>
          }
          findFirst: {
            args: Prisma.ModelsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>
          }
          findMany: {
            args: Prisma.ModelsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>[]
          }
          create: {
            args: Prisma.ModelsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>
          }
          createMany: {
            args: Prisma.ModelsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>[]
          }
          delete: {
            args: Prisma.ModelsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>
          }
          update: {
            args: Prisma.ModelsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>
          }
          deleteMany: {
            args: Prisma.ModelsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>[]
          }
          upsert: {
            args: Prisma.ModelsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelsPayload>
          }
          aggregate: {
            args: Prisma.ModelsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModels>
          }
          groupBy: {
            args: Prisma.ModelsGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelsGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelsCountArgs<ExtArgs>
            result: $Utils.Optional<ModelsCountAggregateOutputType> | number
          }
        }
      }
      Invocations: {
        payload: Prisma.$InvocationsPayload<ExtArgs>
        fields: Prisma.InvocationsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InvocationsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InvocationsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>
          }
          findFirst: {
            args: Prisma.InvocationsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InvocationsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>
          }
          findMany: {
            args: Prisma.InvocationsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>[]
          }
          create: {
            args: Prisma.InvocationsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>
          }
          createMany: {
            args: Prisma.InvocationsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InvocationsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>[]
          }
          delete: {
            args: Prisma.InvocationsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>
          }
          update: {
            args: Prisma.InvocationsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>
          }
          deleteMany: {
            args: Prisma.InvocationsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InvocationsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InvocationsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>[]
          }
          upsert: {
            args: Prisma.InvocationsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvocationsPayload>
          }
          aggregate: {
            args: Prisma.InvocationsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInvocations>
          }
          groupBy: {
            args: Prisma.InvocationsGroupByArgs<ExtArgs>
            result: $Utils.Optional<InvocationsGroupByOutputType>[]
          }
          count: {
            args: Prisma.InvocationsCountArgs<ExtArgs>
            result: $Utils.Optional<InvocationsCountAggregateOutputType> | number
          }
        }
      }
      ToolCalls: {
        payload: Prisma.$ToolCallsPayload<ExtArgs>
        fields: Prisma.ToolCallsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ToolCallsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ToolCallsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>
          }
          findFirst: {
            args: Prisma.ToolCallsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ToolCallsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>
          }
          findMany: {
            args: Prisma.ToolCallsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>[]
          }
          create: {
            args: Prisma.ToolCallsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>
          }
          createMany: {
            args: Prisma.ToolCallsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ToolCallsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>[]
          }
          delete: {
            args: Prisma.ToolCallsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>
          }
          update: {
            args: Prisma.ToolCallsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>
          }
          deleteMany: {
            args: Prisma.ToolCallsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ToolCallsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ToolCallsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>[]
          }
          upsert: {
            args: Prisma.ToolCallsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ToolCallsPayload>
          }
          aggregate: {
            args: Prisma.ToolCallsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateToolCalls>
          }
          groupBy: {
            args: Prisma.ToolCallsGroupByArgs<ExtArgs>
            result: $Utils.Optional<ToolCallsGroupByOutputType>[]
          }
          count: {
            args: Prisma.ToolCallsCountArgs<ExtArgs>
            result: $Utils.Optional<ToolCallsCountAggregateOutputType> | number
          }
        }
      }
      PortfolioSize: {
        payload: Prisma.$PortfolioSizePayload<ExtArgs>
        fields: Prisma.PortfolioSizeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PortfolioSizeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PortfolioSizeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>
          }
          findFirst: {
            args: Prisma.PortfolioSizeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PortfolioSizeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>
          }
          findMany: {
            args: Prisma.PortfolioSizeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>[]
          }
          create: {
            args: Prisma.PortfolioSizeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>
          }
          createMany: {
            args: Prisma.PortfolioSizeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PortfolioSizeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>[]
          }
          delete: {
            args: Prisma.PortfolioSizeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>
          }
          update: {
            args: Prisma.PortfolioSizeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>
          }
          deleteMany: {
            args: Prisma.PortfolioSizeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PortfolioSizeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PortfolioSizeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>[]
          }
          upsert: {
            args: Prisma.PortfolioSizeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PortfolioSizePayload>
          }
          aggregate: {
            args: Prisma.PortfolioSizeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePortfolioSize>
          }
          groupBy: {
            args: Prisma.PortfolioSizeGroupByArgs<ExtArgs>
            result: $Utils.Optional<PortfolioSizeGroupByOutputType>[]
          }
          count: {
            args: Prisma.PortfolioSizeCountArgs<ExtArgs>
            result: $Utils.Optional<PortfolioSizeCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    models?: ModelsOmit
    invocations?: InvocationsOmit
    toolCalls?: ToolCallsOmit
    portfolioSize?: PortfolioSizeOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ModelsCountOutputType
   */

  export type ModelsCountOutputType = {
    invocations: number
    portfolioSize: number
  }

  export type ModelsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invocations?: boolean | ModelsCountOutputTypeCountInvocationsArgs
    portfolioSize?: boolean | ModelsCountOutputTypeCountPortfolioSizeArgs
  }

  // Custom InputTypes
  /**
   * ModelsCountOutputType without action
   */
  export type ModelsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelsCountOutputType
     */
    select?: ModelsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ModelsCountOutputType without action
   */
  export type ModelsCountOutputTypeCountInvocationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvocationsWhereInput
  }

  /**
   * ModelsCountOutputType without action
   */
  export type ModelsCountOutputTypeCountPortfolioSizeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PortfolioSizeWhereInput
  }


  /**
   * Count Type InvocationsCountOutputType
   */

  export type InvocationsCountOutputType = {
    toolCalls: number
  }

  export type InvocationsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    toolCalls?: boolean | InvocationsCountOutputTypeCountToolCallsArgs
  }

  // Custom InputTypes
  /**
   * InvocationsCountOutputType without action
   */
  export type InvocationsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InvocationsCountOutputType
     */
    select?: InvocationsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * InvocationsCountOutputType without action
   */
  export type InvocationsCountOutputTypeCountToolCallsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ToolCallsWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Models
   */

  export type AggregateModels = {
    _count: ModelsCountAggregateOutputType | null
    _avg: ModelsAvgAggregateOutputType | null
    _sum: ModelsSumAggregateOutputType | null
    _min: ModelsMinAggregateOutputType | null
    _max: ModelsMaxAggregateOutputType | null
  }

  export type ModelsAvgAggregateOutputType = {
    invocationCount: number | null
  }

  export type ModelsSumAggregateOutputType = {
    invocationCount: number | null
  }

  export type ModelsMinAggregateOutputType = {
    id: string | null
    name: string | null
    openRoutermodelName: string | null
    lighterApiKey: string | null
    invocationCount: number | null
    accountIndex: string | null
  }

  export type ModelsMaxAggregateOutputType = {
    id: string | null
    name: string | null
    openRoutermodelName: string | null
    lighterApiKey: string | null
    invocationCount: number | null
    accountIndex: string | null
  }

  export type ModelsCountAggregateOutputType = {
    id: number
    name: number
    openRoutermodelName: number
    lighterApiKey: number
    invocationCount: number
    accountIndex: number
    _all: number
  }


  export type ModelsAvgAggregateInputType = {
    invocationCount?: true
  }

  export type ModelsSumAggregateInputType = {
    invocationCount?: true
  }

  export type ModelsMinAggregateInputType = {
    id?: true
    name?: true
    openRoutermodelName?: true
    lighterApiKey?: true
    invocationCount?: true
    accountIndex?: true
  }

  export type ModelsMaxAggregateInputType = {
    id?: true
    name?: true
    openRoutermodelName?: true
    lighterApiKey?: true
    invocationCount?: true
    accountIndex?: true
  }

  export type ModelsCountAggregateInputType = {
    id?: true
    name?: true
    openRoutermodelName?: true
    lighterApiKey?: true
    invocationCount?: true
    accountIndex?: true
    _all?: true
  }

  export type ModelsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Models to aggregate.
     */
    where?: ModelsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Models to fetch.
     */
    orderBy?: ModelsOrderByWithRelationInput | ModelsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Models
    **/
    _count?: true | ModelsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ModelsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ModelsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelsMaxAggregateInputType
  }

  export type GetModelsAggregateType<T extends ModelsAggregateArgs> = {
        [P in keyof T & keyof AggregateModels]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModels[P]>
      : GetScalarType<T[P], AggregateModels[P]>
  }




  export type ModelsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelsWhereInput
    orderBy?: ModelsOrderByWithAggregationInput | ModelsOrderByWithAggregationInput[]
    by: ModelsScalarFieldEnum[] | ModelsScalarFieldEnum
    having?: ModelsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelsCountAggregateInputType | true
    _avg?: ModelsAvgAggregateInputType
    _sum?: ModelsSumAggregateInputType
    _min?: ModelsMinAggregateInputType
    _max?: ModelsMaxAggregateInputType
  }

  export type ModelsGroupByOutputType = {
    id: string
    name: string
    openRoutermodelName: string
    lighterApiKey: string
    invocationCount: number
    accountIndex: string
    _count: ModelsCountAggregateOutputType | null
    _avg: ModelsAvgAggregateOutputType | null
    _sum: ModelsSumAggregateOutputType | null
    _min: ModelsMinAggregateOutputType | null
    _max: ModelsMaxAggregateOutputType | null
  }

  type GetModelsGroupByPayload<T extends ModelsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelsGroupByOutputType[P]>
            : GetScalarType<T[P], ModelsGroupByOutputType[P]>
        }
      >
    >


  export type ModelsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    openRoutermodelName?: boolean
    lighterApiKey?: boolean
    invocationCount?: boolean
    accountIndex?: boolean
    invocations?: boolean | Models$invocationsArgs<ExtArgs>
    portfolioSize?: boolean | Models$portfolioSizeArgs<ExtArgs>
    _count?: boolean | ModelsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["models"]>

  export type ModelsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    openRoutermodelName?: boolean
    lighterApiKey?: boolean
    invocationCount?: boolean
    accountIndex?: boolean
  }, ExtArgs["result"]["models"]>

  export type ModelsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    openRoutermodelName?: boolean
    lighterApiKey?: boolean
    invocationCount?: boolean
    accountIndex?: boolean
  }, ExtArgs["result"]["models"]>

  export type ModelsSelectScalar = {
    id?: boolean
    name?: boolean
    openRoutermodelName?: boolean
    lighterApiKey?: boolean
    invocationCount?: boolean
    accountIndex?: boolean
  }

  export type ModelsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "openRoutermodelName" | "lighterApiKey" | "invocationCount" | "accountIndex", ExtArgs["result"]["models"]>
  export type ModelsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invocations?: boolean | Models$invocationsArgs<ExtArgs>
    portfolioSize?: boolean | Models$portfolioSizeArgs<ExtArgs>
    _count?: boolean | ModelsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ModelsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ModelsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ModelsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Models"
    objects: {
      invocations: Prisma.$InvocationsPayload<ExtArgs>[]
      portfolioSize: Prisma.$PortfolioSizePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      openRoutermodelName: string
      lighterApiKey: string
      invocationCount: number
      accountIndex: string
    }, ExtArgs["result"]["models"]>
    composites: {}
  }

  type ModelsGetPayload<S extends boolean | null | undefined | ModelsDefaultArgs> = $Result.GetResult<Prisma.$ModelsPayload, S>

  type ModelsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelsCountAggregateInputType | true
    }

  export interface ModelsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Models'], meta: { name: 'Models' } }
    /**
     * Find zero or one Models that matches the filter.
     * @param {ModelsFindUniqueArgs} args - Arguments to find a Models
     * @example
     * // Get one Models
     * const models = await prisma.models.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelsFindUniqueArgs>(args: SelectSubset<T, ModelsFindUniqueArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Models that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelsFindUniqueOrThrowArgs} args - Arguments to find a Models
     * @example
     * // Get one Models
     * const models = await prisma.models.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelsFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Models that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelsFindFirstArgs} args - Arguments to find a Models
     * @example
     * // Get one Models
     * const models = await prisma.models.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelsFindFirstArgs>(args?: SelectSubset<T, ModelsFindFirstArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Models that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelsFindFirstOrThrowArgs} args - Arguments to find a Models
     * @example
     * // Get one Models
     * const models = await prisma.models.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelsFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelsFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Models that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Models
     * const models = await prisma.models.findMany()
     * 
     * // Get first 10 Models
     * const models = await prisma.models.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelsWithIdOnly = await prisma.models.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelsFindManyArgs>(args?: SelectSubset<T, ModelsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Models.
     * @param {ModelsCreateArgs} args - Arguments to create a Models.
     * @example
     * // Create one Models
     * const Models = await prisma.models.create({
     *   data: {
     *     // ... data to create a Models
     *   }
     * })
     * 
     */
    create<T extends ModelsCreateArgs>(args: SelectSubset<T, ModelsCreateArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Models.
     * @param {ModelsCreateManyArgs} args - Arguments to create many Models.
     * @example
     * // Create many Models
     * const models = await prisma.models.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelsCreateManyArgs>(args?: SelectSubset<T, ModelsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Models and returns the data saved in the database.
     * @param {ModelsCreateManyAndReturnArgs} args - Arguments to create many Models.
     * @example
     * // Create many Models
     * const models = await prisma.models.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Models and only return the `id`
     * const modelsWithIdOnly = await prisma.models.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelsCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Models.
     * @param {ModelsDeleteArgs} args - Arguments to delete one Models.
     * @example
     * // Delete one Models
     * const Models = await prisma.models.delete({
     *   where: {
     *     // ... filter to delete one Models
     *   }
     * })
     * 
     */
    delete<T extends ModelsDeleteArgs>(args: SelectSubset<T, ModelsDeleteArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Models.
     * @param {ModelsUpdateArgs} args - Arguments to update one Models.
     * @example
     * // Update one Models
     * const models = await prisma.models.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelsUpdateArgs>(args: SelectSubset<T, ModelsUpdateArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Models.
     * @param {ModelsDeleteManyArgs} args - Arguments to filter Models to delete.
     * @example
     * // Delete a few Models
     * const { count } = await prisma.models.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelsDeleteManyArgs>(args?: SelectSubset<T, ModelsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Models
     * const models = await prisma.models.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelsUpdateManyArgs>(args: SelectSubset<T, ModelsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Models and returns the data updated in the database.
     * @param {ModelsUpdateManyAndReturnArgs} args - Arguments to update many Models.
     * @example
     * // Update many Models
     * const models = await prisma.models.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Models and only return the `id`
     * const modelsWithIdOnly = await prisma.models.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelsUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Models.
     * @param {ModelsUpsertArgs} args - Arguments to update or create a Models.
     * @example
     * // Update or create a Models
     * const models = await prisma.models.upsert({
     *   create: {
     *     // ... data to create a Models
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Models we want to update
     *   }
     * })
     */
    upsert<T extends ModelsUpsertArgs>(args: SelectSubset<T, ModelsUpsertArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelsCountArgs} args - Arguments to filter Models to count.
     * @example
     * // Count the number of Models
     * const count = await prisma.models.count({
     *   where: {
     *     // ... the filter for the Models we want to count
     *   }
     * })
    **/
    count<T extends ModelsCountArgs>(
      args?: Subset<T, ModelsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelsAggregateArgs>(args: Subset<T, ModelsAggregateArgs>): Prisma.PrismaPromise<GetModelsAggregateType<T>>

    /**
     * Group by Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelsGroupByArgs['orderBy'] }
        : { orderBy?: ModelsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Models model
   */
  readonly fields: ModelsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Models.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    invocations<T extends Models$invocationsArgs<ExtArgs> = {}>(args?: Subset<T, Models$invocationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    portfolioSize<T extends Models$portfolioSizeArgs<ExtArgs> = {}>(args?: Subset<T, Models$portfolioSizeArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Models model
   */
  interface ModelsFieldRefs {
    readonly id: FieldRef<"Models", 'String'>
    readonly name: FieldRef<"Models", 'String'>
    readonly openRoutermodelName: FieldRef<"Models", 'String'>
    readonly lighterApiKey: FieldRef<"Models", 'String'>
    readonly invocationCount: FieldRef<"Models", 'Int'>
    readonly accountIndex: FieldRef<"Models", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Models findUnique
   */
  export type ModelsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * Filter, which Models to fetch.
     */
    where: ModelsWhereUniqueInput
  }

  /**
   * Models findUniqueOrThrow
   */
  export type ModelsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * Filter, which Models to fetch.
     */
    where: ModelsWhereUniqueInput
  }

  /**
   * Models findFirst
   */
  export type ModelsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * Filter, which Models to fetch.
     */
    where?: ModelsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Models to fetch.
     */
    orderBy?: ModelsOrderByWithRelationInput | ModelsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Models.
     */
    cursor?: ModelsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Models.
     */
    distinct?: ModelsScalarFieldEnum | ModelsScalarFieldEnum[]
  }

  /**
   * Models findFirstOrThrow
   */
  export type ModelsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * Filter, which Models to fetch.
     */
    where?: ModelsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Models to fetch.
     */
    orderBy?: ModelsOrderByWithRelationInput | ModelsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Models.
     */
    cursor?: ModelsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Models.
     */
    distinct?: ModelsScalarFieldEnum | ModelsScalarFieldEnum[]
  }

  /**
   * Models findMany
   */
  export type ModelsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * Filter, which Models to fetch.
     */
    where?: ModelsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Models to fetch.
     */
    orderBy?: ModelsOrderByWithRelationInput | ModelsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Models.
     */
    cursor?: ModelsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Models.
     */
    skip?: number
    distinct?: ModelsScalarFieldEnum | ModelsScalarFieldEnum[]
  }

  /**
   * Models create
   */
  export type ModelsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * The data needed to create a Models.
     */
    data: XOR<ModelsCreateInput, ModelsUncheckedCreateInput>
  }

  /**
   * Models createMany
   */
  export type ModelsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Models.
     */
    data: ModelsCreateManyInput | ModelsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Models createManyAndReturn
   */
  export type ModelsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * The data used to create many Models.
     */
    data: ModelsCreateManyInput | ModelsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Models update
   */
  export type ModelsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * The data needed to update a Models.
     */
    data: XOR<ModelsUpdateInput, ModelsUncheckedUpdateInput>
    /**
     * Choose, which Models to update.
     */
    where: ModelsWhereUniqueInput
  }

  /**
   * Models updateMany
   */
  export type ModelsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Models.
     */
    data: XOR<ModelsUpdateManyMutationInput, ModelsUncheckedUpdateManyInput>
    /**
     * Filter which Models to update
     */
    where?: ModelsWhereInput
    /**
     * Limit how many Models to update.
     */
    limit?: number
  }

  /**
   * Models updateManyAndReturn
   */
  export type ModelsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * The data used to update Models.
     */
    data: XOR<ModelsUpdateManyMutationInput, ModelsUncheckedUpdateManyInput>
    /**
     * Filter which Models to update
     */
    where?: ModelsWhereInput
    /**
     * Limit how many Models to update.
     */
    limit?: number
  }

  /**
   * Models upsert
   */
  export type ModelsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * The filter to search for the Models to update in case it exists.
     */
    where: ModelsWhereUniqueInput
    /**
     * In case the Models found by the `where` argument doesn't exist, create a new Models with this data.
     */
    create: XOR<ModelsCreateInput, ModelsUncheckedCreateInput>
    /**
     * In case the Models was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelsUpdateInput, ModelsUncheckedUpdateInput>
  }

  /**
   * Models delete
   */
  export type ModelsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
    /**
     * Filter which Models to delete.
     */
    where: ModelsWhereUniqueInput
  }

  /**
   * Models deleteMany
   */
  export type ModelsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Models to delete
     */
    where?: ModelsWhereInput
    /**
     * Limit how many Models to delete.
     */
    limit?: number
  }

  /**
   * Models.invocations
   */
  export type Models$invocationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    where?: InvocationsWhereInput
    orderBy?: InvocationsOrderByWithRelationInput | InvocationsOrderByWithRelationInput[]
    cursor?: InvocationsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InvocationsScalarFieldEnum | InvocationsScalarFieldEnum[]
  }

  /**
   * Models.portfolioSize
   */
  export type Models$portfolioSizeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    where?: PortfolioSizeWhereInput
    orderBy?: PortfolioSizeOrderByWithRelationInput | PortfolioSizeOrderByWithRelationInput[]
    cursor?: PortfolioSizeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PortfolioSizeScalarFieldEnum | PortfolioSizeScalarFieldEnum[]
  }

  /**
   * Models without action
   */
  export type ModelsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Models
     */
    select?: ModelsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Models
     */
    omit?: ModelsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelsInclude<ExtArgs> | null
  }


  /**
   * Model Invocations
   */

  export type AggregateInvocations = {
    _count: InvocationsCountAggregateOutputType | null
    _min: InvocationsMinAggregateOutputType | null
    _max: InvocationsMaxAggregateOutputType | null
  }

  export type InvocationsMinAggregateOutputType = {
    id: string | null
    modelId: string | null
    response: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvocationsMaxAggregateOutputType = {
    id: string | null
    modelId: string | null
    response: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvocationsCountAggregateOutputType = {
    id: number
    modelId: number
    response: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InvocationsMinAggregateInputType = {
    id?: true
    modelId?: true
    response?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvocationsMaxAggregateInputType = {
    id?: true
    modelId?: true
    response?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvocationsCountAggregateInputType = {
    id?: true
    modelId?: true
    response?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InvocationsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invocations to aggregate.
     */
    where?: InvocationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invocations to fetch.
     */
    orderBy?: InvocationsOrderByWithRelationInput | InvocationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InvocationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Invocations
    **/
    _count?: true | InvocationsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InvocationsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InvocationsMaxAggregateInputType
  }

  export type GetInvocationsAggregateType<T extends InvocationsAggregateArgs> = {
        [P in keyof T & keyof AggregateInvocations]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInvocations[P]>
      : GetScalarType<T[P], AggregateInvocations[P]>
  }




  export type InvocationsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvocationsWhereInput
    orderBy?: InvocationsOrderByWithAggregationInput | InvocationsOrderByWithAggregationInput[]
    by: InvocationsScalarFieldEnum[] | InvocationsScalarFieldEnum
    having?: InvocationsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InvocationsCountAggregateInputType | true
    _min?: InvocationsMinAggregateInputType
    _max?: InvocationsMaxAggregateInputType
  }

  export type InvocationsGroupByOutputType = {
    id: string
    modelId: string
    response: string
    createdAt: Date
    updatedAt: Date
    _count: InvocationsCountAggregateOutputType | null
    _min: InvocationsMinAggregateOutputType | null
    _max: InvocationsMaxAggregateOutputType | null
  }

  type GetInvocationsGroupByPayload<T extends InvocationsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InvocationsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InvocationsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InvocationsGroupByOutputType[P]>
            : GetScalarType<T[P], InvocationsGroupByOutputType[P]>
        }
      >
    >


  export type InvocationsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelId?: boolean
    response?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    model?: boolean | ModelsDefaultArgs<ExtArgs>
    toolCalls?: boolean | Invocations$toolCallsArgs<ExtArgs>
    _count?: boolean | InvocationsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invocations"]>

  export type InvocationsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelId?: boolean
    response?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invocations"]>

  export type InvocationsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelId?: boolean
    response?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invocations"]>

  export type InvocationsSelectScalar = {
    id?: boolean
    modelId?: boolean
    response?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InvocationsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "modelId" | "response" | "createdAt" | "updatedAt", ExtArgs["result"]["invocations"]>
  export type InvocationsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    model?: boolean | ModelsDefaultArgs<ExtArgs>
    toolCalls?: boolean | Invocations$toolCallsArgs<ExtArgs>
    _count?: boolean | InvocationsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type InvocationsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }
  export type InvocationsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }

  export type $InvocationsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Invocations"
    objects: {
      model: Prisma.$ModelsPayload<ExtArgs>
      toolCalls: Prisma.$ToolCallsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      modelId: string
      response: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["invocations"]>
    composites: {}
  }

  type InvocationsGetPayload<S extends boolean | null | undefined | InvocationsDefaultArgs> = $Result.GetResult<Prisma.$InvocationsPayload, S>

  type InvocationsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InvocationsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InvocationsCountAggregateInputType | true
    }

  export interface InvocationsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Invocations'], meta: { name: 'Invocations' } }
    /**
     * Find zero or one Invocations that matches the filter.
     * @param {InvocationsFindUniqueArgs} args - Arguments to find a Invocations
     * @example
     * // Get one Invocations
     * const invocations = await prisma.invocations.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InvocationsFindUniqueArgs>(args: SelectSubset<T, InvocationsFindUniqueArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Invocations that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InvocationsFindUniqueOrThrowArgs} args - Arguments to find a Invocations
     * @example
     * // Get one Invocations
     * const invocations = await prisma.invocations.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InvocationsFindUniqueOrThrowArgs>(args: SelectSubset<T, InvocationsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invocations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvocationsFindFirstArgs} args - Arguments to find a Invocations
     * @example
     * // Get one Invocations
     * const invocations = await prisma.invocations.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InvocationsFindFirstArgs>(args?: SelectSubset<T, InvocationsFindFirstArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invocations that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvocationsFindFirstOrThrowArgs} args - Arguments to find a Invocations
     * @example
     * // Get one Invocations
     * const invocations = await prisma.invocations.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InvocationsFindFirstOrThrowArgs>(args?: SelectSubset<T, InvocationsFindFirstOrThrowArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Invocations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvocationsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Invocations
     * const invocations = await prisma.invocations.findMany()
     * 
     * // Get first 10 Invocations
     * const invocations = await prisma.invocations.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const invocationsWithIdOnly = await prisma.invocations.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InvocationsFindManyArgs>(args?: SelectSubset<T, InvocationsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Invocations.
     * @param {InvocationsCreateArgs} args - Arguments to create a Invocations.
     * @example
     * // Create one Invocations
     * const Invocations = await prisma.invocations.create({
     *   data: {
     *     // ... data to create a Invocations
     *   }
     * })
     * 
     */
    create<T extends InvocationsCreateArgs>(args: SelectSubset<T, InvocationsCreateArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Invocations.
     * @param {InvocationsCreateManyArgs} args - Arguments to create many Invocations.
     * @example
     * // Create many Invocations
     * const invocations = await prisma.invocations.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InvocationsCreateManyArgs>(args?: SelectSubset<T, InvocationsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Invocations and returns the data saved in the database.
     * @param {InvocationsCreateManyAndReturnArgs} args - Arguments to create many Invocations.
     * @example
     * // Create many Invocations
     * const invocations = await prisma.invocations.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Invocations and only return the `id`
     * const invocationsWithIdOnly = await prisma.invocations.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InvocationsCreateManyAndReturnArgs>(args?: SelectSubset<T, InvocationsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Invocations.
     * @param {InvocationsDeleteArgs} args - Arguments to delete one Invocations.
     * @example
     * // Delete one Invocations
     * const Invocations = await prisma.invocations.delete({
     *   where: {
     *     // ... filter to delete one Invocations
     *   }
     * })
     * 
     */
    delete<T extends InvocationsDeleteArgs>(args: SelectSubset<T, InvocationsDeleteArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Invocations.
     * @param {InvocationsUpdateArgs} args - Arguments to update one Invocations.
     * @example
     * // Update one Invocations
     * const invocations = await prisma.invocations.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InvocationsUpdateArgs>(args: SelectSubset<T, InvocationsUpdateArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Invocations.
     * @param {InvocationsDeleteManyArgs} args - Arguments to filter Invocations to delete.
     * @example
     * // Delete a few Invocations
     * const { count } = await prisma.invocations.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InvocationsDeleteManyArgs>(args?: SelectSubset<T, InvocationsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvocationsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Invocations
     * const invocations = await prisma.invocations.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InvocationsUpdateManyArgs>(args: SelectSubset<T, InvocationsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invocations and returns the data updated in the database.
     * @param {InvocationsUpdateManyAndReturnArgs} args - Arguments to update many Invocations.
     * @example
     * // Update many Invocations
     * const invocations = await prisma.invocations.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Invocations and only return the `id`
     * const invocationsWithIdOnly = await prisma.invocations.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InvocationsUpdateManyAndReturnArgs>(args: SelectSubset<T, InvocationsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Invocations.
     * @param {InvocationsUpsertArgs} args - Arguments to update or create a Invocations.
     * @example
     * // Update or create a Invocations
     * const invocations = await prisma.invocations.upsert({
     *   create: {
     *     // ... data to create a Invocations
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Invocations we want to update
     *   }
     * })
     */
    upsert<T extends InvocationsUpsertArgs>(args: SelectSubset<T, InvocationsUpsertArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Invocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvocationsCountArgs} args - Arguments to filter Invocations to count.
     * @example
     * // Count the number of Invocations
     * const count = await prisma.invocations.count({
     *   where: {
     *     // ... the filter for the Invocations we want to count
     *   }
     * })
    **/
    count<T extends InvocationsCountArgs>(
      args?: Subset<T, InvocationsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InvocationsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Invocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvocationsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InvocationsAggregateArgs>(args: Subset<T, InvocationsAggregateArgs>): Prisma.PrismaPromise<GetInvocationsAggregateType<T>>

    /**
     * Group by Invocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvocationsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InvocationsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InvocationsGroupByArgs['orderBy'] }
        : { orderBy?: InvocationsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InvocationsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvocationsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Invocations model
   */
  readonly fields: InvocationsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Invocations.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InvocationsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    model<T extends ModelsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ModelsDefaultArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    toolCalls<T extends Invocations$toolCallsArgs<ExtArgs> = {}>(args?: Subset<T, Invocations$toolCallsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Invocations model
   */
  interface InvocationsFieldRefs {
    readonly id: FieldRef<"Invocations", 'String'>
    readonly modelId: FieldRef<"Invocations", 'String'>
    readonly response: FieldRef<"Invocations", 'String'>
    readonly createdAt: FieldRef<"Invocations", 'DateTime'>
    readonly updatedAt: FieldRef<"Invocations", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Invocations findUnique
   */
  export type InvocationsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * Filter, which Invocations to fetch.
     */
    where: InvocationsWhereUniqueInput
  }

  /**
   * Invocations findUniqueOrThrow
   */
  export type InvocationsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * Filter, which Invocations to fetch.
     */
    where: InvocationsWhereUniqueInput
  }

  /**
   * Invocations findFirst
   */
  export type InvocationsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * Filter, which Invocations to fetch.
     */
    where?: InvocationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invocations to fetch.
     */
    orderBy?: InvocationsOrderByWithRelationInput | InvocationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invocations.
     */
    cursor?: InvocationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invocations.
     */
    distinct?: InvocationsScalarFieldEnum | InvocationsScalarFieldEnum[]
  }

  /**
   * Invocations findFirstOrThrow
   */
  export type InvocationsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * Filter, which Invocations to fetch.
     */
    where?: InvocationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invocations to fetch.
     */
    orderBy?: InvocationsOrderByWithRelationInput | InvocationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invocations.
     */
    cursor?: InvocationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invocations.
     */
    distinct?: InvocationsScalarFieldEnum | InvocationsScalarFieldEnum[]
  }

  /**
   * Invocations findMany
   */
  export type InvocationsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * Filter, which Invocations to fetch.
     */
    where?: InvocationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invocations to fetch.
     */
    orderBy?: InvocationsOrderByWithRelationInput | InvocationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Invocations.
     */
    cursor?: InvocationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invocations.
     */
    skip?: number
    distinct?: InvocationsScalarFieldEnum | InvocationsScalarFieldEnum[]
  }

  /**
   * Invocations create
   */
  export type InvocationsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * The data needed to create a Invocations.
     */
    data: XOR<InvocationsCreateInput, InvocationsUncheckedCreateInput>
  }

  /**
   * Invocations createMany
   */
  export type InvocationsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Invocations.
     */
    data: InvocationsCreateManyInput | InvocationsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Invocations createManyAndReturn
   */
  export type InvocationsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * The data used to create many Invocations.
     */
    data: InvocationsCreateManyInput | InvocationsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Invocations update
   */
  export type InvocationsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * The data needed to update a Invocations.
     */
    data: XOR<InvocationsUpdateInput, InvocationsUncheckedUpdateInput>
    /**
     * Choose, which Invocations to update.
     */
    where: InvocationsWhereUniqueInput
  }

  /**
   * Invocations updateMany
   */
  export type InvocationsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Invocations.
     */
    data: XOR<InvocationsUpdateManyMutationInput, InvocationsUncheckedUpdateManyInput>
    /**
     * Filter which Invocations to update
     */
    where?: InvocationsWhereInput
    /**
     * Limit how many Invocations to update.
     */
    limit?: number
  }

  /**
   * Invocations updateManyAndReturn
   */
  export type InvocationsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * The data used to update Invocations.
     */
    data: XOR<InvocationsUpdateManyMutationInput, InvocationsUncheckedUpdateManyInput>
    /**
     * Filter which Invocations to update
     */
    where?: InvocationsWhereInput
    /**
     * Limit how many Invocations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Invocations upsert
   */
  export type InvocationsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * The filter to search for the Invocations to update in case it exists.
     */
    where: InvocationsWhereUniqueInput
    /**
     * In case the Invocations found by the `where` argument doesn't exist, create a new Invocations with this data.
     */
    create: XOR<InvocationsCreateInput, InvocationsUncheckedCreateInput>
    /**
     * In case the Invocations was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InvocationsUpdateInput, InvocationsUncheckedUpdateInput>
  }

  /**
   * Invocations delete
   */
  export type InvocationsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
    /**
     * Filter which Invocations to delete.
     */
    where: InvocationsWhereUniqueInput
  }

  /**
   * Invocations deleteMany
   */
  export type InvocationsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invocations to delete
     */
    where?: InvocationsWhereInput
    /**
     * Limit how many Invocations to delete.
     */
    limit?: number
  }

  /**
   * Invocations.toolCalls
   */
  export type Invocations$toolCallsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    where?: ToolCallsWhereInput
    orderBy?: ToolCallsOrderByWithRelationInput | ToolCallsOrderByWithRelationInput[]
    cursor?: ToolCallsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ToolCallsScalarFieldEnum | ToolCallsScalarFieldEnum[]
  }

  /**
   * Invocations without action
   */
  export type InvocationsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invocations
     */
    select?: InvocationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invocations
     */
    omit?: InvocationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InvocationsInclude<ExtArgs> | null
  }


  /**
   * Model ToolCalls
   */

  export type AggregateToolCalls = {
    _count: ToolCallsCountAggregateOutputType | null
    _min: ToolCallsMinAggregateOutputType | null
    _max: ToolCallsMaxAggregateOutputType | null
  }

  export type ToolCallsMinAggregateOutputType = {
    id: string | null
    invocationId: string | null
    toolCallType: $Enums.ToolCallType | null
    metadata: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ToolCallsMaxAggregateOutputType = {
    id: string | null
    invocationId: string | null
    toolCallType: $Enums.ToolCallType | null
    metadata: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ToolCallsCountAggregateOutputType = {
    id: number
    invocationId: number
    toolCallType: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ToolCallsMinAggregateInputType = {
    id?: true
    invocationId?: true
    toolCallType?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ToolCallsMaxAggregateInputType = {
    id?: true
    invocationId?: true
    toolCallType?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ToolCallsCountAggregateInputType = {
    id?: true
    invocationId?: true
    toolCallType?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ToolCallsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ToolCalls to aggregate.
     */
    where?: ToolCallsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ToolCalls to fetch.
     */
    orderBy?: ToolCallsOrderByWithRelationInput | ToolCallsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ToolCallsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ToolCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ToolCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ToolCalls
    **/
    _count?: true | ToolCallsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ToolCallsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ToolCallsMaxAggregateInputType
  }

  export type GetToolCallsAggregateType<T extends ToolCallsAggregateArgs> = {
        [P in keyof T & keyof AggregateToolCalls]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateToolCalls[P]>
      : GetScalarType<T[P], AggregateToolCalls[P]>
  }




  export type ToolCallsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ToolCallsWhereInput
    orderBy?: ToolCallsOrderByWithAggregationInput | ToolCallsOrderByWithAggregationInput[]
    by: ToolCallsScalarFieldEnum[] | ToolCallsScalarFieldEnum
    having?: ToolCallsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ToolCallsCountAggregateInputType | true
    _min?: ToolCallsMinAggregateInputType
    _max?: ToolCallsMaxAggregateInputType
  }

  export type ToolCallsGroupByOutputType = {
    id: string
    invocationId: string
    toolCallType: $Enums.ToolCallType
    metadata: string
    createdAt: Date
    updatedAt: Date
    _count: ToolCallsCountAggregateOutputType | null
    _min: ToolCallsMinAggregateOutputType | null
    _max: ToolCallsMaxAggregateOutputType | null
  }

  type GetToolCallsGroupByPayload<T extends ToolCallsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ToolCallsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ToolCallsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ToolCallsGroupByOutputType[P]>
            : GetScalarType<T[P], ToolCallsGroupByOutputType[P]>
        }
      >
    >


  export type ToolCallsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invocationId?: boolean
    toolCallType?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invocation?: boolean | InvocationsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["toolCalls"]>

  export type ToolCallsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invocationId?: boolean
    toolCallType?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invocation?: boolean | InvocationsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["toolCalls"]>

  export type ToolCallsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invocationId?: boolean
    toolCallType?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    invocation?: boolean | InvocationsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["toolCalls"]>

  export type ToolCallsSelectScalar = {
    id?: boolean
    invocationId?: boolean
    toolCallType?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ToolCallsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "invocationId" | "toolCallType" | "metadata" | "createdAt" | "updatedAt", ExtArgs["result"]["toolCalls"]>
  export type ToolCallsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invocation?: boolean | InvocationsDefaultArgs<ExtArgs>
  }
  export type ToolCallsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invocation?: boolean | InvocationsDefaultArgs<ExtArgs>
  }
  export type ToolCallsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    invocation?: boolean | InvocationsDefaultArgs<ExtArgs>
  }

  export type $ToolCallsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ToolCalls"
    objects: {
      invocation: Prisma.$InvocationsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      invocationId: string
      toolCallType: $Enums.ToolCallType
      metadata: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["toolCalls"]>
    composites: {}
  }

  type ToolCallsGetPayload<S extends boolean | null | undefined | ToolCallsDefaultArgs> = $Result.GetResult<Prisma.$ToolCallsPayload, S>

  type ToolCallsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ToolCallsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ToolCallsCountAggregateInputType | true
    }

  export interface ToolCallsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ToolCalls'], meta: { name: 'ToolCalls' } }
    /**
     * Find zero or one ToolCalls that matches the filter.
     * @param {ToolCallsFindUniqueArgs} args - Arguments to find a ToolCalls
     * @example
     * // Get one ToolCalls
     * const toolCalls = await prisma.toolCalls.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ToolCallsFindUniqueArgs>(args: SelectSubset<T, ToolCallsFindUniqueArgs<ExtArgs>>): Prisma__ToolCallsClient<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ToolCalls that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ToolCallsFindUniqueOrThrowArgs} args - Arguments to find a ToolCalls
     * @example
     * // Get one ToolCalls
     * const toolCalls = await prisma.toolCalls.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ToolCallsFindUniqueOrThrowArgs>(args: SelectSubset<T, ToolCallsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ToolCallsClient<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ToolCalls that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ToolCallsFindFirstArgs} args - Arguments to find a ToolCalls
     * @example
     * // Get one ToolCalls
     * const toolCalls = await prisma.toolCalls.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ToolCallsFindFirstArgs>(args?: SelectSubset<T, ToolCallsFindFirstArgs<ExtArgs>>): Prisma__ToolCallsClient<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ToolCalls that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ToolCallsFindFirstOrThrowArgs} args - Arguments to find a ToolCalls
     * @example
     * // Get one ToolCalls
     * const toolCalls = await prisma.toolCalls.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ToolCallsFindFirstOrThrowArgs>(args?: SelectSubset<T, ToolCallsFindFirstOrThrowArgs<ExtArgs>>): Prisma__ToolCallsClient<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ToolCalls that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ToolCallsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ToolCalls
     * const toolCalls = await prisma.toolCalls.findMany()
     * 
     * // Get first 10 ToolCalls
     * const toolCalls = await prisma.toolCalls.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const toolCallsWithIdOnly = await prisma.toolCalls.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ToolCallsFindManyArgs>(args?: SelectSubset<T, ToolCallsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ToolCalls.
     * @param {ToolCallsCreateArgs} args - Arguments to create a ToolCalls.
     * @example
     * // Create one ToolCalls
     * const ToolCalls = await prisma.toolCalls.create({
     *   data: {
     *     // ... data to create a ToolCalls
     *   }
     * })
     * 
     */
    create<T extends ToolCallsCreateArgs>(args: SelectSubset<T, ToolCallsCreateArgs<ExtArgs>>): Prisma__ToolCallsClient<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ToolCalls.
     * @param {ToolCallsCreateManyArgs} args - Arguments to create many ToolCalls.
     * @example
     * // Create many ToolCalls
     * const toolCalls = await prisma.toolCalls.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ToolCallsCreateManyArgs>(args?: SelectSubset<T, ToolCallsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ToolCalls and returns the data saved in the database.
     * @param {ToolCallsCreateManyAndReturnArgs} args - Arguments to create many ToolCalls.
     * @example
     * // Create many ToolCalls
     * const toolCalls = await prisma.toolCalls.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ToolCalls and only return the `id`
     * const toolCallsWithIdOnly = await prisma.toolCalls.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ToolCallsCreateManyAndReturnArgs>(args?: SelectSubset<T, ToolCallsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ToolCalls.
     * @param {ToolCallsDeleteArgs} args - Arguments to delete one ToolCalls.
     * @example
     * // Delete one ToolCalls
     * const ToolCalls = await prisma.toolCalls.delete({
     *   where: {
     *     // ... filter to delete one ToolCalls
     *   }
     * })
     * 
     */
    delete<T extends ToolCallsDeleteArgs>(args: SelectSubset<T, ToolCallsDeleteArgs<ExtArgs>>): Prisma__ToolCallsClient<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ToolCalls.
     * @param {ToolCallsUpdateArgs} args - Arguments to update one ToolCalls.
     * @example
     * // Update one ToolCalls
     * const toolCalls = await prisma.toolCalls.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ToolCallsUpdateArgs>(args: SelectSubset<T, ToolCallsUpdateArgs<ExtArgs>>): Prisma__ToolCallsClient<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ToolCalls.
     * @param {ToolCallsDeleteManyArgs} args - Arguments to filter ToolCalls to delete.
     * @example
     * // Delete a few ToolCalls
     * const { count } = await prisma.toolCalls.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ToolCallsDeleteManyArgs>(args?: SelectSubset<T, ToolCallsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ToolCalls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ToolCallsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ToolCalls
     * const toolCalls = await prisma.toolCalls.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ToolCallsUpdateManyArgs>(args: SelectSubset<T, ToolCallsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ToolCalls and returns the data updated in the database.
     * @param {ToolCallsUpdateManyAndReturnArgs} args - Arguments to update many ToolCalls.
     * @example
     * // Update many ToolCalls
     * const toolCalls = await prisma.toolCalls.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ToolCalls and only return the `id`
     * const toolCallsWithIdOnly = await prisma.toolCalls.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ToolCallsUpdateManyAndReturnArgs>(args: SelectSubset<T, ToolCallsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ToolCalls.
     * @param {ToolCallsUpsertArgs} args - Arguments to update or create a ToolCalls.
     * @example
     * // Update or create a ToolCalls
     * const toolCalls = await prisma.toolCalls.upsert({
     *   create: {
     *     // ... data to create a ToolCalls
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ToolCalls we want to update
     *   }
     * })
     */
    upsert<T extends ToolCallsUpsertArgs>(args: SelectSubset<T, ToolCallsUpsertArgs<ExtArgs>>): Prisma__ToolCallsClient<$Result.GetResult<Prisma.$ToolCallsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ToolCalls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ToolCallsCountArgs} args - Arguments to filter ToolCalls to count.
     * @example
     * // Count the number of ToolCalls
     * const count = await prisma.toolCalls.count({
     *   where: {
     *     // ... the filter for the ToolCalls we want to count
     *   }
     * })
    **/
    count<T extends ToolCallsCountArgs>(
      args?: Subset<T, ToolCallsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ToolCallsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ToolCalls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ToolCallsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ToolCallsAggregateArgs>(args: Subset<T, ToolCallsAggregateArgs>): Prisma.PrismaPromise<GetToolCallsAggregateType<T>>

    /**
     * Group by ToolCalls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ToolCallsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ToolCallsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ToolCallsGroupByArgs['orderBy'] }
        : { orderBy?: ToolCallsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ToolCallsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetToolCallsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ToolCalls model
   */
  readonly fields: ToolCallsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ToolCalls.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ToolCallsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    invocation<T extends InvocationsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InvocationsDefaultArgs<ExtArgs>>): Prisma__InvocationsClient<$Result.GetResult<Prisma.$InvocationsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ToolCalls model
   */
  interface ToolCallsFieldRefs {
    readonly id: FieldRef<"ToolCalls", 'String'>
    readonly invocationId: FieldRef<"ToolCalls", 'String'>
    readonly toolCallType: FieldRef<"ToolCalls", 'ToolCallType'>
    readonly metadata: FieldRef<"ToolCalls", 'String'>
    readonly createdAt: FieldRef<"ToolCalls", 'DateTime'>
    readonly updatedAt: FieldRef<"ToolCalls", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ToolCalls findUnique
   */
  export type ToolCallsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * Filter, which ToolCalls to fetch.
     */
    where: ToolCallsWhereUniqueInput
  }

  /**
   * ToolCalls findUniqueOrThrow
   */
  export type ToolCallsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * Filter, which ToolCalls to fetch.
     */
    where: ToolCallsWhereUniqueInput
  }

  /**
   * ToolCalls findFirst
   */
  export type ToolCallsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * Filter, which ToolCalls to fetch.
     */
    where?: ToolCallsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ToolCalls to fetch.
     */
    orderBy?: ToolCallsOrderByWithRelationInput | ToolCallsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ToolCalls.
     */
    cursor?: ToolCallsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ToolCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ToolCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ToolCalls.
     */
    distinct?: ToolCallsScalarFieldEnum | ToolCallsScalarFieldEnum[]
  }

  /**
   * ToolCalls findFirstOrThrow
   */
  export type ToolCallsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * Filter, which ToolCalls to fetch.
     */
    where?: ToolCallsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ToolCalls to fetch.
     */
    orderBy?: ToolCallsOrderByWithRelationInput | ToolCallsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ToolCalls.
     */
    cursor?: ToolCallsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ToolCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ToolCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ToolCalls.
     */
    distinct?: ToolCallsScalarFieldEnum | ToolCallsScalarFieldEnum[]
  }

  /**
   * ToolCalls findMany
   */
  export type ToolCallsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * Filter, which ToolCalls to fetch.
     */
    where?: ToolCallsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ToolCalls to fetch.
     */
    orderBy?: ToolCallsOrderByWithRelationInput | ToolCallsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ToolCalls.
     */
    cursor?: ToolCallsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ToolCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ToolCalls.
     */
    skip?: number
    distinct?: ToolCallsScalarFieldEnum | ToolCallsScalarFieldEnum[]
  }

  /**
   * ToolCalls create
   */
  export type ToolCallsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * The data needed to create a ToolCalls.
     */
    data: XOR<ToolCallsCreateInput, ToolCallsUncheckedCreateInput>
  }

  /**
   * ToolCalls createMany
   */
  export type ToolCallsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ToolCalls.
     */
    data: ToolCallsCreateManyInput | ToolCallsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ToolCalls createManyAndReturn
   */
  export type ToolCallsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * The data used to create many ToolCalls.
     */
    data: ToolCallsCreateManyInput | ToolCallsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ToolCalls update
   */
  export type ToolCallsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * The data needed to update a ToolCalls.
     */
    data: XOR<ToolCallsUpdateInput, ToolCallsUncheckedUpdateInput>
    /**
     * Choose, which ToolCalls to update.
     */
    where: ToolCallsWhereUniqueInput
  }

  /**
   * ToolCalls updateMany
   */
  export type ToolCallsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ToolCalls.
     */
    data: XOR<ToolCallsUpdateManyMutationInput, ToolCallsUncheckedUpdateManyInput>
    /**
     * Filter which ToolCalls to update
     */
    where?: ToolCallsWhereInput
    /**
     * Limit how many ToolCalls to update.
     */
    limit?: number
  }

  /**
   * ToolCalls updateManyAndReturn
   */
  export type ToolCallsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * The data used to update ToolCalls.
     */
    data: XOR<ToolCallsUpdateManyMutationInput, ToolCallsUncheckedUpdateManyInput>
    /**
     * Filter which ToolCalls to update
     */
    where?: ToolCallsWhereInput
    /**
     * Limit how many ToolCalls to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ToolCalls upsert
   */
  export type ToolCallsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * The filter to search for the ToolCalls to update in case it exists.
     */
    where: ToolCallsWhereUniqueInput
    /**
     * In case the ToolCalls found by the `where` argument doesn't exist, create a new ToolCalls with this data.
     */
    create: XOR<ToolCallsCreateInput, ToolCallsUncheckedCreateInput>
    /**
     * In case the ToolCalls was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ToolCallsUpdateInput, ToolCallsUncheckedUpdateInput>
  }

  /**
   * ToolCalls delete
   */
  export type ToolCallsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
    /**
     * Filter which ToolCalls to delete.
     */
    where: ToolCallsWhereUniqueInput
  }

  /**
   * ToolCalls deleteMany
   */
  export type ToolCallsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ToolCalls to delete
     */
    where?: ToolCallsWhereInput
    /**
     * Limit how many ToolCalls to delete.
     */
    limit?: number
  }

  /**
   * ToolCalls without action
   */
  export type ToolCallsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ToolCalls
     */
    select?: ToolCallsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ToolCalls
     */
    omit?: ToolCallsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ToolCallsInclude<ExtArgs> | null
  }


  /**
   * Model PortfolioSize
   */

  export type AggregatePortfolioSize = {
    _count: PortfolioSizeCountAggregateOutputType | null
    _min: PortfolioSizeMinAggregateOutputType | null
    _max: PortfolioSizeMaxAggregateOutputType | null
  }

  export type PortfolioSizeMinAggregateOutputType = {
    id: string | null
    modelId: string | null
    netPortfolio: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PortfolioSizeMaxAggregateOutputType = {
    id: string | null
    modelId: string | null
    netPortfolio: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PortfolioSizeCountAggregateOutputType = {
    id: number
    modelId: number
    netPortfolio: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PortfolioSizeMinAggregateInputType = {
    id?: true
    modelId?: true
    netPortfolio?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PortfolioSizeMaxAggregateInputType = {
    id?: true
    modelId?: true
    netPortfolio?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PortfolioSizeCountAggregateInputType = {
    id?: true
    modelId?: true
    netPortfolio?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PortfolioSizeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PortfolioSize to aggregate.
     */
    where?: PortfolioSizeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PortfolioSizes to fetch.
     */
    orderBy?: PortfolioSizeOrderByWithRelationInput | PortfolioSizeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PortfolioSizeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PortfolioSizes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PortfolioSizes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PortfolioSizes
    **/
    _count?: true | PortfolioSizeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PortfolioSizeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PortfolioSizeMaxAggregateInputType
  }

  export type GetPortfolioSizeAggregateType<T extends PortfolioSizeAggregateArgs> = {
        [P in keyof T & keyof AggregatePortfolioSize]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePortfolioSize[P]>
      : GetScalarType<T[P], AggregatePortfolioSize[P]>
  }




  export type PortfolioSizeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PortfolioSizeWhereInput
    orderBy?: PortfolioSizeOrderByWithAggregationInput | PortfolioSizeOrderByWithAggregationInput[]
    by: PortfolioSizeScalarFieldEnum[] | PortfolioSizeScalarFieldEnum
    having?: PortfolioSizeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PortfolioSizeCountAggregateInputType | true
    _min?: PortfolioSizeMinAggregateInputType
    _max?: PortfolioSizeMaxAggregateInputType
  }

  export type PortfolioSizeGroupByOutputType = {
    id: string
    modelId: string
    netPortfolio: string
    createdAt: Date
    updatedAt: Date
    _count: PortfolioSizeCountAggregateOutputType | null
    _min: PortfolioSizeMinAggregateOutputType | null
    _max: PortfolioSizeMaxAggregateOutputType | null
  }

  type GetPortfolioSizeGroupByPayload<T extends PortfolioSizeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PortfolioSizeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PortfolioSizeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PortfolioSizeGroupByOutputType[P]>
            : GetScalarType<T[P], PortfolioSizeGroupByOutputType[P]>
        }
      >
    >


  export type PortfolioSizeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelId?: boolean
    netPortfolio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["portfolioSize"]>

  export type PortfolioSizeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelId?: boolean
    netPortfolio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["portfolioSize"]>

  export type PortfolioSizeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelId?: boolean
    netPortfolio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["portfolioSize"]>

  export type PortfolioSizeSelectScalar = {
    id?: boolean
    modelId?: boolean
    netPortfolio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PortfolioSizeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "modelId" | "netPortfolio" | "createdAt" | "updatedAt", ExtArgs["result"]["portfolioSize"]>
  export type PortfolioSizeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }
  export type PortfolioSizeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }
  export type PortfolioSizeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    model?: boolean | ModelsDefaultArgs<ExtArgs>
  }

  export type $PortfolioSizePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PortfolioSize"
    objects: {
      model: Prisma.$ModelsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      modelId: string
      netPortfolio: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["portfolioSize"]>
    composites: {}
  }

  type PortfolioSizeGetPayload<S extends boolean | null | undefined | PortfolioSizeDefaultArgs> = $Result.GetResult<Prisma.$PortfolioSizePayload, S>

  type PortfolioSizeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PortfolioSizeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PortfolioSizeCountAggregateInputType | true
    }

  export interface PortfolioSizeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PortfolioSize'], meta: { name: 'PortfolioSize' } }
    /**
     * Find zero or one PortfolioSize that matches the filter.
     * @param {PortfolioSizeFindUniqueArgs} args - Arguments to find a PortfolioSize
     * @example
     * // Get one PortfolioSize
     * const portfolioSize = await prisma.portfolioSize.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PortfolioSizeFindUniqueArgs>(args: SelectSubset<T, PortfolioSizeFindUniqueArgs<ExtArgs>>): Prisma__PortfolioSizeClient<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PortfolioSize that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PortfolioSizeFindUniqueOrThrowArgs} args - Arguments to find a PortfolioSize
     * @example
     * // Get one PortfolioSize
     * const portfolioSize = await prisma.portfolioSize.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PortfolioSizeFindUniqueOrThrowArgs>(args: SelectSubset<T, PortfolioSizeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PortfolioSizeClient<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PortfolioSize that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PortfolioSizeFindFirstArgs} args - Arguments to find a PortfolioSize
     * @example
     * // Get one PortfolioSize
     * const portfolioSize = await prisma.portfolioSize.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PortfolioSizeFindFirstArgs>(args?: SelectSubset<T, PortfolioSizeFindFirstArgs<ExtArgs>>): Prisma__PortfolioSizeClient<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PortfolioSize that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PortfolioSizeFindFirstOrThrowArgs} args - Arguments to find a PortfolioSize
     * @example
     * // Get one PortfolioSize
     * const portfolioSize = await prisma.portfolioSize.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PortfolioSizeFindFirstOrThrowArgs>(args?: SelectSubset<T, PortfolioSizeFindFirstOrThrowArgs<ExtArgs>>): Prisma__PortfolioSizeClient<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PortfolioSizes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PortfolioSizeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PortfolioSizes
     * const portfolioSizes = await prisma.portfolioSize.findMany()
     * 
     * // Get first 10 PortfolioSizes
     * const portfolioSizes = await prisma.portfolioSize.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const portfolioSizeWithIdOnly = await prisma.portfolioSize.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PortfolioSizeFindManyArgs>(args?: SelectSubset<T, PortfolioSizeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PortfolioSize.
     * @param {PortfolioSizeCreateArgs} args - Arguments to create a PortfolioSize.
     * @example
     * // Create one PortfolioSize
     * const PortfolioSize = await prisma.portfolioSize.create({
     *   data: {
     *     // ... data to create a PortfolioSize
     *   }
     * })
     * 
     */
    create<T extends PortfolioSizeCreateArgs>(args: SelectSubset<T, PortfolioSizeCreateArgs<ExtArgs>>): Prisma__PortfolioSizeClient<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PortfolioSizes.
     * @param {PortfolioSizeCreateManyArgs} args - Arguments to create many PortfolioSizes.
     * @example
     * // Create many PortfolioSizes
     * const portfolioSize = await prisma.portfolioSize.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PortfolioSizeCreateManyArgs>(args?: SelectSubset<T, PortfolioSizeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PortfolioSizes and returns the data saved in the database.
     * @param {PortfolioSizeCreateManyAndReturnArgs} args - Arguments to create many PortfolioSizes.
     * @example
     * // Create many PortfolioSizes
     * const portfolioSize = await prisma.portfolioSize.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PortfolioSizes and only return the `id`
     * const portfolioSizeWithIdOnly = await prisma.portfolioSize.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PortfolioSizeCreateManyAndReturnArgs>(args?: SelectSubset<T, PortfolioSizeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PortfolioSize.
     * @param {PortfolioSizeDeleteArgs} args - Arguments to delete one PortfolioSize.
     * @example
     * // Delete one PortfolioSize
     * const PortfolioSize = await prisma.portfolioSize.delete({
     *   where: {
     *     // ... filter to delete one PortfolioSize
     *   }
     * })
     * 
     */
    delete<T extends PortfolioSizeDeleteArgs>(args: SelectSubset<T, PortfolioSizeDeleteArgs<ExtArgs>>): Prisma__PortfolioSizeClient<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PortfolioSize.
     * @param {PortfolioSizeUpdateArgs} args - Arguments to update one PortfolioSize.
     * @example
     * // Update one PortfolioSize
     * const portfolioSize = await prisma.portfolioSize.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PortfolioSizeUpdateArgs>(args: SelectSubset<T, PortfolioSizeUpdateArgs<ExtArgs>>): Prisma__PortfolioSizeClient<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PortfolioSizes.
     * @param {PortfolioSizeDeleteManyArgs} args - Arguments to filter PortfolioSizes to delete.
     * @example
     * // Delete a few PortfolioSizes
     * const { count } = await prisma.portfolioSize.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PortfolioSizeDeleteManyArgs>(args?: SelectSubset<T, PortfolioSizeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PortfolioSizes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PortfolioSizeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PortfolioSizes
     * const portfolioSize = await prisma.portfolioSize.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PortfolioSizeUpdateManyArgs>(args: SelectSubset<T, PortfolioSizeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PortfolioSizes and returns the data updated in the database.
     * @param {PortfolioSizeUpdateManyAndReturnArgs} args - Arguments to update many PortfolioSizes.
     * @example
     * // Update many PortfolioSizes
     * const portfolioSize = await prisma.portfolioSize.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PortfolioSizes and only return the `id`
     * const portfolioSizeWithIdOnly = await prisma.portfolioSize.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PortfolioSizeUpdateManyAndReturnArgs>(args: SelectSubset<T, PortfolioSizeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PortfolioSize.
     * @param {PortfolioSizeUpsertArgs} args - Arguments to update or create a PortfolioSize.
     * @example
     * // Update or create a PortfolioSize
     * const portfolioSize = await prisma.portfolioSize.upsert({
     *   create: {
     *     // ... data to create a PortfolioSize
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PortfolioSize we want to update
     *   }
     * })
     */
    upsert<T extends PortfolioSizeUpsertArgs>(args: SelectSubset<T, PortfolioSizeUpsertArgs<ExtArgs>>): Prisma__PortfolioSizeClient<$Result.GetResult<Prisma.$PortfolioSizePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PortfolioSizes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PortfolioSizeCountArgs} args - Arguments to filter PortfolioSizes to count.
     * @example
     * // Count the number of PortfolioSizes
     * const count = await prisma.portfolioSize.count({
     *   where: {
     *     // ... the filter for the PortfolioSizes we want to count
     *   }
     * })
    **/
    count<T extends PortfolioSizeCountArgs>(
      args?: Subset<T, PortfolioSizeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PortfolioSizeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PortfolioSize.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PortfolioSizeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PortfolioSizeAggregateArgs>(args: Subset<T, PortfolioSizeAggregateArgs>): Prisma.PrismaPromise<GetPortfolioSizeAggregateType<T>>

    /**
     * Group by PortfolioSize.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PortfolioSizeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PortfolioSizeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PortfolioSizeGroupByArgs['orderBy'] }
        : { orderBy?: PortfolioSizeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PortfolioSizeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPortfolioSizeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PortfolioSize model
   */
  readonly fields: PortfolioSizeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PortfolioSize.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PortfolioSizeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    model<T extends ModelsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ModelsDefaultArgs<ExtArgs>>): Prisma__ModelsClient<$Result.GetResult<Prisma.$ModelsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PortfolioSize model
   */
  interface PortfolioSizeFieldRefs {
    readonly id: FieldRef<"PortfolioSize", 'String'>
    readonly modelId: FieldRef<"PortfolioSize", 'String'>
    readonly netPortfolio: FieldRef<"PortfolioSize", 'String'>
    readonly createdAt: FieldRef<"PortfolioSize", 'DateTime'>
    readonly updatedAt: FieldRef<"PortfolioSize", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PortfolioSize findUnique
   */
  export type PortfolioSizeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * Filter, which PortfolioSize to fetch.
     */
    where: PortfolioSizeWhereUniqueInput
  }

  /**
   * PortfolioSize findUniqueOrThrow
   */
  export type PortfolioSizeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * Filter, which PortfolioSize to fetch.
     */
    where: PortfolioSizeWhereUniqueInput
  }

  /**
   * PortfolioSize findFirst
   */
  export type PortfolioSizeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * Filter, which PortfolioSize to fetch.
     */
    where?: PortfolioSizeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PortfolioSizes to fetch.
     */
    orderBy?: PortfolioSizeOrderByWithRelationInput | PortfolioSizeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PortfolioSizes.
     */
    cursor?: PortfolioSizeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PortfolioSizes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PortfolioSizes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PortfolioSizes.
     */
    distinct?: PortfolioSizeScalarFieldEnum | PortfolioSizeScalarFieldEnum[]
  }

  /**
   * PortfolioSize findFirstOrThrow
   */
  export type PortfolioSizeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * Filter, which PortfolioSize to fetch.
     */
    where?: PortfolioSizeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PortfolioSizes to fetch.
     */
    orderBy?: PortfolioSizeOrderByWithRelationInput | PortfolioSizeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PortfolioSizes.
     */
    cursor?: PortfolioSizeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PortfolioSizes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PortfolioSizes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PortfolioSizes.
     */
    distinct?: PortfolioSizeScalarFieldEnum | PortfolioSizeScalarFieldEnum[]
  }

  /**
   * PortfolioSize findMany
   */
  export type PortfolioSizeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * Filter, which PortfolioSizes to fetch.
     */
    where?: PortfolioSizeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PortfolioSizes to fetch.
     */
    orderBy?: PortfolioSizeOrderByWithRelationInput | PortfolioSizeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PortfolioSizes.
     */
    cursor?: PortfolioSizeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PortfolioSizes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PortfolioSizes.
     */
    skip?: number
    distinct?: PortfolioSizeScalarFieldEnum | PortfolioSizeScalarFieldEnum[]
  }

  /**
   * PortfolioSize create
   */
  export type PortfolioSizeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * The data needed to create a PortfolioSize.
     */
    data: XOR<PortfolioSizeCreateInput, PortfolioSizeUncheckedCreateInput>
  }

  /**
   * PortfolioSize createMany
   */
  export type PortfolioSizeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PortfolioSizes.
     */
    data: PortfolioSizeCreateManyInput | PortfolioSizeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PortfolioSize createManyAndReturn
   */
  export type PortfolioSizeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * The data used to create many PortfolioSizes.
     */
    data: PortfolioSizeCreateManyInput | PortfolioSizeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PortfolioSize update
   */
  export type PortfolioSizeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * The data needed to update a PortfolioSize.
     */
    data: XOR<PortfolioSizeUpdateInput, PortfolioSizeUncheckedUpdateInput>
    /**
     * Choose, which PortfolioSize to update.
     */
    where: PortfolioSizeWhereUniqueInput
  }

  /**
   * PortfolioSize updateMany
   */
  export type PortfolioSizeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PortfolioSizes.
     */
    data: XOR<PortfolioSizeUpdateManyMutationInput, PortfolioSizeUncheckedUpdateManyInput>
    /**
     * Filter which PortfolioSizes to update
     */
    where?: PortfolioSizeWhereInput
    /**
     * Limit how many PortfolioSizes to update.
     */
    limit?: number
  }

  /**
   * PortfolioSize updateManyAndReturn
   */
  export type PortfolioSizeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * The data used to update PortfolioSizes.
     */
    data: XOR<PortfolioSizeUpdateManyMutationInput, PortfolioSizeUncheckedUpdateManyInput>
    /**
     * Filter which PortfolioSizes to update
     */
    where?: PortfolioSizeWhereInput
    /**
     * Limit how many PortfolioSizes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PortfolioSize upsert
   */
  export type PortfolioSizeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * The filter to search for the PortfolioSize to update in case it exists.
     */
    where: PortfolioSizeWhereUniqueInput
    /**
     * In case the PortfolioSize found by the `where` argument doesn't exist, create a new PortfolioSize with this data.
     */
    create: XOR<PortfolioSizeCreateInput, PortfolioSizeUncheckedCreateInput>
    /**
     * In case the PortfolioSize was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PortfolioSizeUpdateInput, PortfolioSizeUncheckedUpdateInput>
  }

  /**
   * PortfolioSize delete
   */
  export type PortfolioSizeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
    /**
     * Filter which PortfolioSize to delete.
     */
    where: PortfolioSizeWhereUniqueInput
  }

  /**
   * PortfolioSize deleteMany
   */
  export type PortfolioSizeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PortfolioSizes to delete
     */
    where?: PortfolioSizeWhereInput
    /**
     * Limit how many PortfolioSizes to delete.
     */
    limit?: number
  }

  /**
   * PortfolioSize without action
   */
  export type PortfolioSizeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PortfolioSize
     */
    select?: PortfolioSizeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PortfolioSize
     */
    omit?: PortfolioSizeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PortfolioSizeInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ModelsScalarFieldEnum: {
    id: 'id',
    name: 'name',
    openRoutermodelName: 'openRoutermodelName',
    lighterApiKey: 'lighterApiKey',
    invocationCount: 'invocationCount',
    accountIndex: 'accountIndex'
  };

  export type ModelsScalarFieldEnum = (typeof ModelsScalarFieldEnum)[keyof typeof ModelsScalarFieldEnum]


  export const InvocationsScalarFieldEnum: {
    id: 'id',
    modelId: 'modelId',
    response: 'response',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InvocationsScalarFieldEnum = (typeof InvocationsScalarFieldEnum)[keyof typeof InvocationsScalarFieldEnum]


  export const ToolCallsScalarFieldEnum: {
    id: 'id',
    invocationId: 'invocationId',
    toolCallType: 'toolCallType',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ToolCallsScalarFieldEnum = (typeof ToolCallsScalarFieldEnum)[keyof typeof ToolCallsScalarFieldEnum]


  export const PortfolioSizeScalarFieldEnum: {
    id: 'id',
    modelId: 'modelId',
    netPortfolio: 'netPortfolio',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PortfolioSizeScalarFieldEnum = (typeof PortfolioSizeScalarFieldEnum)[keyof typeof PortfolioSizeScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'ToolCallType'
   */
  export type EnumToolCallTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ToolCallType'>
    


  /**
   * Reference to a field of type 'ToolCallType[]'
   */
  export type ListEnumToolCallTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ToolCallType[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ModelsWhereInput = {
    AND?: ModelsWhereInput | ModelsWhereInput[]
    OR?: ModelsWhereInput[]
    NOT?: ModelsWhereInput | ModelsWhereInput[]
    id?: StringFilter<"Models"> | string
    name?: StringFilter<"Models"> | string
    openRoutermodelName?: StringFilter<"Models"> | string
    lighterApiKey?: StringFilter<"Models"> | string
    invocationCount?: IntFilter<"Models"> | number
    accountIndex?: StringFilter<"Models"> | string
    invocations?: InvocationsListRelationFilter
    portfolioSize?: PortfolioSizeListRelationFilter
  }

  export type ModelsOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    openRoutermodelName?: SortOrder
    lighterApiKey?: SortOrder
    invocationCount?: SortOrder
    accountIndex?: SortOrder
    invocations?: InvocationsOrderByRelationAggregateInput
    portfolioSize?: PortfolioSizeOrderByRelationAggregateInput
  }

  export type ModelsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: ModelsWhereInput | ModelsWhereInput[]
    OR?: ModelsWhereInput[]
    NOT?: ModelsWhereInput | ModelsWhereInput[]
    openRoutermodelName?: StringFilter<"Models"> | string
    lighterApiKey?: StringFilter<"Models"> | string
    invocationCount?: IntFilter<"Models"> | number
    accountIndex?: StringFilter<"Models"> | string
    invocations?: InvocationsListRelationFilter
    portfolioSize?: PortfolioSizeListRelationFilter
  }, "id" | "name">

  export type ModelsOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    openRoutermodelName?: SortOrder
    lighterApiKey?: SortOrder
    invocationCount?: SortOrder
    accountIndex?: SortOrder
    _count?: ModelsCountOrderByAggregateInput
    _avg?: ModelsAvgOrderByAggregateInput
    _max?: ModelsMaxOrderByAggregateInput
    _min?: ModelsMinOrderByAggregateInput
    _sum?: ModelsSumOrderByAggregateInput
  }

  export type ModelsScalarWhereWithAggregatesInput = {
    AND?: ModelsScalarWhereWithAggregatesInput | ModelsScalarWhereWithAggregatesInput[]
    OR?: ModelsScalarWhereWithAggregatesInput[]
    NOT?: ModelsScalarWhereWithAggregatesInput | ModelsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Models"> | string
    name?: StringWithAggregatesFilter<"Models"> | string
    openRoutermodelName?: StringWithAggregatesFilter<"Models"> | string
    lighterApiKey?: StringWithAggregatesFilter<"Models"> | string
    invocationCount?: IntWithAggregatesFilter<"Models"> | number
    accountIndex?: StringWithAggregatesFilter<"Models"> | string
  }

  export type InvocationsWhereInput = {
    AND?: InvocationsWhereInput | InvocationsWhereInput[]
    OR?: InvocationsWhereInput[]
    NOT?: InvocationsWhereInput | InvocationsWhereInput[]
    id?: StringFilter<"Invocations"> | string
    modelId?: StringFilter<"Invocations"> | string
    response?: StringFilter<"Invocations"> | string
    createdAt?: DateTimeFilter<"Invocations"> | Date | string
    updatedAt?: DateTimeFilter<"Invocations"> | Date | string
    model?: XOR<ModelsScalarRelationFilter, ModelsWhereInput>
    toolCalls?: ToolCallsListRelationFilter
  }

  export type InvocationsOrderByWithRelationInput = {
    id?: SortOrder
    modelId?: SortOrder
    response?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    model?: ModelsOrderByWithRelationInput
    toolCalls?: ToolCallsOrderByRelationAggregateInput
  }

  export type InvocationsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InvocationsWhereInput | InvocationsWhereInput[]
    OR?: InvocationsWhereInput[]
    NOT?: InvocationsWhereInput | InvocationsWhereInput[]
    modelId?: StringFilter<"Invocations"> | string
    response?: StringFilter<"Invocations"> | string
    createdAt?: DateTimeFilter<"Invocations"> | Date | string
    updatedAt?: DateTimeFilter<"Invocations"> | Date | string
    model?: XOR<ModelsScalarRelationFilter, ModelsWhereInput>
    toolCalls?: ToolCallsListRelationFilter
  }, "id">

  export type InvocationsOrderByWithAggregationInput = {
    id?: SortOrder
    modelId?: SortOrder
    response?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InvocationsCountOrderByAggregateInput
    _max?: InvocationsMaxOrderByAggregateInput
    _min?: InvocationsMinOrderByAggregateInput
  }

  export type InvocationsScalarWhereWithAggregatesInput = {
    AND?: InvocationsScalarWhereWithAggregatesInput | InvocationsScalarWhereWithAggregatesInput[]
    OR?: InvocationsScalarWhereWithAggregatesInput[]
    NOT?: InvocationsScalarWhereWithAggregatesInput | InvocationsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Invocations"> | string
    modelId?: StringWithAggregatesFilter<"Invocations"> | string
    response?: StringWithAggregatesFilter<"Invocations"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Invocations"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Invocations"> | Date | string
  }

  export type ToolCallsWhereInput = {
    AND?: ToolCallsWhereInput | ToolCallsWhereInput[]
    OR?: ToolCallsWhereInput[]
    NOT?: ToolCallsWhereInput | ToolCallsWhereInput[]
    id?: StringFilter<"ToolCalls"> | string
    invocationId?: StringFilter<"ToolCalls"> | string
    toolCallType?: EnumToolCallTypeFilter<"ToolCalls"> | $Enums.ToolCallType
    metadata?: StringFilter<"ToolCalls"> | string
    createdAt?: DateTimeFilter<"ToolCalls"> | Date | string
    updatedAt?: DateTimeFilter<"ToolCalls"> | Date | string
    invocation?: XOR<InvocationsScalarRelationFilter, InvocationsWhereInput>
  }

  export type ToolCallsOrderByWithRelationInput = {
    id?: SortOrder
    invocationId?: SortOrder
    toolCallType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    invocation?: InvocationsOrderByWithRelationInput
  }

  export type ToolCallsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ToolCallsWhereInput | ToolCallsWhereInput[]
    OR?: ToolCallsWhereInput[]
    NOT?: ToolCallsWhereInput | ToolCallsWhereInput[]
    invocationId?: StringFilter<"ToolCalls"> | string
    toolCallType?: EnumToolCallTypeFilter<"ToolCalls"> | $Enums.ToolCallType
    metadata?: StringFilter<"ToolCalls"> | string
    createdAt?: DateTimeFilter<"ToolCalls"> | Date | string
    updatedAt?: DateTimeFilter<"ToolCalls"> | Date | string
    invocation?: XOR<InvocationsScalarRelationFilter, InvocationsWhereInput>
  }, "id">

  export type ToolCallsOrderByWithAggregationInput = {
    id?: SortOrder
    invocationId?: SortOrder
    toolCallType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ToolCallsCountOrderByAggregateInput
    _max?: ToolCallsMaxOrderByAggregateInput
    _min?: ToolCallsMinOrderByAggregateInput
  }

  export type ToolCallsScalarWhereWithAggregatesInput = {
    AND?: ToolCallsScalarWhereWithAggregatesInput | ToolCallsScalarWhereWithAggregatesInput[]
    OR?: ToolCallsScalarWhereWithAggregatesInput[]
    NOT?: ToolCallsScalarWhereWithAggregatesInput | ToolCallsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ToolCalls"> | string
    invocationId?: StringWithAggregatesFilter<"ToolCalls"> | string
    toolCallType?: EnumToolCallTypeWithAggregatesFilter<"ToolCalls"> | $Enums.ToolCallType
    metadata?: StringWithAggregatesFilter<"ToolCalls"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ToolCalls"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ToolCalls"> | Date | string
  }

  export type PortfolioSizeWhereInput = {
    AND?: PortfolioSizeWhereInput | PortfolioSizeWhereInput[]
    OR?: PortfolioSizeWhereInput[]
    NOT?: PortfolioSizeWhereInput | PortfolioSizeWhereInput[]
    id?: StringFilter<"PortfolioSize"> | string
    modelId?: StringFilter<"PortfolioSize"> | string
    netPortfolio?: StringFilter<"PortfolioSize"> | string
    createdAt?: DateTimeFilter<"PortfolioSize"> | Date | string
    updatedAt?: DateTimeFilter<"PortfolioSize"> | Date | string
    model?: XOR<ModelsScalarRelationFilter, ModelsWhereInput>
  }

  export type PortfolioSizeOrderByWithRelationInput = {
    id?: SortOrder
    modelId?: SortOrder
    netPortfolio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    model?: ModelsOrderByWithRelationInput
  }

  export type PortfolioSizeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PortfolioSizeWhereInput | PortfolioSizeWhereInput[]
    OR?: PortfolioSizeWhereInput[]
    NOT?: PortfolioSizeWhereInput | PortfolioSizeWhereInput[]
    modelId?: StringFilter<"PortfolioSize"> | string
    netPortfolio?: StringFilter<"PortfolioSize"> | string
    createdAt?: DateTimeFilter<"PortfolioSize"> | Date | string
    updatedAt?: DateTimeFilter<"PortfolioSize"> | Date | string
    model?: XOR<ModelsScalarRelationFilter, ModelsWhereInput>
  }, "id">

  export type PortfolioSizeOrderByWithAggregationInput = {
    id?: SortOrder
    modelId?: SortOrder
    netPortfolio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PortfolioSizeCountOrderByAggregateInput
    _max?: PortfolioSizeMaxOrderByAggregateInput
    _min?: PortfolioSizeMinOrderByAggregateInput
  }

  export type PortfolioSizeScalarWhereWithAggregatesInput = {
    AND?: PortfolioSizeScalarWhereWithAggregatesInput | PortfolioSizeScalarWhereWithAggregatesInput[]
    OR?: PortfolioSizeScalarWhereWithAggregatesInput[]
    NOT?: PortfolioSizeScalarWhereWithAggregatesInput | PortfolioSizeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PortfolioSize"> | string
    modelId?: StringWithAggregatesFilter<"PortfolioSize"> | string
    netPortfolio?: StringWithAggregatesFilter<"PortfolioSize"> | string
    createdAt?: DateTimeWithAggregatesFilter<"PortfolioSize"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PortfolioSize"> | Date | string
  }

  export type ModelsCreateInput = {
    id?: string
    name: string
    openRoutermodelName: string
    lighterApiKey: string
    invocationCount?: number
    accountIndex: string
    invocations?: InvocationsCreateNestedManyWithoutModelInput
    portfolioSize?: PortfolioSizeCreateNestedManyWithoutModelInput
  }

  export type ModelsUncheckedCreateInput = {
    id?: string
    name: string
    openRoutermodelName: string
    lighterApiKey: string
    invocationCount?: number
    accountIndex: string
    invocations?: InvocationsUncheckedCreateNestedManyWithoutModelInput
    portfolioSize?: PortfolioSizeUncheckedCreateNestedManyWithoutModelInput
  }

  export type ModelsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    openRoutermodelName?: StringFieldUpdateOperationsInput | string
    lighterApiKey?: StringFieldUpdateOperationsInput | string
    invocationCount?: IntFieldUpdateOperationsInput | number
    accountIndex?: StringFieldUpdateOperationsInput | string
    invocations?: InvocationsUpdateManyWithoutModelNestedInput
    portfolioSize?: PortfolioSizeUpdateManyWithoutModelNestedInput
  }

  export type ModelsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    openRoutermodelName?: StringFieldUpdateOperationsInput | string
    lighterApiKey?: StringFieldUpdateOperationsInput | string
    invocationCount?: IntFieldUpdateOperationsInput | number
    accountIndex?: StringFieldUpdateOperationsInput | string
    invocations?: InvocationsUncheckedUpdateManyWithoutModelNestedInput
    portfolioSize?: PortfolioSizeUncheckedUpdateManyWithoutModelNestedInput
  }

  export type ModelsCreateManyInput = {
    id?: string
    name: string
    openRoutermodelName: string
    lighterApiKey: string
    invocationCount?: number
    accountIndex: string
  }

  export type ModelsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    openRoutermodelName?: StringFieldUpdateOperationsInput | string
    lighterApiKey?: StringFieldUpdateOperationsInput | string
    invocationCount?: IntFieldUpdateOperationsInput | number
    accountIndex?: StringFieldUpdateOperationsInput | string
  }

  export type ModelsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    openRoutermodelName?: StringFieldUpdateOperationsInput | string
    lighterApiKey?: StringFieldUpdateOperationsInput | string
    invocationCount?: IntFieldUpdateOperationsInput | number
    accountIndex?: StringFieldUpdateOperationsInput | string
  }

  export type InvocationsCreateInput = {
    id?: string
    response: string
    createdAt?: Date | string
    updatedAt?: Date | string
    model: ModelsCreateNestedOneWithoutInvocationsInput
    toolCalls?: ToolCallsCreateNestedManyWithoutInvocationInput
  }

  export type InvocationsUncheckedCreateInput = {
    id?: string
    modelId: string
    response: string
    createdAt?: Date | string
    updatedAt?: Date | string
    toolCalls?: ToolCallsUncheckedCreateNestedManyWithoutInvocationInput
  }

  export type InvocationsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelsUpdateOneRequiredWithoutInvocationsNestedInput
    toolCalls?: ToolCallsUpdateManyWithoutInvocationNestedInput
  }

  export type InvocationsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    toolCalls?: ToolCallsUncheckedUpdateManyWithoutInvocationNestedInput
  }

  export type InvocationsCreateManyInput = {
    id?: string
    modelId: string
    response: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvocationsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvocationsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ToolCallsCreateInput = {
    id?: string
    toolCallType: $Enums.ToolCallType
    metadata: string
    createdAt?: Date | string
    updatedAt?: Date | string
    invocation: InvocationsCreateNestedOneWithoutToolCallsInput
  }

  export type ToolCallsUncheckedCreateInput = {
    id?: string
    invocationId: string
    toolCallType: $Enums.ToolCallType
    metadata: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ToolCallsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    toolCallType?: EnumToolCallTypeFieldUpdateOperationsInput | $Enums.ToolCallType
    metadata?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    invocation?: InvocationsUpdateOneRequiredWithoutToolCallsNestedInput
  }

  export type ToolCallsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    invocationId?: StringFieldUpdateOperationsInput | string
    toolCallType?: EnumToolCallTypeFieldUpdateOperationsInput | $Enums.ToolCallType
    metadata?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ToolCallsCreateManyInput = {
    id?: string
    invocationId: string
    toolCallType: $Enums.ToolCallType
    metadata: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ToolCallsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    toolCallType?: EnumToolCallTypeFieldUpdateOperationsInput | $Enums.ToolCallType
    metadata?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ToolCallsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    invocationId?: StringFieldUpdateOperationsInput | string
    toolCallType?: EnumToolCallTypeFieldUpdateOperationsInput | $Enums.ToolCallType
    metadata?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PortfolioSizeCreateInput = {
    id?: string
    netPortfolio: string
    createdAt?: Date | string
    updatedAt?: Date | string
    model: ModelsCreateNestedOneWithoutPortfolioSizeInput
  }

  export type PortfolioSizeUncheckedCreateInput = {
    id?: string
    modelId: string
    netPortfolio: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PortfolioSizeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    netPortfolio?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelsUpdateOneRequiredWithoutPortfolioSizeNestedInput
  }

  export type PortfolioSizeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    netPortfolio?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PortfolioSizeCreateManyInput = {
    id?: string
    modelId: string
    netPortfolio: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PortfolioSizeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    netPortfolio?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PortfolioSizeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    netPortfolio?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type InvocationsListRelationFilter = {
    every?: InvocationsWhereInput
    some?: InvocationsWhereInput
    none?: InvocationsWhereInput
  }

  export type PortfolioSizeListRelationFilter = {
    every?: PortfolioSizeWhereInput
    some?: PortfolioSizeWhereInput
    none?: PortfolioSizeWhereInput
  }

  export type InvocationsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PortfolioSizeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ModelsCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    openRoutermodelName?: SortOrder
    lighterApiKey?: SortOrder
    invocationCount?: SortOrder
    accountIndex?: SortOrder
  }

  export type ModelsAvgOrderByAggregateInput = {
    invocationCount?: SortOrder
  }

  export type ModelsMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    openRoutermodelName?: SortOrder
    lighterApiKey?: SortOrder
    invocationCount?: SortOrder
    accountIndex?: SortOrder
  }

  export type ModelsMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    openRoutermodelName?: SortOrder
    lighterApiKey?: SortOrder
    invocationCount?: SortOrder
    accountIndex?: SortOrder
  }

  export type ModelsSumOrderByAggregateInput = {
    invocationCount?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ModelsScalarRelationFilter = {
    is?: ModelsWhereInput
    isNot?: ModelsWhereInput
  }

  export type ToolCallsListRelationFilter = {
    every?: ToolCallsWhereInput
    some?: ToolCallsWhereInput
    none?: ToolCallsWhereInput
  }

  export type ToolCallsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InvocationsCountOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    response?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvocationsMaxOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    response?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvocationsMinOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    response?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumToolCallTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ToolCallType | EnumToolCallTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ToolCallType[] | ListEnumToolCallTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ToolCallType[] | ListEnumToolCallTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumToolCallTypeFilter<$PrismaModel> | $Enums.ToolCallType
  }

  export type InvocationsScalarRelationFilter = {
    is?: InvocationsWhereInput
    isNot?: InvocationsWhereInput
  }

  export type ToolCallsCountOrderByAggregateInput = {
    id?: SortOrder
    invocationId?: SortOrder
    toolCallType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ToolCallsMaxOrderByAggregateInput = {
    id?: SortOrder
    invocationId?: SortOrder
    toolCallType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ToolCallsMinOrderByAggregateInput = {
    id?: SortOrder
    invocationId?: SortOrder
    toolCallType?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumToolCallTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ToolCallType | EnumToolCallTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ToolCallType[] | ListEnumToolCallTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ToolCallType[] | ListEnumToolCallTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumToolCallTypeWithAggregatesFilter<$PrismaModel> | $Enums.ToolCallType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumToolCallTypeFilter<$PrismaModel>
    _max?: NestedEnumToolCallTypeFilter<$PrismaModel>
  }

  export type PortfolioSizeCountOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    netPortfolio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PortfolioSizeMaxOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    netPortfolio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PortfolioSizeMinOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    netPortfolio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvocationsCreateNestedManyWithoutModelInput = {
    create?: XOR<InvocationsCreateWithoutModelInput, InvocationsUncheckedCreateWithoutModelInput> | InvocationsCreateWithoutModelInput[] | InvocationsUncheckedCreateWithoutModelInput[]
    connectOrCreate?: InvocationsCreateOrConnectWithoutModelInput | InvocationsCreateOrConnectWithoutModelInput[]
    createMany?: InvocationsCreateManyModelInputEnvelope
    connect?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
  }

  export type PortfolioSizeCreateNestedManyWithoutModelInput = {
    create?: XOR<PortfolioSizeCreateWithoutModelInput, PortfolioSizeUncheckedCreateWithoutModelInput> | PortfolioSizeCreateWithoutModelInput[] | PortfolioSizeUncheckedCreateWithoutModelInput[]
    connectOrCreate?: PortfolioSizeCreateOrConnectWithoutModelInput | PortfolioSizeCreateOrConnectWithoutModelInput[]
    createMany?: PortfolioSizeCreateManyModelInputEnvelope
    connect?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
  }

  export type InvocationsUncheckedCreateNestedManyWithoutModelInput = {
    create?: XOR<InvocationsCreateWithoutModelInput, InvocationsUncheckedCreateWithoutModelInput> | InvocationsCreateWithoutModelInput[] | InvocationsUncheckedCreateWithoutModelInput[]
    connectOrCreate?: InvocationsCreateOrConnectWithoutModelInput | InvocationsCreateOrConnectWithoutModelInput[]
    createMany?: InvocationsCreateManyModelInputEnvelope
    connect?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
  }

  export type PortfolioSizeUncheckedCreateNestedManyWithoutModelInput = {
    create?: XOR<PortfolioSizeCreateWithoutModelInput, PortfolioSizeUncheckedCreateWithoutModelInput> | PortfolioSizeCreateWithoutModelInput[] | PortfolioSizeUncheckedCreateWithoutModelInput[]
    connectOrCreate?: PortfolioSizeCreateOrConnectWithoutModelInput | PortfolioSizeCreateOrConnectWithoutModelInput[]
    createMany?: PortfolioSizeCreateManyModelInputEnvelope
    connect?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type InvocationsUpdateManyWithoutModelNestedInput = {
    create?: XOR<InvocationsCreateWithoutModelInput, InvocationsUncheckedCreateWithoutModelInput> | InvocationsCreateWithoutModelInput[] | InvocationsUncheckedCreateWithoutModelInput[]
    connectOrCreate?: InvocationsCreateOrConnectWithoutModelInput | InvocationsCreateOrConnectWithoutModelInput[]
    upsert?: InvocationsUpsertWithWhereUniqueWithoutModelInput | InvocationsUpsertWithWhereUniqueWithoutModelInput[]
    createMany?: InvocationsCreateManyModelInputEnvelope
    set?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
    disconnect?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
    delete?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
    connect?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
    update?: InvocationsUpdateWithWhereUniqueWithoutModelInput | InvocationsUpdateWithWhereUniqueWithoutModelInput[]
    updateMany?: InvocationsUpdateManyWithWhereWithoutModelInput | InvocationsUpdateManyWithWhereWithoutModelInput[]
    deleteMany?: InvocationsScalarWhereInput | InvocationsScalarWhereInput[]
  }

  export type PortfolioSizeUpdateManyWithoutModelNestedInput = {
    create?: XOR<PortfolioSizeCreateWithoutModelInput, PortfolioSizeUncheckedCreateWithoutModelInput> | PortfolioSizeCreateWithoutModelInput[] | PortfolioSizeUncheckedCreateWithoutModelInput[]
    connectOrCreate?: PortfolioSizeCreateOrConnectWithoutModelInput | PortfolioSizeCreateOrConnectWithoutModelInput[]
    upsert?: PortfolioSizeUpsertWithWhereUniqueWithoutModelInput | PortfolioSizeUpsertWithWhereUniqueWithoutModelInput[]
    createMany?: PortfolioSizeCreateManyModelInputEnvelope
    set?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
    disconnect?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
    delete?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
    connect?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
    update?: PortfolioSizeUpdateWithWhereUniqueWithoutModelInput | PortfolioSizeUpdateWithWhereUniqueWithoutModelInput[]
    updateMany?: PortfolioSizeUpdateManyWithWhereWithoutModelInput | PortfolioSizeUpdateManyWithWhereWithoutModelInput[]
    deleteMany?: PortfolioSizeScalarWhereInput | PortfolioSizeScalarWhereInput[]
  }

  export type InvocationsUncheckedUpdateManyWithoutModelNestedInput = {
    create?: XOR<InvocationsCreateWithoutModelInput, InvocationsUncheckedCreateWithoutModelInput> | InvocationsCreateWithoutModelInput[] | InvocationsUncheckedCreateWithoutModelInput[]
    connectOrCreate?: InvocationsCreateOrConnectWithoutModelInput | InvocationsCreateOrConnectWithoutModelInput[]
    upsert?: InvocationsUpsertWithWhereUniqueWithoutModelInput | InvocationsUpsertWithWhereUniqueWithoutModelInput[]
    createMany?: InvocationsCreateManyModelInputEnvelope
    set?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
    disconnect?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
    delete?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
    connect?: InvocationsWhereUniqueInput | InvocationsWhereUniqueInput[]
    update?: InvocationsUpdateWithWhereUniqueWithoutModelInput | InvocationsUpdateWithWhereUniqueWithoutModelInput[]
    updateMany?: InvocationsUpdateManyWithWhereWithoutModelInput | InvocationsUpdateManyWithWhereWithoutModelInput[]
    deleteMany?: InvocationsScalarWhereInput | InvocationsScalarWhereInput[]
  }

  export type PortfolioSizeUncheckedUpdateManyWithoutModelNestedInput = {
    create?: XOR<PortfolioSizeCreateWithoutModelInput, PortfolioSizeUncheckedCreateWithoutModelInput> | PortfolioSizeCreateWithoutModelInput[] | PortfolioSizeUncheckedCreateWithoutModelInput[]
    connectOrCreate?: PortfolioSizeCreateOrConnectWithoutModelInput | PortfolioSizeCreateOrConnectWithoutModelInput[]
    upsert?: PortfolioSizeUpsertWithWhereUniqueWithoutModelInput | PortfolioSizeUpsertWithWhereUniqueWithoutModelInput[]
    createMany?: PortfolioSizeCreateManyModelInputEnvelope
    set?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
    disconnect?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
    delete?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
    connect?: PortfolioSizeWhereUniqueInput | PortfolioSizeWhereUniqueInput[]
    update?: PortfolioSizeUpdateWithWhereUniqueWithoutModelInput | PortfolioSizeUpdateWithWhereUniqueWithoutModelInput[]
    updateMany?: PortfolioSizeUpdateManyWithWhereWithoutModelInput | PortfolioSizeUpdateManyWithWhereWithoutModelInput[]
    deleteMany?: PortfolioSizeScalarWhereInput | PortfolioSizeScalarWhereInput[]
  }

  export type ModelsCreateNestedOneWithoutInvocationsInput = {
    create?: XOR<ModelsCreateWithoutInvocationsInput, ModelsUncheckedCreateWithoutInvocationsInput>
    connectOrCreate?: ModelsCreateOrConnectWithoutInvocationsInput
    connect?: ModelsWhereUniqueInput
  }

  export type ToolCallsCreateNestedManyWithoutInvocationInput = {
    create?: XOR<ToolCallsCreateWithoutInvocationInput, ToolCallsUncheckedCreateWithoutInvocationInput> | ToolCallsCreateWithoutInvocationInput[] | ToolCallsUncheckedCreateWithoutInvocationInput[]
    connectOrCreate?: ToolCallsCreateOrConnectWithoutInvocationInput | ToolCallsCreateOrConnectWithoutInvocationInput[]
    createMany?: ToolCallsCreateManyInvocationInputEnvelope
    connect?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
  }

  export type ToolCallsUncheckedCreateNestedManyWithoutInvocationInput = {
    create?: XOR<ToolCallsCreateWithoutInvocationInput, ToolCallsUncheckedCreateWithoutInvocationInput> | ToolCallsCreateWithoutInvocationInput[] | ToolCallsUncheckedCreateWithoutInvocationInput[]
    connectOrCreate?: ToolCallsCreateOrConnectWithoutInvocationInput | ToolCallsCreateOrConnectWithoutInvocationInput[]
    createMany?: ToolCallsCreateManyInvocationInputEnvelope
    connect?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ModelsUpdateOneRequiredWithoutInvocationsNestedInput = {
    create?: XOR<ModelsCreateWithoutInvocationsInput, ModelsUncheckedCreateWithoutInvocationsInput>
    connectOrCreate?: ModelsCreateOrConnectWithoutInvocationsInput
    upsert?: ModelsUpsertWithoutInvocationsInput
    connect?: ModelsWhereUniqueInput
    update?: XOR<XOR<ModelsUpdateToOneWithWhereWithoutInvocationsInput, ModelsUpdateWithoutInvocationsInput>, ModelsUncheckedUpdateWithoutInvocationsInput>
  }

  export type ToolCallsUpdateManyWithoutInvocationNestedInput = {
    create?: XOR<ToolCallsCreateWithoutInvocationInput, ToolCallsUncheckedCreateWithoutInvocationInput> | ToolCallsCreateWithoutInvocationInput[] | ToolCallsUncheckedCreateWithoutInvocationInput[]
    connectOrCreate?: ToolCallsCreateOrConnectWithoutInvocationInput | ToolCallsCreateOrConnectWithoutInvocationInput[]
    upsert?: ToolCallsUpsertWithWhereUniqueWithoutInvocationInput | ToolCallsUpsertWithWhereUniqueWithoutInvocationInput[]
    createMany?: ToolCallsCreateManyInvocationInputEnvelope
    set?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
    disconnect?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
    delete?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
    connect?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
    update?: ToolCallsUpdateWithWhereUniqueWithoutInvocationInput | ToolCallsUpdateWithWhereUniqueWithoutInvocationInput[]
    updateMany?: ToolCallsUpdateManyWithWhereWithoutInvocationInput | ToolCallsUpdateManyWithWhereWithoutInvocationInput[]
    deleteMany?: ToolCallsScalarWhereInput | ToolCallsScalarWhereInput[]
  }

  export type ToolCallsUncheckedUpdateManyWithoutInvocationNestedInput = {
    create?: XOR<ToolCallsCreateWithoutInvocationInput, ToolCallsUncheckedCreateWithoutInvocationInput> | ToolCallsCreateWithoutInvocationInput[] | ToolCallsUncheckedCreateWithoutInvocationInput[]
    connectOrCreate?: ToolCallsCreateOrConnectWithoutInvocationInput | ToolCallsCreateOrConnectWithoutInvocationInput[]
    upsert?: ToolCallsUpsertWithWhereUniqueWithoutInvocationInput | ToolCallsUpsertWithWhereUniqueWithoutInvocationInput[]
    createMany?: ToolCallsCreateManyInvocationInputEnvelope
    set?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
    disconnect?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
    delete?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
    connect?: ToolCallsWhereUniqueInput | ToolCallsWhereUniqueInput[]
    update?: ToolCallsUpdateWithWhereUniqueWithoutInvocationInput | ToolCallsUpdateWithWhereUniqueWithoutInvocationInput[]
    updateMany?: ToolCallsUpdateManyWithWhereWithoutInvocationInput | ToolCallsUpdateManyWithWhereWithoutInvocationInput[]
    deleteMany?: ToolCallsScalarWhereInput | ToolCallsScalarWhereInput[]
  }

  export type InvocationsCreateNestedOneWithoutToolCallsInput = {
    create?: XOR<InvocationsCreateWithoutToolCallsInput, InvocationsUncheckedCreateWithoutToolCallsInput>
    connectOrCreate?: InvocationsCreateOrConnectWithoutToolCallsInput
    connect?: InvocationsWhereUniqueInput
  }

  export type EnumToolCallTypeFieldUpdateOperationsInput = {
    set?: $Enums.ToolCallType
  }

  export type InvocationsUpdateOneRequiredWithoutToolCallsNestedInput = {
    create?: XOR<InvocationsCreateWithoutToolCallsInput, InvocationsUncheckedCreateWithoutToolCallsInput>
    connectOrCreate?: InvocationsCreateOrConnectWithoutToolCallsInput
    upsert?: InvocationsUpsertWithoutToolCallsInput
    connect?: InvocationsWhereUniqueInput
    update?: XOR<XOR<InvocationsUpdateToOneWithWhereWithoutToolCallsInput, InvocationsUpdateWithoutToolCallsInput>, InvocationsUncheckedUpdateWithoutToolCallsInput>
  }

  export type ModelsCreateNestedOneWithoutPortfolioSizeInput = {
    create?: XOR<ModelsCreateWithoutPortfolioSizeInput, ModelsUncheckedCreateWithoutPortfolioSizeInput>
    connectOrCreate?: ModelsCreateOrConnectWithoutPortfolioSizeInput
    connect?: ModelsWhereUniqueInput
  }

  export type ModelsUpdateOneRequiredWithoutPortfolioSizeNestedInput = {
    create?: XOR<ModelsCreateWithoutPortfolioSizeInput, ModelsUncheckedCreateWithoutPortfolioSizeInput>
    connectOrCreate?: ModelsCreateOrConnectWithoutPortfolioSizeInput
    upsert?: ModelsUpsertWithoutPortfolioSizeInput
    connect?: ModelsWhereUniqueInput
    update?: XOR<XOR<ModelsUpdateToOneWithWhereWithoutPortfolioSizeInput, ModelsUpdateWithoutPortfolioSizeInput>, ModelsUncheckedUpdateWithoutPortfolioSizeInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumToolCallTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ToolCallType | EnumToolCallTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ToolCallType[] | ListEnumToolCallTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ToolCallType[] | ListEnumToolCallTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumToolCallTypeFilter<$PrismaModel> | $Enums.ToolCallType
  }

  export type NestedEnumToolCallTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ToolCallType | EnumToolCallTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ToolCallType[] | ListEnumToolCallTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ToolCallType[] | ListEnumToolCallTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumToolCallTypeWithAggregatesFilter<$PrismaModel> | $Enums.ToolCallType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumToolCallTypeFilter<$PrismaModel>
    _max?: NestedEnumToolCallTypeFilter<$PrismaModel>
  }

  export type InvocationsCreateWithoutModelInput = {
    id?: string
    response: string
    createdAt?: Date | string
    updatedAt?: Date | string
    toolCalls?: ToolCallsCreateNestedManyWithoutInvocationInput
  }

  export type InvocationsUncheckedCreateWithoutModelInput = {
    id?: string
    response: string
    createdAt?: Date | string
    updatedAt?: Date | string
    toolCalls?: ToolCallsUncheckedCreateNestedManyWithoutInvocationInput
  }

  export type InvocationsCreateOrConnectWithoutModelInput = {
    where: InvocationsWhereUniqueInput
    create: XOR<InvocationsCreateWithoutModelInput, InvocationsUncheckedCreateWithoutModelInput>
  }

  export type InvocationsCreateManyModelInputEnvelope = {
    data: InvocationsCreateManyModelInput | InvocationsCreateManyModelInput[]
    skipDuplicates?: boolean
  }

  export type PortfolioSizeCreateWithoutModelInput = {
    id?: string
    netPortfolio: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PortfolioSizeUncheckedCreateWithoutModelInput = {
    id?: string
    netPortfolio: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PortfolioSizeCreateOrConnectWithoutModelInput = {
    where: PortfolioSizeWhereUniqueInput
    create: XOR<PortfolioSizeCreateWithoutModelInput, PortfolioSizeUncheckedCreateWithoutModelInput>
  }

  export type PortfolioSizeCreateManyModelInputEnvelope = {
    data: PortfolioSizeCreateManyModelInput | PortfolioSizeCreateManyModelInput[]
    skipDuplicates?: boolean
  }

  export type InvocationsUpsertWithWhereUniqueWithoutModelInput = {
    where: InvocationsWhereUniqueInput
    update: XOR<InvocationsUpdateWithoutModelInput, InvocationsUncheckedUpdateWithoutModelInput>
    create: XOR<InvocationsCreateWithoutModelInput, InvocationsUncheckedCreateWithoutModelInput>
  }

  export type InvocationsUpdateWithWhereUniqueWithoutModelInput = {
    where: InvocationsWhereUniqueInput
    data: XOR<InvocationsUpdateWithoutModelInput, InvocationsUncheckedUpdateWithoutModelInput>
  }

  export type InvocationsUpdateManyWithWhereWithoutModelInput = {
    where: InvocationsScalarWhereInput
    data: XOR<InvocationsUpdateManyMutationInput, InvocationsUncheckedUpdateManyWithoutModelInput>
  }

  export type InvocationsScalarWhereInput = {
    AND?: InvocationsScalarWhereInput | InvocationsScalarWhereInput[]
    OR?: InvocationsScalarWhereInput[]
    NOT?: InvocationsScalarWhereInput | InvocationsScalarWhereInput[]
    id?: StringFilter<"Invocations"> | string
    modelId?: StringFilter<"Invocations"> | string
    response?: StringFilter<"Invocations"> | string
    createdAt?: DateTimeFilter<"Invocations"> | Date | string
    updatedAt?: DateTimeFilter<"Invocations"> | Date | string
  }

  export type PortfolioSizeUpsertWithWhereUniqueWithoutModelInput = {
    where: PortfolioSizeWhereUniqueInput
    update: XOR<PortfolioSizeUpdateWithoutModelInput, PortfolioSizeUncheckedUpdateWithoutModelInput>
    create: XOR<PortfolioSizeCreateWithoutModelInput, PortfolioSizeUncheckedCreateWithoutModelInput>
  }

  export type PortfolioSizeUpdateWithWhereUniqueWithoutModelInput = {
    where: PortfolioSizeWhereUniqueInput
    data: XOR<PortfolioSizeUpdateWithoutModelInput, PortfolioSizeUncheckedUpdateWithoutModelInput>
  }

  export type PortfolioSizeUpdateManyWithWhereWithoutModelInput = {
    where: PortfolioSizeScalarWhereInput
    data: XOR<PortfolioSizeUpdateManyMutationInput, PortfolioSizeUncheckedUpdateManyWithoutModelInput>
  }

  export type PortfolioSizeScalarWhereInput = {
    AND?: PortfolioSizeScalarWhereInput | PortfolioSizeScalarWhereInput[]
    OR?: PortfolioSizeScalarWhereInput[]
    NOT?: PortfolioSizeScalarWhereInput | PortfolioSizeScalarWhereInput[]
    id?: StringFilter<"PortfolioSize"> | string
    modelId?: StringFilter<"PortfolioSize"> | string
    netPortfolio?: StringFilter<"PortfolioSize"> | string
    createdAt?: DateTimeFilter<"PortfolioSize"> | Date | string
    updatedAt?: DateTimeFilter<"PortfolioSize"> | Date | string
  }

  export type ModelsCreateWithoutInvocationsInput = {
    id?: string
    name: string
    openRoutermodelName: string
    lighterApiKey: string
    invocationCount?: number
    accountIndex: string
    portfolioSize?: PortfolioSizeCreateNestedManyWithoutModelInput
  }

  export type ModelsUncheckedCreateWithoutInvocationsInput = {
    id?: string
    name: string
    openRoutermodelName: string
    lighterApiKey: string
    invocationCount?: number
    accountIndex: string
    portfolioSize?: PortfolioSizeUncheckedCreateNestedManyWithoutModelInput
  }

  export type ModelsCreateOrConnectWithoutInvocationsInput = {
    where: ModelsWhereUniqueInput
    create: XOR<ModelsCreateWithoutInvocationsInput, ModelsUncheckedCreateWithoutInvocationsInput>
  }

  export type ToolCallsCreateWithoutInvocationInput = {
    id?: string
    toolCallType: $Enums.ToolCallType
    metadata: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ToolCallsUncheckedCreateWithoutInvocationInput = {
    id?: string
    toolCallType: $Enums.ToolCallType
    metadata: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ToolCallsCreateOrConnectWithoutInvocationInput = {
    where: ToolCallsWhereUniqueInput
    create: XOR<ToolCallsCreateWithoutInvocationInput, ToolCallsUncheckedCreateWithoutInvocationInput>
  }

  export type ToolCallsCreateManyInvocationInputEnvelope = {
    data: ToolCallsCreateManyInvocationInput | ToolCallsCreateManyInvocationInput[]
    skipDuplicates?: boolean
  }

  export type ModelsUpsertWithoutInvocationsInput = {
    update: XOR<ModelsUpdateWithoutInvocationsInput, ModelsUncheckedUpdateWithoutInvocationsInput>
    create: XOR<ModelsCreateWithoutInvocationsInput, ModelsUncheckedCreateWithoutInvocationsInput>
    where?: ModelsWhereInput
  }

  export type ModelsUpdateToOneWithWhereWithoutInvocationsInput = {
    where?: ModelsWhereInput
    data: XOR<ModelsUpdateWithoutInvocationsInput, ModelsUncheckedUpdateWithoutInvocationsInput>
  }

  export type ModelsUpdateWithoutInvocationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    openRoutermodelName?: StringFieldUpdateOperationsInput | string
    lighterApiKey?: StringFieldUpdateOperationsInput | string
    invocationCount?: IntFieldUpdateOperationsInput | number
    accountIndex?: StringFieldUpdateOperationsInput | string
    portfolioSize?: PortfolioSizeUpdateManyWithoutModelNestedInput
  }

  export type ModelsUncheckedUpdateWithoutInvocationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    openRoutermodelName?: StringFieldUpdateOperationsInput | string
    lighterApiKey?: StringFieldUpdateOperationsInput | string
    invocationCount?: IntFieldUpdateOperationsInput | number
    accountIndex?: StringFieldUpdateOperationsInput | string
    portfolioSize?: PortfolioSizeUncheckedUpdateManyWithoutModelNestedInput
  }

  export type ToolCallsUpsertWithWhereUniqueWithoutInvocationInput = {
    where: ToolCallsWhereUniqueInput
    update: XOR<ToolCallsUpdateWithoutInvocationInput, ToolCallsUncheckedUpdateWithoutInvocationInput>
    create: XOR<ToolCallsCreateWithoutInvocationInput, ToolCallsUncheckedCreateWithoutInvocationInput>
  }

  export type ToolCallsUpdateWithWhereUniqueWithoutInvocationInput = {
    where: ToolCallsWhereUniqueInput
    data: XOR<ToolCallsUpdateWithoutInvocationInput, ToolCallsUncheckedUpdateWithoutInvocationInput>
  }

  export type ToolCallsUpdateManyWithWhereWithoutInvocationInput = {
    where: ToolCallsScalarWhereInput
    data: XOR<ToolCallsUpdateManyMutationInput, ToolCallsUncheckedUpdateManyWithoutInvocationInput>
  }

  export type ToolCallsScalarWhereInput = {
    AND?: ToolCallsScalarWhereInput | ToolCallsScalarWhereInput[]
    OR?: ToolCallsScalarWhereInput[]
    NOT?: ToolCallsScalarWhereInput | ToolCallsScalarWhereInput[]
    id?: StringFilter<"ToolCalls"> | string
    invocationId?: StringFilter<"ToolCalls"> | string
    toolCallType?: EnumToolCallTypeFilter<"ToolCalls"> | $Enums.ToolCallType
    metadata?: StringFilter<"ToolCalls"> | string
    createdAt?: DateTimeFilter<"ToolCalls"> | Date | string
    updatedAt?: DateTimeFilter<"ToolCalls"> | Date | string
  }

  export type InvocationsCreateWithoutToolCallsInput = {
    id?: string
    response: string
    createdAt?: Date | string
    updatedAt?: Date | string
    model: ModelsCreateNestedOneWithoutInvocationsInput
  }

  export type InvocationsUncheckedCreateWithoutToolCallsInput = {
    id?: string
    modelId: string
    response: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvocationsCreateOrConnectWithoutToolCallsInput = {
    where: InvocationsWhereUniqueInput
    create: XOR<InvocationsCreateWithoutToolCallsInput, InvocationsUncheckedCreateWithoutToolCallsInput>
  }

  export type InvocationsUpsertWithoutToolCallsInput = {
    update: XOR<InvocationsUpdateWithoutToolCallsInput, InvocationsUncheckedUpdateWithoutToolCallsInput>
    create: XOR<InvocationsCreateWithoutToolCallsInput, InvocationsUncheckedCreateWithoutToolCallsInput>
    where?: InvocationsWhereInput
  }

  export type InvocationsUpdateToOneWithWhereWithoutToolCallsInput = {
    where?: InvocationsWhereInput
    data: XOR<InvocationsUpdateWithoutToolCallsInput, InvocationsUncheckedUpdateWithoutToolCallsInput>
  }

  export type InvocationsUpdateWithoutToolCallsInput = {
    id?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelsUpdateOneRequiredWithoutInvocationsNestedInput
  }

  export type InvocationsUncheckedUpdateWithoutToolCallsInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelsCreateWithoutPortfolioSizeInput = {
    id?: string
    name: string
    openRoutermodelName: string
    lighterApiKey: string
    invocationCount?: number
    accountIndex: string
    invocations?: InvocationsCreateNestedManyWithoutModelInput
  }

  export type ModelsUncheckedCreateWithoutPortfolioSizeInput = {
    id?: string
    name: string
    openRoutermodelName: string
    lighterApiKey: string
    invocationCount?: number
    accountIndex: string
    invocations?: InvocationsUncheckedCreateNestedManyWithoutModelInput
  }

  export type ModelsCreateOrConnectWithoutPortfolioSizeInput = {
    where: ModelsWhereUniqueInput
    create: XOR<ModelsCreateWithoutPortfolioSizeInput, ModelsUncheckedCreateWithoutPortfolioSizeInput>
  }

  export type ModelsUpsertWithoutPortfolioSizeInput = {
    update: XOR<ModelsUpdateWithoutPortfolioSizeInput, ModelsUncheckedUpdateWithoutPortfolioSizeInput>
    create: XOR<ModelsCreateWithoutPortfolioSizeInput, ModelsUncheckedCreateWithoutPortfolioSizeInput>
    where?: ModelsWhereInput
  }

  export type ModelsUpdateToOneWithWhereWithoutPortfolioSizeInput = {
    where?: ModelsWhereInput
    data: XOR<ModelsUpdateWithoutPortfolioSizeInput, ModelsUncheckedUpdateWithoutPortfolioSizeInput>
  }

  export type ModelsUpdateWithoutPortfolioSizeInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    openRoutermodelName?: StringFieldUpdateOperationsInput | string
    lighterApiKey?: StringFieldUpdateOperationsInput | string
    invocationCount?: IntFieldUpdateOperationsInput | number
    accountIndex?: StringFieldUpdateOperationsInput | string
    invocations?: InvocationsUpdateManyWithoutModelNestedInput
  }

  export type ModelsUncheckedUpdateWithoutPortfolioSizeInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    openRoutermodelName?: StringFieldUpdateOperationsInput | string
    lighterApiKey?: StringFieldUpdateOperationsInput | string
    invocationCount?: IntFieldUpdateOperationsInput | number
    accountIndex?: StringFieldUpdateOperationsInput | string
    invocations?: InvocationsUncheckedUpdateManyWithoutModelNestedInput
  }

  export type InvocationsCreateManyModelInput = {
    id?: string
    response: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PortfolioSizeCreateManyModelInput = {
    id?: string
    netPortfolio: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvocationsUpdateWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    toolCalls?: ToolCallsUpdateManyWithoutInvocationNestedInput
  }

  export type InvocationsUncheckedUpdateWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    toolCalls?: ToolCallsUncheckedUpdateManyWithoutInvocationNestedInput
  }

  export type InvocationsUncheckedUpdateManyWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    response?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PortfolioSizeUpdateWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    netPortfolio?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PortfolioSizeUncheckedUpdateWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    netPortfolio?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PortfolioSizeUncheckedUpdateManyWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    netPortfolio?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ToolCallsCreateManyInvocationInput = {
    id?: string
    toolCallType: $Enums.ToolCallType
    metadata: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ToolCallsUpdateWithoutInvocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    toolCallType?: EnumToolCallTypeFieldUpdateOperationsInput | $Enums.ToolCallType
    metadata?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ToolCallsUncheckedUpdateWithoutInvocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    toolCallType?: EnumToolCallTypeFieldUpdateOperationsInput | $Enums.ToolCallType
    metadata?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ToolCallsUncheckedUpdateManyWithoutInvocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    toolCallType?: EnumToolCallTypeFieldUpdateOperationsInput | $Enums.ToolCallType
    metadata?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}