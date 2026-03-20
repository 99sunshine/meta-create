export function AuthBackground() {
  return (
    <>
      {/* Decorative radial gradient background - centered and responsive */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-60">
        <div 
          className="w-full max-w-2xl aspect-square rounded-full blur-xl"
          style={{
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(193, 126, 69, 0.65) 0%, rgba(105.50, 76.50, 65.50, 0.82) 50%, #3E3440 70%, rgba(39.87, 39.37, 62.87, 0.96) 84%, #121B3E 100%)',
          }}
        />
      </div>
    </>
  )
}
