import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "services/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// DEV MODE: bypass auth for testing UI
import { DEV_MODE } from "devMode";
const DEV_USER = DEV_MODE ? { id: 'dev-user', email: 'coach@test.com' } : null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEV_USER);
  const [userProfile, setUserProfile] = useState(DEV_MODE ? { id: 'dev-user', role: 'coach', name: 'Test Coach' } : null);
  const [coachData, setCoachData] = useState(DEV_MODE ? { id: 'dev-coach', team_name: 'Test FC' } : null);
  const [teamData, setTeamData] = useState(DEV_MODE ? { id: 'dev-team', name: 'Thunder FC', age_group: 'U12' } : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip Supabase in dev mode - use mock data
    if (DEV_MODE) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUserProfile(null);
          setCoachData(null);
          setTeamData(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
      }
      setUserProfile(profile);

      // If coach, fetch coach data and team
      if (profile?.role === "coach" || profile?.role === "assistant_coach") {
        const { data: coach, error: coachError } = await supabase
          .from("coaches")
          .select(`
            *,
            team:teams(*)
          `)
          .eq("user_id", userId)
          .single();

        if (coachError && coachError.code !== "PGRST116") {
          console.error("Error fetching coach:", coachError);
        }
        setCoachData(coach);
        setTeamData(coach?.team);
      }

      // If parent, fetch parent data and linked players
      if (profile?.role === "parent") {
        const { data: parent, error: parentError } = await supabase
          .from("parents")
          .select(`
            *,
            team:teams(*),
            players(*)
          `)
          .eq("user_id", userId)
          .single();

        if (parentError && parentError.code !== "PGRST116") {
          console.error("Error fetching parent:", parentError);
        }
        setTeamData(parent?.team);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    }
  };

  const signUp = async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithMagicLink = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUserProfile(null);
      setCoachData(null);
      setTeamData(null);
    }
    return { error };
  };

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (!error) {
      setUserProfile(data);
    }
    return { data, error };
  };

  const createTeam = async (teamData) => {
    // Create team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert([teamData])
      .select()
      .single();

    if (teamError) return { error: teamError };

    // Link coach to team
    const { error: coachError } = await supabase
      .from("coaches")
      .update({ team_id: team.id })
      .eq("user_id", user.id);

    if (coachError) return { error: coachError };

    setTeamData(team);
    return { data: team };
  };

  const value = {
    user,
    userProfile,
    coachData,
    teamData,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    updateProfile,
    createTeam,
    refreshUserData: () => fetchUserData(user?.id),
    isCoach: userProfile?.role === "coach" || userProfile?.role === "assistant_coach",
    isParent: userProfile?.role === "parent",
    isChild: userProfile?.role === "child",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
