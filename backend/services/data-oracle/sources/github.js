class GitHubSource {
  constructor(opts = {}) {
    this.token = opts.token || process.env.GITHUB_TOKEN || '';
  }

  async search(query) {
    // Mock-only: returns empty for now
    return [];
  }

  async getDetails(repo) {
    return null;
  }
}

module.exports = GitHubSource;
