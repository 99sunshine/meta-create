'use client'

/**
 * La:satellite-dish icon from Figma (node 216:202 / Bottom Nav Messages).
 * SVG path sourced directly from Figma MCP export.
 */
export function IconSatelliteDish({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      // width="22"
      // height="22"
      viewBox="0 0 16.1449 16.1449"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.58241 0V1.375C12.0089 1.375 14.7699 4.136 14.7699 7.5625H16.1449C16.1449 3.39419 12.75 0 8.58241 0ZM8.58241 2.75V4.125C10.4888 4.125 12.0199 5.65606 12.0199 7.5625H13.3949C13.3949 4.91219 11.2327 2.75 8.58241 2.75ZM2.67403 2.81463L2.20172 3.28694C-0.733906 6.22256 -0.733906 11.0076 2.20172 13.9432C5.13734 16.8788 9.92234 16.8788 12.858 13.9432L13.3303 13.4709L12.858 12.9766L9.07672 9.19531C9.78003 8.98013 10.3012 8.33869 10.3012 7.5625C10.3012 6.61444 9.53047 5.84375 8.58241 5.84375C7.80622 5.84375 7.16409 6.36488 6.94959 7.06819L3.16834 3.28694L2.67403 2.81463ZM2.78197 4.85581L11.2891 13.3629C8.86978 15.2831 5.40822 15.2164 3.16834 12.9766C0.928469 10.7367 0.861782 7.27513 2.78128 4.85513L2.78197 4.85581Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * List-bullets icon — ph:list-bullets (Phosphor Icons, from Iconify).
 * Used for List view mode toggle in Explore top bar.
 */
export function IconListBullet({ active, className }: { active: boolean; className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M80 64a8 8 0 0 1 8-8h128a8 8 0 0 1 0 16H88a8 8 0 0 1-8-8m136 56H88a8 8 0 0 0 0 16h128a8 8 0 0 0 0-16m0 64H88a8 8 0 0 0 0 16h128a8 8 0 0 0 0-16M44 52a12 12 0 1 0 12 12a12 12 0 0 0-12-12m0 64a12 12 0 1 0 12 12a12 12 0 0 0-12-12m0 64a12 12 0 1 0 12 12a12 12 0 0 0-12-12"
        fill={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'}
      />
    </svg>
  )
}

/**
 * arcticons:swipefy icon — Arcticons icon set (from Iconify).
 * Used for Swipe view mode toggle in Explore top bar.
 * Two-path design: overlapping card + secondary card.
 */
export function IconSwipeStack({ active, className }: { active: boolean; className?: string }) {
  const color = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.34 8.214l15.762-2.676a2.665 2.665 0 0 1 3.075 2.18q0 0 0 0l4.196 24.737a2.665 2.665 0 0 1-2.179 3.075q0 0 0 0l-15.761 2.675a2.665 2.665 0 0 1-3.064-2.18L6.16 11.29a2.665 2.665 0 0 1 2.18-3.075z"
      />
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m27.533 9.972l9.752 2.428q5.901 1.155 4.219 6.127l-5.179 20.65q-1.132 4.38-5.815 2.987L19.7 39.618q-1.941-.43-3.894-1.736"
      />
    </svg>
  )
}

export function IconCreator({ active, className }: { active: boolean; className?: string }) {
  const color = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M128 132a52 52 0 1 0-52-52a52.06 52.06 0 0 0 52 52m0-88a36 36 0 1 1-36 36a36 36 0 0 1 36-36m0 104c-42.08 0-80 20.15-80 52a8 8 0 0 0 16 0c0-21.66 29.91-36 64-36s64 14.34 64 36a8 8 0 0 0 16 0c0-31.85-37.92-52-80-52"
        fill={color}
      />
    </svg>
  )
}

export function IconTeam({ active, className }: { active: boolean; className?: string }) {
  const color = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M84 116a32 32 0 1 0-32-32a32 32 0 0 0 32 32m88 0a32 32 0 1 0-32-32a32 32 0 0 0 32 32M40 196a44 44 0 0 1 88 0a8 8 0 0 0 16 0a59.71 59.71 0 0 0-19.5-44.17A47.89 47.89 0 0 1 172 132a48 48 0 0 1 48 48a8 8 0 0 0 16 0a64 64 0 0 0-108.13-46.16A59.72 59.72 0 0 0 24 196a8 8 0 0 0 16 0"
        fill={color}
      />
    </svg>
  )
}

export function IconWork({ active, className }: { active: boolean; className?: string }) {
  const color = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M224 72h-56V48a24 24 0 0 0-24-24h-32a24 24 0 0 0-24 24v24H32A16 16 0 0 0 16 88v104a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16V88a16 16 0 0 0-16-16m-120-24a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v24h-48Zm120 144H32V120h192zm0-88H32V88h192z"
        fill={color}
      />
    </svg>
  )
}
