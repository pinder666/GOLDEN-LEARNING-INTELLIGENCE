import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Icons
import { IoCheckmarkCircle, IoTime, IoAlert, IoCard } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

import { DEV_MODE } from "devMode";

const DEMO_PAYMENTS = [
  {
    id: 1,
    status: "pending",
    amount_due: 75,
    payment_request: {
      title: "September Dues",
      description: "Monthly team dues - field rental and equipment",
      due_date: new Date(Date.now() + 432000000).toISOString(),
    },
  },
  {
    id: 2,
    status: "paid",
    amount_due: 75,
    amount_paid: 75,
    paid_at: new Date(Date.now() - 2592000000).toISOString(),
    payment_request: {
      title: "August Dues",
      description: "Monthly team dues",
      due_date: new Date(Date.now() - 2592000000).toISOString(),
    },
  },
  {
    id: 3,
    status: "paid",
    amount_due: 45,
    amount_paid: 45,
    paid_at: new Date(Date.now() - 5184000000).toISOString(),
    payment_request: {
      title: "Tournament Fee",
      description: "Spring tournament registration",
      due_date: new Date(Date.now() - 5184000000).toISOString(),
    },
  },
];

function ParentPayments() {
  const { t, i18n } = useTranslation(["common"]);
  const { user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setPayments(DEMO_PAYMENTS);
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      // Get parent info
      const { data: parentData } = await supabase
        .from("parents")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!parentData) return;

      // Get payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select(`
          *,
          payment_request:payment_requests(*)
        `)
        .eq("parent_id", parentData.id)
        .order("created_at", { ascending: false });

      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (payment) => {
    // In production, this would open Stripe Checkout
    alert(
      language === "es"
        ? "El pago con Stripe se configurará pronto."
        : "Stripe payment will be set up soon."
    );
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

  const getStatusInfo = (payment) => {
    if (payment.status === "paid") {
      return {
        icon: <IoCheckmarkCircle size={20} />,
        color: "#4CAF50",
        label: language === "es" ? "Pagado" : "Paid",
      };
    }
    if (isOverdue(payment.payment_request?.due_date)) {
      return {
        icon: <IoAlert size={20} />,
        color: "#f44336",
        label: language === "es" ? "Vencido" : "Overdue",
      };
    }
    return {
      icon: <IoTime size={20} />,
      color: "#FF9800",
      label: language === "es" ? "Pendiente" : "Pending",
    };
  };

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const paidPayments = payments.filter((p) => p.status === "paid");

  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {language === "es" ? "Pagos" : "Payments"}
          </VuiTypography>
        </VuiBox>

        {/* Summary Cards */}
        {pendingPayments.length > 0 && (
          <Card sx={{ mb: 3, background: "linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 87, 34, 0.1) 100%)" }}>
            <VuiBox p={3} display="flex" justifyContent="space-between" alignItems="center">
              <VuiBox>
                <VuiTypography variant="h6" color="warning">
                  {language === "es" ? "Total Pendiente" : "Total Pending"}
                </VuiTypography>
                <VuiTypography variant="h4" color="white">
                  {formatCurrency(totalPending)}
                </VuiTypography>
              </VuiBox>
              <IoCard size={40} color="#FF9800" />
            </VuiBox>
          </Card>
        )}

        {loading ? (
          <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
        ) : payments.length === 0 ? (
          <Card>
            <VuiBox p={5} textAlign="center">
              <VuiTypography variant="h2" mb={2}>
                💳
              </VuiTypography>
              <VuiTypography variant="h5" color="white">
                {language === "es" ? "Sin pagos" : "No payments"}
              </VuiTypography>
              <VuiTypography variant="body2" color="text">
                {language === "es"
                  ? "Las solicitudes de pago del entrenador aparecerán aquí"
                  : "Payment requests from the coach will appear here"}
              </VuiTypography>
            </VuiBox>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {/* Pending Payments */}
            {pendingPayments.length > 0 && (
              <Grid item xs={12}>
                <VuiTypography variant="h6" color="warning" mb={2}>
                  {language === "es" ? "Pendientes" : "Pending"} ({pendingPayments.length})
                </VuiTypography>
                {pendingPayments.map((payment) => {
                  const statusInfo = getStatusInfo(payment);
                  const request = payment.payment_request;

                  return (
                    <Card key={payment.id} sx={{ mb: 2 }}>
                      <VuiBox p={3}>
                        <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start">
                          <VuiBox flex={1}>
                            <VuiBox display="flex" alignItems="center" gap={1} mb={1}>
                              <VuiBox sx={{ color: statusInfo.color }}>{statusInfo.icon}</VuiBox>
                              <VuiTypography variant="button" sx={{ color: statusInfo.color }}>
                                {statusInfo.label}
                              </VuiTypography>
                            </VuiBox>
                            <VuiTypography variant="h6" color="white" fontWeight="bold">
                              {request?.title || (language === "es" ? "Pago" : "Payment")}
                            </VuiTypography>
                            {request?.description && (
                              <VuiTypography variant="caption" color="text" display="block" mt={0.5}>
                                {request.description}
                              </VuiTypography>
                            )}
                            <VuiTypography variant="caption" color="text" display="block" mt={1}>
                              {language === "es" ? "Vence" : "Due"}: {formatDate(request?.due_date)}
                            </VuiTypography>
                          </VuiBox>
                          <VuiBox textAlign="right">
                            <VuiTypography variant="h5" color="white" mb={2}>
                              {formatCurrency(payment.amount_due)}
                            </VuiTypography>
                            <VuiButton color="info" size="small" onClick={() => handlePay(payment)}>
                              {language === "es" ? "Pagar Ahora" : "Pay Now"}
                            </VuiButton>
                          </VuiBox>
                        </VuiBox>
                      </VuiBox>
                    </Card>
                  );
                })}
              </Grid>
            )}

            {/* Paid Payments */}
            {paidPayments.length > 0 && (
              <Grid item xs={12}>
                <VuiTypography variant="h6" color="success" mb={2}>
                  {language === "es" ? "Pagados" : "Paid"} ({paidPayments.length})
                </VuiTypography>
                {paidPayments.map((payment) => {
                  const request = payment.payment_request;

                  return (
                    <Card key={payment.id} sx={{ mb: 2, opacity: 0.7 }}>
                      <VuiBox p={3}>
                        <VuiBox display="flex" justifyContent="space-between" alignItems="center">
                          <VuiBox display="flex" alignItems="center" gap={2}>
                            <IoCheckmarkCircle size={24} color="#4CAF50" />
                            <VuiBox>
                              <VuiTypography variant="button" color="white" fontWeight="bold">
                                {request?.title || (language === "es" ? "Pago" : "Payment")}
                              </VuiTypography>
                              <VuiTypography variant="caption" color="text" display="block">
                                {language === "es" ? "Pagado el" : "Paid on"} {formatDate(payment.paid_at)}
                              </VuiTypography>
                            </VuiBox>
                          </VuiBox>
                          <VuiTypography variant="h6" color="success">
                            {formatCurrency(payment.amount_paid || payment.amount_due)}
                          </VuiTypography>
                        </VuiBox>
                      </VuiBox>
                    </Card>
                  );
                })}
              </Grid>
            )}
          </Grid>
        )}

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default ParentPayments;
