// ===== EDIT ME: all portfolio content lives here =====
export const LINKEDIN = 'https://www.linkedin.com/in/ashutoshraj7061';
export const GITHUB = 'https://github.com/your-username'; // replace
export const EMAIL = 'your.email@example.com'; // replace
export const PHONE = '+91 00000 00000'; // replace

export const RACKS = ['/identity', '/stack', '/projects', '/projects?page=2'];

const project = (n, stack) => ({
  name: `[Project ${n}]`,
  summary: '[One sentence: what it does and who uses it]',
  stack,
  problem: '[What was slow, broken or missing]',
  built: '[APIs, jobs, schema, infra]',
  result: '[e.g. latency down 60%]',
  source: GITHUB,
});

// rack index matches RACKS above. Each rack holds up to 4 servers.
export const SECTIONS = [
  { id: 'about', rack: 0, data: { name: 'Ashutosh Raj', role: 'Backend developer', location: 'Patna, Bihar, India', summary: 'I build backend systems that stay fast and readable as they grow.', experience_years: '[X]', open_to: ['full-time', 'freelance'] } },
  { id: 'experience', rack: 0, data: { roles: [
    { title: '[Title]', company: '[Company A]', period: '[Mon YYYY] - present', highlights: ['[What you built, with a number]'] },
    { title: '[Title]', company: '[Company B]', period: '[Mon YYYY] - [Mon YYYY]', highlights: ['[What you built, with a number]'] },
  ] } },
  { id: 'education', rack: 0, data: { degree: '[B.Tech / B.Sc, branch]', college: '[College name]', years: '[YYYY - YYYY]', certifications: ['[Optional]'] } },
  { id: 'contact', rack: 0, data: { email: EMAIL, phone: PHONE, linkedin: LINKEDIN, github: GITHUB, reply_time: '1-2 days' } },
  { id: 'apis', rack: 1, data: { protocols: ['REST', 'gRPC'], practices: ['versioning', 'validation', 'pagination', 'OpenAPI docs'], auth: ['JWT', 'OAuth2', 'RBAC'] } },
  { id: 'databases', rack: 1, data: { relational: ['PostgreSQL', 'MySQL'], nosql: ['MongoDB'], cache: ['Redis'], skills: ['schema design', 'indexing', 'query tuning', 'migrations'] } },
  { id: 'infra', rack: 1, data: { containers: ['Docker'], cloud: ['AWS'], messaging: ['Kafka', 'RabbitMQ'], delivery: ['CI/CD', 'monitoring'] } },
  { id: 'github', rack: 1, data: { profile: GITHUB, note: 'Code, side projects and contributions.' } },
  { id: 'project-1', rack: 2, data: project(1, ['[Node.js]', '[PostgreSQL]', '[Docker]']) },
  { id: 'project-2', rack: 2, data: project(2, ['[Python]', '[Redis]', '[AWS]']) },
  { id: 'project-3', rack: 2, data: project(3, ['[Go]', '[Kafka]', '[gRPC]']) },
  { id: 'project-4', rack: 2, data: project(4, ['[Java]', '[Spring Boot]', '[MySQL]']) },
  { id: 'project-5', rack: 3, data: project(5, ['[FastAPI]', '[MongoDB]', '[Celery]']) },
  { id: 'project-6', rack: 3, data: project(6, ['[Node.js]', '[GraphQL]', '[Kubernetes]']) },
  { id: 'status', rack: 3, data: { status: 'healthy', uptime: '[X] years in production', open_to_work: true, focus: ['distributed systems', 'API design', 'performance'] } },
];