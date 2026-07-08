import type { Metadata } from "next"
import Link from "next/link"
import { PageShell, SectionCard } from "@/components/custom/page-shell"
import { legalContactEmail, legalUpdatedLabel } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Privacy Policy | wasans",
  description: "Privacy details for the Wasans website.",
}

const discordData = [
  "Discord user ID",
  "Discord username or display name",
  "Discord avatar hash and discriminator when Discord provides them",
  "Discord OAuth access token, refresh token, and token expiry",
]

const accountData = [
  "Internal player UUID",
  "Player name, score, permission level, and date joined",
  "Account status, deactivation/deletion time, and terms/privacy acceptance timestamp",
  "Session tokens used to keep you logged in",
]

const publicData = [
  "Player profiles, names, avatars, scores, ranks, and join dates",
  "Submissions, times, trials, states, moderator notes, and moderators shown on submissions",
  "Personal bests, world records, public score videos, and Discord submission thread links when used",
]

const localStorageItems = [
  "A session cookie for logged-in accounts",
  "Short-lived Discord OAuth state cookies during login",
  "Sidebar and UI preference storage",
  "Calculator inputs, cached leaderboard data, and recently viewed submission IDs",
]

export default function PrivacyPage() {
  return (
    <PageShell className="max-w-4xl">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated {legalUpdatedLabel}.</p>
      </div>

      <SectionCard title="Who to contact">
        <p className="text-sm leading-6 text-muted-foreground">
          This website is operated by the website operators and project maintainers. For privacy questions, account deletion, or data requests, email{" "}
          <a href={`mailto:${legalContactEmail}`} className="text-primary underline underline-offset-4">{legalContactEmail}</a>.
        </p>
      </SectionCard>

      <SectionCard title="Discord login data">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>When you log in with Discord, the site requests Discord&apos;s identify scope and may store:</p>
          <ul className="list-disc space-y-2 pl-5">
            {discordData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Discord login is used to create your player account, keep you signed in, connect submissions to your player profile, and support moderation/community features.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Account data">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          {accountData.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Public data">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Some site data is meant to be public so the leaderboard and submission archive work:</p>
          <ul className="list-disc space-y-2 pl-5">
            {publicData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Public submissions, scores, and videos can stay public after account deletion. Deleted accounts are shown as deleted account.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Submissions and proof videos">
        <p className="text-sm leading-6 text-muted-foreground">
          When you submit a run, the site stores the trial, time, submission state, player information, and proof video. Uploaded videos and videos fetched from supported proof links are stored in the site&apos;s video storage and may be publicly viewable.
        </p>
      </SectionCard>

      <SectionCard title="Logs and security data">
        <p className="text-sm leading-6 text-muted-foreground">
          The site stores audit logs for submissions, moderation, world record changes, and site errors. Error logs can include the page path, browser user agent, error message, stack trace, and your logged-in account if the error happened while you were signed in.
        </p>
      </SectionCard>

      <SectionCard title="Cookies and browser storage">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>The site uses cookies and browser storage for login, security, preferences, and cached UI data:</p>
          <ul className="list-disc space-y-2 pl-5">
            {localStorageItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            The site does not currently use advertising or marketing cookies. If that changes, the project maintainers should add a consent flow before using non-essential tracking.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Third-party services">
        <p className="text-sm leading-6 text-muted-foreground">
          The site uses Discord for login and community features, Cloudflare for hosting/database/video storage, and proof providers like Medal when resolving submitted proof links. These services may process data under their own policies.
        </p>
      </SectionCard>

      <SectionCard title="Deletion and deactivation">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            You can deactivate your account in Settings. Deactivation hides the account from normal player listings and is reversible by logging in with Discord again.
          </p>
          <p>
            You can delete your account in Settings or request deletion by emailing{" "}
            <a href={`mailto:${legalContactEmail}`} className="text-primary underline underline-offset-4">{legalContactEmail}</a>. Deletion removes Discord login data, OAuth tokens, active sessions, and personal account identity from the account row. Public submissions, scores, and proof videos stay available as deleted account.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Age">
        <p className="text-sm leading-6 text-muted-foreground">
          Our website is not intended for children under the age of 13. By logging in via Discord, you confirm that you meet Discord&apos;s minimum age requirements.
        </p>
      </SectionCard>

      <SectionCard title="Your choices">
        <p className="text-sm leading-6 text-muted-foreground">
          You can use public pages without logging in. If you log in, you can manage account deactivation or deletion in Settings. You can also contact the project maintainers to ask about access, correction, deletion, or privacy concerns.
        </p>
      </SectionCard>

      <SectionCard title="Terms">
        <p className="text-sm leading-6 text-muted-foreground">
          The rules for using the site are in the{" "}
          <Link href="/terms" className="text-primary underline underline-offset-4">Terms of Service</Link>.
        </p>
      </SectionCard>
    </PageShell>
  )
}
