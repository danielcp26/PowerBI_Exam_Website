const microsoftLearn = 'https://learn.microsoft.com';
const pl300StudyGuide = `${microsoftLearn}/en-us/credentials/certifications/resources/study-guides/pl-300#skills-measured-as-of-april-20-2026`;

export interface StudyGuideReference {
  guidePath: string;
  concept: string;
  correction: string;
  keywords: string[];
  sources: string[];
}

const fallbackReference: StudyGuideReference = {
  guidePath: 'PL-300 study guide > Skills measured > Power BI Data Analyst objectives',
  concept: 'Review the Microsoft PL-300 skills measured objective that matches this question.',
  correction: 'Compare the question wording with the official objective bullets, then practice the related Microsoft Learn module.',
  keywords: ['PL-300', 'Power BI', 'Microsoft Learn'],
  sources: [`${microsoftLearn}/training/browse/?products=power-bi`, pl300StudyGuide],
};

const references: Array<{ match: string[]; reference: StudyGuideReference }> = [
  {
    match: ['scheduled refresh', 'gateway cluster', 'gateways', 'gateway', 'refresh schedule'],
    reference: {
      guidePath: 'PL-300 study guide > Manage and secure Power BI > Create and manage workspaces and assets > Configure a semantic model scheduled refresh',
      concept: 'Scheduled refresh keeps imported semantic models current, and on-premises sources usually need a configured gateway connection.',
      correction: 'Check whether the data source needs a gateway, whether the model should use a gateway cluster for high availability, and where refresh is configured in semantic model settings.',
      keywords: ['Scheduled refresh', 'Semantic model', 'On-premises data gateway', 'Gateway cluster'],
      sources: [
        `${microsoftLearn}/en-us/power-bi/connect-data/refresh-scheduled-refresh`,
        `${microsoftLearn}/en-us/power-bi/connect-data/service-gateway-data-sources`,
        pl300StudyGuide,
      ],
    },
  },
  {
    match: ['workspace role', 'workspace roles', 'member role', 'contributor', 'viewer', 'admin role', 'manage workspaces and apps'],
    reference: {
      guidePath: 'PL-300 study guide > Manage and secure Power BI > Secure and govern Power BI items > Assign workspace roles',
      concept: 'Workspace roles control what people can view, edit, share, publish, and manage inside a Power BI workspace.',
      correction: 'Choose the least-privileged role that still allows the required action: Viewer for read-only, Contributor for editing content, Member for sharing/publishing app content, and Admin for full management.',
      keywords: ['Workspace roles', 'Admin', 'Member', 'Contributor', 'Viewer'],
      sources: [
        `${microsoftLearn}/en-us/power-bi/collaborate-share/service-roles-new-workspaces`,
        `${microsoftLearn}/en-us/power-bi/collaborate-share/service-give-access-new-workspaces`,
        pl300StudyGuide,
      ],
    },
  },
  {
    match: ['power bi app', 'publish app', 'configure app', 'update app', 'app access', 'audience'],
    reference: {
      guidePath: 'PL-300 study guide > Manage and secure Power BI > Create and manage workspaces and assets > Configure and update an app',
      concept: 'Power BI apps package workspace content for distribution and can have app permissions that differ from workspace permissions.',
      correction: 'Separate workspace collaboration from app distribution, then decide who should edit content versus who should consume the published app.',
      keywords: ['Power BI apps', 'App permissions', 'Workspace app', 'Audience'],
      sources: [
        `${microsoftLearn}/en-us/power-bi/collaborate-share/service-create-distribute-apps`,
        `${microsoftLearn}/en-us/power-bi/explore-reports/end-user-apps`,
        pl300StudyGuide,
      ],
    },
  },
  {
    match: ['query folding', 'folding'],
    reference: {
      guidePath: 'PL-300 study guide > Prepare the data > Transform and load the data',
      concept: 'Query folding pushes Power Query transformation work back to the source system when the source can execute it.',
      correction: 'Check which applied step breaks folding, and prefer source-supported transformations before expensive local steps.',
      keywords: ['Query folding', 'Power Query', 'Applied steps', 'Native query'],
      sources: [`${microsoftLearn}/power-query/power-query-folding`, pl300StudyGuide],
    },
  },
  {
    match: ['row-level security', 'rls', 'security'],
    reference: {
      guidePath: 'PL-300 study guide > Manage and secure Power BI > Manage workspaces and semantic models',
      concept: 'Row-level security filters model rows based on roles, rules, and user identity.',
      correction: 'Separate workspace permissions from data permissions, then validate each role with the intended user context.',
      keywords: ['RLS', 'Roles', 'DAX filters', 'Test as role'],
      sources: [`${microsoftLearn}/power-bi/enterprise/service-admin-rls`, pl300StudyGuide],
    },
  },
  {
    match: ['dax measure', 'measures', 'filter context', 'calculate'],
    reference: {
      guidePath: 'PL-300 study guide > Model the data > Create model calculations by using DAX',
      concept: 'Measures calculate at query time and depend on filter context from visuals, slicers, and relationships.',
      correction: 'Identify the filter context first, then choose the DAX expression that changes or preserves that context correctly.',
      keywords: ['DAX', 'Measures', 'CALCULATE', 'Filter context'],
      sources: [`${microsoftLearn}/dax/calculate-function-dax`, `${microsoftLearn}/dax/dax-overview`, pl300StudyGuide],
    },
  },
  {
    match: ['calculated columns', 'calculated column', 'calculated tables'],
    reference: {
      guidePath: 'PL-300 study guide > Model the data > Create model calculations by using DAX',
      concept: 'Calculated columns are evaluated row by row during refresh, while measures are evaluated dynamically in reports.',
      correction: 'Use calculated columns for row-level attributes and measures for aggregations that must react to report filters.',
      keywords: ['Calculated columns', 'Calculated tables', 'Row context', 'Measures'],
      sources: [`${microsoftLearn}/power-bi/transform-model/desktop-calculated-columns`, pl300StudyGuide],
    },
  },
  {
    match: ['date table', 'date tables', 'time intelligence'],
    reference: {
      guidePath: 'PL-300 study guide > Model the data > Design and implement a semantic model',
      concept: 'A proper date table supports reliable time intelligence and date-based relationships.',
      correction: 'Use a complete marked date table with unique dates, then relate it to fact tables instead of relying on scattered date fields.',
      keywords: ['Date table', 'Mark as date table', 'Time intelligence', 'Relationships'],
      sources: [`${microsoftLearn}/power-bi/transform-model/desktop-date-tables`, pl300StudyGuide],
    },
  },
  {
    match: ['star schema', 'relationships', 'semantic model', 'model the data'],
    reference: {
      guidePath: 'PL-300 study guide > Model the data > Design and implement a semantic model',
      concept: 'A star schema separates fact tables from dimension tables so filters flow predictably.',
      correction: 'Look for facts, dimensions, cardinality, and filter direction before choosing the model design answer.',
      keywords: ['Star schema', 'Fact table', 'Dimension table', 'Cardinality'],
      sources: [`${microsoftLearn}/power-bi/guidance/star-schema`, pl300StudyGuide],
    },
  },
  {
    match: ['get data', 'data sources', 'connect to data'],
    reference: {
      guidePath: 'PL-300 study guide > Prepare the data > Get data from data sources',
      concept: 'Power BI data connection decisions affect refresh, credentials, gateways, DirectQuery, and import behavior.',
      correction: 'Match the source, connection mode, gateway need, and refresh requirement before selecting the answer.',
      keywords: ['Get data', 'Import', 'DirectQuery', 'Gateway'],
      sources: [`${microsoftLearn}/power-bi/connect-data/desktop-connect-to-data`, pl300StudyGuide],
    },
  },
  {
    match: ['clean', 'transform', 'load data', 'power query'],
    reference: {
      guidePath: 'PL-300 study guide > Prepare the data > Profile, clean, transform, and load the data',
      concept: 'Power Query shapes data before it enters the semantic model, including profiling, cleaning, combining, and loading.',
      correction: 'Decide whether the work belongs in Power Query before load, in the model after load, or in the report layer.',
      keywords: ['Power Query', 'Data profiling', 'Transform data', 'Load settings'],
      sources: [`${microsoftLearn}/power-query/`, pl300StudyGuide],
    },
  },
  {
    match: ['create reports', 'visualize', 'analyze', 'visual'],
    reference: {
      guidePath: 'PL-300 study guide > Visualize and analyze the data > Create reports',
      concept: 'Report design choices should support the required insight, interaction, accessibility, and audience.',
      correction: 'Tie each visual, filter, drill action, or analytic feature back to the business question being asked.',
      keywords: ['Reports', 'Visuals', 'Interactions', 'Analytics pane'],
      sources: [`${microsoftLearn}/power-bi/create-reports/`, pl300StudyGuide],
    },
  },
];

function referenceForText(text: string) {
  const normalized = text.toLowerCase();
  return references.find(({ match }) => match.some((term) => normalized.includes(term)))?.reference || fallbackReference;
}

export function studyGuideForQuestion(skill: string, prompt = '', explanation = '') {
  return referenceForText(`${skill} ${prompt} ${explanation}`);
}

export function topicConcept(skill: string, prompt = '', explanation = '') {
  return studyGuideForQuestion(skill, prompt, explanation);
}

export function studySourcesForSkill(skill: string, suppliedSources: string[] = []) {
  if (suppliedSources.length) return suppliedSources;
  return studyGuideForQuestion(skill).sources;
}

export function sourceLabel(url: string) {
  if (url.includes('/credentials/certifications/resources/study-guides/pl-300')) return 'Microsoft Learn · PL-300 study guide';
  if (url.includes('/power-query/')) return 'Microsoft Learn · Power Query';
  if (url.includes('/dax/')) return 'Microsoft Learn · DAX';
  if (url.includes('/guidance/')) return 'Microsoft Learn · Power BI guidance';
  if (url.includes('/training/')) return 'Microsoft Learn · Power BI training';
  return 'Microsoft Learn · Power BI documentation';
}
