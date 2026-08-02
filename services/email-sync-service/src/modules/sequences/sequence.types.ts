export type SequenceStep = {
  stepNumber: number;
  type: 'email' | 'task' | 'wait';
  delayDays?: number;
  templateId?: string;
};
