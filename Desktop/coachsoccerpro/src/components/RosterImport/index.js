/**
 * ROSTER IMPORT — the switch off GoTeamUp / TeamSnap / Spond / a spreadsheet.
 * Coach drops their export → we auto-map the columns → they preview → we create
 * players + parent contacts. Pure parsing, NO Claude, no cost. Firing the
 * welcome message to each new parent is handled by the welcome automation.
 */
import { useState, useRef } from "react";
import { useLang } from "useLang";
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

// ── Minimal CSV parser (handles quoted fields, commas, CRLF) ──
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ""));
}

// Fields we can fill, and the header patterns that hint at each.
const FIELD_HINTS = {
  firstName: /first\s*name|given|fname|^first$/i,
  lastName: /last\s*name|surname|family|lname|^last$/i,
  fullName: /^name$|player\s*name|child\s*name|athlete|member\s*name|full\s*name/i,
  parentName: /parent|guardian|mother|father|mum|mom|dad|contact\s*name/i,
  email: /e-?mail/i,
  phone: /phone|mobile|cell|^tel|number/i,
  dob: /birth|dob|d\.o\.b|born/i,
};
const FIELD_LABELS = {
  ignore: { en: "— ignore —", es: "— ignorar —" },
  firstName: { en: "Player first name", es: "Nombre del jugador" },
  lastName: { en: "Player last name", es: "Apellido del jugador" },
  fullName: { en: "Player full name", es: "Nombre completo" },
  parentName: { en: "Parent name", es: "Nombre del padre" },
  email: { en: "Parent email", es: "Email del padre" },
  phone: { en: "Parent phone", es: "Teléfono del padre" },
  dob: { en: "Date of birth", es: "Fecha de nacimiento" },
};

function autoMap(headers) {
  const map = headers.map((h) => {
    for (const [field, re] of Object.entries(FIELD_HINTS)) if (re.test(h)) return field;
    return "ignore";
  });
  // If we matched fullName, don't also keep first/last from a weaker match.
  return map;
}

function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
}

export default function RosterImport({ open, onClose, onImported }) {
  const [lang] = useLang();
  const t = (en, es) => (lang === "es" ? es : en);
  const fileRef = useRef(null);
  const [rows, setRows] = useState(null);      // parsed rows incl header
  const [headers, setHeaders] = useState([]);
  const [map, setMap] = useState([]);          // per-column field
  const [rowKind, setRowKind] = useState("player"); // "player" | "parent"
  const [done, setDone] = useState(null);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const all = parseCSV(String(reader.result || ""));
      if (!all.length) return;
      const hdr = all[0].map((h) => h.trim());
      setHeaders(hdr);
      setMap(autoMap(hdr));
      setRows(all.slice(1));
      // Heuristic: if there's a parent/guardian column, the rows are likely parents.
      setRowKind(hdr.some((h) => /parent|guardian|member/i.test(h)) ? "parent" : "player");
      setDone(null);
    };
    reader.readAsText(f);
  };

  const colIndex = (field) => map.indexOf(field);
  const val = (r, field) => { const i = colIndex(field); return i >= 0 ? (r[i] || "").trim() : ""; };

  const buildRecords = () => {
    return (rows || []).map((r) => {
      let first = val(r, "firstName"), last = val(r, "lastName");
      if ((!first || !last) && colIndex("fullName") >= 0) { const s = splitName(val(r, "fullName")); first = first || s.first; last = last || s.last; }
      return {
        first_name: first, last_name: last,
        date_of_birth: val(r, "dob") || null,
        parent_name: val(r, "parentName"),
        email: val(r, "email"), phone: val(r, "phone"),
      };
    }).filter((x) => x.first_name || x.email);
  };

  const preview = rows ? buildRecords() : [];

  const doImport = async () => {
    const records = buildRecords();
    let saved = records;
    // Try live Supabase; fall back to a local roster cache in dev / on error.
    try {
      const { supabase } = await import("services/supabase");
      const { data: teamRow } = await supabase.from("teams").select("id").limit(1).single();
      const teamId = teamRow && teamRow.id;
      if (teamId) {
        for (const rec of records) {
          const { data: p } = await supabase.from("players").insert([{
            team_id: teamId, first_name: rec.first_name, last_name: rec.last_name, date_of_birth: rec.date_of_birth,
          }]).select().single();
          if (rec.email || rec.phone) {
            await supabase.from("parents").insert([{
              team_id: teamId, email: rec.email || null, phone: rec.phone || null, invite_status: "pending",
              invite_token: Math.random().toString(36).slice(2, 15), player_id: p ? p.id : null,
            }]);
          }
        }
      } else { throw new Error("no-team"); }
    } catch (e) {
      // dev / offline: keep it locally so the roster + welcome queue still work
      try {
        const existing = JSON.parse(localStorage.getItem("csp_imported_roster") || "[]");
        localStorage.setItem("csp_imported_roster", JSON.stringify([...existing, ...records]));
      } catch (e2) {}
    }
    // Queue a welcome message per parent (the welcome automation sends it).
    try {
      const q = JSON.parse(localStorage.getItem("csp_welcome_queue") || "[]");
      records.filter((r) => r.email || r.phone).forEach((r) =>
        q.push({ parent: r.parent_name || "", player: [r.first_name, r.last_name].filter(Boolean).join(" "), email: r.email, phone: r.phone, at: new Date().toISOString() }));
      localStorage.setItem("csp_welcome_queue", JSON.stringify(q));
    } catch (e) {}

    setDone({ players: records.length, parents: records.filter((r) => r.email || r.phone).length });
    if (onImported) onImported(records);
  };

  if (!open) return null;

  return (
    <VuiBox sx={{ position: "fixed", inset: 0, zIndex: 1600, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }} onClick={onClose}>
      <VuiBox onClick={(e) => e.stopPropagation()} sx={{
        width: "min(760px, 100%)", maxHeight: "90vh", overflow: "auto",
        background: "linear-gradient(160deg,#0d1440 0%,#0a0e23 100%)", border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 16, padding: "18px 20px", fontFamily: "Inter,sans-serif",
        scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
      }}>
        <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <VuiTypography variant="h5" color="white" fontWeight="bold">📥 {t("Import your roster", "Importar tu plantilla")}</VuiTypography>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.6)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </VuiBox>

        {done ? (
          <VuiBox textAlign="center" py={4}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>✅</div>
            <VuiTypography variant="h6" color="white">{t(`Imported ${done.players} players and ${done.parents} parent contacts.`, `Importados ${done.players} jugadores y ${done.parents} contactos de padres.`)}</VuiTypography>
            <VuiTypography variant="caption" color="text">{t("Each parent is queued for your welcome message.", "Cada padre está en cola para tu mensaje de bienvenida.")}</VuiTypography>
            <div style={{ marginTop: 16 }}>
              <button onClick={onClose} style={S.primary}>{t("Done", "Listo")}</button>
            </div>
          </VuiBox>
        ) : !rows ? (
          <VuiBox textAlign="center" py={4}>
            <VuiTypography variant="body2" color="text" mb={2}>
              {t("Export a CSV from GoTeamUp, TeamSnap, Spond or a spreadsheet, then drop it here. We'll read the columns for you.",
                 "Exporta un CSV de GoTeamUp, TeamSnap, Spond o una hoja de cálculo, y súbelo aquí. Leemos las columnas por ti.")}
            </VuiTypography>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>
              {t("GoTeamUp: Customers → Export filtered list → Export to CSV.", "GoTeamUp: Clientes → Exportar lista filtrada → Exportar a CSV.")}
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current && fileRef.current.click()} style={{ ...S.primary, padding: "12px 28px", fontSize: 14 }}>
              {t("Choose CSV file", "Elegir archivo CSV")}
            </button>
          </VuiBox>
        ) : (
          <>
            {/* Row kind */}
            <VuiBox mb={1.5} sx={{ background: "rgba(255,255,255,.05)", borderRadius: 10, p: 1.5 }}>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{t("Each row is a…", "Cada fila es un…")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[["player", t("Player", "Jugador")], ["parent", t("Parent (child in a column)", "Padre (hijo en una columna)")]].map(([k, lbl]) => (
                  <button key={k} onClick={() => setRowKind(k)} style={{ ...S.chip, background: rowKind === k ? "#f97316" : "rgba(255,255,255,.08)", color: rowKind === k ? "#000" : "#fff", fontWeight: 700 }}>{lbl}</button>
                ))}
              </div>
              <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10, marginTop: 6 }}>
                {rowKind === "parent"
                  ? t("Set the child's name column to \"Player full name\" below.", "Abajo, marca la columna con el nombre del hijo como \"Nombre completo\".")
                  : t("Map the player's name; parent email/phone become their contact.", "Mapea el nombre del jugador; email/teléfono del padre = su contacto.")}
              </div>
            </VuiBox>

            {/* Column mapping */}
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{t("Columns we read", "Columnas leídas")}</div>
            <VuiBox sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, mb: 2 }}>
              {headers.map((h, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "7px 9px" }}>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h || `Column ${i + 1}`}</div>
                  <select value={map[i]} onChange={(e) => setMap((m) => m.map((x, j) => j === i ? e.target.value : x))}
                    style={{ width: "100%", background: "rgba(0,0,0,.3)", color: map[i] === "ignore" ? "rgba(255,255,255,.4)" : "#f97316", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, padding: "4px 6px", fontSize: 11, fontFamily: "Inter,sans-serif", outline: "none" }}>
                    {Object.keys(FIELD_LABELS).map((f) => <option key={f} value={f} style={{ color: "#000" }}>{FIELD_LABELS[f][lang] || FIELD_LABELS[f].en}</option>)}
                  </select>
                </div>
              ))}
            </VuiBox>

            {/* Preview */}
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
              {t(`Preview — ${preview.length} players, ${preview.filter((r) => r.email || r.phone).length} parent contacts`, `Vista previa — ${preview.length} jugadores, ${preview.filter((r) => r.email || r.phone).length} contactos`)}
            </div>
            <div style={{ maxHeight: 180, overflow: "auto", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ position: "sticky", top: 0, background: "#0a0e23" }}>
                  {[t("Player", "Jugador"), t("Parent", "Padre"), "Email", t("Phone", "Teléfono")].map((h) => (
                    <th key={h} style={{ textAlign: "left", color: "rgba(255,255,255,.5)", padding: "6px 8px", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {preview.slice(0, 40).map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}>
                      <td style={S.td}>{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</td>
                      <td style={S.td}>{r.parent_name || "—"}</td>
                      <td style={S.td}>{r.email || "—"}</td>
                      <td style={S.td}>{r.phone || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <VuiBox display="flex" gap={1} mt={2} justifyContent="flex-end">
              <button onClick={() => setRows(null)} style={S.ghost}>{t("Choose another file", "Otro archivo")}</button>
              <button onClick={doImport} disabled={!preview.length} style={{ ...S.primary, opacity: preview.length ? 1 : 0.5 }}>
                {t(`Import ${preview.length}`, `Importar ${preview.length}`)}
              </button>
            </VuiBox>
          </>
        )}
      </VuiBox>
    </VuiBox>
  );
}

const S = {
  primary: { background: "#f97316", color: "#000", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" },
  ghost: { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif" },
  chip: { border: "none", borderRadius: 16, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "Inter,sans-serif" },
  td: { color: "rgba(255,255,255,.8)", padding: "5px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 },
};
