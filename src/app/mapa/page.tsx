import type { Metadata } from "next";
import { ExploradorMapa } from "@/components/mapa/explorador-mapa";

export const metadata: Metadata = {
  title: "Mapa de baches",
  description: "Baches de Navojoa ordenados por un índice de prioridad explicable, con capas de marginación, escuelas y salud.",
};

export default function MapaPage() {
  return <ExploradorMapa />;
}
