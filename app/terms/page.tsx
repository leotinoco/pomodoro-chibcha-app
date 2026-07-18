import { Metadata } from "next";
import TermsContent from "./TermsContent";

export const metadata: Metadata = {
  title: "Términos de Servicio | Pomodoro Chibcha App",
  description:
    "Términos y condiciones para el uso de Pomodoro Chibcha App, disponibles en español, inglés, francés, japonés y portugués.",
  alternates: {
    canonical: "https://pomodoro.chibcha.club/terms",
  },
  openGraph: {
    title: "Términos de Servicio | Pomodoro Chibcha App",
    description:
      "Términos y condiciones para el uso de Pomodoro Chibcha App, disponibles en español, inglés, francés, japonés y portugués.",
    url: "https://pomodoro.chibcha.club/terms",
  },
};

export default function TermsOfService() {
  return <TermsContent />;
}
