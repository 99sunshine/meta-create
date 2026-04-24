interface OnboardingProgressProps {
  currentStep: 1 | 2 | 3
  totalSteps?: number
}

export function OnboardingProgress({ currentStep, totalSteps = 3 }: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 w-full max-w-[305px] mx-auto">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1
        const isCompleted = step < currentStep
        const isActive = step === currentStep
        const isInactive = step > currentStep

        return (
          <div
            key={step}
            className="flex-1 h-[5px] rounded-full transition-all duration-300"
            style={{
              background: isCompleted
                ? '#70D22E'
                : isActive
                ? '#E7770F'
                : 'linear-gradient(0deg, rgba(243.75, 139.84, 35.92, 0.50) 0%, rgba(243.75, 139.84, 35.92, 0.50) 100%), rgba(0, 0, 0, 0.30)',
              boxShadow: isActive ? '0px 0px 5.3px #E7770F' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
