// DuckLake can either be backed by Comet Cloud projects (catalog + storage are managed for the
// user) or configured manually with a PostgreSQL catalog URL and S3-compatible credentials.
export const DUCKLAKE_MODE_COMETCLOUD = 'cometcloud'
export const DUCKLAKE_MODE_CUSTOM = 'custom'
export type DucklakeMode = typeof DUCKLAKE_MODE_COMETCLOUD | typeof DUCKLAKE_MODE_CUSTOM
