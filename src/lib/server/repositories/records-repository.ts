import "server-only"

export async function listWorldRecords(db: D1Database, options?: { limit?: number }) {
  const limit = options?.limit ?? 0
  const query = `
    SELECT
      wrs.*,
      players.score AS player_score,
      players.player_id,
      players.discord_avatar,
      players.discord_discriminator,
      submissions.moderator_note,
      submissions.moderator_username
    FROM wrs
    LEFT JOIN players ON players.uuid = wrs.player_uuid
    LEFT JOIN submissions ON submissions.uuid = wrs.submission_uuid
    ORDER BY CAST(submissions.date AS INTEGER) DESC, wrs.trial_name ASC
  `

  const statement = db.prepare(query + (limit > 0 ? ` LIMIT ?` : ""))
  const boundStatement = limit > 0 ? statement.bind(limit) : statement
  const rows = await boundStatement.all()

  return rows.results || []
}

export async function getWorldRecordByTrial(db: D1Database, trialName: string) {
  return db.prepare(
    `SELECT
       wrs.*,
       players.score AS player_score,
       players.player_id,
       players.discord_avatar,
       players.discord_discriminator,
       submissions.moderator_note,
       submissions.moderator_username
     FROM wrs
     LEFT JOIN players ON players.uuid = wrs.player_uuid
     LEFT JOIN submissions ON submissions.uuid = wrs.submission_uuid
     WHERE wrs.trial_name = ?`
  )
    .bind(trialName)
    .first()
}
