export type Activity = {
    date: string;
    steps: number;
    goal: number;
  };

  // A changed goal applies to the displayed history and streak immediately.
  export const withCurrentGoal = (activities: Activity[], goal: number): Activity[] =>
    activities.map(activity => ({...activity, goal}));
  
  export const calculateStreak = (
    recentActivity: Activity[],
    today: Date = new Date(),
  ) => {
    let streak = 0;

    const sortedActivity = [...recentActivity].sort(
        (a, b) => b.date.localeCompare(a.date),
      );
  
    const currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);
  
    let expectedDate = new Date(currentDate);

const hasToday = sortedActivity.some(activity => {
  const activityDate = new Date(`${activity.date}T12:00:00`);
  activityDate.setHours(0, 0, 0, 0);

  return activityDate.getTime() === currentDate.getTime();
});

if (!hasToday) {
  expectedDate.setDate(expectedDate.getDate() - 1);
}

for (const activity of sortedActivity) {
      const activityDate = new Date(`${activity.date}T12:00:00`);
      activityDate.setHours(0, 0, 0, 0);
  
      // Today is still in progress, so don't let
      // an incomplete today break the streak
      if (
        activityDate.getTime() === currentDate.getTime() &&
        activity.steps < activity.goal
      ) {
        expectedDate.setDate(expectedDate.getDate() - 1);
        continue;
      }
  
      // A missing calendar day ends the streak
      if (activityDate.getTime() !== expectedDate.getTime()) {
        break;
      }
  
      // A completed goal continues the streak
      if (activity.steps >= activity.goal) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
  
    return streak;
  };
