export const SITE = {
  nombre: "Calle Justa",
  lema: "Observatorio ciudadano de baches de Navojoa",
  descripcion:
    "Calle Justa mide si las calles de Navojoa se reparan donde más se necesita, no solo donde más se queja la gente. Mapa, índice de prioridad explicable y datos abiertos.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://calle-justa.vercel.app",
  repo: "https://github.com/soniaasv/proyectoSocial",
  equipo: ["Sonia Arizbeth Soto Valenzuela", "Chema"],
  /** The municipality's official WhatsApp channel for citizen reports. */
  whatsappAyuntamiento: "526421571356",
} as const;

export const NAVEGACION = [
  { href: "/mapa", label: "Mapa" },
  { href: "/equidad", label: "Equidad" },
  { href: "/panel", label: "Panel" },
  { href: "/metodologia", label: "Metodología" },
  { href: "/datos", label: "Datos" },
] as const;

/** Real figures shown on the home page, each with its source. */
export const CIFRAS = [
  {
    valor: "19,208",
    etiqueta: "baches contados en Navojoa por el propio Ayuntamiento",
    fuente: "SIUE vía Tribuna, 17 sep 2026",
    url: "https://tribuna.com.mx/sonora/2026/09/17/tapan-mas-de-10-mil-baches-en-solo-un-ano-en-el-municipio-de-navojoa_689122/",
  },
  {
    valor: "10,500+",
    etiqueta: "baches tapados entre septiembre de 2025 y septiembre de 2026",
    fuente: "Ayuntamiento de Navojoa vía Tribuna",
    url: "https://tribuna.com.mx/sonora/2026/09/17/tapan-mas-de-10-mil-baches-en-solo-un-ano-en-el-municipio-de-navojoa_689122/",
  },
  {
    valor: "$10.2 MDP",
    etiqueta: "invertidos en bacheo en ese mismo año",
    fuente: "Ayuntamiento de Navojoa vía Tribuna",
    url: "https://tribuna.com.mx/sonora/2026/09/17/tapan-mas-de-10-mil-baches-en-solo-un-ano-en-el-municipio-de-navojoa_689122/",
  },
  {
    valor: "83.4%",
    etiqueta: "de las personas de 18 años o más en 91 ciudades de México señalaron los baches como uno de los principales problemas de su ciudad",
    fuente: "INEGI, ENSU, junio de 2026",
    url: "https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/ensu/ENSU2026_07_CP.pdf",
  },
] as const;
