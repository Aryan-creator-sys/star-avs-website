// Shared contact helpers — reuse the site's real numbers (no fabricated values).
import { COMPANY } from "../../data/site";

export const PHONE_TEL = (COMPANY.phones && COMPANY.phones[0] && COMPANY.phones[0].tel) || COMPANY.phone || "";
export const PHONE_LABEL = (COMPANY.phones && COMPANY.phones[0] && COMPANY.phones[0].label) || COMPANY.phone || "";
export const CALL_HREF = PHONE_TEL ? `tel:${PHONE_TEL}` : COMPANY.phoneHref || "#contact";

export function whatsappHref(message) {
  const text = message || "Hi Star AV, I'd like help planning an AV / home-cinema system.";
  return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;
}
