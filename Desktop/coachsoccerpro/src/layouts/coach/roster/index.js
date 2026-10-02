import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import RosterImport from "components/RosterImport";
import VuiAvatar from "components/VuiAvatar";
import VuiBadge from "components/VuiBadge";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Custom components
import PlayerCard from "components/PlayerCard";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

// Icons
import { IoAdd, IoSearch, IoEllipsisVertical } from "react-icons/io5";

function CoachRoster() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const navigate = useNavigate();
  const { teamData } = useAuth();

  const [players, setPlayers] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'cards'
  const [panelPlayer, setPanelPlayer] = useState(null);
  const [smInput, setSmInput] = useState("");
  const [smSaving, setSmSaving] = useState(false);
  const [smSaved, setSmSaved] = useState(false);

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id) {
      fetchPlayers();
    }
  }, [teamData]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select(`
          *,
          parent:parents(
            id,
            email,
            phone,
            user:users(first_name, last_name, email, phone)
          ),
          badges:player_badges(
            badge:badge_definitions(key, icon, category)
          )
        `)
        .eq("team_id", teamData.id)
        .order("first_name");

      if (error) throw error;

      // Process players to add badge count and top badges
      const processedPlayers = data.map((player) => ({
        ...player,
        badgeCount: player.badges?.length || 0,
        topBadges: player.badges?.slice(0, 3).map((b) => b.badge) || [],
      }));

      setPlayers(processedPlayers);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter((player) =>
    `${player.first_name} ${player.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleMenuOpen = (event, player) => {
    event.stopPropagation();
    setSelectedPlayer(player);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPlayer(null);
  };

  const handlePlayerClick = (player) => {
    setPanelPlayer(player);
    setSmInput(player.sm_user_id || "");
    setSmSaved(false);
  };

  const closePanel = () => {
    setPanelPlayer(null);
    setSmInput("");
    setSmSaved(false);
  };

  const handleSmSave = async () => {
    if (!panelPlayer) return;
    const val = smInput.trim().toUpperCase();
    setSmSaving(true);
    try {
      await supabase
        .from("players")
        .update({ sm_user_id: val || null })
        .eq("id", panelPlayer.id);
      setPlayers(prev => prev.map(p =>
        p.id === panelPlayer.id ? { ...p, sm_user_id: val || null } : p
      ));
      setPanelPlayer(prev => ({ ...prev, sm_user_id: val || null }));
      setSmSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSmSaving(false);
    }
  };

  const handleInviteParent = async () => {
    if (!selectedPlayer) return;
    // TODO: Implement parent invite
    handleMenuClose();
  };

  const handleArchivePlayer = async () => {
    if (!selectedPlayer) return;
    // TODO: Implement archive
    handleMenuClose();
  };

  const getPositionColor = (position) => {
    switch (position?.toLowerCase()) {
      case "goalkeeper":
        return "warning";
      case "defender":
        return "info";
      case "midfielder":
        return "success";
      case "forward":
      case "striker":
      case "winger":
        return "error";
      default:
        return "secondary";
    }
  };

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0075FF&color=fff&size=100`;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              {t("coach:roster.title")}
            </VuiTypography>
            <VuiTypography variant="body2" color="text">
              {t("coach:roster.playerCount", { count: players.length })}
            </VuiTypography>
          </VuiBox>
          <VuiBox display="flex" gap={1}>
            <VuiButton
              color="warning"
              variant="outlined"
              onClick={() => setImportOpen(true)}
              startIcon={<Icon>upload_file</Icon>}
            >
              {t("coach:roster.import", "Import")}
            </VuiButton>
            <VuiButton
              color="info"
              onClick={() => navigate("/coach/roster/add")}
              startIcon={<IoAdd />}
            >
              {t("coach:roster.addPlayer")}
            </VuiButton>
          </VuiBox>
        </VuiBox>
        <RosterImport open={importOpen} onClose={() => setImportOpen(false)} onImported={() => fetchPlayers()} />

        {/* Search & View Toggle */}
        <VuiBox display="flex" gap={2} mb={3}>
          <VuiBox flex={1}>
            <VuiInput
              placeholder={t("coach:roster.searchPlayers")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={{ component: <IoSearch />, direction: "left" }}
            />
          </VuiBox>
          <VuiBox display="flex" gap={1}>
            <VuiButton
              variant={viewMode === "list" ? "contained" : "outlined"}
              color="info"
              size="small"
              onClick={() => setViewMode("list")}
            >
              <Icon>view_list</Icon>
            </VuiButton>
            <VuiButton
              variant={viewMode === "cards" ? "contained" : "outlined"}
              color="info"
              size="small"
              onClick={() => setViewMode("cards")}
            >
              <Icon>grid_view</Icon>
            </VuiButton>
          </VuiBox>
        </VuiBox>

        {/* Loading State */}
        {loading ? (
          <VuiBox display="flex" justifyContent="center" py={5}>
            <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
          </VuiBox>
        ) : filteredPlayers.length === 0 ? (
          /* Empty State */
          <Card>
            <VuiBox p={5} textAlign="center">
              <VuiTypography variant="h1" mb={2}>
                ⚽
              </VuiTypography>
              <VuiTypography variant="h5" color="white" mb={1}>
                {searchTerm
                  ? language === "es"
                    ? "No se encontraron jugadores"
                    : "No players found"
                  : t("coach:roster.noPlayers")}
              </VuiTypography>
              {!searchTerm && (
                <VuiButton
                  color="info"
                  onClick={() => navigate("/coach/roster/add")}
                  sx={{ mt: 2 }}
                >
                  {t("coach:roster.addPlayer")}
                </VuiButton>
              )}
            </VuiBox>
          </Card>
        ) : viewMode === "cards" ? (
          /* Cards View */
          <Grid container spacing={3}>
            {filteredPlayers.map((player) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={player.id}>
                <VuiBox
                  sx={{ cursor: "pointer" }}
                  onClick={() => handlePlayerClick(player)}
                >
                  <PlayerCard player={player} size="medium" showStats={false} />
                </VuiBox>
              </Grid>
            ))}
          </Grid>
        ) : (
          /* List View */
          <Card>
            <VuiBox>
              {filteredPlayers.map((player, index) => (
                <VuiBox
                  key={player.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={2}
                  sx={{
                    borderBottom:
                      index < filteredPlayers.length - 1
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                  onClick={() => handlePlayerClick(player)}
                >
                  {/* Player Info */}
                  <VuiBox display="flex" alignItems="center" gap={2}>
                    <VuiAvatar
                      src={player.avatar_url || defaultAvatar(`${player.first_name} ${player.last_name}`)}
                      alt={player.first_name}
                      size="md"
                      sx={{
                        border: `2px solid ${
                          player.card_frame === "gold"
                            ? "#FFD700"
                            : player.card_frame === "silver"
                            ? "#C0C0C0"
                            : player.card_frame === "platinum"
                            ? "#E5E4E2"
                            : player.card_frame === "diamond"
                            ? "#B9F2FF"
                            : "#CD7F32"
                        }`,
                      }}
                    />
                    <VuiBox>
                      <VuiTypography variant="button" color="white" fontWeight="bold">
                        {player.first_name} {player.last_name}
                        {player.jersey_number && (
                          <VuiTypography
                            component="span"
                            variant="caption"
                            color="text"
                            ml={1}
                          >
                            #{player.jersey_number}
                          </VuiTypography>
                        )}
                      </VuiTypography>
                      <VuiBox display="flex" alignItems="center" gap={1}>
                        <VuiBadge
                          badgeContent={player.position || "Player"}
                          color={getPositionColor(player.position)}
                          size="xs"
                          container
                        />
                        {player.attendance_streak > 0 && (
                          <VuiTypography variant="caption" color="warning">
                            🔥 {player.attendance_streak}
                          </VuiTypography>
                        )}
                      </VuiBox>
                    </VuiBox>
                  </VuiBox>

                  {/* Stats & Actions */}
                  <VuiBox display="flex" alignItems="center" gap={3}>
                    {/* Points */}
                    <VuiBox textAlign="center" display={{ xs: "none", md: "block" }}>
                      <VuiTypography variant="h6" color="white">
                        {player.total_points || 0}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        pts
                      </VuiTypography>
                    </VuiBox>

                    {/* Badges */}
                    <VuiBox textAlign="center" display={{ xs: "none", md: "block" }}>
                      <VuiTypography variant="h6" color="white">
                        {player.badgeCount}
                      </VuiTypography>
                      <VuiTypography variant="caption" color="text">
                        {language === "es" ? "insignias" : "badges"}
                      </VuiTypography>
                    </VuiBox>

                    {/* Top Badges Icons */}
                    <VuiBox display={{ xs: "none", lg: "flex" }} gap={0.5}>
                      {player.topBadges.map((badge, i) => (
                        <VuiBox
                          key={i}
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "8px",
                            background: "rgba(255, 255, 255, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                          }}
                        >
                          {badge?.icon || "🏅"}
                        </VuiBox>
                      ))}
                    </VuiBox>

                    {/* SM Link indicator */}
                    {player.sm_user_id && (
                      <VuiBox display={{ xs: "none", sm: "flex" }} alignItems="center" gap="4px">
                        <span style={{ fontSize: 10, background: "rgba(249,115,22,.15)", color: "#f97316", borderRadius: 20, padding: "2px 8px", fontWeight: 700, fontFamily: "Inter,sans-serif", border: "1px solid rgba(249,115,22,.3)" }}>
                          ⚽ SM
                        </span>
                      </VuiBox>
                    )}

                    {/* Parent Status */}
                    <VuiBox display={{ xs: "none", sm: "block" }}>
                      {player.parent?.user ? (
                        <VuiBadge
                          badgeContent={language === "es" ? "Conectado" : "Connected"}
                          color="success"
                          size="xs"
                          container
                        />
                      ) : (
                        <VuiBadge
                          badgeContent={language === "es" ? "Sin padre" : "No parent"}
                          color="warning"
                          size="xs"
                          container
                        />
                      )}
                    </VuiBox>

                    {/* Menu */}
                    <VuiBox
                      onClick={(e) => handleMenuOpen(e, player)}
                      sx={{ cursor: "pointer", p: 1 }}
                    >
                      <IoEllipsisVertical color="white" />
                    </VuiBox>
                  </VuiBox>
                </VuiBox>
              ))}
            </VuiBox>
          </Card>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              background: "linear-gradient(135deg, rgba(6, 11, 40, 0.94) 0%, rgba(10, 14, 35, 0.79) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <MenuItem onClick={() => navigate(`/coach/roster/${selectedPlayer?.id}`)}>
            <VuiTypography variant="button" color="white">
              {language === "es" ? "Ver Detalles" : "View Details"}
            </VuiTypography>
          </MenuItem>
          <MenuItem onClick={() => navigate(`/coach/roster/${selectedPlayer?.id}/edit`)}>
            <VuiTypography variant="button" color="white">
              {t("common:buttons.edit")}
            </VuiTypography>
          </MenuItem>
          <MenuItem onClick={handleInviteParent}>
            <VuiTypography variant="button" color="info">
              {t("coach:roster.inviteParent")}
            </VuiTypography>
          </MenuItem>
          <MenuItem onClick={() => navigate(`/coach/badges/award?player=${selectedPlayer?.id}`)}>
            <VuiTypography variant="button" color="warning">
              {t("coach:dashboard.awardBadge")}
            </VuiTypography>
          </MenuItem>
          <MenuItem onClick={handleArchivePlayer}>
            <VuiTypography variant="button" color="error">
              {t("coach:roster.archivePlayer")}
            </VuiTypography>
          </MenuItem>
        </Menu>

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>

    {/* Player detail slide panel */}
    {panelPlayer && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1300,
        display: "flex", justifyContent: "flex-end",
      }}>
        {/* Backdrop */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)" }} onClick={closePanel} />

        {/* Panel */}
        <div style={{
          position: "relative", width: 360, maxWidth: "100vw",
          background: "linear-gradient(135deg, #0f0c29 0%, #1a1740 100%)",
          borderLeft: "1px solid rgba(255,255,255,.1)",
          display: "flex", flexDirection: "column",
          boxShadow: "-20px 0 60px rgba(0,0,0,.5)",
          overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={panelPlayer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(panelPlayer.first_name + " " + panelPlayer.last_name)}&background=0075FF&color=fff&size=100`}
                alt={panelPlayer.first_name}
                style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(249,115,22,.4)" }}
              />
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "Inter,sans-serif" }}>
                  {panelPlayer.first_name} {panelPlayer.last_name}
                  {panelPlayer.jersey_number && <span style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginLeft: 6 }}>#{panelPlayer.jersey_number}</span>}
                </div>
                <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontFamily: "Inter,sans-serif" }}>
                  {panelPlayer.position || (language === "es" ? "Sin posición" : "No position")}
                </div>
              </div>
            </div>
            <button onClick={closePanel} style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 0, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            {[
              { label: language === "es" ? "Puntos" : "Points", val: panelPlayer.total_points || 0 },
              { label: language === "es" ? "Insignias" : "Badges", val: panelPlayer.badgeCount || 0 },
              { label: language === "es" ? "Racha" : "Streak", val: panelPlayer.attendance_streak || 0 },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, fontFamily: "Inter,sans-serif" }}>{s.val}</div>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10, fontFamily: "Inter,sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* SoccerMental ID section */}
          <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: "#f97316", fontWeight: 700, fontSize: 12, fontFamily: "Inter,sans-serif", marginBottom: 2 }}>
                ⚽ {language === "es" ? "ID de SoccerMental" : "SoccerMental Family ID"}
              </div>
              <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, fontFamily: "Inter,sans-serif", lineHeight: 1.5 }}>
                {language === "es"
                  ? "Pide al padre que te comparta su ID de familia de SoccerMental (ej. SM-AD28F6B8)"
                  : "Ask the parent to share their SoccerMental family ID (e.g. SM-AD28F6B8)"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={smInput}
                onChange={e => { setSmInput(e.target.value.toUpperCase()); setSmSaved(false); }}
                placeholder="SM-XXXXXXXX"
                maxLength={20}
                style={{
                  flex: 1, background: "rgba(255,255,255,.08)",
                  border: panelPlayer.sm_user_id ? "1px solid rgba(249,115,22,.4)" : "1px solid rgba(255,255,255,.15)",
                  borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13,
                  fontFamily: "monospace", outline: "none",
                }}
              />
              <button
                onClick={handleSmSave}
                disabled={smSaving || smInput.trim() === (panelPlayer.sm_user_id || "")}
                style={{
                  background: smSaved ? "#22c55e" : "#f97316",
                  border: "none", borderRadius: 8, padding: "8px 14px",
                  color: "#000", fontWeight: 700, fontSize: 12,
                  cursor: smSaving ? "wait" : "pointer", fontFamily: "Inter,sans-serif",
                  opacity: smInput.trim() === (panelPlayer.sm_user_id || "") ? 0.4 : 1,
                  transition: "background .2s",
                }}
              >
                {smSaved ? (language === "es" ? "✓ Guardado" : "✓ Saved") : (smSaving ? "..." : (language === "es" ? "Guardar" : "Save"))}
              </button>
            </div>
            {panelPlayer.sm_user_id && (
              <div style={{ marginTop: 8, color: "#22c55e", fontSize: 11, fontFamily: "Inter,sans-serif" }}>
                ✓ {language === "es" ? "Vinculado:" : "Linked:"} {panelPlayer.sm_user_id}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => { closePanel(); navigate(`/coach/roster/${panelPlayer.id}`); }}
              style={{
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 8, padding: "10px 16px", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif", textAlign: "left",
              }}
            >
              {language === "es" ? "Ver perfil completo →" : "View full profile →"}
            </button>
            <button
              onClick={() => { closePanel(); navigate(`/coach/messages?player=${panelPlayer.id}`); }}
              style={{
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 8, padding: "10px 16px", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif", textAlign: "left",
              }}
            >
              {language === "es" ? "Enviar mensaje →" : "Send message →"}
            </button>
          </div>
        </div>
      </div>
    )}
  );
}

export default CoachRoster;
