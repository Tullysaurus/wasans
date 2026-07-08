"use client"

import { useEffect, useMemo, useState, createContext, useContext } from "react"
import Link from "next/link"
import { Settings2Icon, Trash2Icon, UserXIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { accountDeletePhrase } from "@/lib/account-deletion"
import { apiV1 } from "@/lib/api"

type SettingsContextValue = {
  disableSubmissionThumbnails: boolean
  setDisableSubmissionThumbnails: (value: boolean) => void
}

type SettingsUser = {
  uuid: string
  player_name: string
}

const STORAGE_KEY = "wasans:ui-settings:v1"

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [disableSubmissionThumbnails, setDisableSubmissionThumbnails] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return false
      }
      const parsed = JSON.parse(raw) as { disableSubmissionThumbnails?: boolean }
      return Boolean(parsed.disableSubmissionThumbnails)
    } catch {
      // Ignore invalid local settings and keep defaults.
      return false
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          disableSubmissionThumbnails,
        })
      )
    } catch {
      // Ignore storage failures (private mode / browser limits).
    }
  }, [disableSubmissionThumbnails])

  const value = useMemo(
    () => ({ disableSubmissionThumbnails, setDisableSubmissionThumbnails }),
    [disableSubmissionThumbnails]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}

export function FloatingSettingsModal({ user }: { user?: SettingsUser | null }) {
  const settings = useSettings()
  const [updatingScore, setUpdatingScore] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [accountError, setAccountError] = useState<string | null>(null)

  if (!settings) {
    return null
  }

  const updateScore = async () => {
    if (updatingScore) {
      return
    }

    setUpdatingScore(true)

    await fetch(apiV1("/auth/me/score"), {
      method: "POST",
      cache: "no-store",
    }).catch(() => null)

    setUpdatingScore(false)
  }

  const runAccountAction = async (action: "deactivate" | "delete") => {
    if ((action === "deactivate" && deactivating) || (action === "delete" && deleting)) {
      return
    }

    setAccountError(null)

    if (action === "delete" && deleteText !== accountDeletePhrase) {
      setAccountError(`Type ${accountDeletePhrase} to confirm.`)
      return
    }

    if (action === "deactivate") {
      setDeactivating(true)
    } else {
      setDeleting(true)
    }

    try {
      const response = await fetch(apiV1(action === "deactivate" ? "/account/deactivate" : "/account"), {
        method: action === "deactivate" ? "POST" : "DELETE",
        cache: "no-store",
        headers: action === "delete" ? { "content-type": "application/json" } : undefined,
        body: action === "delete" ? JSON.stringify({ confirmation: deleteText }) : undefined,
      })

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        throw new Error(json?.error?.message || "Account update failed")
      }

      window.localStorage.removeItem("player_uuid")
      window.location.assign("/")
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Account update failed")
      setDeactivating(false)
      setDeleting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenuButton type="button" className="cursor-pointer" aria-label="Open settings">
          <Settings2Icon className="size-4" />
          <span className="truncate">Settings</span>
        </SidebarMenuButton>
      </DialogTrigger>

      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Control lightweight client-side preferences.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Disable submission thumbnails</p>
              <p className="text-xs text-muted-foreground">Prevents preview videos from loading in submission cards.</p>
            </div>
            <Switch
              className="cursor-pointer"
              checked={settings.disableSubmissionThumbnails}
              onCheckedChange={settings.setDisableSubmissionThumbnails}
              aria-label="Disable submission thumbnails"
            />
          </div>
        </div>

        {user ? (
          <>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Update score</p>
                  <p className="text-xs text-muted-foreground">Recalculate from your personal bests.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={updatingScore}
                  onClick={updateScore}
                >
                  Update score
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground">Logged in as {user.player_name}.</p>
                </div>

                {accountError ? <p className="text-xs text-destructive">{accountError}</p> : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" disabled={deactivating || deleting}>
                        <UserXIcon />
                        Deactivate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This hides your account from player lists and logs you out. Logging in with Discord again reactivates it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={deactivating}
                          onClick={(event) => {
                            event.preventDefault()
                            void runAccountAction("deactivate")
                          }}
                        >
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog
                    onOpenChange={(open) => {
                      if (open) {
                        setAccountError(null)
                      } else {
                        setDeleteText("")
                      }
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" size="sm" disabled={deactivating || deleting}>
                        <Trash2Icon />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete account?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3 text-left">
                            <p>This is permanent. Your Discord login/account data and sessions will be deleted, and you will be logged out.</p>
                            <ul className="list-disc space-y-1 pl-5">
                              <li>Public submissions, scores, PBs, WRs, and proof videos will stay public.</li>
                              <li>Public records connected to this account will show as Deleted Account.</li>
                              <li>This does not delete proof videos from R2.</li>
                            </ul>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <label className="grid gap-2 text-sm">
                        <span className="text-muted-foreground">Type {accountDeletePhrase} to confirm.</span>
                        <Input
                          value={deleteText}
                          onChange={(event) => setDeleteText(event.target.value)}
                          disabled={deleting}
                          autoComplete="off"
                          aria-invalid={deleteText.length > 0 && deleteText !== accountDeletePhrase}
                        />
                      </label>
                      {accountError ? <p className="text-xs text-destructive">{accountError}</p> : null}
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={deleting || deleteText !== accountDeletePhrase}
                          onClick={(event) => {
                            event.preventDefault()
                            void runAccountAction("delete")
                          }}
                        >
                          {deleting ? "Deleting..." : "Delete forever"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <p className="text-[11px] leading-5 text-muted-foreground">
                  See the{" "}
                  <Link href="/terms" className="underline underline-offset-3">Terms</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline underline-offset-3">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
