/**
 * /dev — página de herramientas de desarrollo.
 * Solo accesible en NODE_ENV !== "production".
 * Redirige a /dev/theme-test por defecto.
 */
import { redirect } from "next/navigation";

export default function DevIndex() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }
  redirect("/dev/theme-test");
}
