import { test, expect, describe } from 'bun:test'
import { classifyItem, normalizeItemName } from './classify'
import type { StoreArea } from '../types'

describe('normalizeItemName', () => {
  test('lowercases and trims', () => expect(normalizeItemName('  Apples  ')).toBe('apple'))
  test('strips regular plural s', () => expect(normalizeItemName('carrots')).toBe('carrot'))
  test('-ies → -y', () => expect(normalizeItemName('strawberries')).toBe('strawberry'))
  test('-oes → -o', () => expect(normalizeItemName('tomatoes')).toBe('tomato'))
  test('does not strip ss', () => expect(normalizeItemName('hummus')).toBe('hummu')) // fuzzy saves it
  test('applies synonyms', () => expect(normalizeItemName('pop')).toBe('soda'))
  test('courgette → zucchini', () => expect(normalizeItemName('courgette')).toBe('zucchini'))
})

describe('classifyItem — exact matches', () => {
  const cases: Array<[string, StoreArea]> = [
    ['apple', 'Produce'],
    ['banana', 'Produce'],
    ['spinach', 'Produce'],
    ['broccoli', 'Produce'],
    ['carrot', 'Produce'],
    ['tomato', 'Produce'],
    ['onion', 'Produce'],
    ['garlic', 'Produce'],
    ['lemon', 'Produce'],
    ['avocado', 'Produce'],
    ['milk', 'Dairy'],
    ['eggs', 'Dairy'],
    ['butter', 'Dairy'],
    ['cheese', 'Dairy'],    // fuzzy → cheddar/cream cheese
    ['yogurt', 'Dairy'],
    ['cream cheese', 'Dairy'],
    ['sour cream', 'Dairy'],
    ['heavy cream', 'Dairy'],
    ['parmesan', 'Dairy'],
    ['mozzarella', 'Dairy'],
    ['bread', 'Bakery'],
    ['bagel', 'Bakery'],
    ['tortilla', 'Bakery'],
    ['croissant', 'Bakery'],
    ['sourdough', 'Bakery'],
    ['chicken', 'Meat & Seafood'],
    ['salmon', 'Meat & Seafood'],
    ['beef', 'Meat & Seafood'],
    ['bacon', 'Meat & Seafood'],
    ['shrimp', 'Meat & Seafood'],
    ['ground beef', 'Meat & Seafood'],
    ['turkey', 'Meat & Seafood'],
    ['pork', 'Meat & Seafood'],
    ['ice cream', 'Frozen'],
    ['frozen pizza', 'Frozen'],
    ['chicken nuggets', 'Frozen'],
    ['french fries', 'Frozen'],
    ['olive oil', 'Pantry'],
    ['pasta', 'Pantry'],
    ['rice', 'Pantry'],
    ['flour', 'Pantry'],
    ['sugar', 'Pantry'],
    ['honey', 'Pantry'],
    ['soy sauce', 'Pantry'],
    ['peanut butter', 'Pantry'],
    ['canned tomatoes', 'Pantry'],
    ['chicken broth', 'Pantry'],
    ['coffee', 'Beverages'],
    ['orange juice', 'Beverages'],
    ['water', 'Beverages'],
    ['beer', 'Beverages'],
    ['wine', 'Beverages'],
    ['sparkling water', 'Beverages'],
    ['tea', 'Beverages'],
    ['soda', 'Beverages'],
    ['kombucha', 'Beverages'],
    ['lemonade', 'Beverages'],
    ['chips', 'Snacks'],
    ['hummus', 'Snacks'],
    ['salsa', 'Snacks'],
    ['popcorn', 'Snacks'],
    ['granola bar', 'Snacks'],
    ['chocolate', 'Snacks'],
    ['crackers', 'Snacks'],
    ['pretzels', 'Snacks'],
    ['paper towels', 'Household'],
    ['toilet paper', 'Household'],
    ['dish soap', 'Household'],
    ['trash bags', 'Household'],
    ['laundry detergent', 'Household'],
    ['sponge', 'Household'],
    ['aluminum foil', 'Household'],
    ['ziplock bags', 'Household'],
    ['shampoo', 'Personal Care'],
    ['toothpaste', 'Personal Care'],
    ['deodorant', 'Personal Care'],
    ['ibuprofen', 'Personal Care'],
    ['sunscreen', 'Personal Care'],
    ['razor', 'Personal Care'],
    ['lotion', 'Personal Care'],
  ]

  for (const [input, expected] of cases) {
    test(`"${input}" → ${expected}`, () => {
      expect(classifyItem(input)).toBe(expected)
    })
  }
})

describe('classifyItem — case-insensitive matching', () => {
  test('uppercase dictionary input matches', () => expect(classifyItem('OATMEAL')).toBe('Pantry'))
  test('mixed-case contained dictionary input matches', () =>
    expect(classifyItem('Instant Oatmeal')).toBe('Pantry'))
  test('mixed-case history input matches', () => {
    const history = [{ name: 'Oat Milk', store_area: 'Beverages' as const, last_used: '' }]
    expect(classifyItem('oAt MiLk', history)).toBe('Beverages')
  })
})

describe('classifyItem — plurals and variants', () => {
  test('apples → Produce', () => expect(classifyItem('apples')).toBe('Produce'))
  test('strawberries → Produce', () => expect(classifyItem('strawberries')).toBe('Produce'))
  test('tomatoes → Produce', () => expect(classifyItem('tomatoes')).toBe('Produce'))
  test('potatoes → Produce', () => expect(classifyItem('potatoes')).toBe('Produce'))
  test('blueberries → Produce', () => expect(classifyItem('blueberries')).toBe('Produce'))
  test('chicken breasts → Meat & Seafood', () =>
    expect(classifyItem('chicken breasts')).toBe('Meat & Seafood'))
  test('frozen peas → Frozen', () => expect(classifyItem('frozen peas')).toBe('Frozen'))
  test('batteries → Household', () => expect(classifyItem('batteries')).toBe('Household'))
  test('vitamins → Personal Care', () => expect(classifyItem('vitamins')).toBe('Personal Care'))
})

describe('classifyItem — contained phrase matching', () => {
  test('instant oatmeal → Pantry', () => expect(classifyItem('instant oatmeal')).toBe('Pantry'))
  test('chicken tenders → Meat & Seafood', () =>
    expect(classifyItem('chicken tenders')).toBe('Meat & Seafood'))
  test('ground beef tacos → Meat & Seafood', () =>
    expect(classifyItem('ground beef tacos')).toBe('Meat & Seafood'))
  test('low sodium chicken broth prefers broth over chicken → Pantry', () =>
    expect(classifyItem('low sodium chicken broth')).toBe('Pantry'))
  test('cheese matches a more specific dictionary phrase → Dairy', () =>
    expect(classifyItem('cheese')).toBe('Dairy'))
})

describe('classifyItem — fuzzy matching', () => {
  test('asparagus (stripped to asparagu) → Produce', () =>
    expect(classifyItem('asparagus')).toBe('Produce'))
  test('typo "tomatoe" → Produce', () => expect(classifyItem('tomatoe')).toBe('Produce'))
  test('typo "brocoli" → Produce', () => expect(classifyItem('brocoli')).toBe('Produce'))
  test('typo "buttr" → Dairy', () => expect(classifyItem('buttr')).toBe('Dairy'))
})

describe('classifyItem — synonyms', () => {
  test('pop → Beverages', () => expect(classifyItem('pop')).toBe('Beverages'))
  test('aubergine → Produce', () => expect(classifyItem('aubergine')).toBe('Produce'))
  test('courgette → Produce', () => expect(classifyItem('courgette')).toBe('Produce'))
  test('coriander → Produce', () => expect(classifyItem('coriander')).toBe('Produce'))
})

describe('classifyItem — history takes precedence', () => {
  const history = [
    { name: 'oat milk', store_area: 'Beverages' as const, last_used: '' },
    { name: 'chicken', store_area: 'Frozen' as const, last_used: '' },
  ]

  test('oat milk in history overrides dictionary', () =>
    expect(classifyItem('oat milk', history)).toBe('Beverages'))
  test('exact history match beats contained dictionary match', () =>
    expect(classifyItem('chicken', history)).toBe('Frozen'))
  test('contained history match beats contained dictionary match', () =>
    expect(classifyItem('chicken tenders', history)).toBe('Frozen'))
})

describe('classifyItem — unknown items', () => {
  test('unknown item → Other', () => expect(classifyItem('xyzabc123')).toBe('Other'))
})
