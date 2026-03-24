export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'teacher';
  content: string;
  timestamp: number;
  image?: string;
}

export interface Stats {
  total: number;
  correct: number;
  needsPractice: number;
  strong: string[];
  weak: string[];
  recommended: string[];
}
