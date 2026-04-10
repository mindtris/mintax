import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getActiveOrg, getCurrentUser } from "@/lib/core/auth"
import { getContentTemplates } from "@/lib/services/content-templates"
import { Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export async function ContentView() {
  const user = await getCurrentUser()
  const org = await getActiveOrg(user)
  const templates = await getContentTemplates(org.id)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground font-display">Content</h1>
          <div className="bg-secondary text-xl px-2.5 py-0.5 rounded-md font-bold text-muted-foreground/70 tabular-nums border-black/[0.03] border shadow-sm">
            {templates.length}
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          <span className="hidden md:block">New template</span>
        </Button>
      </header>

      {templates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="border border-black/[0.03] shadow-sm shadow-black/[0.02] bg-[#f5f4ef] text-[#141413] rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="font-semibold mb-1">{template.name}</div>
                {template.category && (
                  <Badge variant="outline" className="text-[10px] font-medium mb-2">{template.category}</Badge>
                )}
                <p className="text-sm text-[#141413] line-clamp-3">{template.content}</p>
                {template.platforms.length > 0 && (
                  <div className="flex gap-1 mt-3">
                    {template.platforms.map((p: string) => (
                      <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  <Link href={`/engage/posts/new?template=${template.id}`}>
                    <Button size="sm" variant="outline">Use template</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border py-10 px-4 flex flex-col items-center gap-3">
          <Image src="/empty-state.svg" alt="No templates" width={120} height={120} priority />
          <h3 className="text-sm font-semibold">Content</h3>
          <p className="text-xs text-muted-foreground text-center max-w-md">No templates yet. Create reusable content templates for quick posting.</p>
        </div>
      )}
    </div>
  )
}
