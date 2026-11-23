export interface Movie {
  title: string
  directors: string[]
  description: string
  status: 'available' | 'sold_out' | 'upcoming'
  buyUrl: string | undefined
  infoUrl: string | undefined
  date: string
  time: string
  category: string
}

export interface ScrapedDay {
  date: string
  movies: Movie[]
  programUrl: string
}

export interface AppConfig {
  cron: string
  /** IANA timezone used to interpret the CRON expression. */
  cronTimezone?: string
  /** Run an initial scrape when the daemon starts. Defaults to true. */
  runOnStart?: boolean
  /** Optional directory for saved scrape results and the monthly programme PDF. */
  dataDir?: string
  smtpHost: string | undefined
  smtpPort: number | undefined
  smtpUser: string | undefined
  smtpPass: string | undefined
  emailFrom: string | undefined
  emailTo: string | undefined
  gotifyUrl: string | undefined
  gotifyToken: string | undefined
}
