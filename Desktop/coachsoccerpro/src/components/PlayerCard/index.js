import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

// @mui material components
import Card from "@mui/material/Card";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiProgress from "components/VuiProgress";

// Default avatar
const defaultAvatar = "https://ui-avatars.com/api/?name=Player&background=0075FF&color=fff&size=150";

// Frame gradients based on level
const frameGradients = {
  bronze: "linear-gradient(135deg, #CD7F32 0%, #8B4513 50%, #CD7F32 100%)",
  silver: "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 50%, #E8E8E8 100%)",
  gold: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)",
  platinum: "linear-gradient(135deg, #E5E4E2 0%, #A0A0A0 30%, #E5E4E2 60%, #FFFFFF 100%)",
  diamond: "linear-gradient(135deg, #B9F2FF 0%, #00BFFF 25%, #E0FFFF 50%, #00CED1 75%, #B9F2FF 100%)",
};

// Frame glow effects
const frameGlows = {
  bronze: "0 0 20px rgba(205, 127, 50, 0.3)",
  silver: "0 0 25px rgba(192, 192, 192, 0.4)",
  gold: "0 0 30px rgba(255, 215, 0, 0.5)",
  platinum: "0 0 35px rgba(229, 228, 226, 0.6)",
  diamond: "0 0 40px rgba(0, 191, 255, 0.7), 0 0 60px rgba(0, 206, 209, 0.4)",
};

function PlayerCard({
  player,
  showStats = true,
  size = "large",
  animated = true,
  onClick
}) {
  const { t, i18n } = useTranslation(["child"]);
  const [isFlipped, setIsFlipped] = useState(false);

  const language = i18n.language || "en";
  const frame = player?.card_frame || "bronze";

  const stats = {
    attendance: player?.attendance_rate || 85,
    effort: player?.effort_rating || 80,
    teamwork: player?.teamwork_rating || 75,
    skill: player?.skill_rating || 70,
  };

  const handleFlip = () => {
    if (showStats) {
      setIsFlipped(!isFlipped);
    }
    if (onClick) {
      onClick(player);
    }
  };

  const sizeStyles = {
    small: { width: 180, height: 280 },
    medium: { width: 240, height: 380 },
    large: { width: 300, height: 500 },
  };

  const cardSize = sizeStyles[size] || sizeStyles.large;

  const CardFront = () => (
    <VuiBox
      sx={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        backfaceVisibility: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: size === "small" ? "12px" : "20px",
      }}
    >
      {/* Player Photo */}
      <VuiBox
        sx={{
          width: size === "small" ? 80 : size === "medium" ? 100 : 130,
          height: size === "small" ? 80 : size === "medium" ? 100 : 130,
          borderRadius: "50%",
          border: `4px solid transparent`,
          backgroundImage: frameGradients[frame],
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          padding: "4px",
          mt: 1,
        }}
      >
        <VuiBox
          component="img"
          src={player?.avatar_url || defaultAvatar}
          alt={player?.first_name}
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </VuiBox>

      {/* Player Name & Number */}
      <VuiBox textAlign="center" mt={1}>
        <VuiTypography
          variant={size === "small" ? "button" : "h5"}
          color="white"
          fontWeight="bold"
        >
          {player?.first_name} {player?.last_name?.charAt(0)}.
        </VuiTypography>
        {player?.jersey_number && (
          <VuiTypography variant="caption" color="text">
            #{player.jersey_number}
          </VuiTypography>
        )}
      </VuiBox>

      {/* Position Badge */}
      <VuiBox
        sx={{
          background: "rgba(0, 117, 255, 0.3)",
          borderRadius: "8px",
          padding: "4px 12px",
          mt: 1,
        }}
      >
        <VuiTypography variant="caption" color="info" fontWeight="bold" textTransform="uppercase">
          {player?.position || "Player"}
        </VuiTypography>
      </VuiBox>

      {/* Points & Rank */}
      <VuiBox display="flex" justifyContent="space-around" width="100%" mt={1} mb={2}>
        <VuiBox textAlign="center">
          <VuiTypography variant="h6" color="white" fontWeight="bold">
            {player?.total_points || 0}
          </VuiTypography>
          <VuiTypography variant="caption" color="text">
            {language === "es" ? "pts" : "pts"}
          </VuiTypography>
        </VuiBox>
        {player?.attendance_streak > 0 && (
          <VuiBox textAlign="center">
            <VuiTypography variant="h6" color="warning" fontWeight="bold">
              🔥 {player.attendance_streak}
            </VuiTypography>
            <VuiTypography variant="caption" color="text">
              {language === "es" ? "racha" : "streak"}
            </VuiTypography>
          </VuiBox>
        )}
      </VuiBox>

      {/* Top Badges */}
      {player?.topBadges && player.topBadges.length > 0 && (
        <VuiBox display="flex" gap={1} mt={1}>
          {player.topBadges.slice(0, 3).map((badge, index) => (
            <VuiBox
              key={index}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              {badge.icon || "🏅"}
            </VuiBox>
          ))}
        </VuiBox>
      )}

      {/* Frame Label */}
      <VuiBox
        sx={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <VuiTypography
          variant="caption"
          sx={{
            background: frameGradients[frame],
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "bold",
            textTransform: "uppercase",
            fontSize: "10px",
          }}
        >
          {t(`child:cardFrames.${frame}`)}
        </VuiTypography>
      </VuiBox>

      {/* Tap to flip hint */}
      {showStats && size !== "small" && (
        <VuiTypography
          variant="caption"
          color="text"
          sx={{ position: "absolute", bottom: -20 }}
        >
          {t("child:playerCard.tapToFlip")}
        </VuiTypography>
      )}
    </VuiBox>
  );

  const CardBack = () => (
    <VuiBox
      sx={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
      }}
    >
      <VuiTypography variant="h6" color="white" fontWeight="bold" mb={2}>
        {t("child:playerCard.cardBack")}
      </VuiTypography>

      {/* Stats Bars */}
      {Object.entries(stats).map(([key, value]) => (
        <VuiBox key={key} mb={2}>
          <VuiBox display="flex" justifyContent="space-between" mb={0.5}>
            <VuiTypography variant="caption" color="text" textTransform="capitalize">
              {t(`child:playerCard.${key}`)}
            </VuiTypography>
            <VuiTypography variant="caption" color="white" fontWeight="bold">
              {value}%
            </VuiTypography>
          </VuiBox>
          <VuiProgress
            value={value}
            color={
              value >= 90 ? "success" :
              value >= 70 ? "info" :
              value >= 50 ? "warning" : "error"
            }
            sx={{ background: "rgba(255, 255, 255, 0.1)" }}
          />
        </VuiBox>
      ))}

      {/* Games Played */}
      <VuiBox display="flex" justifyContent="space-around" mt="auto">
        <VuiBox textAlign="center">
          <VuiTypography variant="h5" color="white" fontWeight="bold">
            {player?.games_played || 0}
          </VuiTypography>
          <VuiTypography variant="caption" color="text">
            {language === "es" ? "Partidos" : "Games"}
          </VuiTypography>
        </VuiBox>
        <VuiBox textAlign="center">
          <VuiTypography variant="h5" color="white" fontWeight="bold">
            {player?.goals || 0}
          </VuiTypography>
          <VuiTypography variant="caption" color="text">
            {language === "es" ? "Goles" : "Goals"}
          </VuiTypography>
        </VuiBox>
        <VuiBox textAlign="center">
          <VuiTypography variant="h5" color="white" fontWeight="bold">
            {player?.assists || 0}
          </VuiTypography>
          <VuiTypography variant="caption" color="text">
            {language === "es" ? "Asistencias" : "Assists"}
          </VuiTypography>
        </VuiBox>
      </VuiBox>
    </VuiBox>
  );

  return (
    <VuiBox
      sx={{
        perspective: "1000px",
        width: cardSize.width,
        height: cardSize.height,
        cursor: showStats ? "pointer" : "default",
      }}
      onClick={handleFlip}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          position: "relative",
        }}
      >
        {/* Card Container */}
        <Card
          sx={{
            width: "100%",
            height: "100%",
            position: "absolute",
            padding: 0,
            background: "linear-gradient(135deg, rgba(6, 11, 40, 0.94) 0%, rgba(10, 14, 35, 0.79) 100%)",
            border: `3px solid`,
            borderImage: frameGradients[frame],
            borderImageSlice: 1,
            boxShadow: frameGlows[frame],
            borderRadius: "20px",
            overflow: "hidden",
            transition: "box-shadow 0.3s ease",
            "&:hover": {
              boxShadow: frame === "diamond"
                ? "0 0 50px rgba(0, 191, 255, 0.8), 0 0 80px rgba(0, 206, 209, 0.5)"
                : frameGlows[frame],
            },
          }}
        >
          {/* Animated background for diamond */}
          {frame === "diamond" && animated && (
            <VuiBox
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(45deg, transparent 30%, rgba(185, 242, 255, 0.1) 50%, transparent 70%)",
                animation: "shimmer 3s infinite",
                "@keyframes shimmer": {
                  "0%": { transform: "translateX(-100%)" },
                  "100%": { transform: "translateX(100%)" },
                },
                pointerEvents: "none",
              }}
            />
          )}

          <CardFront />
          {showStats && <CardBack />}
        </Card>
      </motion.div>
    </VuiBox>
  );
}

export default PlayerCard;
