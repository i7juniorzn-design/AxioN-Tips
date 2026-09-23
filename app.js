document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);

  const loginScreen = $("#loginScreen");
  const registerScreen = $("#registerScreen");
  const appScreen = $("#appScreen");

  const loginForm = $("#loginForm");
  const registerForm = $("#registerForm");

  const loginEmail = $("#loginEmail");
  const loginPassword = $("#loginPassword");

  const registerNickname = $("#registerNickname");
  const registerEmail = $("#registerEmail");
  const registerPassword = $("#registerPassword");

  const loginError = $("#loginError");
  const registerError = $("#registerError");

  const nicknameElements = document.querySelectorAll(
    "#userNickname, #profileNickname, #welcomeNickname"
  );

  const toast = $("#toast");

  let currentUser = null;
  let currentProfile = null;
  let bets = [];
  let selectedMatch = null;

  function showScreen(screen) {
    [loginScreen, registerScreen, appScreen].forEach((element) => {
      if (element) {
        element.classList.remove("active");
      }
    });

    if (screen) {
      screen.classList.add("active");
    }
  }

  function showLogin() {
    showScreen(loginScreen);
  }

  function showRegister() {
    showScreen(registerScreen);
  }

  function showApp() {
    showScreen(appScreen);
  }

  function showToast(message, type = "info") {
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  function showError(element, message) {
    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.classList.toggle("show", Boolean(message));
  }

  function clearErrors() {
    showError(loginError, "");
    showError(registerError, "");
  }

  function formatMoney(value) {
    const number = Number(value) || 0;

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString("pt-BR");
  }

  function normalizeResult(result) {
    return String(result || "PENDING").toUpperCase();
  }

  function updateNickname(nickname) {
    nicknameElements.forEach((element) => {
      element.textContent = nickname || "Usuário";
    });
  }

  function calculateStats() {
    let greens = 0;
    let reds = 0;
    let profit = 0;

    bets.forEach((bet) => {
      const result = normalizeResult(bet.result);

      if (result === "GREEN" || result === "WIN") {
        greens++;
      }

      if (result === "RED" || result === "LOSS" || result === "LOSE") {
        reds++;
      }

      profit += Number(bet.profit) || 0;
    });

    const finished = greens + reds;
    const hitRate = finished > 0 ? (greens / finished) * 100 : 0;

    return {
      greens,
      reds,
      profit,
      hitRate
    };
  }

  function updateStats() {
    const stats = calculateStats();

    const profitValue = $("#profitValue");
    const greensValue = $("#greensValue");
    const redsValue = $("#redsValue");
    const hitRateValue = $("#hitRateValue");

    if (profitValue) {
      profitValue.textContent = formatMoney(stats.profit);
      profitValue.classList.remove("positive", "negative");

      if (stats.profit > 0) {
        profitValue.classList.add("positive");
      }

      if (stats.profit < 0) {
        profitValue.classList.add("negative");
      }
    }

    if (greensValue) {
      greensValue.textContent = stats.greens;
    }

    if (redsValue) {
      redsValue.textContent = stats.reds;
    }

    if (hitRateValue) {
      hitRateValue.textContent = `${stats.hitRate.toFixed(1)}%`;
    }
  }

  function getBetProfit(bet, result) {
    const normalized = normalizeResult(result);

    const odds = Number(bet.odds) || 0;
    const stake = Number(bet.stake) || 0;

    if (normalized === "GREEN" || normalized === "WIN") {
      return (odds * stake) - stake;
    }

    if (
      normalized === "RED" ||
      normalized === "LOSS" ||
      normalized === "LOSE"
    ) {
      return -stake;
    }

    return 0;
  }

  async function loadBets() {
    if (!currentUser) {
      return;
    }

    try {
      const result = await getBets(currentUser.id);

      bets = Array.isArray(result) ? result : [];

      updateStats();
      renderHistory();
      renderSummary();
    } catch (error) {
      console.error("Erro ao carregar apostas:", error);
      showToast("Não foi possível carregar as apostas.", "error");
    }
  }

  function renderHistory() {
    const historyContainer =
      $("#historyList") ||
      $("#historyContainer") ||
      $("#betsHistory");

    if (!historyContainer) {
      return;
    }

    historyContainer.innerHTML = "";

    if (!bets.length) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <p>Nenhuma aposta registrada ainda.</p>
        </div>
      `;

      return;
    }

    bets.forEach((bet) => {
      const result = normalizeResult(bet.result);

      const item = document.createElement("div");
      item.className = `history-item ${result.toLowerCase()}`;

      item.innerHTML = `
        <div class="history-main">
          <strong>${bet.home_team || "-"} x ${bet.away_team || "-"}</strong>
          <span>${bet.market || "-"}${bet.selection ? ` • ${bet.selection}` : ""}</span>
        </div>

        <div class="history-info">
          <span>${formatDate(bet.match_date)}</span>
          <span>Odd ${Number(bet.odds || 0).toFixed(2)}</span>
          <span>${formatMoney(bet.stake)}</span>
        </div>

        <div class="history-result">
          <strong>${result}</strong>
          <span>${formatMoney(bet.profit)}</span>
        </div>
      `;

      historyContainer.appendChild(item);
    });
  }

  function renderSummary() {
    const summaryContainer =
      $("#summaryList") ||
      $("#summaryContainer") ||
      $("#profitSummary");

    if (!summaryContainer) {
      return;
    }

    const stats = calculateStats();

    summaryContainer.innerHTML = `
      <div class="summary-row">
        <span>Entradas</span>
        <strong>${bets.length}</strong>
      </div>

      <div class="summary-row">
        <span>GREEN</span>
        <strong>${stats.greens}</strong>
      </div>

      <div class="summary-row">
        <span>RED</span>
        <strong>${stats.reds}</strong>
      </div>

      <div class="summary-row">
        <span>Taxa de acerto</span>
        <strong>${stats.hitRate.toFixed(1)}%</strong>
      </div>

      <div class="summary-row">
        <span>Lucro</span>
        <strong>${formatMoney(stats.profit)}</strong>
      </div>
    `;
  }

  async function loadGoal() {
    if (!currentUser) {
      return;
    }

    try {
      const goal = await getGoal(currentUser.id);

      if (!goal) {
        return;
      }

      const goalName = $("#goalName");
      const goalTarget = $("#goalTarget");
      const goalCurrent = $("#goalCurrent");
      const goalProgress = $("#goalProgress");

      if (goalName) {
        goalName.textContent = goal.name || "Meta";
      }

      if (goalTarget) {
        goalTarget.textContent = formatMoney(goal.target);
      }

      if (goalCurrent) {
        goalCurrent.textContent = formatMoney(goal.current_value);
      }

      if (goalProgress) {
        const target = Number(goal.target) || 0;
        const current = Number(goal.current_value) || 0;

        const percentage =
          target > 0
            ? Math.min(100, Math.max(0, (current / target) * 100))
            : 0;

        goalProgress.style.width = `${percentage}%`;
      }
    } catch (error) {
      console.error("Erro ao carregar meta:", error);
    }
  }

  async function loadProfile() {
    if (!currentUser) {
      return;
    }

    try {
      currentProfile = await getProfile(currentUser.id);

      if (currentProfile) {
        updateNickname(currentProfile.nickname);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  }

  async function loadDashboard() {
    await loadProfile();
    await loadBets();
    await loadGoal();
  }

  async function handleLogin(event) {
    event.preventDefault();

    clearErrors();

    const email = loginEmail?.value.trim();
    const password = loginPassword?.value;

    if (!email || !password) {
      showError(loginError, "Preencha email e senha.");
      return;
    }

    try {
      const data = await signIn(email, password);

      currentUser = data?.user || data;

      showToast("Login realizado com sucesso.", "success");

      await loadDashboard();

      showApp();
    } catch (error) {
      console.error(error);

      showError(
        loginError,
        error?.message || "Não foi possível entrar."
      );
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    clearErrors();

    const nickname = registerNickname?.value.trim();
    const email = registerEmail?.value.trim();
    const password = registerPassword?.value;

    if (!nickname || !email || !password) {
      showError(registerError, "Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      showError(
        registerError,
        "A senha precisa ter pelo menos 6 caracteres."
      );

      return;
    }

    try {
      const data = await signUp(email, password, nickname);

      currentUser = data?.user || null;

      showToast("Conta criada com sucesso.", "success");

      if (currentUser) {
        await loadDashboard();
        showApp();
      } else {
        showLogin();
        showToast(
          "Conta criada. Agora faça login.",
          "success"
        );
      }
    } catch (error) {
      console.error(error);

      showError(
        registerError,
        error?.message || "Não foi possível criar a conta."
      );
    }
  }

  async function handleLogout() {
    try {
      await signOut();

      currentUser = null;
      currentProfile = null;
      bets = [];

      showLogin();

      showToast("Você saiu da conta.", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao sair da conta.", "error");
    }
  }

  function setupNavigation() {
    const registerButtons = document.querySelectorAll(
      "[data-action='register'], #goRegister, #showRegister"
    );

    registerButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        showRegister();
      });
    });

    const loginButtons = document.querySelectorAll(
      "[data-action='login'], #goLogin, #showLogin"
    );

    loginButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        showLogin();
      });
    });

    const logoutButtons = document.querySelectorAll(
      "[data-action='logout'], #logoutButton, #logoutBtn"
    );

    logoutButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        handleLogout();
      });
    });
  }

  function setupTabs() {
    const tabs = document.querySelectorAll(
      "[data-tab], .tab-button, .date-tab"
    );

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((item) => item.classList.remove("active"));
        tab.classList.add("active");

        const target = tab.dataset.tab;

        if (target) {
          document.querySelectorAll("[data-panel]").forEach((panel) => {
            panel.classList.toggle(
              "active",
              panel.dataset.panel === target
            );
          });
        }
      });
    });
  }

  function setupMobileNavigation() {
    const navItems = document.querySelectorAll(
      ".mobile-nav button, .bottom-nav button, [data-section]"
    );

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const section = item.dataset.section;

        if (!section) {
          return;
        }

        document.querySelectorAll("[data-section]").forEach((element) => {
          element.classList.remove("active");
        });

        item.classList.add("active");

        document.querySelectorAll("[data-page]").forEach((page) => {
          page.classList.toggle(
            "active",
            page.dataset.page === section
          );
        });
      });
    });
  }

  function setupBetForm() {
    const form =
      $("#betForm") ||
      $("#confirmBetForm") ||
      $("#newBetForm");

    if (!form) {
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!currentUser) {
        showToast("Faça login primeiro.", "error");
        return;
      }

      const formData = new FormData(form);

      const bet = {
        user_id: currentUser.id,
        league:
          formData.get("league") ||
          selectedMatch?.league ||
          null,
        home_team:
          formData.get("home_team") ||
          selectedMatch?.home_team ||
          "",
        away_team:
          formData.get("away_team") ||
          selectedMatch?.away_team ||
          "",
        match_date:
          formData.get("match_date") ||
          selectedMatch?.match_date ||
          null,
        market:
          formData.get("market") ||
          "Resultado",
        selection:
          formData.get("selection") ||
          "",
        odds: Number(formData.get("odds") || 0),
        stake: Number(formData.get("stake") || 0),
        result: "PENDING",
        profit: 0,
        notes:
          formData.get("notes") ||
          ""
      };

      if (!bet.home_team || !bet.away_team) {
        showToast("Informe as equipes.", "error");
        return;
      }

      if (bet.odds <= 0 || bet.stake <= 0) {
        showToast("Informe odd e valor da aposta.", "error");
        return;
      }

      try {
        await createBet(bet);

        form.reset();

        selectedMatch = null;

        showToast("Aposta registrada.", "success");

        await loadBets();
      } catch (error) {
        console.error(error);

        showToast(
          error?.message || "Não foi possível registrar a aposta.",
          "error"
        );
      }
    });
  }

  function setupMatchSelection() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(
        "[data-match-id], .match-card, .match-item"
      );

      if (!button) {
        return;
      }

      const matchId = button.dataset.matchId;

      if (!matchId || !window.AxionAPI) {
        return;
      }

      AxionAPI.getMatch(matchId)
        .then((match) => {
          selectedMatch = match || null;

          if (!match) {
            return;
          }

          const home = $("#analysisHome");
          const away = $("#analysisAway");
          const league = $("#analysisLeague");

          if (home) {
            home.textContent = match.home_team || "-";
          }

          if (away) {
            away.textContent = match.away_team || "-";
          }

          if (league) {
            league.textContent = match.league || "-";
          }
        })
        .catch((error) => {
          console.error("Erro ao selecionar partida:", error);
        });
    });
  }

  function setupFilters() {
    const filter = $("#historyFilter");

    if (!filter) {
      return;
    }

    filter.addEventListener("change", () => {
      const value = normalizeResult(filter.value);

      if (!filter.value || filter.value === "ALL") {
        renderHistory();
        return;
      }

      const originalBets = bets;

      bets = originalBets.filter(
        (bet) => normalizeResult(bet.result) === value
      );

      renderHistory();

      bets = originalBets;
    });
  }

  async function initializeAuth() {
    try {
      const user = await getCurrentUser();

      if (user) {
        currentUser = user;
        await loadDashboard();
        showApp();
      } else {
        showLogin();
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      showLogin();
    }
  }

  function setupAuthListener() {
    window.addEventListener("axion-auth-change", async (event) => {
      const user = event.detail?.user || null;

      currentUser = user;

      if (user) {
        await loadDashboard();
        showApp();
      } else {
        showLogin();
      }
    });
  }

  loginForm?.addEventListener("submit", handleLogin);
  registerForm?.addEventListener("submit", handleRegister);

  setupNavigation();
  setupTabs();
  setupMobileNavigation();
  setupBetForm();
  setupMatchSelection();
  setupFilters();
  setupAuthListener();

  initializeAuth();
});