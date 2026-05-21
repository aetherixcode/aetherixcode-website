import { useEffect } from "react";

import { supabase } from "../lib/supabase";

export default function AuthRedirect() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/dashboard";
    });
  }, []);

  return null;
}
