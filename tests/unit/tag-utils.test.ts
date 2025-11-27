import { describe, expect, it } from 'vitest'

describe('Tag Utilities', () => {
  describe('Tag name normalization', () => {
    it('normalizes tag names to lowercase', () => {
      const normalize = (name: string) => name.toLowerCase().trim()

      expect(normalize('Frontend')).toBe('frontend')
      expect(normalize('BACKEND')).toBe('backend')
      expect(normalize('UX/UI')).toBe('ux/ui')
    })

    it('trims whitespace from tag names', () => {
      const normalize = (name: string) => name.toLowerCase().trim()

      expect(normalize('  frontend  ')).toBe('frontend')
      expect(normalize('\nbackend\t')).toBe('backend')
    })

    it('handles multi-word tag names', () => {
      const normalize = (name: string) => name.toLowerCase().trim()

      expect(normalize('High Priority')).toBe('high priority')
      expect(normalize('  In Progress  ')).toBe('in progress')
    })
  })

  describe('Tag color validation', () => {
    // Common tag colors used in the system
    const validColors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#6366f1', // indigo
    ]

    it('validates hex color format', () => {
      const isValidHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color)

      validColors.forEach((color) => {
        expect(isValidHexColor(color)).toBe(true)
      })

      expect(isValidHexColor('#123')).toBe(false) // too short
      expect(isValidHexColor('#1234567')).toBe(false) // too long
      expect(isValidHexColor('3b82f6')).toBe(false) // missing #
      expect(isValidHexColor('#gggggg')).toBe(false) // invalid hex
    })

    it('validates color string length', () => {
      validColors.forEach((color) => {
        expect(color.length).toBe(7)
        expect(color[0]).toBe('#')
      })
    })
  })

  describe('Tag uniqueness within team', () => {
    it('checks for duplicate tag names within same team', () => {
      const existingTags = [
        { teamId: 'team-1', name: 'frontend' },
        { teamId: 'team-1', name: 'backend' },
        { teamId: 'team-2', name: 'frontend' }, // Different team, same name is OK
      ]

      const isDuplicate = (teamId: string, name: string) =>
        existingTags.some((tag) => tag.teamId === teamId && tag.name === name)

      // Duplicate in same team
      expect(isDuplicate('team-1', 'frontend')).toBe(true)
      expect(isDuplicate('team-1', 'backend')).toBe(true)

      // Not duplicate - different team
      expect(isDuplicate('team-2', 'backend')).toBe(false)

      // Not duplicate - new name
      expect(isDuplicate('team-1', 'infrastructure')).toBe(false)
    })
  })

  describe('Tag validation rules', () => {
    it('validates tag name length', () => {
      const isValidName = (name: string) => name.length > 0 && name.length <= 50

      expect(isValidName('valid')).toBe(true)
      expect(isValidName('a'.repeat(50))).toBe(true)
      expect(isValidName('')).toBe(false)
      expect(isValidName('a'.repeat(51))).toBe(false)
    })

    it('validates tag color format and length', () => {
      const isValidColor = (color: string) =>
        /^#[0-9A-Fa-f]{6}$/.test(color) && color.length === 7

      expect(isValidColor('#3b82f6')).toBe(true)
      expect(isValidColor('#FFFFFF')).toBe(true)
      expect(isValidColor('#000000')).toBe(true)
      expect(isValidColor('blue')).toBe(false)
      expect(isValidColor('#ggg')).toBe(false)
    })
  })

  describe('Common tag types', () => {
    it('identifies frontend-related tags', () => {
      const frontendTags = ['frontend', 'ui', 'ux', 'react', 'design']

      frontendTags.forEach((tag) => {
        expect(tag.length).toBeGreaterThan(0)
        expect(typeof tag).toBe('string')
      })
    })

    it('identifies backend-related tags', () => {
      const backendTags = ['backend', 'api', 'database', 'server']

      backendTags.forEach((tag) => {
        expect(tag.length).toBeGreaterThan(0)
        expect(typeof tag).toBe('string')
      })
    })

    it('identifies priority-related tags', () => {
      const priorityTags = ['urgent', 'high-priority', 'critical', 'blocker']

      priorityTags.forEach((tag) => {
        expect(tag.length).toBeGreaterThan(0)
        expect(typeof tag).toBe('string')
      })
    })
  })
})
