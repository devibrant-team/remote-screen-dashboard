import React, { createContext, useContext, useState, type Dispatch, type SetStateAction } from "react";

type StepCtx = {
  stepMinutes: number;
  // ⬇️ allow both numbers and functional updaters
  setStepMinutes: Dispatch<SetStateAction<number>>;
  customStep: string;
  setCustomStep: Dispatch<SetStateAction<string>>;
};

const StepContext = createContext<StepCtx | null>(null);

export const StepProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [stepMinutes, setStepMinutes] = useState<number>(10);
  const [customStep, setCustomStep] = useState<string>("");

  return (
    <StepContext.Provider value={{ stepMinutes, setStepMinutes, customStep, setCustomStep }}>
      {children}
    </StepContext.Provider>
  );
};

export const useStep = () => {
  const ctx = useContext(StepContext);
  if (!ctx) throw new Error("useStep must be used within a StepProvider");
  return ctx;
};
