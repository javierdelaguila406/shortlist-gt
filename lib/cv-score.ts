export function calculateCVScore(text: string) {
  const normalized = text.toLocaleLowerCase('es');
  const skills = ['typescript', 'react', 'nodejs', 'python', 'sql'];
  const keywordScore = skills.reduce((score, skill) => score + (normalized.includes(skill) ? 10 : 0), 0);
  const experienceMatch = normalized.match(/(\d+)\s+(?:años|año|years|year)/);
  const years = experienceMatch ? Number.parseInt(experienceMatch[1], 10) : 0;
  const experienceScore = Math.min(years * 5, 50);
  return { total: Math.min(keywordScore + experienceScore, 100), keywords: keywordScore, experience: experienceScore };
}
