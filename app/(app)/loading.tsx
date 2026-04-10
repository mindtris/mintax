import Image from "next/image"

export default function Loading() {
  return (
    <div className="w-full flex justify-center p-12">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary animate-pulse">
        <Image
          src="/logo/logo.svg"
          alt="Loading..."
          width={28}
          height={28}
          className="brightness-0 invert"
        />
      </div>
    </div>
  )
}
