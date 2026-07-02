import Link from "next/link"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { ArrowRightIcon, CalculatorIcon, ClipboardListIcon, InfoIcon, TrophyIcon, MedalIcon, BookIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PageShell, SectionCard, ErrorState } from "@/components/custom/page-shell"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { listSubmissions } from "@/lib/server/repositories/submission-repository"
import { listWorldRecords } from "@/lib/server/repositories/records-repository"

const quickLinks = [
  {
    "href": "/rules",
    "title": "Rules",
    "description": "Read the official rules for valid runs, submissions, and applications.",
    "icon": BookIcon,
  },
  {
    href: "/information",
    title: "Information",
    description: "See FAQ and site/discord details.",
    icon: InfoIcon,
  },
  {
    href: "/submissions",
    title: "Submit Runs",
    description: "Submit your own runs for review.",
    icon: ClipboardListIcon,
  },
  {
    href: "/wrs",
    title: "World Records",
    description: "See world records for every trial.",
    icon: MedalIcon,
  },
  {
    href: "/calculator",
    title: "Calculator",
    description: "Estimate scores with live data.",
    icon: CalculatorIcon,
  },
  {
    href: "/players",
    title: "Leaderboard",
    description: "Browse rankings and player history.",
    icon: TrophyIcon,
  }
]

export default async function HomePage() {
  let recentSubmissions: Array<{ trial_name: string; player_name: string; time: number; state: string }> = []
  let worldRecords: Array<{ trial_name: string; time: number; player_name: string }> = []
  let errorMessage: string | null = null

  try {
    const { env } = await getCloudflareContext({ async: true })
    if (env?.wasans) {
      const [submissionRows, recordRows] = await Promise.all([
        listSubmissions(env.wasans, { limit: 6, offset: 0, state: "approved" }),
        listWorldRecords(env.wasans, { limit: 6 }),
      ])
      recentSubmissions = (submissionRows.results || []).slice(0, 6)
      worldRecords = (recordRows as Array<{ trial_name: string; time: number; player_name: string }>).slice(0, 6)
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load dashboard data"
  }

  return (
    <PageShell>
      <section className="animate-subtle-in relative overflow-hidden rounded-3xl border border-border/70 bg-background/55 px-5 py-8 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.85)] md:px-8 md:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--page-accent) 16%, transparent), transparent)" }}
        />

        <div className="relative z-10 grid gap-7 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Parkour Reborn</p>
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              The home for official scores, records, and submissions.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              All competitive data in one place.
            </p>
          </div>
        </div>
      </section>

      <section className="animate-subtle-in">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">Get Started</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((linkItem) => {
            const Icon = linkItem.icon
            return (
              <Link key={linkItem.href} href={linkItem.href}>
                <Card className="h-full rounded-2xl border-border/70 bg-background/55 transition hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_18px_44px_-30px_rgba(0,0,0,0.9)]">
                  <CardContent className="flex h-full items-start gap-3 p-4">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/45">
                      <Icon className="size-4.5 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold tracking-tight text-foreground">{linkItem.title}</p>
                      <p className="text-sm text-muted-foreground">{linkItem.description}</p>
                      <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-primary">
                        Open <ArrowRightIcon className="size-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <SectionCard title="Recent WRs">
          {errorMessage ? (
            <ErrorState title="Unable to load records" message={errorMessage} />
          ) : worldRecords.length > 0 ? (
            <div className="space-y-2">
              {worldRecords.map((record) => (
                <div key={record.trial_name} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">{record.trial_name}</span>
                  <div className="text-right text-muted-foreground">
                    <div>{record.time.toFixed(3)}</div>
                    <div className="text-xs">{record.player_name}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No WR data yet</EmptyTitle>
                <EmptyDescription>Records will appear here as submissions are approved.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </SectionCard>

        <SectionCard title="Recent submissions">
          {errorMessage ? (
            <ErrorState title="Unable to load submissions" message={errorMessage} />
          ) : recentSubmissions.length > 0 ? (
            <div className="space-y-2">
              {recentSubmissions.map((submission) => (
                <div key={submission.trial_name + submission.player_name + submission.time} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-foreground">{submission.player_name}</div>
                    <div className="text-muted-foreground">{submission.trial_name}</div>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <div>{submission.time.toFixed(3)}</div>
                    <div className="text-xs">Approved</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No recent runs</EmptyTitle>
                <EmptyDescription>Approved submissions will show up here as soon as they are available.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </SectionCard>
      </section>
    </PageShell>
  )
}
