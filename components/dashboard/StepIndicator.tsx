export function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="mb-8 w-full">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                index < currentStep
                  ? "bg-secondary text-primary"
                  : index === currentStep
                    ? "bg-primary text-white"
                    : "border-2 border-primary bg-white text-black"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  index < currentStep ? "bg-secondary" : "bg-primary opacity-30"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex">
        {steps.map((label, index) => (
          <span
            key={label}
            className={`flex-1 text-center text-xs ${
              index === currentStep ? "font-semibold text-primary" : "text-primary-mid"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
