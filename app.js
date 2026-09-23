
const $ = (selector) => document.querySelector(selector);

let currentUser = null;
let currentProfile = null;
let bets = [];
let selectedMatch = null;
let currentFilter = "ALL";
let currentMatchDay = 0;

const loginScreen = $("#loginScreen");
const registerScreen = $("#registerScreen");
const appScreen = $("#appScreen");

function showScreen(screen) {
  [loginScreen, registerScreen, appScreen].forEach((element) => {
    if (element) {
      element.classList.remove("active");
      element.classList.add("hidden");
    }
  });

  if (screen) {
    screen.classList.remove("hidden");
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
  const toast = $("#toast");

  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function formatMoney(value) {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(date) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("pt-BR");
}

function normalizeResult(result) {
  return String(result || "PENDING").toUpperCase();
}

function updateNickname(nickname) {
  const elements = [
    $("#userNickname"),
    $("#heroNickname"),
    $("#profileNickname"),
    $("#welcomeNickname")
  ];

  elements.forEach((element) => {
    if (element) {
      element.textContent = nickname || "Usuário";
    }
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

    if (
      result === "RED" ||
      result === "LOSS" ||
      result === "LOSE"
    ) {
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

  const bankValue = $("#bankValue");
  const bankGreens = $("#bankGreens");
  const bankReds = $("#bankReds");
  const bankHitRate = $("#bankHitRate");

  if (bankValue) {
    bankValue.textContent = formatMoney(stats.profit);
  }

  if (bankGreens) {
    bankGreens.textContent = stats.greens;
  }

  if (bankReds) {
    bankReds.textContent = stats.reds;
  }

  if (bankHitRate) {
    bankHitRate.textContent = `${stats.hitRate.toFixed(1)}%`;
  }
}

async function loadProfile() {
  if (!currentUser) return;

  try {
    currentProfile = await getProfile(currentUser.id);

    if (currentProfile) {
      updateNickname(currentProfile.nickname);
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadBets() {
  if (!currentUser) return;

  try {
    const result = await getBets(currentUser.id);

    bets = Array.isArray(result) ? result : [];

    updateStats();
    renderBets();
  } catch (error) {
    console.error(error);
    showToast("Erro ao carregar apostas.", "error");
  }
}

function getFilteredBets() {
  if (currentFilter === "ALL") {
    return bets;
  }

  return bets.filter(
    (bet) => normalizeResult(bet.result) === currentFilter
  );
}

function renderBets() {
  const container = $("#betsList");

  if (!container) return;

  const filteredBets = getFilteredBets();

  container.innerHTML = "";

  if (!filteredBets.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhuma aposta encontrada.</p>
      </div>
    `;

    return;
  }

  filteredBets.forEach((bet) => {
    const result = normalizeResult(bet.result);

    const item = document.createElement("div");

    item.className = `bet-item ${result.toLowerCase()}`;

    item.innerHTML = `
      <div class="bet-main">
        <strong>${bet.home_team || "-"} x ${bet.away_team || "-"}</strong>
        <span>${bet.market || "-"}</span>
        <span>${bet.selection || ""}</span>
      </div>

      <div class="bet-info">
        <span>${formatDate(bet.match_date)}</span>
        <span>Odd ${Number(bet.odds || 0).toFixed(2)}</span>
        <span>${formatMoney(bet.stake)}</span>
      </div>

      <div class="bet-result">
        <strong>${result}</strong>
        <span>${formatMoney(bet.profit)}</span>
      </div>
    `;

    container.appendChild(item);
  });
}

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll(".filter-tab").forEach((button) => {
    button.classList.remove("active");
  });

  const activeButton = {
    ALL: $("#filterAll"),
    PENDING: $("#filterPending"),
    GREEN: $("#filterGreen"),
    RED: $("#filterRed")
  }[filter];

  if (activeButton) {
    activeButton.classList.add("active");
  }

  renderBets();
}

function renderGoal(goal) {
  if (!goal) return;

  const name = $("#goalDisplayName");
  const percent = $("#goalPercent");
  const current = $("#goalCurrent");
  const target = $("#goalTargetDisplay");
  const bar = $("#goalBar");

  const goalTarget = Number(goal.target) || 0;
  const goalCurrent = Number(goal.current_value) || 0;

  const percentage =
    goalTarget > 0
      ? Math.min(100, Math.max(0, (goalCurrent / goalTarget) * 100))
      : 0;

  if (name) {
    name.textContent = goal.name || "Minha meta";
  }

  if (percent) {
    percent.textContent = `${percentage.toFixed(0)}%`;
  }

  if (current) {
    current.textContent = formatMoney(goalCurrent);
  }

  if (target) {
    target.textContent = formatMoney(goalTarget);
  }

  if (bar) {
    bar.style.width = `${percentage}%`;
  }
}

async function loadGoal() {
  if (!currentUser) return;

  try {
    const goal = await getGoal(currentUser.id);

    renderGoal(goal);
  } catch (error) {
    console.error(error);
  }
}

function showGoalForm() {
  const form = $("#goalForm");

  if (form) {
    form.classList.remove("hidden");
  }
}

function hideGoalForm() {
  const form = $("#goalForm");

  if (form) {
    form.classList.add("hidden");
  }
}

async function saveGoal(event) {
  event.preventDefault();

  if (!currentUser) {
    showToast("Faça login primeiro.", "error");
    return;
  }

  const name = $("#goalName")?.value.trim();
  const target = Number($("#goalTarget")?.value || 0);

  if (!name || target <= 0) {
    showToast("Preencha os dados da meta.", "error");
    return;
  }

  try {
    const existingGoal = await getGoal(currentUser.id);

    let goal;

    if (existingGoal) {
      goal = await updateGoal(existingGoal.id, {
        name,
        target
      });
    } else {
      goal = await createGoal({
        user_id: currentUser.id,
        name,
        target,
        current_value: 0
      });
    }

    renderGoal(goal);
    hideGoalForm();

    showToast("Meta salva com sucesso.", "success");
  } catch (error) {
    console.error(error);
    showToast("Erro ao salvar meta.", "error");
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = $("#loginEmail")?.value.trim();
  const password = $("#loginPassword")?.value;

  if (!email || !password) {
    showToast("Preencha email e senha.", "error");
    return;
  }

  try {
    const data = await signIn(email, password);

    currentUser = data?.user || data;

    await loadDashboard();

    showApp();

    showToast("Login realizado com sucesso.", "success");
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Erro ao entrar.", "error");
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const nickname = $("#registerNickname")?.value.trim();
  const email = $("#registerEmail")?.value.trim();
  const password = $("#registerPassword")?.value;

  if (!nickname || !email || !password) {
    showToast("Preencha todos os campos.", "error");
    return;
  }

  if (password.length < 6) {
    showToast("A senha precisa ter pelo menos 6 caracteres.", "error");
    return;
  }

  try {
    const data = await signUp(email, password, nickname);

    currentUser = data?.user || null;

    if (currentUser) {
      await loadDashboard();
      showApp();
    } else {
      showLogin();
      showToast("Conta criada. Faça login.", "success");
    }
  } catch (error) {
    console.error(error);
    showToast(error?.message || "Erro ao criar conta.", "error");
  }
}

async function logout() {
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

async function loadDashboard() {
  await loadProfile();
  await loadBets();
  await loadGoal();
}

function changeMatchDay(day) {
  currentMatchDay = day;

  document.querySelectorAll(".date-tab").forEach((button, index) => {
    button.classList.toggle("active", index === day);
  });

  loadMatches();
}

async function loadMatches() {
  const container = $("#matchesList");

  if (!container || !window.AxionAPI) return;

  try {
    const matches = await AxionAPI.getMatches({
      day: currentMatchDay
    });

    container.innerHTML = "";

    if (!matches || !matches.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Nenhuma partida disponível.</p>
        </div>
      `;

      return;
    }

    matches.forEach((match) => {
      const item = document.createElement("button");

      item.type = "button";
      item.className = "match-card";
      item.dataset.matchId = match.id;

      item.innerHTML = `
        <span>${match.league || "Competição"}</span>
        <strong>${match.home_team || "-"} x ${match.away_team || "-"}</strong>
        <small>${match.match_date || ""}</small>
      `;

      item.addEventListener("click", () => {
        openMatch(match);
      });

      container.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
}

function openMatch(match) {
  selectedMatch = match;

  $("#analysisLeague").textContent = match.league || "Competição";
  $("#analysisTime").textContent = match.match_date || "00:00";
  $("#analysisHome").textContent = match.home_team || "Casa";
  $("#analysisAway").textContent = match.away_team || "Fora";
  $("#analysisConfidence").textContent = `${match.confidence || 0}%`;
  $("#analysisMarket").textContent = match.market || "-";
  $("#analysisSelection").textContent = match.selection || "-";
  $("#analysisOdds").textContent = Number(match.odds || 0).toFixed(2);

  $("#matchesSection")?.classList.add("hidden");
  $("#homeSection")?.classList.add("hidden");
  $("#matchAnalysis")?.classList.remove("hidden");
}

function closeMatch() {
  $("#matchAnalysis")?.classList.add("hidden");
  $("#matchesSection")?.classList.remove("hidden");
  $("#homeSection")?.classList.remove("hidden");

  selectedMatch = null;
}

function calculatePotentialReturn() {
  const stake = Number($("#analysisStake")?.value || 0);
  const odds = Number(selectedMatch?.odds || 0);

  const potentialReturn = stake * odds;
  const potentialProfit = potentialReturn - stake;

  const returnElement = $("#potentialReturn");
  const profitElement = $("#potentialProfit");

  if (returnElement) {
    returnElement.textContent = formatMoney(potentialReturn);
  }

  if (profitElement) {
    profitElement.textContent = formatMoney(potentialProfit);
  }
}

async function confirmAnalysisBet() {
  if (!currentUser) {
    showToast("Faça login primeiro.", "error");
    return;
  }

  if (!selectedMatch) {
    showToast("Selecione uma partida.", "error");
    return;
  }

  const stake = Number($("#analysisStake")?.value || 0);
  const notes = $("#analysisNotes")?.value || "";

  if (stake <= 0) {
    showToast("Informe o valor da aposta.", "error");
    return;
  }

  const bet = {
    user_id: currentUser.id,
    league: selectedMatch.league || null,
    home_team: selectedMatch.home_team || "",
    away_team: selectedMatch.away_team || "",
    match_date: selectedMatch.match_date || null,
    market: selectedMatch.market || "Resultado",
    selection: selectedMatch.selection || "",
    odds: Number(selectedMatch.odds || 0),
    stake,
    result: "PENDING",
    profit: 0,
    notes
  };

  try {
    await createBet(bet);

    showToast("Aposta registrada.", "success");

    $("#analysisStake").value = "";
    $("#analysisNotes").value = "";

    await loadBets();
    closeMatch();
  } catch (error) {
    console.error(error);
    showToast("Erro ao registrar aposta.", "error");
  }
}

function scrollToTop() {
  $("#homeSection")?.scrollIntoView({
    behavior: "smooth"
  });
}

function scrollToMatches() {
  $("#matchesSection")?.scrollIntoView({
    behavior: "smooth"
  });
}

function scrollToBets() {
  $("#betsSection")?.scrollIntoView({
    behavior: "smooth"
  });
}

function scrollToGoal() {
  $("#goalSection")?.scrollIntoView({
    behavior: "smooth"
  });
}

function setupEvents() {
  $("#loginForm")?.addEventListener("submit", handleLogin);
  $("#registerForm")?.addEventListener("submit", handleRegister);
}

async function initialize() {
  setupEvents();

  try {
    currentUser = await getCurrentUser();

    if (currentUser) {
      await loadDashboard();
      showApp();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error(error);
    showLogin();
  }

  loadMatches();
}

window.login = handleLogin;
window.register = handleRegister;
window.logout = logout;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.changeMatchDay = changeMatchDay;
window.closeMatch = closeMatch;
window.calculatePotentialReturn = calculatePotentialReturn;
window.confirmAnalysisBet = confirmAnalysisBet;
window.setFilter = setFilter;
window.showGoalForm = showGoalForm;
window.hideGoalForm = hideGoalForm;
window.saveGoal = saveGoal;
window.scrollToTop = scrollToTop;
window.scrollToMatches = scrollToMatches;
window.scrollToBets = scrollToBets;
window.scrollToGoal = scrollToGoal;

document.addEventListener("DOMContentLoaded", initialize);
