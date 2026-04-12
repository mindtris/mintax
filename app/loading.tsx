import Image from "next/image"

export default function AppLoading() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-primary">
      <div className="flex items-center justify-center animate-pulse">
        <Image
          src="/logo/logo.svg"
          alt="Loading..."
          width={64}
          height={64}
          className="brightness-0 invert"
        />
      </div>
    </div>
  )
}
