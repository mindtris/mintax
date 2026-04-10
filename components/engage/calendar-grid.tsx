"use client"

import { Card, CardContent } from "@/components/ui/card"
import { NewPostSheet } from "./new-post-sheet"
import { eachDayOfInterval, format, isSameDay, startOfMonth } from "date-fns"
import Link from "next/link"
import { useState } from "react"

type CalendarPost = {
  id: string
  content: string
  publishedAt: string | null
  scheduledAt: string | null
}

export function CalendarGrid({
  posts,
  monthStart,
  monthEnd,
}: {
  posts: CalendarPost[]
  monthStart: string
  monthEnd: string
}) {
  const start = new Date(monthStart)
  const end = new Date(monthEnd)
  const now = new Date()
  const days = eachDayOfInterval({ start, end })
  const offset = startOfMonth(start).getDay()

  const getPostsForDay = (day: Date) =>
    posts.filter((p) => {
      const date = p.publishedAt || p.scheduledAt
      return date && isSameDay(new Date(date), day)
    })

  return (
    <Card className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden">
      <CardContent className="pt-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-xs font-medium text-[#141413] text-center py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px]" />
          ))}

          {days.map((day) => {
            const dayPosts = getPostsForDay(day)
            const isToday = isSameDay(day, now)

            return (
              <DayCell key={day.toISOString()} day={day} isToday={isToday} posts={dayPosts} />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function DayCell({ day, isToday, posts }: { day: Date; isToday: boolean; posts: CalendarPost[] }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setSheetOpen(true)}
        className={`min-h-[80px] border rounded-lg p-1 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors cursor-pointer ${
          isToday ? "border-primary bg-primary/5" : "border-black/[0.05]"
        }`}
      >
        <div className={`text-xs mb-1 ${isToday ? "font-bold text-primary" : "text-[#141413]"}`}>
          {format(day, "d")}
        </div>
        <div className="space-y-0.5">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/engage/posts/${post.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] leading-tight truncate rounded px-1 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {post.content.slice(0, 20)}
              </div>
            </Link>
          ))}
          {posts.length > 3 && (
            <div className="text-[10px] text-[#141413] px-1">+{posts.length - 3} more</div>
          )}
        </div>
      </div>

      <NewPostSheet open={sheetOpen} onOpenChange={setSheetOpen} defaultDate={format(day, "yyyy-MM-dd")} />
    </>
  )
}
