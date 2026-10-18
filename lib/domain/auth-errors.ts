/** Turns Supabase Auth / database errors into plain-language messages. Never reveals whether an email is registered. */
export function friendlyError(err: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!err) return "Something went wrong. Please try again.";
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();

  if (code === "otp_expired" || (msg.includes("link") && (msg.includes("expired") || msg.includes("invalid")))) return "That link has expired. Request a new one.";
  if (code === "flow_state_not_found" || code === "bad_code_verifier" || msg.includes("code verifier"))
    return "That link was opened in a different browser or has already been used. Open it in the browser you started with, or request a new one.";
  if (code === "invalid_credentials" || msg.includes("invalid login credentials"))
    return "That email and password don't match. Check them and try again.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return "Please confirm your email first. Open the link we sent you, or send it again below.";
  if (code === "same_password" || msg.includes("different from the old password"))
    return "Your new password must be different from your current one.";
  if (code === "weak_password" || msg.includes("password should"))
    return "Choose a stronger password: at least 8 characters, ideally mixing letters and numbers.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || err.status === 429 || msg.includes("rate limit"))
    return "Too many attempts. Please wait a few minutes and try again.";
  if (code === "email_address_not_authorized" || msg.includes("not authorized"))
    return "We can't send email to this address yet. During testing only invited addresses receive emails.";
  if (code === "email_address_invalid" || (msg.includes("email") && (msg.includes("invalid format") || msg.includes("is invalid"))))
    return "Enter a valid email address.";
  if (code === "signup_disabled") return "New accounts can't be created right now.";
  if (code === "session_not_found" || code === "refresh_token_not_found" || msg.includes("jwt expired")) return "You've been signed out. Please sign in again.";
  if (code === "23514" || msg.includes("check constraint") || msg.includes("violates check"))
    return msg.includes("18") ? "Mealwise is for adults aged 18 and over." : "One of your answers isn't in the allowed range. Please check and try again.";
  if (msg.includes("failed to fetch") || msg.includes("network") || err.status === 0)
    return "Can't reach Mealwise. Check your internet connection and try again.";
  return "Something went wrong. Please try again.";
}
