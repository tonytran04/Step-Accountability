import React, {
    createContext,
    useContext,
    useEffect,
    useState,
  } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
type GoalContextType = {
    goal: number;
    goalLoaded: boolean;
    updateGoal: (goal: number) => Promise<void>;
  };
const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({children}: {children: React.ReactNode}) {
  const [goal, setGoal] = useState(10000);
  const [goalLoaded, setGoalLoaded] = useState(false);

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const savedGoal = await AsyncStorage.getItem('dailyStepGoal');
  
        if (savedGoal !== null && Number.isSafeInteger(Number(savedGoal)) && Number(savedGoal) > 0) {
          setGoal(Number(savedGoal));
        }
      } catch (error) {
        console.error('Error loading goal:', error);
      } finally {
        setGoalLoaded(true);
      }
    };
  
    loadGoal();
  }, []);
  const updateGoal = async (newGoal: number) => {
    try {
      setGoal(newGoal);
      await AsyncStorage.setItem('dailyStepGoal', newGoal.toString());
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  return (
    <GoalContext.Provider value={{goal, goalLoaded, updateGoal}}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoal() {
  const context = useContext(GoalContext);

  if (!context) {
    throw new Error('useGoal must be used inside GoalProvider');
  }

  return context;
}
