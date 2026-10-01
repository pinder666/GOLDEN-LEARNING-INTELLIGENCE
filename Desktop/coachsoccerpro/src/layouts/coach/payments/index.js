import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Modal from "@mui/material/Modal";
import IconButton from "@mui/material/IconButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiInput from "components/VuiInput";
import VuiSwitch from "components/VuiSwitch";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Icons
import { IoAdd, IoClose, IoWallet, IoCheckmarkCircle, IoTime, IoAlert } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

function CoachPayments() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const { teamData, coachData } = useAuth();

  const [paymentRequests, setPaymentRequests] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [stripeConnected, setStripeConnected] = useState(false);

  // Create request modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: "",
    amount: "",
    due_date: "",
    description: "",
    allow_partial: false,
    send_to: "all", // 'all' or array of player ids
  });
  const [creating, setCreating] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id) {
      fetchData();
      checkStripeConnection();
    }
  }, [teamData]);

  const fetchData = async () => {
    try {
      // Fetch payment requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("payment_requests")
        .select(`
          *,
          payments:player_payments(
            id,
            amount_cents,
            status,
            paid_at,
            player:players(first_name, last_name),
            parent:parents(
              email,
              user:users(first_name, last_name)
            )
          )
        `)
        .eq("team_id", teamData.id)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      setPaymentRequests(requestsData || []);

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select(`
          *,
          parent:parents(id)
        `)
        .eq("team_id", teamData.id)
        .eq("is_active", true);

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkStripeConnection = async () => {
    try {
      const { data } = await supabase
        .from("coaches")
        .select("stripe_account_id, stripe_onboarding_complete")
        .eq("id", coachData.id)
        .single();

      setStripeConnected(data?.stripe_onboarding_complete || false);
    } catch (error) {
      console.error("Error checking Stripe:", error);
    }
  };

  const handleConnectStripe = async () => {
    // In production, this would redirect to Stripe Connect onboarding
    // For now, show a message
    alert(
      language === "es"
        ? "La conexión con Stripe se configurará pronto. Por ahora, puedes crear solicitudes de pago."
        : "Stripe connection will be set up soon. For now, you can create payment requests."
    );
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();

    if (!requestForm.title || !requestForm.amount || !requestForm.due_date) {
      return;
    }

    setCreating(true);
    try {
      // Create payment request
      const { data: request, error } = await supabase
        .from("payment_requests")
        .insert([
          {
            team_id: teamData.id,
            created_by_coach_id: coachData.id,
            title: requestForm.title,
            description: requestForm.description || null,
            amount_cents: Math.round(parseFloat(requestForm.amount) * 100),
            due_date: requestForm.due_date,
            allow_partial: requestForm.allow_partial,
            status: "active",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Create individual payment records for each player with a parent
      const playersWithParents = players.filter((p) => p.parent?.id);
      const paymentRecords = playersWithParents.map((player) => ({
        payment_request_id: request.id,
        parent_id: player.parent.id,
        player_id: player.id,
        amount_cents: Math.round(parseFloat(requestForm.amount) * 100),
        status: "pending",
      }));

      if (paymentRecords.length > 0) {
        await supabase.from("player_payments").insert(paymentRecords);
      }

      setShowCreateModal(false);
      setRequestForm({
        title: "",
        amount: "",
        due_date: "",
        description: "",
        allow_partial: false,
        send_to: "all",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setCreating(false);
    }
  };

  const getRequestStats = (request) => {
    const payments = request.payments || [];
    const paid = payments.filter((p) => p.status === "paid");
    const pending = payments.filter((p) => p.status !== "paid");
    const totalCollected = paid.reduce((sum, p) => sum + (p.amount_cents || 0), 0) / 100;

    return {
      paidCount: paid.length,
      pendingCount: pending.length,
      totalCollected,
      totalExpected: (payments.length * (request.amount_cents || 0)) / 100,
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const handleTogglePaid = async (payment) => {
    setUpdatingPaymentId(payment.id);
    try {
      const nowPaid = payment.status !== "paid";
      const { error } = await supabase
        .from("player_payments")
        .update(
          nowPaid
            ? { status: "paid", paid_at: new Date().toISOString() }
            : { status: "pending", paid_at: null }
        )
        .eq("id", payment.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error updating payment:", error);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Calculate totals
  const totalCollected = paymentRequests.reduce((sum, req) => {
    const stats = getRequestStats(req);
    return sum + stats.totalCollected;
  }, 0);

  const totalOutstanding = paymentRequests.reduce((sum, req) => {
    const stats = getRequestStats(req);
    return sum + (stats.totalExpected - stats.totalCollected);
  }, 0);

  const activeRequests = paymentRequests.filter((r) => r.status === "active");
  const completedRequests = paymentRequests.filter((r) => r.status === "completed");

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={1} sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Header */}
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {t("coach:payments.title")}
          </VuiTypography>
          <VuiButton color="info" onClick={() => setShowCreateModal(true)} startIcon={<IoAdd />}>
            {t("coach:payments.createRequest")}
          </VuiButton>
        </VuiBox>

        {/* Stripe Connection Banner */}
        {!stripeConnected && (
          <Card sx={{ mb: 2, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <VuiBox p={3} display="flex" justifyContent="space-between" alignItems="center">
              <VuiBox display="flex" alignItems="center" gap={2}>
                <IoWallet size={32} color="white" />
                <VuiBox>
                  <VuiTypography variant="h6" color="white">
                    {language === "es" ? "Conecta tu cuenta de Stripe" : "Connect your Stripe account"}
                  </VuiTypography>
                  <VuiTypography variant="caption" color="white" sx={{ opacity: 0.8 }}>
                    {language === "es"
                      ? "Recibe pagos directamente en tu cuenta bancaria"
                      : "Receive payments directly to your bank account"}
                  </VuiTypography>
                </VuiBox>
              </VuiBox>
              <VuiButton color="white" onClick={handleConnectStripe}>
                {language === "es" ? "Conectar" : "Connect"}
              </VuiButton>
            </VuiBox>
          </Card>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="caption" color="text" fontWeight="bold">
                  {t("coach:payments.collected")}
                </VuiTypography>
                <VuiTypography variant="h4" color="success">
                  {formatCurrency(totalCollected)}
                </VuiTypography>
              </VuiBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="caption" color="text" fontWeight="bold">
                  {t("coach:payments.outstanding")}
                </VuiTypography>
                <VuiTypography variant="h4" color="warning">
                  {formatCurrency(totalOutstanding)}
                </VuiTypography>
              </VuiBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="caption" color="text" fontWeight="bold">
                  {language === "es" ? "Solicitudes Activas" : "Active Requests"}
                </VuiTypography>
                <VuiTypography variant="h4" color="info">
                  {activeRequests.length}
                </VuiTypography>
              </VuiBox>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 2 }}>
          <VuiBox px={2}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              sx={{
                "& .MuiTab-root": { color: "rgba(255,255,255,0.7)" },
                "& .Mui-selected": { color: "#0075FF" },
                "& .MuiTabs-indicator": { backgroundColor: "#0075FF" },
              }}
            >
              <Tab label={`${language === "es" ? "Activas" : "Active"} (${activeRequests.length})`} />
              <Tab label={`${language === "es" ? "Completadas" : "Completed"} (${completedRequests.length})`} />
            </Tabs>
          </VuiBox>
        </Card>

        {/* Payment Requests List — scrolls internally */}
        <Card sx={{ flex: 1, overflow: "auto" }}>
          <VuiBox p={3}>
            {loading ? (
              <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
            ) : (activeTab === 0 ? activeRequests : completedRequests).length === 0 ? (
              <VuiBox textAlign="center" py={5}>
                <VuiTypography variant="h2" mb={2}>
                  💰
                </VuiTypography>
                <VuiTypography variant="h5" color="white" mb={1}>
                  {language === "es" ? "Sin solicitudes de pago" : "No payment requests"}
                </VuiTypography>
                <VuiTypography variant="body2" color="text" mb={3}>
                  {language === "es"
                    ? "Crea una solicitud para cobrar cuotas o equipamiento"
                    : "Create a request to collect dues or equipment fees"}
                </VuiTypography>
                <VuiButton color="info" onClick={() => setShowCreateModal(true)}>
                  {t("coach:payments.createRequest")}
                </VuiButton>
              </VuiBox>
            ) : (
              <VuiBox>
                {(activeTab === 0 ? activeRequests : completedRequests).map((request) => {
                  const stats = getRequestStats(request);
                  const overdue = isOverdue(request.due_date);

                  return (
                    <VuiBox
                      key={request.id}
                      sx={{
                        p: 3,
                        mb: 2,
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.03)",
                        borderLeft: `4px solid ${
                          overdue ? "#f44336" : stats.pendingCount === 0 ? "#4CAF50" : "#FF9800"
                        }`,
                      }}
                    >
                      <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <VuiBox>
                          <VuiTypography variant="h6" color="white" fontWeight="bold">
                            {request.title}
                          </VuiTypography>
                          <VuiTypography variant="caption" color="text">
                            {language === "es" ? "Vence" : "Due"}: {formatDate(request.due_date)}
                            {overdue && (
                              <VuiTypography component="span" variant="caption" color="error" ml={1}>
                                ({language === "es" ? "Vencido" : "Overdue"})
                              </VuiTypography>
                            )}
                          </VuiTypography>
                        </VuiBox>
                        <VuiTypography variant="h5" color="white">
                          {formatCurrency((request.amount_cents || 0) / 100)}
                        </VuiTypography>
                      </VuiBox>

                      {/* Progress */}
                      <VuiBox mb={2}>
                        <VuiBox display="flex" justifyContent="space-between" mb={1}>
                          <VuiTypography variant="caption" color="text">
                            {stats.paidCount} / {stats.paidCount + stats.pendingCount}{" "}
                            {language === "es" ? "pagados" : "paid"}
                          </VuiTypography>
                          <VuiTypography variant="caption" color="success">
                            {formatCurrency(stats.totalCollected)}
                          </VuiTypography>
                        </VuiBox>
                        <VuiBox
                          sx={{
                            height: 8,
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.1)",
                            overflow: "hidden",
                          }}
                        >
                          <VuiBox
                            sx={{
                              height: "100%",
                              width: `${(stats.totalCollected / stats.totalExpected) * 100}%`,
                              background: "linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)",
                              borderRadius: "4px",
                            }}
                          />
                        </VuiBox>
                      </VuiBox>

                      {/* Status Icons */}
                      <VuiBox
                        display="flex"
                        gap={3}
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          setExpandedRequest(expandedRequest === request.id ? null : request.id)
                        }
                      >
                        <VuiBox display="flex" alignItems="center" gap={1}>
                          <IoCheckmarkCircle color="#4CAF50" />
                          <VuiTypography variant="caption" color="text">
                            {stats.paidCount} {t("coach:payments.paid")}
                          </VuiTypography>
                        </VuiBox>
                        <VuiBox display="flex" alignItems="center" gap={1}>
                          <IoTime color="#FF9800" />
                          <VuiTypography variant="caption" color="text">
                            {stats.pendingCount} {t("coach:payments.pending")}
                          </VuiTypography>
                        </VuiBox>
                        <VuiTypography variant="caption" color="info">
                          {expandedRequest === request.id
                            ? language === "es"
                              ? "Ocultar detalle ▲"
                              : "Hide detail ▲"
                            : language === "es"
                            ? "Marcar pagos ▼"
                            : "Mark payments ▼"}
                        </VuiTypography>
                      </VuiBox>

                      {/* Per-player payment line items — manual mark-paid, no processor needed */}
                      {expandedRequest === request.id && (
                        <VuiBox mt={2} pt={2} sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          {(request.payments || []).map((payment) => {
                            const name = payment.player
                              ? `${payment.player.first_name} ${payment.player.last_name}`
                              : payment.parent?.user
                              ? `${payment.parent.user.first_name} ${payment.parent.user.last_name}`
                              : language === "es"
                              ? "Padre sin nombre"
                              : "Unnamed parent";
                            const isPaid = payment.status === "paid";
                            return (
                              <VuiBox
                                key={payment.id}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                py={1}
                              >
                                <VuiTypography variant="button" color="white">
                                  {name}
                                </VuiTypography>
                                <VuiButton
                                  size="small"
                                  color={isPaid ? "success" : "secondary"}
                                  variant={isPaid ? "contained" : "outlined"}
                                  disabled={updatingPaymentId === payment.id}
                                  onClick={() => handleTogglePaid(payment)}
                                >
                                  {updatingPaymentId === payment.id
                                    ? t("common:status.saving")
                                    : isPaid
                                    ? language === "es"
                                      ? "✓ Pagado — deshacer"
                                      : "✓ Paid — undo"
                                    : language === "es"
                                    ? "Marcar pagado"
                                    : "Mark paid"}
                                </VuiButton>
                              </VuiBox>
                            );
                          })}
                        </VuiBox>
                      )}
                    </VuiBox>
                  );
                })}
              </VuiBox>
            )}
          </VuiBox>
        </Card>

        {/* Create Request Modal */}
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <VuiBox
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "95%", md: 500 },
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <Card>
              <VuiBox p={3}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <VuiTypography variant="h5" color="white">
                    {t("coach:payments.createRequest")}
                  </VuiTypography>
                  <IconButton onClick={() => setShowCreateModal(false)}>
                    <IoClose color="white" />
                  </IconButton>
                </VuiBox>

                <VuiBox component="form" onSubmit={handleCreateRequest}>
                  {/* Title */}
                  <VuiBox mb={2}>
                    <VuiTypography variant="button" color="white" fontWeight="medium">
                      {t("coach:payments.paymentTitle")} *
                    </VuiTypography>
                    <VuiInput
                      placeholder={
                        language === "es" ? "Cuota mensual - Julio" : "Monthly dues - July"
                      }
                      value={requestForm.title}
                      onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                      required
                    />
                  </VuiBox>

                  {/* Amount */}
                  <VuiBox mb={2}>
                    <VuiTypography variant="button" color="white" fontWeight="medium">
                      {t("coach:payments.amount")} *
                    </VuiTypography>
                    <VuiInput
                      type="number"
                      placeholder="50.00"
                      value={requestForm.amount}
                      onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                      required
                      min="1"
                      step="0.01"
                    />
                  </VuiBox>

                  {/* Due Date */}
                  <VuiBox mb={2}>
                    <VuiTypography variant="button" color="white" fontWeight="medium">
                      {t("coach:payments.dueDate")} *
                    </VuiTypography>
                    <VuiInput
                      type="date"
                      value={requestForm.due_date}
                      onChange={(e) => setRequestForm({ ...requestForm, due_date: e.target.value })}
                      required
                    />
                  </VuiBox>

                  {/* Description */}
                  <VuiBox mb={2}>
                    <VuiTypography variant="button" color="white" fontWeight="medium">
                      {t("coach:payments.description")}
                    </VuiTypography>
                    <VuiInput
                      multiline
                      rows={2}
                      placeholder={
                        language === "es"
                          ? "Incluye uniforme y uso de cancha"
                          : "Includes uniform and field usage"
                      }
                      value={requestForm.description}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, description: e.target.value })
                      }
                    />
                  </VuiBox>

                  {/* Allow Partial */}
                  <VuiBox mb={3} display="flex" alignItems="center" justifyContent="space-between">
                    <VuiTypography variant="button" color="white" fontWeight="medium">
                      {t("coach:payments.allowPartial")}
                    </VuiTypography>
                    <VuiSwitch
                      checked={requestForm.allow_partial}
                      onChange={(e) =>
                        setRequestForm({ ...requestForm, allow_partial: e.target.checked })
                      }
                    />
                  </VuiBox>

                  {/* Info */}
                  <VuiBox
                    mb={3}
                    p={2}
                    sx={{ background: "rgba(0, 117, 255, 0.1)", borderRadius: "8px" }}
                  >
                    <VuiTypography variant="caption" color="info">
                      {language === "es"
                        ? `Se enviará a ${players.filter((p) => p.parent?.id).length} padres conectados`
                        : `Will be sent to ${players.filter((p) => p.parent?.id).length} connected parents`}
                    </VuiTypography>
                  </VuiBox>

                  {/* Submit */}
                  <VuiButton color="info" fullWidth type="submit" disabled={creating}>
                    {creating ? t("common:status.saving") : t("coach:payments.sendRequest")}
                  </VuiButton>
                </VuiBox>
              </VuiBox>
            </Card>
          </VuiBox>
        </Modal>

{/* Footer removed — page fits one screen */}
      </VuiBox>
    </DashboardLayout>
  );
}

export default CoachPayments;
