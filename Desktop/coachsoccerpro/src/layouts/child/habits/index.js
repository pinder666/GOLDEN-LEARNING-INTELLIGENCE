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
import { IoCheckmarkCircle, IoWater, IoBed, IoNutrition, IoBody } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const DAILY_HABITS = [
  {
    key: "water",
    icon: <IoWater size={28} />,
    color: "#00D4FF",
    labelEn: "Drink Water",
    labelEs: "Tomar Agua",
    descEn: "8 glasses today",
    descEs: "8 vasos hoy",
  },
  {
    key: "sleep",
    icon: <IoBed size={28} />,
    color: "#9D4EDD",
    labelEn: "Good Sleep",
    labelEs: "Buen Sueño",
    descEn: "8+ hours last night",
    descEs: "8+ horas anoche",
  },
  {
    key: "food",
    icon: <IoNutrition size={28} />,
    color: "#4CAF50",
    labelEn: "Healthy Food",
    labelEs: "Comida Saludable",
    descEn: "Fruits & vegetables",
    descEs: "Frutas y verduras",
  },
  {
    key: "stretch",
    icon: <IoBody size={28} />,
    color: "#FF9800",
    labelEn: "Stretch",
    labelEs: "Estirar",
    descEn: "Morning stretches",
    descEs: "Estiramientos matutinos",
  },
];

import { DEV_MODE } from "devMode";

const DEMO_PRO_HABIT = {
  player_name: "Cristiano Ronaldo",
  habit_en: "I eat 6 small meals a day instead of 3 big ones",
  habit_es: "Como 6 comidas pequeñas al día en vez de 3 grandes",
};

function ChildHabits() {
  const { t, i18n } = useTranslation(["common"]);
  const { user } = useAuth();

  const [playerId, setPlayerId] = useState(null);
  const [completedToday, setCompletedToday] = useState(new Set());
  const [proHabit, setProHabit] = useState(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const language = i18n.language || "en";
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (DEV_MODE) {
      setPlayerId(1);
      setCompletedToday(new Set(["water", "sleep"]));
      setProHabit(DEMO_PRO_HABIT);
      setStreak(5);
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchHabitData();
    }
  }, [user]);

  const fetchHabitData = async () => {
    try {
      // Get player
      const { data: playerData } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!playerData) return;
      setPlayerId(playerData.id);

      // Get today's completed habits
      const { data: todayData } = await supabase
        .from("daily_habit_logs")
        .select("habit_key")
        .eq("player_id", playerData.id)
        .eq("date", today);

      setCompletedToday(new Set(todayData?.map((d) => d.habit_key) || []));

      // Calculate streak (simplified - days in a row with all 4 completed)
      const { data: streakData } = await supabase
        .from("daily_habit_logs")
        .select("date")
        .eq("player_id", playerData.id)
        .order("date", { ascending: false });

      // Count consecutive complete days
      let currentStreak = 0;
      const dateSet = new Set(streakData?.map((d) => d.date) || []);
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday

      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        const count = streakData?.filter((d) => d.date === dateStr).length || 0;
        if (count === 4) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      setStreak(currentStreak);

      // Get today's pro habit
      const { data: habitData } = await supabase
        .from("player_habit_assignments")
        .select(`
          *,
          habit:pro_habits(*)
        `)
        .eq("player_id", playerData.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .single();

      if (habitData) setProHabit(habitData.habit);
    } catch (error) {
      console.error("Error fetching habit data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitKey) => {
    if (!playerId) return;

    const isCompleted = completedToday.has(habitKey);

    if (DEV_MODE) {
      setCompletedToday((prev) => {
        const next = new Set(prev);
        if (isCompleted) next.delete(habitKey);
        else next.add(habitKey);
        return next;
      });
      return;
    }

    try {
      if (isCompleted) {
        // Remove completion
        await supabase
          .from("daily_habit_logs")
          .delete()
          .eq("player_id", playerId)
          .eq("date", today)
          .eq("habit_key", habitKey);

        setCompletedToday((prev) => {
          const next = new Set(prev);
          next.delete(habitKey);
          return next;
        });
      } else {
        // Mark as complete
        await supabase.from("daily_habit_logs").insert([
          {
            player_id: playerId,
            date: today,
            habit_key: habitKey,
          },
        ]);

        setCompletedToday((prev) => new Set([...prev, habitKey]));

        // Award points if all 4 completed
        if (completedToday.size === 3) {
          // This would be the 4th
          await supabase.rpc("add_player_points", {
            player_id: playerId,
            points_to_add: 10,
          });
        }
      }
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const completedCount = completedToday.size;
  const allComplete = completedCount === 4;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3} textAlign="center">
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {language === "es" ? "Mis Hábitos" : "My Habits"} 💪
          </VuiTypography>
          {streak > 0 && (
            <VuiTypography variant="h6" color="warning" mt={1}>
              🔥 {streak} {language === "es" ? "días seguidos" : "day streak"}
            </VuiTypography>
          )}
        </VuiBox>

        {/* Progress */}
        <Card sx={{ mb: 3 }}>
          <VuiBox p={3} textAlign="center">
            <VuiTypography variant="h5" color={allComplete ? "success" : "white"}>
              {completedCount} / 4{" "}
              {language === "es" ? "completados hoy" : "completed today"}
              {allComplete && " 🎉"}
            </VuiTypography>
            <VuiBox
              sx={{
                mt: 2,
                height: 12,
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
              }}
            >
              <VuiBox
                sx={{
                  height: "100%",
                  width: `${(completedCount / 4) * 100}%`,
                  background: allComplete
                    ? "linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)"
                    : "linear-gradient(90deg, #0075FF 0%, #00D4FF 100%)",
                  borderRadius: "6px",
                  transition: "width 0.5s",
                }}
              />
            </VuiBox>
            {allComplete && (
              <VuiTypography variant="caption" color="success" mt={1}>
                +10 {language === "es" ? "puntos ganados" : "points earned"}!
              </VuiTypography>
            )}
          </VuiBox>
        </Card>

        {/* Daily Habits */}
        <Grid container spacing={2} mb={3}>
          {DAILY_HABITS.map((habit) => {
            const isComplete = completedToday.has(habit.key);

            return (
              <Grid item xs={6} key={habit.key}>
                <Card
                  onClick={() => toggleHabit(habit.key)}
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.3s",
                    background: isComplete
                      ? `linear-gradient(135deg, ${habit.color}30 0%, ${habit.color}10 100%)`
                      : undefined,
                    border: isComplete ? `2px solid ${habit.color}` : "2px solid transparent",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  <VuiBox p={3} textAlign="center">
                    <VuiBox sx={{ color: isComplete ? habit.color : "rgba(255,255,255,0.5)" }}>
                      {habit.icon}
                    </VuiBox>
                    <VuiTypography variant="button" color="white" fontWeight="bold" mt={1} display="block">
                      {language === "es" ? habit.labelEs : habit.labelEn}
                    </VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {language === "es" ? habit.descEs : habit.descEn}
                    </VuiTypography>
                    {isComplete && (
                      <VuiBox mt={1}>
                        <IoCheckmarkCircle size={24} color={habit.color} />
                      </VuiBox>
                    )}
                  </VuiBox>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Pro Habit of the Day */}
        {proHabit && (
          <Card sx={{ background: "linear-gradient(135deg, rgba(157, 78, 221, 0.2) 0%, rgba(224, 64, 251, 0.1) 100%)" }}>
            <VuiBox p={3}>
              <VuiTypography variant="button" color="white" fontWeight="bold" mb={2} display="block">
                ⭐ {language === "es" ? "HÁBITO PRO DEL DÍA" : "PRO HABIT OF THE DAY"}
              </VuiTypography>
              <VuiBox display="flex" alignItems="center" gap={2}>
                {proHabit.player_image_url ? (
                  <VuiBox
                    component="img"
                    src={proHabit.player_image_url}
                    sx={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <VuiBox
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #9D4EDD 0%, #E040FB 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                    }}
                  >
                    ⚽
                  </VuiBox>
                )}
                <VuiBox>
                  <VuiTypography variant="h6" color="white">
                    {proHabit.player_name}
                  </VuiTypography>
                  <VuiTypography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                    "{language === "es" ? proHabit.habit_es : proHabit.habit_en}"
                  </VuiTypography>
                </VuiBox>
              </VuiBox>
            </VuiBox>
          </Card>
        )}

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default ChildHabits;
