import { describe, expect, it } from 'vitest'
import { generateUniqueSlug, slugify } from '@/lib/slugify'

describe('slugify', () => {
  it('converts basic strings to lowercase with hyphens', () => {
    expect(slugify('Chicken Noodle Soup')).toBe('chicken-noodle-soup')
    expect(slugify('Baked Chicken')).toBe('baked-chicken')
  })

  it('removes apostrophes', () => {
    expect(slugify("Za'atar Seasoning")).toBe('zaatar-seasoning')
    expect(slugify("Chef's Special")).toBe('chefs-special')
  })

  it('removes commas', () => {
    expect(
      slugify('Chicken Noodle Soup, Garlic Bread and Mixed Green Salad'),
    ).toBe('chicken-noodle-soup-garlic-bread-and-mixed-green-salad')
    expect(slugify('Soup, Bread, Salad')).toBe('soup-bread-salad')
  })

  it('converts ampersands to "and"', () => {
    expect(slugify('Chicken & Rice')).toBe('chicken-and-rice')
    expect(slugify('Mac & Cheese')).toBe('mac-and-cheese')
  })

  it('removes parentheses', () => {
    expect(slugify('Chicken (Roasted)')).toBe('chicken-roasted')
    expect(slugify('Beans (Cooked)')).toBe('beans-cooked')
  })

  it('normalizes accented characters', () => {
    expect(slugify('Café au Lait')).toBe('cafe-au-lait')
    expect(slugify('Crème Brûlée')).toBe('creme-brulee')
    expect(slugify('Jalapeño Peppers')).toBe('jalapeno-peppers')
  })

  it('handles multiple consecutive spaces', () => {
    expect(slugify('Too    Many    Spaces')).toBe('too-many-spaces')
    expect(slugify('Multiple   Space   Test')).toBe('multiple-space-test')
  })

  it('handles multiple consecutive hyphens', () => {
    expect(slugify('Already--Has---Hyphens')).toBe('already-has-hyphens')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('-Leading Hyphen')).toBe('leading-hyphen')
    expect(slugify('Trailing Hyphen-')).toBe('trailing-hyphen')
    expect(slugify('-Both Sides-')).toBe('both-sides')
  })

  it('removes all special characters', () => {
    expect(slugify('Recipe!@#$%Test')).toBe('recipetest')
    expect(slugify('Special*()Characters?')).toBe('specialcharacters')
  })

  it('handles empty strings', () => {
    expect(slugify('')).toBe('')
  })

  it('handles strings with only special characters', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('@#$%')).toBe('')
  })

  it('handles real-world meal names', () => {
    expect(slugify('Green Thai Curry with Chicken and Brown Rice')).toBe(
      'green-thai-curry-with-chicken-and-brown-rice',
    )

    expect(slugify("Beef with Za'atar Cauliflower and Sweet Potatoes")).toBe(
      'beef-with-zaatar-cauliflower-and-sweet-potatoes',
    )
  })

  it('handles numbers in strings', () => {
    expect(slugify('93% Lean Ground Beef')).toBe('93-lean-ground-beef')
    expect(slugify('Recipe 123')).toBe('recipe-123')
  })
})

describe('generateUniqueSlug', () => {
  it('returns base slug if not in existing set', () => {
    const existing = new Set(['other-slug'])
    expect(generateUniqueSlug('chicken-soup', existing)).toBe('chicken-soup')
  })

  it('appends -2 for first collision', () => {
    const existing = new Set(['chicken-soup'])
    expect(generateUniqueSlug('chicken-soup', existing)).toBe('chicken-soup-2')
  })

  it('increments counter for multiple collisions', () => {
    const existing = new Set([
      'chicken-soup',
      'chicken-soup-2',
      'chicken-soup-3',
    ])
    expect(generateUniqueSlug('chicken-soup', existing)).toBe('chicken-soup-4')
  })

  it('handles empty existing set', () => {
    const existing = new Set<string>()
    expect(generateUniqueSlug('chicken-soup', existing)).toBe('chicken-soup')
  })

  it('finds first available gap', () => {
    const existing = new Set(['recipe', 'recipe-2'])
    expect(generateUniqueSlug('recipe', existing)).toBe('recipe-3')
  })
})
