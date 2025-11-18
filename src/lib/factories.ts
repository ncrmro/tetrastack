/**
 * Central factory utilities for test data generation.
 *
 * This module wraps fishery and faker to provide a consistent interface
 * for all test factories. All factories should import from this file
 * rather than directly from fishery or faker.
 *
 * @example
 * ```typescript
 * import { Factory, db } from '@/lib/factories';
 *
 * class UserFactory extends Factory<User> {
 *   admin() {
 *     return this.params({ admin: true });
 *   }
 * }
 *
 * const userFactory = UserFactory.define(({ sequence }) => ({
 *   email: `user-${sequence}@example.com`,
 *   name: Factory.faker.person.fullName(),
 * }));
 *
 * const admin = userFactory.admin().build();
 * ```
 */

import { Factory as FisheryFactory } from 'fishery';
import { faker as fakerInstance } from '@faker-js/faker';
import { db as database } from '@/database';

/**
 * Factory class for defining test data factories.
 * Extend this class to add custom builder methods (traits).
 *
 * Access faker via Factory.faker for generating realistic fake data.
 *
 * @see https://github.com/thoughtbot/fishery
 * @see https://fakerjs.dev/
 */
export const Factory: typeof FisheryFactory & {
  faker: typeof fakerInstance;
} = FisheryFactory as typeof FisheryFactory & {
  faker: typeof fakerInstance;
};

/**
 * Faker instance for generating realistic fake data.
 * Available as static property on Factory class.
 */
Factory.faker = fakerInstance;

/**
 * Database instance for factory persistence.
 * Use this in factory create() methods to persist data.
 *
 * @example
 * ```typescript
 * async create(params) {
 *   const data = this.build(params);
 *   const [created] = await db.insert(users).values(data).returning();
 *   return created;
 * }
 * ```
 */
export const db = database;

/**
 * Type helper for factory transient parameters.
 * Transient params affect factory behavior but aren't in the final object.
 *
 * @example
 * ```typescript
 * type FoodTransientParams = {
 *   includeNutrients?: boolean;
 *   includeWholeUnits?: boolean;
 * };
 *
 * Factory.define<InsertFood, FoodTransientParams>(({ transientParams }) => ({
 *   wholeUnits: transientParams.includeWholeUnits ? [...] : null
 * }))
 * ```
 */
export type TransientParams = Record<string, unknown>;

/**
 * Type helper for factory associations.
 * Associations are related objects that can be passed to factories.
 *
 * @example
 * ```typescript
 * type RecipeAssociations = {
 *   ingredients?: InsertFood[];
 * };
 *
 * recipeFactory.build({}, {
 *   associations: {
 *     ingredients: foodFactory.buildList(3)
 *   }
 * })
 * ```
 */
export type Associations = Record<string, unknown>;
