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
// Ladder rungs (display only; SM's ladder_state string wins when present)
const RUNGS = [
  { at: 20, en: "your fee reaches $0", es: "tu cuota llega a $0" },
  { at: 35, en: "free assistant-coach seat", es: "asiento gratis de asistente" },
  { at: 50, en: "your club on the stadium boards", es: "tu club en las vallas del estadio" },
];

const DEMO_CACHE = {
  as_of: new Date().toISOString(),
  seat_count_active: 9,
  offset_usd: 45,
  ladder_state: "climbing",
  seats: [
    { player_ref: "PLR-8347", player_alias: "Marcus J.", status: "founding", progress_card: { days_sealed: 34, current_streak: 6, preseason_status: "graduated", last_sealed_date: "2026-09-13", sessions_this_week: 4 } },
    { player_ref: "PLR-2210", player_alias: "Sofia G.", status: "founding", progress_card: { days_sealed: 41, current_streak: 12, preseason_status: "graduated", last_sealed_date: "2026-09-14", sessions_this_week: 5 } },
    { player_ref: "PLR-9921", player_alias: "Liam S.", status: "preseason", progress_card: { days_sealed: 3, current_streak: 3, preseason_status: "day 3 of 7", last_sealed_date: "2026-09-14", sessions_this_week: 3 } },
    { player_ref: "PLR-4470", player_alias: "Emma W.", status: "founding", progress_card: { days_sealed: 27, current_streak: 0, preseason_status: "graduated", last_sealed_date: "2026-09-08", sessions_this_week: 0 } },
    { player_ref: "PLR-1183", player_alias: "Noah B.", status: "founding", progress_card: { days_sealed: 19, current_streak: 2, preseason_status: "graduated", last_sealed_date: "2026-09-13", sessions_this_week: 2 } },
    { player_ref: "PLR-7752", player_alias: "Olivia D.", status: "founding", progress_card: { days_sealed: 22, current_streak: 4, preseason_status: "graduated", last_sealed_date: "2026-09-14", sessions_this_week: 3 } },
    { player_ref: "PLR-3319", player_alias: "Ava M.", status: "preseason", progress_card: { days_sealed: 1, current_streak: 1, preseason_status: "day 1 of 7", last_sealed_date: "2026-09-14", sessions_this_week: 1 } },
    { player_ref: "PLR-6604", player_alias: "Ethan T.", status: "founding", progress_card: { days_sealed: 15, current_streak: 5, preseason_status: "graduated", last_sealed_date: "2026-09-14", sessions_this_week: 4 } },
    { player_ref: "PLR-5588", player_alias: "Mia R.", status: "founding", progress_card: { days_sealed: 30, current_streak: 9, preseason_status: "graduated", last_sealed_date: "2026-09-14", sessions_this_week: 5 } },
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
  const count = cache?.seat_count_active ?? 0;
  const offset = Number(cache?.offset_usd ?? 0);
  const due = handGift ? 0 : Math.max(0, FEE - offset);
  const nextRung = RUNGS.find((r) => count < r.at);
  const savings = count * 10; // $10/mo team-rate value per family — the pitch line

  const quiet = (card) => {
    const d = card?.last_sealed_date ? (Date.now() - new Date(card.last_sealed_date)) / 86400000 : 99;
    return d >= 5;
  };

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
                  <VuiTypography variant="button" sx={{ color: "#4ade80", fontWeight: 700 }}>
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
                      background: "linear-gradient(90deg,#4ade80,#22d3ee)",
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
            const isQuiet = quiet(c);
            return (
              <VuiBox key={s.player_ref} sx={{
                background: "rgba(255,255,255,.04)",
                border: `1px solid ${isQuiet ? "rgba(251,191,36,.4)" : "rgba(255,255,255,.08)"}`,
                borderRadius: "12px", padding: "12px 14px",
              }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <VuiTypography variant="button" color="white" fontWeight="bold">
                    {s.player_alias}
                  </VuiTypography>
                  <span style={{
                    fontSize: 9, fontWeight: 800, borderRadius: 10, padding: "2px 8px",
                    background: s.status === "preseason" ? "rgba(96,165,250,.15)" : "rgba(74,222,128,.15)",
                    color: s.status === "preseason" ? "#60a5fa" : "#4ade80",
                    textTransform: "uppercase",
                  }}>
                    {s.status === "preseason" ? (c.preseason_status || "preseason") : s.status}
                  </span>
                </VuiBox>
                <VuiBox display="flex" gap="12px" flexWrap="wrap">
                  {[
                    [c.days_sealed ?? 0, t("days sealed", "días sellados")],
                    [`🔥 ${c.current_streak ?? 0}`, t("streak", "racha")],
                    [c.sessions_this_week ?? 0, t("this week", "esta semana")],
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
