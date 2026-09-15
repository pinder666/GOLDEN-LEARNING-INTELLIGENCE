/**
 * SEATS — the coach's money screen. Everything here is DISPLAYED from
 * SoccerMental's Pipe B pushes; CSP never computes money (ruled).
 * Window, not control room: five fields per kid, see never touch.
 * Lean per the depth-cap ruling.
 */
import { useState, useEffect } from "react";
import { useLang } from "useLang";
import Card from "@mui/material/Card";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";
import { DEV_MODE } from "devMode";

const FEE = 99;
// SM's ladder_state object is authoritative: {rung, seats_active, seats_to_next}
const RUNG_NEXT = {
  none: { at: 20, en: "your fee reaches $0", es: "tu cuota llega a $0" },
  fee_zero: { at: 35, en: "free assistant-coach seat", es: "asiento gratis de asistente" },
  assistant_seat: { at: 50, en: "your club on the stadium boards", es: "tu club en las vallas del estadio" },
  boards_founding: null, // top of the ladder
};

// SM final spec: 9-field progress_card, status trial|active|churned,
// founding = boolean on the seat, last_active is a bucket string.
const pc = (o) => ({ latest_badge: null, stage_label: "", from_your_coach: { assigned: 0, opened: 0 }, ...o });
const DEMO_CACHE = {
  as_of: new Date().toISOString(),
  seat_count_active: 9,
  offset_usd: 45,
  ladder_state: { rung: "none", seats_active: 9, seats_to_next: 11 },
  seats: [
    { player_ref: "SM-8A3F02B41C9D", founding: true, progress_card: pc({ player_alias: "Marcus J.", status: "active", days_sealed: 34, current_streak: 6, last_active: "today", sessions_this_week: 4, latest_badge: "Perfect Week", stage_label: "Foundation — Day 5", from_your_coach: { assigned: 2, opened: 2 } }) },
    { player_ref: "SM-22C10FE97A55", founding: true, progress_card: pc({ player_alias: "Sofia G.", status: "active", days_sealed: 41, current_streak: 12, last_active: "today", sessions_this_week: 5, latest_badge: "Iron Will", stage_label: "First Team" }) },
    { player_ref: "SM-99D21B6E4F08", founding: false, progress_card: pc({ player_alias: "Liam S.", status: "trial", days_sealed: 3, current_streak: 3, last_active: "today", sessions_this_week: 3, stage_label: "Preseason — Day 3" }) },
    { player_ref: "SM-4470AC55D2E1", founding: true, progress_card: pc({ player_alias: "Emma W.", status: "active", days_sealed: 27, current_streak: 0, last_active: "quiet 2+ weeks", sessions_this_week: 0, latest_badge: "First Goal", stage_label: "Foundation — Day 7" }) },
    { player_ref: "SM-1183FE09B7C2", founding: true, progress_card: pc({ player_alias: "Noah B.", status: "active", days_sealed: 19, current_streak: 2, last_active: "this week", sessions_this_week: 2, stage_label: "Foundation — Day 4" }) },
    { player_ref: "SM-7752D3A18E64", founding: true, progress_card: pc({ player_alias: "Olivia D.", status: "active", days_sealed: 22, current_streak: 4, last_active: "today", sessions_this_week: 3, stage_label: "Foundation — Day 6" }) },
    { player_ref: "SM-3319B8C4F1D7", founding: false, progress_card: pc({ player_alias: "Ava M.", status: "trial", days_sealed: 1, current_streak: 1, last_active: "today", sessions_this_week: 1, stage_label: "Preseason — Day 1" }) },
    { player_ref: "SM-6604E2F91A3B", founding: true, progress_card: pc({ player_alias: "Ethan T.", status: "active", days_sealed: 15, current_streak: 5, last_active: "today", sessions_this_week: 4, stage_label: "Foundation — Day 3" }) },
    { player_ref: "SM-5588C7D20B9E", founding: true, progress_card: pc({ player_alias: "Mia R.", status: "active", days_sealed: 30, current_streak: 9, last_active: "today", sessions_this_week: 5, latest_badge: "Most Improved", stage_label: "Foundation — Day 7" }) },
  ],
};

function Seats() {
  const [lang] = useLang();
  const { coachData } = useAuth();
  const [cache, setCache] = useState(null);
  const [handGift, setHandGift] = useState(false);

  const t = (en, es) => (lang === "es" ? es : en);

  useEffect(() => {
    if (DEV_MODE) {
      setCache(DEMO_CACHE);
      return;
    }
    if (!coachData?.id) return;
    supabase.from("sm_roster_cache").select("*").eq("coach_id", coachData.id).maybeSingle()
      .then(({ data }) => setCache(data || { seat_count_active: 0, offset_usd: 0, seats: [] }));
    supabase.from("coach_billing").select("hand_gift").eq("coach_id", coachData.id).maybeSingle()
      .then(({ data }) => setHandGift(!!data?.hand_gift));
  }, [coachData]);

  const seats = cache?.seats || [];
  const ladder = cache?.ladder_state || { rung: "none", seats_active: cache?.seat_count_active ?? 0, seats_to_next: null };
  const count = ladder.seats_active ?? cache?.seat_count_active ?? 0;
  const offset = Number(cache?.offset_usd ?? 0);
  const due = handGift ? 0 : Math.max(0, FEE - offset);
  const nextRung = RUNG_NEXT[ladder.rung] ?? null;
  const savings = count * 10; // $10/mo team-rate value per family — the pitch line

  // SM sends last_active as a bucket string; "quiet" is the nudge trigger
  const quiet = (card) => (card?.last_active || "").includes("quiet");

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", overflow: "hidden" }}>

        {/* Header */}
        <VuiBox mb={1} sx={{ flexShrink: 0 }}>
          <VuiTypography variant="h5" color="white" fontWeight="bold">
            {t("Seats", "Asientos")}
          </VuiTypography>
          <VuiTypography variant="caption" color="text">
            {t("Families on your code — their training, your fee.", "Familias con tu código — su entrenamiento, tu cuota.")}
          </VuiTypography>
        </VuiBox>

        {/* Fee + ladder row */}
        <VuiBox display="flex" gap="12px" mb={1.5} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
          <Card sx={{ flex: 1, minWidth: 260 }}>
            <VuiBox p={2}>
              <VuiTypography variant="caption" color="text" sx={{ textTransform: "uppercase", fontSize: 10, letterSpacing: ".06em" }}>
                {t("Your fee this month", "Tu cuota este mes")}
              </VuiTypography>
              <VuiBox display="flex" alignItems="baseline" gap="10px" mt={0.5}>
                <VuiTypography variant="h3" color="white" fontWeight="bold">
                  ${due}
                </VuiTypography>
                {!handGift && offset > 0 && (
                  <VuiTypography variant="button" sx={{ color: "#f97316", fontWeight: 700 }}>
                    ${FEE} − ${offset}
                  </VuiTypography>
                )}
                {handGift && (
                  <VuiTypography variant="caption" color="text">
                    {t("adjusted", "ajustado")}
                  </VuiTypography>
                )}
              </VuiBox>
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: 0.5 }}>
                {t(
                  `${count} active families · you've put $${savings}/mo back in your parents' pockets`,
                  `${count} familias activas · has devuelto $${savings}/mes a los bolsillos de tus padres`
                )}
              </VuiTypography>
            </VuiBox>
          </Card>

          <Card sx={{ flex: 1.4, minWidth: 300 }}>
            <VuiBox p={2}>
              <VuiTypography variant="caption" color="text" sx={{ textTransform: "uppercase", fontSize: 10, letterSpacing: ".06em" }}>
                {t("Next rung", "Siguiente peldaño")}
              </VuiTypography>
              {nextRung ? (
                <>
                  <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mt: 0.5 }}>
                    {count} / {nextRung.at} — {lang === "es" ? nextRung.es : nextRung.en}
                  </VuiTypography>
                  <VuiBox sx={{ mt: 1, height: 10, borderRadius: 5, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
                    <VuiBox sx={{
                      width: `${Math.min(100, (count / nextRung.at) * 100)}%`, height: "100%",
                      background: "linear-gradient(90deg,#f97316,#22d3ee)",
                    }} />
                  </VuiBox>
                </>
              ) : (
                <VuiTypography variant="button" sx={{ color: "#fbbf24", fontWeight: 800, display: "block", mt: 0.5 }}>
                  🏟 {t("Top of the ladder — your club is on the boards", "Cima de la escalera — tu club está en las vallas")}
                </VuiTypography>
              )}
            </VuiBox>
          </Card>
        </VuiBox>

        {/* Seat cards — the window, never a control room */}
        <VuiBox sx={{
          flex: 1, minHeight: 0, overflowY: "auto",
          scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: "10px", alignContent: "start",
        }}>
          {seats.length === 0 && (
            <VuiTypography variant="caption" color="text" sx={{ gridColumn: "1/-1", py: 4, textAlign: "center" }}>
              {t(
                "No families yet — share your Team Code (Settings) and this page fills itself.",
                "Aún sin familias — comparte tu Código de Equipo (Ajustes) y esta página se llena sola."
              )}
            </VuiTypography>
          )}
          {seats.map((s) => {
            const c = s.progress_card || {};
            const status = c.status || s.status || "active";
            const isQuiet = quiet(c);
            const chip =
              status === "trial"
                ? { bg: "rgba(96,165,250,.15)", col: "#60a5fa", label: t("TRIAL", "PRUEBA") }
                : status === "churned"
                ? { bg: "rgba(255,255,255,.08)", col: "rgba(255,255,255,.4)", label: t("LEFT", "SE FUE") }
                : { bg: "rgba(249,115,22,.15)", col: "#f97316", label: t("ACTIVE", "ACTIVA") };
            return (
              <VuiBox key={s.player_ref} sx={{
                background: "rgba(255,255,255,.04)",
                border: `1px solid ${isQuiet ? "rgba(251,191,36,.4)" : "rgba(255,255,255,.08)"}`,
                borderRadius: "12px", padding: "12px 14px",
                opacity: status === "churned" ? 0.55 : 1,
              }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <VuiTypography variant="button" color="white" fontWeight="bold">
                    {c.player_alias || s.player_alias}
                    {s.founding && <span title={t("Founding family", "Familia fundadora")} style={{ marginLeft: 6, fontSize: 10 }}>⭐</span>}
                  </VuiTypography>
                  <span style={{
                    fontSize: 9, fontWeight: 800, borderRadius: 10, padding: "2px 8px",
                    background: chip.bg, color: chip.col, textTransform: "uppercase",
                  }}>
                    {chip.label}
                  </span>
                </VuiBox>
                {c.stage_label && (
                  <VuiTypography variant="caption" sx={{ color: "rgba(255,255,255,.45)", fontSize: 9.5, display: "block", mb: 0.75 }}>
                    {c.stage_label}{c.latest_badge ? ` · 🏅 ${c.latest_badge}` : ""}
                  </VuiTypography>
                )}
                <VuiBox display="flex" gap="12px" flexWrap="wrap">
                  {[
                    [c.days_sealed ?? 0, t("days sealed", "días sellados")],
                    [`🔥 ${c.current_streak ?? 0}`, t("streak", "racha")],
                    [c.sessions_this_week ?? 0, t("this week", "esta semana")],
                    [`${c.from_your_coach?.opened ?? 0}/${c.from_your_coach?.assigned ?? 0}`, t("your drills", "tus ejercicios")],
                  ].map(([v, l], i) => (
                    <VuiBox key={i} textAlign="center">
                      <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", fontSize: 14 }}>
                        {v}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text" sx={{ fontSize: 9 }}>
                        {l}
                      </VuiTypography>
                    </VuiBox>
                  ))}
                </VuiBox>
                {isQuiet && (
                  <VuiTypography variant="caption" sx={{ color: "#fbbf24", fontSize: 10, display: "block", mt: 1 }}>
                    {t("Quiet lately — a word from you goes a long way", "Callado últimamente — una palabra tuya vale mucho")}
                  </VuiTypography>
                )}
              </VuiBox>
            );
          })}
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default Seats;
