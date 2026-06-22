const microsoftLearn = 'https://learn.microsoft.com';

const sourceBySkill: Record<string, string> = {
  'row-level security': `${microsoftLearn}/power-bi/enterprise/service-admin-rls`,
  'query folding': `${microsoftLearn}/power-query/power-query-folding`,
  'create dax measures': `${microsoftLearn}/dax/dax-overview`,
  'create calculated columns and calculated tables': `${microsoftLearn}/power-bi/transform-model/desktop-calculated-columns`,
  'create and use date tables': `${microsoftLearn}/power-bi/transform-model/desktop-date-tables`,
  'design a star schema': `${microsoftLearn}/power-bi/guidance/star-schema`,
  'get data from data sources': `${microsoftLearn}/power-bi/connect-data/desktop-connect-to-data`,
  'clean, transform, and load data': `${microsoftLearn}/power-query/`,
  'configure and preserve query folding': `${microsoftLearn}/power-query/power-query-folding`,
  'create reports': `${microsoftLearn}/power-bi/create-reports/`,
};

export function studySourcesForSkill(skill: string, suppliedSources: string[] = []) {
  if (suppliedSources.length) return suppliedSources;
  const normalizedSkill = skill.trim().toLowerCase();
  const direct = sourceBySkill[normalizedSkill];
  if (direct) return [direct];
  return [`${microsoftLearn}/training/browse/?products=power-bi`];
}

export function sourceLabel(url: string) {
  if (url.includes('/power-query/')) return 'Microsoft Learn · Power Query';
  if (url.includes('/dax/')) return 'Microsoft Learn · DAX';
  if (url.includes('/guidance/')) return 'Microsoft Learn · Power BI guidance';
  if (url.includes('/training/')) return 'Microsoft Learn · Power BI training';
  return 'Microsoft Learn · Power BI documentation';
}
