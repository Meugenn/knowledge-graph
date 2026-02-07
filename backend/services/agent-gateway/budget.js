const CASTE_LIMITS = {
  guardian: { tokenLimit: 100000, warningAt: 0.8 },
  philosopher: { tokenLimit: 150000, warningAt: 0.8 },
  producer: { tokenLimit: 80000, warningAt: 0.8 },
};

class Budget {
  constructor(opts = {}) {
    this.limits = { ...CASTE_LIMITS, ...(opts.limits || {}) };
    this.usage = {};
  }

  canSpend(caste) {
    const limit = this.limits[caste];
    if (!limit) return { allowed: true };

    const used = this.usage[caste] || 0;
    const ratio = used / limit.tokenLimit;

    if (ratio >= 1.0) return { allowed: false, used, limit: limit.tokenLimit, ratio };
    if (ratio >= limit.warningAt) return { allowed: true, warning: true, used, limit: limit.tokenLimit, ratio };
    return { allowed: true, used, limit: limit.tokenLimit, ratio };
  }

  recordSpend(caste, tokens) {
    this.usage[caste] = (this.usage[caste] || 0) + tokens;
  }

  getStatus() {
    const status = {};
    for (const [caste, limit] of Object.entries(this.limits)) {
      const used = this.usage[caste] || 0;
      status[caste] = {
        used,
        limit: limit.tokenLimit,
        ratio: used / limit.tokenLimit,
        remaining: limit.tokenLimit - used,
      };
    }
    return status;
  }

  reset(caste) {
    if (caste) {
      this.usage[caste] = 0;
    } else {
      this.usage = {};
    }
  }
}

module.exports = Budget;
