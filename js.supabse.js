const SUPABASE_URL = "https://lvdknawajdktnfuzlllp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Mb_5x7t0UFvzbd-Tup9E_w_lDflmVbM";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error(error);
    return null;
  }

  return user;
}

async function getProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

async function getBets() {
  const user = await getCurrentUser();

  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("bets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

async function createBet(bet) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabaseClient
    .from("bets")
    .insert({
      user_id: user.id,
      league: bet.league || null,
      home_team: bet.home_team,
      away_team: bet.away_team,
      match_date: bet.match_date || null,
      market: bet.market,
      selection: bet.selection || null,
      odds: Number(bet.odds),
      stake: Number(bet.stake),
      result: bet.result || "PENDING",
      profit: Number(bet.profit || 0),
      notes: bet.notes || null
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateBetResult(betId, result, profit) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabaseClient
    .from("bets")
    .update({
      result,
      profit: Number(profit)
    })
    .eq("id", betId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function deleteBet(betId) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { error } = await supabaseClient
    .from("bets")
    .delete()
    .eq("id", betId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return true;
}

async function getGoal() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
    return null;
  }

  return data?.[0] || null;
}

async function createGoal(name, target, currentValue = 0) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabaseClient
    .from("goals")
    .insert({
      user_id: user.id,
      name,
      target: Number(target),
      current_value: Number(currentValue)
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateGoal(goalId, name, target, currentValue) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data, error } = await supabaseClient
    .from("goals")
    .update({
      name,
      target: Number(target),
      current_value: Number(currentValue)
    })
    .eq("id", goalId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

async function signUp(email, password, nickname) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    throw error;
  }
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  window.dispatchEvent(
    new CustomEvent("axion-auth-change", {
      detail: {
        event,
        session
      }
    })
  );
});