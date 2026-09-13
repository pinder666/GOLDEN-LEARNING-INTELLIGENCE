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
import VuiAvatar from "components/VuiAvatar";

// Vision UI Dashboard examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Icons
import { IoClose, IoSend, IoPeople, IoPerson, IoCheckmarkCircle } from "react-icons/io5";

// Auth & Data
import { useAuth } from "context/AuthContext";
import { supabase } from "services/supabase";

const HABIT_CATEGORIES = [
  { key: "all", labelEn: "All Habits", labelEs: "Todos", icon: "⚽" },
  { key: "sleep", labelEn: "Sleep", labelEs: "Sueño", icon: "😴" },
  { key: "nutrition", labelEn: "Nutrition", labelEs: "Nutrición", icon: "🥗" },
  { key: "training", labelEn: "Training", labelEs: "Entrenamiento", icon: "💪" },
  { key: "mindset", labelEn: "Mindset", labelEs: "Mentalidad", icon: "🧠" },
];

import { DEV_MODE } from "devMode";

const DEMO_HABITS = [
  // SLEEP HABITS
  { id: 1, player_name: "Lionel Messi", category: "sleep", habit_en: "I sleep 8-9 hours every night", habit_es: "Duermo 8-9 horas cada noche", source: "Interview 2022", emoji: "😴" },
  { id: 2, player_name: "Cristiano Ronaldo", category: "sleep", habit_en: "I take 5 short naps throughout the day", habit_es: "Tomo 5 siestas cortas durante el día", source: "Sleep coach", emoji: "😴" },
  { id: 3, player_name: "Erling Haaland", category: "sleep", habit_en: "I go to bed at the same time every night", habit_es: "Me acuesto a la misma hora cada noche", source: "Documentary", emoji: "🌙" },
  { id: 4, player_name: "Kylian Mbappé", category: "sleep", habit_en: "I avoid screens 1 hour before sleep", habit_es: "Evito pantallas 1 hora antes de dormir", source: "Interview 2023", emoji: "📵" },
  { id: 5, player_name: "Neymar Jr", category: "sleep", habit_en: "I sleep in a completely dark room", habit_es: "Duermo en una habitación completamente oscura", source: "Interview", emoji: "🌑" },
  { id: 6, player_name: "Kevin De Bruyne", category: "sleep", habit_en: "I keep my bedroom cold for better sleep", habit_es: "Mantengo mi habitación fría para dormir mejor", source: "Interview", emoji: "❄️" },
  { id: 7, player_name: "Virgil van Dijk", category: "sleep", habit_en: "I never use my phone in bed", habit_es: "Nunca uso mi teléfono en la cama", source: "Podcast", emoji: "📱" },
  { id: 8, player_name: "Mohamed Salah", category: "sleep", habit_en: "I wake up at the same time every day", habit_es: "Me despierto a la misma hora todos los días", source: "Interview", emoji: "⏰" },
  { id: 9, player_name: "Jude Bellingham", category: "sleep", habit_en: "I read a book before sleep instead of watching TV", habit_es: "Leo un libro antes de dormir en vez de ver TV", source: "Interview 2024", emoji: "📚" },
  { id: 10, player_name: "Luka Modrić", category: "sleep", habit_en: "I take a short nap after training", habit_es: "Tomo una siesta corta después de entrenar", source: "Interview", emoji: "💤" },
  { id: 11, player_name: "Robert Lewandowski", category: "sleep", habit_en: "I sleep 9 hours minimum on match days", habit_es: "Duermo mínimo 9 horas los días de partido", source: "Documentary", emoji: "⚽" },
  { id: 12, player_name: "Pedri", category: "sleep", habit_en: "I have the same sleep routine every night", habit_es: "Tengo la misma rutina de sueño cada noche", source: "Interview", emoji: "🔄" },

  // NUTRITION HABITS
  { id: 13, player_name: "Cristiano Ronaldo", category: "nutrition", habit_en: "I eat 6 small meals a day instead of 3 big ones", habit_es: "Como 6 comidas pequeñas al día en vez de 3 grandes", source: "Autobiography", emoji: "🍽️" },
  { id: 14, player_name: "Lionel Messi", category: "nutrition", habit_en: "I drink water before every meal", habit_es: "Bebo agua antes de cada comida", source: "Nutritionist", emoji: "💧" },
  { id: 15, player_name: "Erling Haaland", category: "nutrition", habit_en: "I eat fish and vegetables every day", habit_es: "Como pescado y verduras todos los días", source: "Documentary", emoji: "🐟" },
  { id: 16, player_name: "Kylian Mbappé", category: "nutrition", habit_en: "I drink 3 liters of water daily", habit_es: "Bebo 3 litros de agua al día", source: "Interview 2023", emoji: "💧" },
  { id: 17, player_name: "Robert Lewandowski", category: "nutrition", habit_en: "I avoid sugar and processed foods", habit_es: "Evito el azúcar y alimentos procesados", source: "Documentary", emoji: "🚫" },
  { id: 18, player_name: "Mohamed Salah", category: "nutrition", habit_en: "I eat breakfast within 30 minutes of waking", habit_es: "Desayuno dentro de los 30 minutos de despertar", source: "Interview", emoji: "🌅" },
  { id: 19, player_name: "Neymar Jr", category: "nutrition", habit_en: "I always have fruits as snacks", habit_es: "Siempre como frutas como snacks", source: "Interview", emoji: "🍎" },
  { id: 20, player_name: "Kevin De Bruyne", category: "nutrition", habit_en: "I eat protein with every meal", habit_es: "Como proteína en cada comida", source: "Nutritionist", emoji: "🥩" },
  { id: 21, player_name: "Virgil van Dijk", category: "nutrition", habit_en: "I never skip breakfast", habit_es: "Nunca me salto el desayuno", source: "Interview", emoji: "🥣" },
  { id: 22, player_name: "Thibaut Courtois", category: "nutrition", habit_en: "I drink a protein shake after every training", habit_es: "Tomo un batido de proteínas después de cada entrenamiento", source: "Interview", emoji: "🥤" },
  { id: 23, player_name: "Gavi", category: "nutrition", habit_en: "I eat carbs 3 hours before a match", habit_es: "Como carbohidratos 3 horas antes del partido", source: "Interview", emoji: "🍝" },
  { id: 24, player_name: "Bukayo Saka", category: "nutrition", habit_en: "I avoid fried foods", habit_es: "Evito las comidas fritas", source: "Interview", emoji: "🍟" },
  { id: 25, player_name: "Phil Foden", category: "nutrition", habit_en: "I eat vegetables with every meal", habit_es: "Como verduras en cada comida", source: "Interview", emoji: "🥦" },
  { id: 26, player_name: "Vinicius Jr", category: "nutrition", habit_en: "I drink coconut water for hydration", habit_es: "Bebo agua de coco para hidratarme", source: "Interview", emoji: "🥥" },
  { id: 27, player_name: "Erling Haaland", category: "nutrition", habit_en: "I eat heart and liver for nutrients", habit_es: "Como corazón e hígado por los nutrientes", source: "Documentary", emoji: "❤️" },
  { id: 28, player_name: "Luka Modrić", category: "nutrition", habit_en: "I avoid alcohol completely", habit_es: "Evito el alcohol completamente", source: "Interview", emoji: "🚫" },
  { id: 29, player_name: "Karim Benzema", category: "nutrition", habit_en: "I eat dates for natural energy", habit_es: "Como dátiles para energía natural", source: "Interview", emoji: "🌴" },
  { id: 30, player_name: "Jamal Musiala", category: "nutrition", habit_en: "I always pack healthy snacks for travel", habit_es: "Siempre llevo snacks saludables cuando viajo", source: "Interview", emoji: "🎒" },

  // TRAINING HABITS
  { id: 31, player_name: "Cristiano Ronaldo", category: "training", habit_en: "I do 3000 sit-ups every day", habit_es: "Hago 3000 abdominales cada día", source: "Autobiography", emoji: "💪" },
  { id: 32, player_name: "Lionel Messi", category: "training", habit_en: "I practice free kicks for 30 minutes after every training", habit_es: "Practico tiros libres 30 minutos después de cada entrenamiento", source: "Coach interview", emoji: "⚽" },
  { id: 33, player_name: "Erling Haaland", category: "training", habit_en: "I do yoga every morning for flexibility", habit_es: "Hago yoga cada mañana para flexibilidad", source: "Documentary", emoji: "🧘" },
  { id: 34, player_name: "Kylian Mbappé", category: "training", habit_en: "I do sprint training 3 times a week", habit_es: "Hago entrenamiento de sprints 3 veces por semana", source: "Interview", emoji: "🏃" },
  { id: 35, player_name: "Kevin De Bruyne", category: "training", habit_en: "I always arrive 30 minutes early to training", habit_es: "Siempre llego 30 minutos antes al entrenamiento", source: "Pep Guardiola", emoji: "⏰" },
  { id: 36, player_name: "Virgil van Dijk", category: "training", habit_en: "I do extra core work every day", habit_es: "Hago trabajo extra de core todos los días", source: "Interview", emoji: "🏋️" },
  { id: 37, player_name: "Mohamed Salah", category: "training", habit_en: "I practice with both feet every session", habit_es: "Practico con ambos pies en cada sesión", source: "Training footage", emoji: "👟" },
  { id: 38, player_name: "Neymar Jr", category: "training", habit_en: "I practice skills for 1 hour after training", habit_es: "Practico habilidades 1 hora después del entrenamiento", source: "Interview", emoji: "🎯" },
  { id: 39, player_name: "Robert Lewandowski", category: "training", habit_en: "I never miss a gym session", habit_es: "Nunca me pierdo una sesión de gimnasio", source: "Documentary", emoji: "🏋️" },
  { id: 40, player_name: "Jude Bellingham", category: "training", habit_en: "I watch video of my performance after every match", habit_es: "Veo video de mi rendimiento después de cada partido", source: "Interview 2024", emoji: "📹" },
  { id: 41, player_name: "Pedri", category: "training", habit_en: "I do extra passing drills every day", habit_es: "Hago ejercicios extra de pases cada día", source: "Interview", emoji: "⚽" },
  { id: 42, player_name: "Phil Foden", category: "training", habit_en: "I practice ball control in my garden every day", habit_es: "Practico control de balón en mi jardín cada día", source: "Interview", emoji: "🏡" },
  { id: 43, player_name: "Bukayo Saka", category: "training", habit_en: "I do balance exercises every morning", habit_es: "Hago ejercicios de equilibrio cada mañana", source: "Interview", emoji: "⚖️" },
  { id: 44, player_name: "Gavi", category: "training", habit_en: "I study opponents before every match", habit_es: "Estudio a los rivales antes de cada partido", source: "Interview", emoji: "📊" },
  { id: 45, player_name: "Trent Alexander-Arnold", category: "training", habit_en: "I practice crossing for 20 minutes after training", habit_es: "Practico centros 20 minutos después del entrenamiento", source: "Liverpool", emoji: "🎯" },
  { id: 46, player_name: "Vinicius Jr", category: "training", habit_en: "I do reaction training twice a week", habit_es: "Hago entrenamiento de reacción dos veces por semana", source: "Interview", emoji: "⚡" },
  { id: 47, player_name: "Declan Rice", category: "training", habit_en: "I always do the full warm-up, never skip steps", habit_es: "Siempre hago el calentamiento completo, nunca salto pasos", source: "Interview", emoji: "🔥" },
  { id: 48, player_name: "Rodri", category: "training", habit_en: "I practice positioning without the ball", habit_es: "Practico el posicionamiento sin balón", source: "Guardiola", emoji: "📍" },
  { id: 49, player_name: "Bruno Fernandes", category: "training", habit_en: "I take 50 shots at goal after every training", habit_es: "Hago 50 tiros a puerta después de cada entrenamiento", source: "Interview", emoji: "🥅" },
  { id: 50, player_name: "Martin Ødegaard", category: "training", habit_en: "I do agility ladder drills every day", habit_es: "Hago ejercicios de escalera de agilidad cada día", source: "Interview", emoji: "🪜" },

  // MINDSET HABITS
  { id: 51, player_name: "Lionel Messi", category: "mindset", habit_en: "I visualize my goals before every match", habit_es: "Visualizo mis goles antes de cada partido", source: "Interview 2021", emoji: "🧠" },
  { id: 52, player_name: "Cristiano Ronaldo", category: "mindset", habit_en: "I believe I am the best, and I work to prove it", habit_es: "Creo que soy el mejor, y trabajo para demostrarlo", source: "Documentary", emoji: "👑" },
  { id: 53, player_name: "Kylian Mbappé", category: "mindset", habit_en: "I write my goals down every year", habit_es: "Escribo mis metas cada año", source: "Interview 2023", emoji: "📝" },
  { id: 54, player_name: "Erling Haaland", category: "mindset", habit_en: "I meditate for 10 minutes every morning", habit_es: "Medito 10 minutos cada mañana", source: "Documentary", emoji: "🧘" },
  { id: 55, player_name: "Kevin De Bruyne", category: "mindset", habit_en: "I focus on what I can control, not results", habit_es: "Me enfoco en lo que puedo controlar, no en los resultados", source: "Interview", emoji: "🎯" },
  { id: 56, player_name: "Virgil van Dijk", category: "mindset", habit_en: "I never let mistakes affect my next action", habit_es: "Nunca dejo que los errores afecten mi siguiente acción", source: "Interview", emoji: "💪" },
  { id: 57, player_name: "Mohamed Salah", category: "mindset", habit_en: "I pray before every match", habit_es: "Rezo antes de cada partido", source: "Interview", emoji: "🙏" },
  { id: 58, player_name: "Neymar Jr", category: "mindset", habit_en: "I listen to music to get in the zone before games", habit_es: "Escucho música para entrar en la zona antes de los partidos", source: "Interview", emoji: "🎧" },
  { id: 59, player_name: "Robert Lewandowski", category: "mindset", habit_en: "I set small daily goals, not just big ones", habit_es: "Establezco pequeñas metas diarias, no solo grandes", source: "Documentary", emoji: "📈" },
  { id: 60, player_name: "Luka Modrić", category: "mindset", habit_en: "I stay calm under pressure by breathing deeply", habit_es: "Mantengo la calma bajo presión respirando profundamente", source: "Interview", emoji: "😌" },
  { id: 61, player_name: "Jude Bellingham", category: "mindset", habit_en: "I learn from every loss instead of being upset", habit_es: "Aprendo de cada derrota en vez de molestarme", source: "Interview 2024", emoji: "📚" },
  { id: 62, player_name: "Pedri", category: "mindset", habit_en: "I stay humble even when I play well", habit_es: "Me mantengo humilde incluso cuando juego bien", source: "Interview", emoji: "🙏" },
  { id: 63, player_name: "Gavi", category: "mindset", habit_en: "I never give up, even when we are losing", habit_es: "Nunca me rindo, incluso cuando vamos perdiendo", source: "Interview", emoji: "🔥" },
  { id: 64, player_name: "Phil Foden", category: "mindset", habit_en: "I focus on enjoying the game, not just winning", habit_es: "Me enfoco en disfrutar el juego, no solo en ganar", source: "Interview", emoji: "😊" },
  { id: 65, player_name: "Bukayo Saka", category: "mindset", habit_en: "I use positive self-talk before matches", habit_es: "Uso diálogo interno positivo antes de los partidos", source: "Interview", emoji: "💬" },
  { id: 66, player_name: "Vinicius Jr", category: "mindset", habit_en: "I block out negativity from fans and media", habit_es: "Bloqueo la negatividad de fans y medios", source: "Interview", emoji: "🚫" },
  { id: 67, player_name: "Trent Alexander-Arnold", category: "mindset", habit_en: "I watch highlights of great players to stay inspired", habit_es: "Veo highlights de grandes jugadores para mantenerme inspirado", source: "Interview", emoji: "📺" },
  { id: 68, player_name: "Rodri", category: "mindset", habit_en: "I prepare mentally for every possible scenario", habit_es: "Me preparo mentalmente para cada escenario posible", source: "Interview", emoji: "🧠" },
  { id: 69, player_name: "Bruno Fernandes", category: "mindset", habit_en: "I take responsibility when things go wrong", habit_es: "Asumo responsabilidad cuando las cosas salen mal", source: "Interview", emoji: "✋" },
  { id: 70, player_name: "Declan Rice", category: "mindset", habit_en: "I talk to a sports psychologist regularly", habit_es: "Hablo con un psicólogo deportivo regularmente", source: "Interview", emoji: "🗣️" },
  { id: 71, player_name: "Martin Ødegaard", category: "mindset", habit_en: "I spend time with family to stay grounded", habit_es: "Paso tiempo con familia para mantenerme centrado", source: "Interview", emoji: "👨‍👩‍👧" },
  { id: 72, player_name: "Florian Wirtz", category: "mindset", habit_en: "I remember why I started playing football", habit_es: "Recuerdo por qué empecé a jugar fútbol", source: "Interview", emoji: "⚽" },
  { id: 73, player_name: "Jamal Musiala", category: "mindset", habit_en: "I celebrate small wins, not just big victories", habit_es: "Celebro pequeñas victorias, no solo las grandes", source: "Interview", emoji: "🎉" },
  { id: 74, player_name: "Karim Benzema", category: "mindset", habit_en: "I stay patient even when goals don't come", habit_es: "Mantengo la paciencia incluso cuando no llegan los goles", source: "Interview", emoji: "⏳" },
  { id: 75, player_name: "Thibaut Courtois", category: "mindset", habit_en: "I study my opponents' shooting patterns", habit_es: "Estudio los patrones de tiro de mis oponentes", source: "Interview", emoji: "🎯" },

  // MORE TRAINING HABITS
  { id: 76, player_name: "Cristiano Ronaldo", category: "training", habit_en: "I do ice baths after every game", habit_es: "Hago baños de hielo después de cada partido", source: "Autobiography", emoji: "🧊" },
  { id: 77, player_name: "Lionel Messi", category: "training", habit_en: "I focus on recovery as much as training", habit_es: "Me enfoco en la recuperación tanto como en el entrenamiento", source: "Interview", emoji: "🔋" },
  { id: 78, player_name: "Erling Haaland", category: "training", habit_en: "I wear special recovery glasses that block blue light", habit_es: "Uso gafas especiales de recuperación que bloquean luz azul", source: "Documentary", emoji: "👓" },
  { id: 79, player_name: "Kylian Mbappé", category: "training", habit_en: "I do stretching for 20 minutes before bed", habit_es: "Hago estiramientos 20 minutos antes de dormir", source: "Interview", emoji: "🧘" },
  { id: 80, player_name: "Robert Lewandowski", category: "training", habit_en: "I do cryotherapy twice a week", habit_es: "Hago crioterapia dos veces por semana", source: "Documentary", emoji: "❄️" },
  { id: 81, player_name: "Neymar Jr", category: "training", habit_en: "I play other sports to stay sharp", habit_es: "Juego otros deportes para mantenerme en forma", source: "Interview", emoji: "🏀" },
  { id: 82, player_name: "Kevin De Bruyne", category: "training", habit_en: "I use a foam roller every day", habit_es: "Uso un rodillo de espuma todos los días", source: "Interview", emoji: "🔄" },
  { id: 83, player_name: "Mohamed Salah", category: "training", habit_en: "I do extra cardio on rest days", habit_es: "Hago cardio extra en días de descanso", source: "Interview", emoji: "🫀" },
  { id: 84, player_name: "Virgil van Dijk", category: "training", habit_en: "I get a massage after every match", habit_es: "Me hago un masaje después de cada partido", source: "Interview", emoji: "💆" },
  { id: 85, player_name: "Luka Modrić", category: "training", habit_en: "I work on my weaker foot for 15 minutes daily", habit_es: "Trabajo mi pierna débil 15 minutos diarios", source: "Interview", emoji: "🦵" },

  // MORE NUTRITION HABITS
  { id: 86, player_name: "Cristiano Ronaldo", category: "nutrition", habit_en: "I eat chicken, rice, and salad every day", habit_es: "Como pollo, arroz y ensalada todos los días", source: "Chef interview", emoji: "🍗" },
  { id: 87, player_name: "Lionel Messi", category: "nutrition", habit_en: "I cut out pizza and started eating whole grains", habit_es: "Dejé la pizza y empecé a comer granos integrales", source: "Nutritionist", emoji: "🌾" },
  { id: 88, player_name: "Kylian Mbappé", category: "nutrition", habit_en: "I eat a banana before every match for energy", habit_es: "Como un plátano antes de cada partido para energía", source: "Interview", emoji: "🍌" },
  { id: 89, player_name: "Jude Bellingham", category: "nutrition", habit_en: "I have a recovery shake within 30 minutes of training", habit_es: "Tomo un batido de recuperación dentro de 30 minutos del entrenamiento", source: "Interview", emoji: "🥤" },
  { id: 90, player_name: "Pedri", category: "nutrition", habit_en: "I always eat breakfast with my family", habit_es: "Siempre desayuno con mi familia", source: "Interview", emoji: "👨‍👩‍👧" },

  // MORE SLEEP HABITS
  { id: 91, player_name: "Cristiano Ronaldo", category: "sleep", habit_en: "I sleep in the fetal position for optimal recovery", habit_es: "Duermo en posición fetal para recuperación óptima", source: "Sleep coach", emoji: "🛏️" },
  { id: 92, player_name: "Erling Haaland", category: "sleep", habit_en: "I use blackout curtains in every hotel", habit_es: "Uso cortinas opacas en cada hotel", source: "Documentary", emoji: "🏨" },
  { id: 93, player_name: "Robert Lewandowski", category: "sleep", habit_en: "I have a special mattress that travels with me", habit_es: "Tengo un colchón especial que viaja conmigo", source: "Documentary", emoji: "🛏️" },
  { id: 94, player_name: "Mohamed Salah", category: "sleep", habit_en: "I don't drink caffeine after 2pm", habit_es: "No tomo cafeína después de las 2pm", source: "Interview", emoji: "☕" },
  { id: 95, player_name: "Kevin De Bruyne", category: "sleep", habit_en: "I use a sleep tracker to monitor my rest", habit_es: "Uso un rastreador de sueño para monitorear mi descanso", source: "Interview", emoji: "⌚" },

  // MORE MINDSET HABITS
  { id: 96, player_name: "Lionel Messi", category: "mindset", habit_en: "I play for the team, not individual glory", habit_es: "Juego para el equipo, no para gloria individual", source: "Interview", emoji: "🤝" },
  { id: 97, player_name: "Cristiano Ronaldo", category: "mindset", habit_en: "I use criticism as motivation", habit_es: "Uso las críticas como motivación", source: "Documentary", emoji: "🔥" },
  { id: 98, player_name: "Neymar Jr", category: "mindset", habit_en: "I remember my childhood dream before big games", habit_es: "Recuerdo mi sueño de infancia antes de partidos importantes", source: "Interview", emoji: "✨" },
  { id: 99, player_name: "Kylian Mbappé", category: "mindset", habit_en: "I always try something new in every match", habit_es: "Siempre intento algo nuevo en cada partido", source: "Interview", emoji: "🎨" },
  { id: 100, player_name: "Erling Haaland", category: "mindset", habit_en: "I think about scoring the moment I wake up", habit_es: "Pienso en marcar desde que me despierto", source: "Documentary", emoji: "⚽" },
  { id: 101, player_name: "Virgil van Dijk", category: "mindset", habit_en: "I lead by example, not just words", habit_es: "Lidero con el ejemplo, no solo con palabras", source: "Interview", emoji: "👑" },
  { id: 102, player_name: "Luka Modrić", category: "mindset", habit_en: "I thank my teammates after every match", habit_es: "Agradezco a mis compañeros después de cada partido", source: "Interview", emoji: "🙏" },
  { id: 103, player_name: "Robert Lewandowski", category: "mindset", habit_en: "I set a new goal the moment I achieve one", habit_es: "Establezco una nueva meta en cuanto logro una", source: "Documentary", emoji: "🎯" },
  { id: 104, player_name: "Jude Bellingham", category: "mindset", habit_en: "I never complain about referee decisions", habit_es: "Nunca me quejo de las decisiones del árbitro", source: "Interview", emoji: "🤐" },
  { id: 105, player_name: "Gavi", category: "mindset", habit_en: "I respect every opponent, big or small", habit_es: "Respeto a cada oponente, grande o pequeño", source: "Interview", emoji: "🤝" },
];

const DEMO_PLAYERS = [
  { id: 1, first_name: "Marcus", last_name: "Johnson" },
  { id: 2, first_name: "Sofia", last_name: "Garcia" },
  { id: 3, first_name: "Liam", last_name: "Smith" },
  { id: 4, first_name: "Emma", last_name: "Williams" },
];

function CoachProHabits() {
  const { t, i18n } = useTranslation(["common", "coach", "prohabits"]);
  const { teamData, coachData } = useAuth();

  const [habits, setHabits] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  // Send modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [sendTo, setSendTo] = useState("team"); // 'team' or player id
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const language = i18n.language || "en";

  useEffect(() => {
    if (DEV_MODE) {
      setHabits(DEMO_HABITS);
      setPlayers(DEMO_PLAYERS);
      setLoading(false);
      return;
    }
    fetchData();
  }, [teamData]);

  const fetchData = async () => {
    try {
      // Fetch pro habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("pro_habits")
        .select("*")
        .order("category")
        .order("player_name");

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      // Fetch players
      if (teamData?.id) {
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("*")
          .eq("team_id", teamData.id)
          .eq("is_active", true)
          .order("first_name");

        if (playersError) throw playersError;
        setPlayers(playersData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openSendModal = (habit) => {
    setSelectedHabit(habit);
    setSendTo("team");
    setSent(false);
    setShowSendModal(true);
  };

  const handleSend = async () => {
    if (!selectedHabit) return;

    setSending(true);
    try {
      if (sendTo === "team") {
        // Send to all players
        const records = players.map((player) => ({
          player_id: player.id,
          habit_id: selectedHabit.id,
          sent_by_coach_id: coachData.id,
        }));

        if (records.length > 0) {
          await supabase.from("player_habit_assignments").insert(records);
        }
      } else {
        // Send to individual player
        await supabase.from("player_habit_assignments").insert([
          {
            player_id: sendTo,
            habit_id: selectedHabit.id,
            sent_by_coach_id: coachData.id,
          },
        ]);
      }

      setSent(true);
    } catch (error) {
      console.error("Error sending habit:", error);
    } finally {
      setSending(false);
    }
  };

  const filteredHabits = habits.filter((habit) => {
    if (activeCategory === "all") return true;
    return habit.category === activeCategory;
  });

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0075FF&color=fff&size=100`;

  const getCategoryInfo = (category) => {
    return HABIT_CATEGORIES.find((c) => c.key === category) || HABIT_CATEGORIES[0];
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={2} sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 140px)" }}>
        {/* Header */}
        <VuiBox mb={3}>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {t("coach:prohabits.title")}
          </VuiTypography>
          <VuiTypography variant="body2" color="text">
            {language === "es"
              ? "Hábitos reales de jugadores profesionales"
              : "Real habits from professional players"}
          </VuiTypography>
        </VuiBox>

        {/* Category Tabs */}
        <Card sx={{ mb: 3 }}>
          <VuiBox px={2}>
            <Tabs
              value={activeCategory}
              onChange={(e, val) => setActiveCategory(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": { color: "rgba(255,255,255,0.7)", minWidth: "auto", px: 2 },
                "& .Mui-selected": { color: "#0075FF" },
                "& .MuiTabs-indicator": { backgroundColor: "#0075FF" },
              }}
            >
              {HABIT_CATEGORIES.map((cat) => (
                <Tab
                  key={cat.key}
                  value={cat.key}
                  label={`${cat.icon} ${language === "es" ? cat.labelEs : cat.labelEn}`}
                />
              ))}
            </Tabs>
          </VuiBox>
        </Card>

        {/* Habits Grid */}
        {loading ? (
          <VuiTypography color="text">{t("common:status.loading")}</VuiTypography>
        ) : filteredHabits.length === 0 ? (
          <Card>
            <VuiBox p={5} textAlign="center">
              <VuiTypography variant="h2" mb={2}>
                ⚽
              </VuiTypography>
              <VuiTypography variant="h5" color="white">
                {language === "es" ? "Sin hábitos en esta categoría" : "No habits in this category"}
              </VuiTypography>
            </VuiBox>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredHabits.map((habit) => {
              const catInfo = getCategoryInfo(habit.category);

              return (
                <Grid item xs={12} md={6} lg={4} key={habit.id}>
                  <Card
                    sx={{
                      height: "100%",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <VuiBox p={3}>
                      {/* Player Header */}
                      <VuiBox display="flex" alignItems="center" gap={2} mb={2}>
                        {habit.player_image_url ? (
                          <VuiAvatar
                            src={habit.player_image_url}
                            alt={habit.player_name}
                            size="lg"
                          />
                        ) : (
                          <VuiBox
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #0075FF 0%, #00D4FF 100%)",
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
                          <VuiTypography variant="h6" color="white" fontWeight="bold">
                            {habit.player_name}
                          </VuiTypography>
                          <VuiTypography variant="caption" color="text">
                            {habit.player_team} • {habit.player_country}
                          </VuiTypography>
                        </VuiBox>
                      </VuiBox>

                      {/* Habit Content */}
                      <VuiBox
                        sx={{
                          p: 2,
                          borderRadius: "12px",
                          background: "rgba(255, 255, 255, 0.03)",
                          mb: 2,
                        }}
                      >
                        <VuiBox display="flex" gap={1} mb={1}>
                          <VuiTypography variant="body2">{catInfo.icon}</VuiTypography>
                          <VuiTypography variant="caption" color="info" fontWeight="bold">
                            {language === "es" ? catInfo.labelEs : catInfo.labelEn}
                          </VuiTypography>
                        </VuiBox>
                        <VuiTypography variant="body2" color="white">
                          "{language === "es" ? habit.habit_es : habit.habit_en}"
                        </VuiTypography>
                      </VuiBox>

                      {/* Source */}
                      {habit.source && (
                        <VuiTypography variant="caption" color="text" display="block" mb={2}>
                          📰 {habit.source}
                        </VuiTypography>
                      )}

                      {/* Send Button */}
                      <VuiButton
                        color="info"
                        fullWidth
                        size="small"
                        onClick={() => openSendModal(habit)}
                        startIcon={<IoSend />}
                      >
                        {language === "es" ? "Enviar al Equipo" : "Send to Team"}
                      </VuiButton>
                    </VuiBox>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Send Modal */}
        <Modal open={showSendModal} onClose={() => setShowSendModal(false)}>
          <VuiBox
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "95%", md: 450 },
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <Card>
              <VuiBox p={3}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <VuiTypography variant="h5" color="white">
                    {language === "es" ? "Enviar Hábito Pro" : "Send Pro Habit"}
                  </VuiTypography>
                  <IconButton onClick={() => setShowSendModal(false)}>
                    <IoClose color="white" />
                  </IconButton>
                </VuiBox>

                {selectedHabit && (
                  <>
                    {/* Habit Preview */}
                    <VuiBox
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        background: "rgba(0, 117, 255, 0.1)",
                        border: "1px solid rgba(0, 117, 255, 0.3)",
                        mb: 3,
                      }}
                    >
                      <VuiTypography variant="button" color="white" fontWeight="bold">
                        {selectedHabit.player_name}
                      </VuiTypography>
                      <VuiTypography variant="body2" color="white" mt={1}>
                        "{language === "es" ? selectedHabit.habit_es : selectedHabit.habit_en}"
                      </VuiTypography>
                    </VuiBox>

                    {sent ? (
                      <VuiBox textAlign="center" py={3}>
                        <IoCheckmarkCircle size={60} color="#4CAF50" />
                        <VuiTypography variant="h5" color="success" mt={2}>
                          {t("coach:prohabits.sentSuccess")}
                        </VuiTypography>
                        <VuiButton
                          color="info"
                          onClick={() => setShowSendModal(false)}
                          sx={{ mt: 3 }}
                        >
                          {t("common:buttons.close")}
                        </VuiButton>
                      </VuiBox>
                    ) : (
                      <>
                        {/* Send To Selection */}
                        <VuiBox mb={3}>
                          <VuiTypography variant="button" color="white" fontWeight="medium" mb={1} display="block">
                            {language === "es" ? "Enviar a" : "Send to"}
                          </VuiTypography>

                          {/* Team Option */}
                          <VuiBox
                            onClick={() => setSendTo("team")}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              p: 2,
                              mb: 1,
                              borderRadius: "12px",
                              cursor: "pointer",
                              background: sendTo === "team" ? "rgba(0, 117, 255, 0.2)" : "rgba(255, 255, 255, 0.03)",
                              border: sendTo === "team" ? "2px solid #0075FF" : "2px solid transparent",
                            }}
                          >
                            <IoPeople size={24} color={sendTo === "team" ? "#0075FF" : "white"} />
                            <VuiTypography variant="button" color="white">
                              {t("coach:prohabits.sendToTeam")} ({players.length})
                            </VuiTypography>
                          </VuiBox>

                          {/* Individual Players */}
                          <VuiBox
                            sx={{
                              maxHeight: 200,
                              overflow: "auto",
                              borderRadius: "12px",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            {players.map((player) => (
                              <VuiBox
                                key={player.id}
                                onClick={() => setSendTo(player.id)}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  p: 1.5,
                                  cursor: "pointer",
                                  background: sendTo === player.id ? "rgba(0, 117, 255, 0.2)" : "transparent",
                                  borderLeft: sendTo === player.id ? "3px solid #0075FF" : "3px solid transparent",
                                  "&:hover": {
                                    background: "rgba(255,255,255,0.05)",
                                  },
                                }}
                              >
                                <VuiAvatar
                                  src={player.avatar_url || defaultAvatar(`${player.first_name} ${player.last_name}`)}
                                  size="sm"
                                />
                                <VuiTypography variant="button" color="white">
                                  {player.first_name} {player.last_name}
                                </VuiTypography>
                              </VuiBox>
                            ))}
                          </VuiBox>
                        </VuiBox>

                        {/* Send Button */}
                        <VuiButton
                          color="info"
                          fullWidth
                          onClick={handleSend}
                          disabled={sending}
                          startIcon={<IoSend />}
                        >
                          {sending
                            ? t("common:status.sending")
                            : sendTo === "team"
                            ? t("coach:prohabits.sendToTeam")
                            : t("coach:prohabits.sendToPlayer")}
                        </VuiButton>
                      </>
                    )}
                  </>
                )}
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

export default CoachProHabits;
