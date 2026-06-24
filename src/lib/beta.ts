// Beta feature-flag. In beta tonen we alleen schermen die echt geld verwerken
// (server-side, via Supabase). De overige mockup-flows draaien nog op demo-
// state ("nepgeld") en worden verborgen zodat testers niet in de war raken.
//
// Zet BETA op false om de volledige mockup-vision weer te tonen.
export const BETA = true;

// Demo-routes (nepgeld) — verborgen in beta, ook bij directe URL.
export const DEMO_ROUTES = [
  "/aanvragen",
  "/rekeningen",
  "/goud",
  "/crypto",
  "/sparen",
  "/leningen",
  "/verzekering",
  "/cashback",
  "/markt",
  "/overheid",
  "/landbouw",
  "/diaspora",
  "/whatsapp",
];

export const isDemoHidden = (pathname: string) =>
  BETA && DEMO_ROUTES.includes(pathname);
