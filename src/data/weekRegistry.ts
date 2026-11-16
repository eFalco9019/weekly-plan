import type { FoodEquivalent, MealTemplate, MealType } from '../types'
import { week1Templates, week1Colazione, week1Pranzo, week1Cena, week1Spuntino } from './week1'
import { week2Templates, week2Colazione, week2Pranzo, week2Cena, week2Spuntino } from './week2'
import { week3Templates, week3Colazione, week3Pranzo, week3Cena, week3Spuntino } from './week3'
import { week4Templates, week4Colazione, week4Pranzo, week4Cena, week4Spuntino } from './week4'

export interface WeekData {
  templates: MealTemplate[]
  colazione: Record<string, FoodEquivalent[]>
  pranzo: Record<string, FoodEquivalent[]>
  cena: Record<string, FoodEquivalent[]>
  spuntino: Record<string, FoodEquivalent[]>
}

export const weeks: Record<number, WeekData> = {
  1: { templates: week1Templates, colazione: week1Colazione, pranzo: week1Pranzo, cena: week1Cena, spuntino: week1Spuntino },
  2: { templates: week2Templates, colazione: week2Colazione, pranzo: week2Pranzo, cena: week2Cena, spuntino: week2Spuntino },
  3: { templates: week3Templates, colazione: week3Colazione, pranzo: week3Pranzo, cena: week3Cena, spuntino: week3Spuntino },
  4: { templates: week4Templates, colazione: week4Colazione, pranzo: week4Pranzo, cena: week4Cena, spuntino: week4Spuntino },
}

export function mealEquivalentsForWeek(week: number, meal: MealType): Record<string, FoodEquivalent[]> {
  const data = weeks[week] ?? weeks[1]
  return data[meal]
}

export function templatesForWeek(week: number): MealTemplate[] {
  return (weeks[week] ?? weeks[1]).templates
}
