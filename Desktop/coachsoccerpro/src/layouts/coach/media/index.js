import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Modal from "@mui/material/Modal";
import IconButton from "@mui/material/IconButton";

// Vision UI Dashboard components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiProgress from "components/VuiProgress";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Icons
import { IoAdd, IoClose, IoPlay, IoImage, IoVideocam, IoCloudUpload, IoTrash } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

// Image compression
const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

function CoachMedia() {
  const { t, i18n } = useTranslation(["common", "coach"]);
  const { teamData, coachData } = useAuth();
  const fileInputRef = useRef(null);

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'images', 'videos'

  const language = i18n.language || "en";

  useEffect(() => {
    if (teamData?.id) {
      fetchMedia();
    }
  }, [teamData]);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("media")
        .select(`
          *,
          event:events(title, event_type, start_time),
          tagged_players:media_player_tags(
            player:players(id, first_name, last_name)
          )
        `)
        .eq("team_id", teamData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;

    for (const file of files) {
      try {
        let fileToUpload = file;
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          console.warn("Skipping unsupported file type:", file.type);
          continue;
        }

        // Compress images
        if (isImage && file.size > 500000) {
          fileToUpload = await compressImage(file);
        }

        // Check video size (max 100MB)
        if (isVideo && file.size > 100 * 1024 * 1024) {
          alert(
            language === "es"
              ? "El video es demasiado grande. Máximo 100MB."
              : "Video is too large. Maximum 100MB."
          );
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${teamData.id}/${timestamp}_${safeName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, fileToUpload, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase.from("media").insert([
          {
            team_id: teamData.id,
            uploaded_by_coach_id: coachData.id,
            file_name: file.name,
            file_type: isImage ? "image" : "video",
            mime_type: file.type,
            file_size_bytes: fileToUpload.size,
            storage_provider: "supabase",
            storage_path: filePath,
            public_url: publicUrl,
            visible_to_parents: true,
          },
        ]);

        if (dbError) throw dbError;

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    fetchMedia();

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (mediaItem) => {
    if (!confirm(language === "es" ? "¿Eliminar este archivo?" : "Delete this file?")) {
      return;
    }

    try {
      // Delete from storage
      await supabase.storage.from("media").remove([mediaItem.storage_path]);

      // Delete from database
      await supabase.from("media").delete().eq("id", mediaItem.id);

      setMedia(media.filter((m) => m.id !== mediaItem.id));
      setSelectedMedia(null);
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const filteredMedia = media.filter((m) => {
    if (filter === "images") return m.file_type === "image";
    if (filter === "videos") return m.file_type === "video";
    return true;
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              {language === "es" ? "Fotos y Videos" : "Photos & Videos"}
            </VuiTypography>
            <VuiTypography variant="body2" color="text">
              {media.length} {language === "es" ? "archivos" : "files"}
            </VuiTypography>
          </VuiBox>
          <VuiButton
            color="info"
            onClick={() => fileInputRef.current?.click()}
            startIcon={<IoCloudUpload />}
            disabled={uploading}
          >
            {language === "es" ? "Subir" : "Upload"}
          </VuiButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </VuiBox>

        {/* Upload Progress */}
        {uploading && (
          <Card sx={{ mb: 3 }}>
            <VuiBox p={3}>
              <VuiBox display="flex" alignItems="center" gap={2}>
                <VuiTypography variant="button" color="white">
                  {language === "es" ? "Subiendo..." : "Uploading..."}
                </VuiTypography>
                <VuiBox flex={1}>
                  <VuiProgress value={uploadProgress} color="info" />
                </VuiBox>
                <VuiTypography variant="button" color="white">
                  {uploadProgress}%
                </VuiTypography>
              </VuiBox>
            </VuiBox>
          </Card>
        )}

        {/* Filters */}
        <VuiBox display="flex" gap={1} mb={3}>
          <VuiButton
            variant={filter === "all" ? "contained" : "outlined"}
            color="info"
            size="small"
            onClick={() => setFilter("all")}
          >
            {language === "es" ? "Todo" : "All"}
          </VuiButton>
          <VuiButton
            variant={filter === "images" ? "contained" : "outlined"}
            color="info"
            size="small"
            onClick={() => setFilter("images")}
            startIcon={<IoImage size={14} />}
          >
            {language === "es" ? "Fotos" : "Photos"}
          </VuiButton>
          <VuiButton
            variant={filter === "videos" ? "contained" : "outlined"}
            color="info"
            size="small"
            onClick={() => setFilter("videos")}
            startIcon={<IoVideocam size={14} />}
          >
            Videos
          </VuiButton>
        </VuiBox>

        {/* Media Grid */}
        {loading ? (
          <VuiBox display="flex" justifyContent="center" py={5}>
            <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
          </VuiBox>
        ) : filteredMedia.length === 0 ? (
          <Card>
            <VuiBox p={5} textAlign="center">
              <VuiTypography variant="h1" mb={2}>
                📸
              </VuiTypography>
              <VuiTypography variant="h5" color="white" mb={1}>
                {language === "es" ? "Sin fotos o videos" : "No photos or videos yet"}
              </VuiTypography>
              <VuiTypography variant="body2" color="text" mb={3}>
                {language === "es"
                  ? "Sube fotos y videos de los entrenamientos y partidos"
                  : "Upload photos and videos from practices and games"}
              </VuiTypography>
              <VuiButton
                color="info"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<IoCloudUpload />}
              >
                {language === "es" ? "Subir Archivos" : "Upload Files"}
              </VuiButton>
            </VuiBox>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredMedia.map((item) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
                <VuiBox
                  sx={{
                    position: "relative",
                    paddingTop: "100%",
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "rgba(0, 0, 0, 0.3)",
                    "&:hover": {
                      "& .overlay": {
                        opacity: 1,
                      },
                    },
                  }}
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.file_type === "image" ? (
                    <VuiBox
                      component="img"
                      src={item.public_url}
                      alt={item.file_name}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <VuiBox
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
                      }}
                    >
                      <IoPlay size={40} color="white" />
                    </VuiBox>
                  )}

                  {/* Hover overlay */}
                  <VuiBox
                    className="overlay"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      background: "rgba(0, 0, 0, 0.5)",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: "8px",
                    }}
                  >
                    <VuiTypography variant="caption" color="white" noWrap>
                      {formatDate(item.created_at)}
                    </VuiTypography>
                  </VuiBox>

                  {/* Video indicator */}
                  {item.file_type === "video" && (
                    <VuiBox
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0, 0, 0, 0.6)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                      }}
                    >
                      <IoVideocam size={14} color="white" />
                    </VuiBox>
                  )}
                </VuiBox>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Media Viewer Modal */}
        <Modal open={!!selectedMedia} onClose={() => setSelectedMedia(null)}>
          <VuiBox
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "90vw",
              maxHeight: "90vh",
              outline: "none",
            }}
          >
            <Card>
              <VuiBox p={2}>
                {/* Header */}
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <VuiTypography variant="button" color="white">
                    {selectedMedia?.file_name}
                  </VuiTypography>
                  <VuiBox display="flex" gap={1}>
                    <IconButton onClick={() => handleDelete(selectedMedia)} size="small">
                      <IoTrash color="#f44336" />
                    </IconButton>
                    <IconButton onClick={() => setSelectedMedia(null)} size="small">
                      <IoClose color="white" />
                    </IconButton>
                  </VuiBox>
                </VuiBox>

                {/* Media Content */}
                {selectedMedia?.file_type === "image" ? (
                  <VuiBox
                    component="img"
                    src={selectedMedia?.public_url}
                    alt={selectedMedia?.file_name}
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <VuiBox
                    component="video"
                    src={selectedMedia?.public_url}
                    controls
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      borderRadius: "8px",
                    }}
                  />
                )}

                {/* Info */}
                <VuiBox mt={2} display="flex" gap={3}>
                  <VuiTypography variant="caption" color="text">
                    {formatDate(selectedMedia?.created_at)}
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text">
                    {formatFileSize(selectedMedia?.file_size_bytes)}
                  </VuiTypography>
                  {selectedMedia?.event && (
                    <VuiTypography variant="caption" color="info">
                      📍 {selectedMedia.event.title}
                    </VuiTypography>
                  )}
                </VuiBox>
              </VuiBox>
            </Card>
          </VuiBox>
        </Modal>

        <VuiBox mt="auto" pt={3}>
          <Footer />
        </VuiBox>
      </VuiBox>
    </DashboardLayout>
  );
}

export default CoachMedia;
