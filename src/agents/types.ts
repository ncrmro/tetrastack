// Shared types and constants for agents - safe for client-side import

export interface MealGenerationOptions {
  simplified?: boolean
  vegan?: boolean
  vegetarian?: boolean
  glutenFree?: boolean
  resolveRecipesNow?: boolean
  resolveFoodsNow?: boolean
  getOrCreateMeals?: boolean // Enable meal database search/create
  getOrCreateRecipes?: boolean // Cascade to recipe agent
  getOrCreateFoods?: boolean // Cascade through meal → recipe → food agents
}

export const MealGenerationSteps = {
  RESEARCH: 'research',
  SELECT: 'select',
  GENERATE: 'generate',
  FOODS: 'foods',
  COMPLETE: 'complete',
} as const
