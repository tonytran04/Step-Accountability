export type Activity = {
    date: string;
    steps: number;
    goal: number;
  };
  
  export const calculateStreak = (
    recentActivity: Activity[],
    today: Date = new Date(),
  ) => {
    let streak = 0;
  
    const currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);
  
    let expectedDate = new Date(currentDate);
  
    for (const activity of recentActivity) {
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