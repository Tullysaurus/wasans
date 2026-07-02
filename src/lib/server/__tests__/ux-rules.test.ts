import test from "node:test"
import assert from "node:assert/strict"
import {
  resolvePreviousWrDisplayRow,
  shouldCreateWrThread,
  formatPreviousWrLine,
  getSubmissionProofHint,
  getSubmissionErrorMessage,
  shouldNotifyModeratorOfChange,
  getUploadProgressMessage,
} from "../ux-rules"

test("resolvePreviousWrDisplayRow prefers a different submission than the current WR", () => {
  const previous = {
    submission_uuid: "old-wr",
    player_name: "Old Player",
    player_uuid: "player-old",
    time: 12.34,
    date: "1700000000",
    previous_thread_id: null,
  }

  const resolved = resolvePreviousWrDisplayRow({
    currentSubmissionUuid: "new-wr",
    previousWrRow: previous,
    fallbackWrRow: null,
  })

  assert.equal(resolved?.submission_uuid, "old-wr")
})

test("resolvePreviousWrDisplayRow falls back to another eligible WR when the old one is the same submission", () => {
  const resolved = resolvePreviousWrDisplayRow({
    currentSubmissionUuid: "same-submission",
    previousWrRow: {
      submission_uuid: "same-submission",
      player_name: "Same",
      player_uuid: "p1",
      time: 12.34,
      date: "1700000000",
      previous_thread_id: null,
    },
    fallbackWrRow: {
      submission_uuid: "fallback-wr",
      player_name: "Fallback",
      player_uuid: "p2",
      time: 11.22,
      date: "1699999999",
      previous_thread_id: "thread-1",
    },
  })

  assert.equal(resolved?.submission_uuid, "fallback-wr")
  assert.equal(resolved?.previous_thread_id, "thread-1")
})

test("shouldCreateWrThread only creates a thread for a real new WR when no existing thread exists", () => {
  assert.equal(
    shouldCreateWrThread({
      isWr: true,
      hasExistingThread: false,
      currentSubmissionUuid: "new-wr",
      previousWrRow: { submission_uuid: "old-wr", player_name: "Old", player_uuid: "p1", time: 10, date: "1", previous_thread_id: null },
    }),
    true
  )

  assert.equal(
    shouldCreateWrThread({
      isWr: true,
      hasExistingThread: false,
      currentSubmissionUuid: "new-wr",
      previousWrRow: { submission_uuid: "new-wr", player_name: "New", player_uuid: "p2", time: 10, date: "2", previous_thread_id: null },
    }),
    false
  )
})

test("formatPreviousWrLine renders a human-friendly previous WR line", () => {
  assert.equal(
    formatPreviousWrLine({ submission_uuid: "old", player_name: "Alice", time: 13.5, date: "1", previous_thread_id: null }),
    "Previous WR: 13.500 by Alice"
  )
})

test("proof hints explain what the user needs to do next", () => {
  assert.match(getSubmissionProofHint({ hasFile: false, hasUrl: false }), /Add a Medal link or upload a video file/)
  assert.match(getSubmissionProofHint({ hasFile: true, hasUrl: false }), /ready to submit/i)
})

test("submission errors use specific language for Medal processing problems", () => {
  assert.match(getSubmissionErrorMessage("medal_download_failed"), /Medal link could not be processed/)
  assert.match(getSubmissionErrorMessage("video_invalid"), /Only H.264 MP4 video files are supported/)
})

test("moderation notifications only fire for meaningful changes", () => {
  assert.equal(
    shouldNotifyModeratorOfChange({ oldPlayerId: "player-1", stateChanged: true, noteChanged: false, scoreChanged: false, rankChanged: false }),
    true
  )
  assert.equal(
    shouldNotifyModeratorOfChange({ oldPlayerId: null, stateChanged: true, noteChanged: false, scoreChanged: false, rankChanged: false }),
    false
  )
  assert.equal(
    shouldNotifyModeratorOfChange({ oldPlayerId: "player-1", stateChanged: false, noteChanged: false, scoreChanged: false, rankChanged: false }),
    false
  )
})

test("upload progress messaging is specific to each submission stage", () => {
  assert.match(getUploadProgressMessage({ status: "validating", progress: 0, hasMedalLink: false }), /Checking proof inputs/)
  assert.match(getUploadProgressMessage({ status: "processing", progress: 55, hasMedalLink: true }), /Downloading proof video/)
  assert.equal(getUploadProgressMessage({ status: "done", progress: 100, hasMedalLink: false }), "Submission ready")
})
