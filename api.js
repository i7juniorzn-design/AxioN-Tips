const AxionAPI = {
  provider: null,

  setProvider(provider) {
    this.provider = provider;
  },

  async getMatches(date) {
    if (this.provider && typeof this.provider.getMatches === "function") {
      return await this.provider.getMatches(date);
    }

    return [];
  },

  async getMatch(matchId) {
    if (this.provider && typeof this.provider.getMatch === "function") {
      return await this.provider.getMatch(matchId);
    }

    return null;
  },

  async getMatchResult(matchId) {
    if (this.provider && typeof this.provider.getMatchResult === "function") {
      return await this.provider.getMatchResult(matchId);
    }

    return null;
  },

  async getLeagues() {
    if (this.provider && typeof this.provider.getLeagues === "function") {
      return await this.provider.getLeagues();
    }

    return [];
  },

  async getTeams() {
    if (this.provider && typeof this.provider.getTeams === "function") {
      return await this.provider.getTeams();
    }

    return [];
  },

  normalizeMatch(match) {
    if (!match) return null;

    return {
      id: match.id ?? null,
      league: match.league ?? "",
      homeTeam: match.homeTeam ?? "",
      awayTeam: match.awayTeam ?? "",
      date: match.date ?? null,
      time: match.time ?? "",
      status: match.status ?? "SCHEDULED",
      homeScore: match.homeScore ?? null,
      awayScore: match.awayScore ?? null,
      venue: match.venue ?? null,
      logoHome: match.logoHome ?? null,
      logoAway: match.logoAway ?? null
    };
  },

  normalizeMatches(matches) {
    if (!Array.isArray(matches)) return [];

    return matches
      .map(match => this.normalizeMatch(match))
      .filter(Boolean);
  },

  getResultStatus(match) {
    if (!match) return "PENDING";

    if (
      typeof match.homeScore !== "number" ||
      typeof match.awayScore !== "number"
    ) {
      return "PENDING";
    }

    return "FINISHED";
  },

  calculateBetResult(bet, match) {
    if (!bet || !match) return null;

    const homeScore = Number(match.homeScore);
    const awayScore = Number(match.awayScore);

    if (
      !Number.isFinite(homeScore) ||
      !Number.isFinite(awayScore)
    ) {
      return {
        result: "PENDING",
        profit: 0
      };
    }

    const selection = String(bet.selection || "").toLowerCase();
    const market = String(bet.market || "").toLowerCase();

    let won = false;
    let determined = false;

    if (
      market.includes("vencedor") ||
      market.includes("resultado") ||
      market === "1x2"
    ) {
      determined = true;

      if (
        selection.includes("casa") ||
        selection.includes("mandante") ||
        selection === "1"
      ) {
        won = homeScore > awayScore;
      }

      if (
        selection.includes("fora") ||
        selection.includes("visitante") ||
        selection === "2"
      ) {
        won = awayScore > homeScore;
      }

      if (
        selection.includes("empate") ||
        selection === "x"
      ) {
        won = homeScore === awayScore;
      }
    }

    if (
      market.includes("dupla") ||
      market.includes("double chance")
    ) {
      determined = true;

      if (
        selection.includes("casa") ||
        selection.includes("1x")
      ) {
        won = homeScore >= awayScore;
      }

      if (
        selection.includes("fora") ||
        selection.includes("x2")
      ) {
        won = awayScore >= homeScore;
      }

      if (selection.includes("12")) {
        won = homeScore !== awayScore;
      }
    }

    if (
      market.includes("mais de 1.5") ||
      market.includes("over 1.5")
    ) {
      determined = true;
      won = homeScore + awayScore > 1;
    }

    if (
      market.includes("menos de 1.5") ||
      market.includes("under 1.5")
    ) {
      determined = true;
      won = homeScore + awayScore < 2;
    }

    if (
      market.includes("mais de 2.5") ||
      market.includes("over 2.5")
    ) {
      determined = true;
      won = homeScore + awayScore > 2;
    }

    if (
      market.includes("menos de 2.5") ||
      market.includes("under 2.5")
    ) {
      determined = true;
      won = homeScore + awayScore < 3;
    }

    if (
      market.includes("mais de 3.5") ||
      market.includes("over 3.5")
    ) {
      determined = true;
      won = homeScore + awayScore > 3;
    }

    if (
      market.includes("menos de 3.5") ||
      market.includes("under 3.5")
    ) {
      determined = true;
      won = homeScore + awayScore < 4;
    }

    if (!determined) {
      return {
        result: "PENDING",
        profit: 0
      };
    }

    const stake = Number(bet.stake);
    const odds = Number(bet.odds);

    if (!Number.isFinite(stake) || !Number.isFinite(odds)) {
      return {
        result: "PENDING",
        profit: 0
      };
    }

    if (won) {
      return {
        result: "GREEN",
        profit: Number((stake * (odds - 1)).toFixed(2))
      };
    }

    return {
      result: "RED",
      profit: Number((-stake).toFixed(2))
    };
  }
};

const AxionManualProvider = {
  matches: [],

  async getMatches() {
    return this.matches;
  },

  async getMatch(matchId) {
    return this.matches.find(
      match => String(match.id) === String(matchId)
    ) || null;
  },

  async getMatchResult(matchId) {
    const match = await this.getMatch(matchId);

    if (!match) return null;

    if (
      typeof match.homeScore !== "number" ||
      typeof match.awayScore !== "number"
    ) {
      return null;
    }

    return {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status || "FINISHED"
    };
  },

  async getLeagues() {
    return [
      ...new Set(
        this.matches
          .map(match => match.league)
          .filter(Boolean)
      )
    ];
  },

  async getTeams() {
    const teams = [];

    this.matches.forEach(match => {
      if (match.homeTeam) teams.push(match.homeTeam);
      if (match.awayTeam) teams.push(match.awayTeam);
    });

    return [...new Set(teams)];
  },

  addMatch(match) {
    this.matches.push(
      AxionAPI.normalizeMatch(match)
    );
  },

  clear() {
    this.matches = [];
  }
};

AxionAPI.setProvider(AxionManualProvider);

window.AxionAPI = AxionAPI;
window.AxionManualProvider = AxionManualProvider;