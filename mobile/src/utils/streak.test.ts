import {calculateStreak, withCurrentGoal} from './streak';

describe('calculateStreak', () => {
    test('uses a changed goal for saved days and the streak', () => {
      const saved = [
        {date: '2026-09-22', steps: 1890, goal: 10000},
        {date: '2026-09-21', steps: 6236, goal: 10000},
      ];
      const evaluated = withCurrentGoal(saved, 1000);

      expect(evaluated.map(day => day.steps >= day.goal)).toEqual([true, true]);
      expect(calculateStreak(evaluated, new Date('2026-09-22T12:00:00'))).toBe(2);
      expect(saved[0].goal).toBe(10000);
    });
    test('stops the streak when a previous day misses the goal', () => {
        const activities = [
          {date: '2026-09-14', steps: 1248, goal: 10000},
          {date: '2026-09-13', steps: 10300, goal: 10000},
          {date: '2026-09-12', steps: 8000, goal: 10000},
          {date: '2026-09-11', steps: 10500, goal: 10000},
        ];
      
        const today = new Date('2026-09-14T12:00:00');
      
        const result = calculateStreak(activities, today);
      
        expect(result).toBe(1);
      });
    test('stops the streak when a calendar day is missing', () => {
        const activities = [
          {date: '2026-09-14', steps: 1248, goal: 10000},
          {date: '2026-09-13', steps: 10300, goal: 10000},
      
          // September 12 is missing
      
          {date: '2026-09-11', steps: 10500, goal: 10000},
        ];
      
        const today = new Date('2026-09-14T12:00:00');
      
        const result = calculateStreak(activities, today);
      
        expect(result).toBe(1);
      });
  test('counts previous completed days when today is incomplete', () => {
    const activities = [
      {date: '2026-09-14', steps: 1248, goal: 10000},
      {date: '2026-09-13', steps: 10300, goal: 10000},
      {date: '2026-09-12', steps: 11200, goal: 10000},
      {date: '2026-09-11', steps: 10500, goal: 10000},
    ];

    const today = new Date('2026-09-14T12:00:00');

    const result = calculateStreak(activities, today);

    expect(result).toBe(3);
  });
  test('counts streak when there is no record for today', () => {
    const activities = [
      {date: '2026-09-13', steps: 10300, goal: 10000},
      {date: '2026-09-12', steps: 11200, goal: 10000},
      {date: '2026-09-11', steps: 10500, goal: 10000},
    ];
  
    const today = new Date('2026-09-14T12:00:00');
  
    const result = calculateStreak(activities, today);
  
    expect(result).toBe(3);
  });
  test('calculates streak correctly when activities are unsorted', () => {
    const activities = [
      {date: '2026-09-12', steps: 11200, goal: 10000},
      {date: '2026-09-14', steps: 1248, goal: 10000},
      {date: '2026-09-11', steps: 10500, goal: 10000},
      {date: '2026-09-13', steps: 10300, goal: 10000},
    ];
  
    const today = new Date('2026-09-14T12:00:00');
  
    const result = calculateStreak(activities, today);
  
    expect(result).toBe(3);
  });
  test('counts today when today has completed the goal', () => {
    const activities = [
      {date: '2026-09-14', steps: 11000, goal: 10000},
      {date: '2026-09-13', steps: 10300, goal: 10000},
      {date: '2026-09-12', steps: 11200, goal: 10000},
      {date: '2026-09-11', steps: 10500, goal: 10000},
    ];
  
    const today = new Date('2026-09-14T12:00:00');
  
    const result = calculateStreak(activities, today);
  
    expect(result).toBe(4);
  });
});
