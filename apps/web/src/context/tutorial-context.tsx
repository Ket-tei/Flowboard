import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { TUTORIAL_STEPS } from "@/components/tutorial/tutorial-steps";

const STORAGE_KEY = "flowboard_tutorial_done";

type TutorialContextValue = {
  active: boolean;
  stepIndex: number;
  totalSteps: number;
  startTutorial: () => void;
  nextStep: () => void;
  skipTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const startTutorial = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const skipTutorial = useCallback(() => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((prev) => {
      const next = prev + 1;
      if (next >= TUTORIAL_STEPS.length) {
        setActive(false);
        localStorage.setItem(STORAGE_KEY, "1");
        return prev;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (user && !localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => startTutorial(), 600);
      return () => clearTimeout(timer);
    }
  }, [user, startTutorial]);

  const value = useMemo(
    () => ({ active, stepIndex, totalSteps: TUTORIAL_STEPS.length, startTutorial, nextStep, skipTutorial }),
    [active, stepIndex, startTutorial, nextStep, skipTutorial]
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}
