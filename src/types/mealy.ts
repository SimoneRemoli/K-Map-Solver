export type MealyTransition = {
  to: string;
  output: 0 | 1;
};

export type MealyMachine = {
  alphabet: string[];
  states: string[];
  start: string;
  transitions: Record<string, Record<string, MealyTransition>>;
};
