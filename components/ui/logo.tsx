import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 32 }: LogoProps) {
  const width = (60 / 32) * size
  
  return (
    <svg 
      width={width} 
      height={size} 
      viewBox="0 0 60 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      <g clipPath="url(#clip0_4002_249)">
        <path fillRule="evenodd" clipRule="evenodd" d="M48.3457 0.350734C50.9943 1.38463 52.3187 4.4078 51.2907 7.07171L42.9082 28.6863C41.8802 31.3504 38.8743 32.6836 36.2454 31.6496C33.5956 30.6145 32.2712 27.5925 33.2992 24.9274L41.6618 3.29407C42.6912 0.648793 45.6957 -0.683161 48.3457 0.350734Z" fill="url(#paint0_linear_4002_249)"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M15.2661 0.350734C17.8941 1.38463 19.2074 4.4078 18.1682 7.07171L9.875 28.6863C8.85556 31.3504 5.87467 32.6836 3.24802 31.6496C0.639721 30.6145 -0.673608 27.5925 0.345829 24.9274L8.64039 3.29407C9.65984 0.648793 12.6394 -0.683161 15.2661 0.350734Z" fill="currentColor"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M31.8237 0.350734C34.4517 1.38463 35.765 4.4078 34.7258 7.07171L26.4327 28.6863C25.4132 31.3504 22.4322 32.6836 19.8056 31.6496C17.1973 30.6145 15.884 27.5925 16.9035 24.9274L25.1979 3.29407C26.2174 0.648793 29.1969 -0.683161 31.8237 0.350734Z" fill="currentColor"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M15.2957 0.350734C12.664 -0.683162 9.67861 0.648794 8.65718 3.29407L0.346501 24.9274C-0.674917 27.5925 0.640963 30.6145 3.25433 31.6496C5.88608 32.6836 8.87277 31.3504 9.8942 28.6863L18.2036 7.07171C19.2448 4.4078 17.9289 1.38463 15.2957 0.350734ZM44.7039 0.350734C42.0721 1.38463 40.7562 4.4078 41.7777 7.07171L50.087 28.6863C51.1282 31.3504 54.1136 32.6836 56.7269 31.6496C59.3587 30.6145 60.6746 27.5925 59.6544 24.9274L51.3241 3.29407C50.3026 0.648794 47.3172 -0.683162 44.7039 0.350734ZM31.8961 0.350734C34.5082 1.38463 35.8239 4.4078 34.8039 7.07171L26.4933 28.6863C25.4718 31.3504 22.4864 32.6836 19.8533 31.6496C17.2216 30.6145 15.9057 27.5925 16.927 24.9274L25.2562 3.29407C26.2775 0.648794 29.2629 -0.683162 31.8961 0.350734Z" fill="currentColor"/>
      </g>
      <defs>
        <linearGradient id="paint0_linear_4002_249" x1="42.2949" y1="0" x2="42.2949" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor"/>
          <stop offset="1" stopColor="currentColor" stopOpacity="0.32"/>
        </linearGradient>
        <clipPath id="clip0_4002_249">
          <rect width="60" height="32" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  )
}
