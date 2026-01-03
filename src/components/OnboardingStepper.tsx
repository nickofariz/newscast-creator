import { motion } from "framer-motion";
import { Check, Image, Mic, Film, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepId = "media" | "voiceover" | "editor" | "export";

interface Step {
  id: StepId;
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "media",
    number: 1,
    title: "Insert Media",
    description: "Upload video/gambar",
    icon: <Image className="w-4 h-4" />,
  },
  {
    id: "voiceover",
    number: 2,
    title: "Voice Over",
    description: "Teks & suara AI",
    icon: <Mic className="w-4 h-4" />,
  },
  {
    id: "editor",
    number: 3,
    title: "Editor",
    description: "Merge & edit",
    icon: <Film className="w-4 h-4" />,
  },
  {
    id: "export",
    number: 4,
    title: "Export",
    description: "Download & riwayat",
    icon: <Download className="w-4 h-4" />,
  },
];

interface OnboardingStepperProps {
  currentStep: StepId;
  onStepClick: (step: StepId) => void;
  completedSteps: StepId[];
}

const OnboardingStepper = ({
  currentStep,
  onStepClick,
  completedSteps,
}: OnboardingStepperProps) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full mb-8">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isPast = index < currentStepIndex;
          const isClickable = isCompleted || isPast || isCurrent;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                  isCurrent && "bg-primary/10 border border-primary/30",
                  !isCurrent && isClickable && "hover:bg-secondary cursor-pointer",
                  !isClickable && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && !isCompleted && "bg-primary text-primary-foreground",
                    !isCurrent && !isCompleted && "bg-secondary text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{step.description}</p>
                </div>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1",
                    isPast || isCompleted ? "bg-green-500" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isPast = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => onStepClick(step.id)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCurrent && !isCompleted && "bg-secondary text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      isPast || isCompleted ? "bg-green-500" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="font-semibold text-foreground">
            {steps.find((s) => s.id === currentStep)?.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {steps.find((s) => s.id === currentStep)?.description}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingStepper;
