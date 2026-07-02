export type PreviousWrDisplayRow = {
  submission_uuid: string
  player_uuid: string
  player_name: string
  time: number
  date: string
  previous_thread_id: string | null
}

export type PreviousWrResolutionInput = {
  currentSubmissionUuid: string
  previousWrRow: PreviousWrDisplayRow | null
  fallbackWrRow: PreviousWrDisplayRow | null
}

export function resolvePreviousWrDisplayRow({
  currentSubmissionUuid,
  previousWrRow,
  fallbackWrRow,
}: PreviousWrResolutionInput) {
  if (previousWrRow && previousWrRow.submission_uuid !== currentSubmissionUuid) {
    return previousWrRow
  }

  if (fallbackWrRow && fallbackWrRow.submission_uuid !== currentSubmissionUuid) {
    return fallbackWrRow
  }

  return null
}

export function shouldCreateWrThread({
  isWr,
  hasExistingThread,
  currentSubmissionUuid,
  previousWrRow,
}: {
  isWr: boolean
  hasExistingThread: boolean
  currentSubmissionUuid: string
  previousWrRow: PreviousWrDisplayRow | null
}) {
  if (!hasExistingThread && isWr) {
    return previousWrRow ? previousWrRow.submission_uuid !== currentSubmissionUuid : true
  }

  return false
}

export function formatPreviousWrLine(previousWr?: PreviousWrDisplayRow | null) {
  if (!previousWr || !Number.isFinite(previousWr.time)) {
    return null
  }

  if (previousWr.previous_thread_id) {
    return `Previous WR: ${previousWr.time.toFixed(3)} by ${previousWr.player_name} <#${previousWr.previous_thread_id}>`
  }

  return `Previous WR: ${previousWr.time.toFixed(3)} by ${previousWr.player_name}`
}

export function getSubmissionProofHint({
  hasFile,
  hasUrl,
}: {
  hasFile: boolean
  hasUrl: boolean
}) {
  if (hasFile) {
    return "Proof video is ready to submit."
  }

  if (hasUrl) {
    return "Medal link detected. We will validate and process it after submission."
  }

  return "Add a Medal link or upload a video file to continue."
}

export function getSubmissionErrorMessage(code: string | null | undefined) {
  switch (code) {
    case "medal_download_failed":
      return "Medal link could not be processed. Please try another proof link or upload a video file."
    case "medal_invalid":
      return "The provided proof link is not a valid Medal URL."
    case "video_invalid":
      return "Only H.264 MP4 video files are supported."
    case "video_too_large":
      return "The video file is too large. Please choose a smaller file."
    default:
      return "We could not process that submission. Please check your inputs and try again."
  }
}
