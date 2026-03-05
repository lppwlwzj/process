export type SurveyRating = {
  reception: number
  consultant: number
  photographer: number
  doctor: number
  nurse: number
  waxDesigner: number
}

export const SURVEY_ROLES = [
  { key: 'reception' as const, label: '前台人员' },
  { key: 'consultant' as const, label: '咨询师' },
  { key: 'photographer' as const, label: '拍摄人员' },
  { key: 'doctor' as const, label: '医生' },
  { key: 'nurse' as const, label: '护士' },
  { key: 'waxDesigner' as const, label: '蜡型设计师' }
] as const

export const INITIAL_RATINGS: SurveyRating = {
  reception: 0,
  consultant: 0,
  photographer: 0,
  doctor: 0,
  nurse: 0,
  waxDesigner: 0
}
