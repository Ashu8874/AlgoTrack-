export const GITHUB_ACTIVITY_QUERY = /* GraphQL */ `
  query GitHubActivity($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      name
      contributionsCollection(from: $from, to: $to) {
        totalContributions
        totalCommitContributions
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;
