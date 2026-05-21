import { Lead, ScraperLog } from "../types";

export const ENGLISH_NAMES = [
  { name: "Blue Bottle Coffee", website: "https://bluebottlecoffee.com", suffix: "Roasters" },
  { name: "Monmouth Coffee Co.", website: "https://monmouthcoffee.co.uk", suffix: "Borough Market" },
  { name: "Origin Coffee Roasting", website: "https://origincoffee.co.uk", suffix: "Shoreditch" },
  { name: "Prufrock Coffee", website: "https://prufrockcoffee.com", suffix: "Leather Lane" },
  { name: "Workshop Coffee", website: "https://workshopcoffee.com", suffix: "Marylebone" },
  { name: "Kaffeine", website: "https://kaffeine.co.uk", suffix: "Fitzrovia" },
  { name: "Flat White Coffee", website: "https://flatwhitelondon.com", suffix: "Soho" },
  { name: "Nude Espresso", website: "https://nudeespresso.com", suffix: "Spitalfields" },
  { name: "Taylor St Baristas", website: "https://taylor-st.com", suffix: "City" },
  { name: "Department of Coffee", website: "https://departmentofcoffee.com", suffix: "Carnaby" }
];

export const FRENCH_NAMES = [
  { name: "Le Grenier à Pain", website: "https://legrenierapain.com", suffix: "Abbesses" },
  { name: "Boulangerie Poilâne", website: "https://poilane.com", suffix: "Saint-Germain" },
  { name: "Du Pain et des Idées", website: "https://dupainetdesidees.com", suffix: "Canal St-Martin" },
  { name: "Boulangerie Liberté", website: "https://liberte-paris.com", suffix: "Vinaigriers" },
  { name: "Boulangerie Mamiche", website: "https://mamiche.fr", suffix: "Condorcet" },
  { name: "Boulangerie Utopie", website: "https://boulangerieutopie.com", suffix: "Jean-Pierre Timbaud" },
  { name: "Chambelland Sans Gluten", website: "https://chambelland.com", suffix: "Popincourt" },
  { name: "Des Gâteaux et du Pain", website: "https://desgateauxetdupain.com", suffix: "Pasteur" },
  { name: "Laurent Duchêne Paris", website: "https://laurentduchene.com", suffix: "Butte-aux-Cailles" },
  { name: "Boulangerie Carton", website: "https://cartonparis.com", suffix: "Gare de l'Est" }
];

export const GERMAN_NAMES = [
  { name: "Zahnarztpraxis Mitte", website: "https://zahnarzt-mitte-berlin.de", suffix: "Dr. Schmidt" },
  { name: "Dentists Berlin", website: "https://dentists-berlin.com", suffix: "Dr. Becker & Team" },
  { name: "Zahngesundheit Friedrichshain", website: "https://zahngesund-fhain.de", suffix: "Dr. Weber" },
  { name: "Zahnärzte am Ku'damm", website: "https://kudamm-zahnaerzte.de", suffix: "Dr. Neumann" },
  { name: "Berlin Smiles Dental", website: "https://berlin-smiles.de", suffix: "Zahnmedizin" },
  { name: "Zahnarztpraxis am Alexanderplatz", website: "https://zahnarzt-alexanderplatz.de", suffix: "Dr. Lang" },
  { name: "Zahnarzt Dr. Natalie Müller", website: "https://dr-mueller-zahnmedizin.de", suffix: "Prenzlauer Berg" },
  { name: "Smart Dent Prenzlauer Berg", website: "https://smartdent-berlin.de", suffix: "Praxis" },
  { name: "Zahnarztpraxis Charlottenburg", website: "https://zahnarzt-charlottenburg.de", suffix: "Dr. Fischer" },
  { name: "AllDent Zahnzentrum", website: "https://alldent-zahnzentrum.de", suffix: "Berlin" }
];

export function generateRandomMockLead(query: string, lang: string, index: number): Lead {
  const queryLower = query.toLowerCase();
  let pool = ENGLISH_NAMES;
  let phonePrefix = "+44";
  let addressBase = "London, UK";

  if (lang.startsWith("fr") || queryLower.includes("paris") || queryLower.includes("boulangerie")) {
    pool = FRENCH_NAMES;
    phonePrefix = "+33";
    addressBase = "Paris, FR";
  } else if (lang.startsWith("de") || queryLower.includes("berlin") || queryLower.includes("dentist") || queryLower.includes("zahnarzt")) {
    pool = GERMAN_NAMES;
    phonePrefix = "+49";
    addressBase = "Berlin, DE";
  }

  const selection = pool[index % pool.length];
  const uniqueId = `g_maps_1s${Math.random().toString(36).substr(2, 9)}!8m1`;
  const rating = parseFloat((3.8 + Math.random() * 1.2).toFixed(1));
  const reviewsCount = Math.floor(12 + Math.random() * 850);
  
  // Format randomized elements
  const streetNum = Math.floor(1 + Math.random() * 199);
  const zipCode = Math.floor(10000 + Math.random() * 89999);
  const finalAddress = `${streetNum} Rue/St du Commerce, ${zipCode} ${addressBase}`;
  const phoneSuffix = Math.floor(100000000 + Math.random() * 899999999).toString();
  const finalPhone = `${phonePrefix} ${phoneSuffix.slice(0, 3)} ${phoneSuffix.slice(3, 6)} ${phoneSuffix.slice(6)}`;

  return {
    id: uniqueId,
    name: `${selection.name} - ${selection.suffix}`,
    query: query || "Google Maps Search",
    address: finalAddress,
    phone: finalPhone,
    website: selection.website,
    rating,
    reviewsCount,
    googleUrl: `https://www.google.com/maps/place/${encodeURIComponent(selection.name)}/@51.5,-0.12,15z/data=!4m2!3m1!1s${uniqueId}`,
    language: lang,
    timestamp: new Date().toISOString(),
    email: `contact@${selection.name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
    facebook: `https://facebook.com/${selection.name.toLowerCase().replace(/[^a-z]/g, "")}`,
    instagram: `https://instagram.com/${selection.name.toLowerCase().replace(/[^a-z]/g, "")}`,
    linkedin: `https://linkedin.com/company/${selection.name.toLowerCase().replace(/[^a-z]/g, "")}`,
    twitter: `https://twitter.com/${selection.name.toLowerCase().replace(/[^a-z]/g, "")}`
  };
}

export function createInitialLogs(): ScraperLog[] {
  return [
    {
      id: "log_1",
      timestamp: new Date(Date.now() - 5000).toISOString(),
      type: "info",
      message: "MapExtract Extension Core Initialized. System Ready."
    },
    {
      id: "log_2",
      timestamp: new Date(Date.now() - 4000).toISOString(),
      type: "proxy",
      message: "Loaded Proxy-Pool (Europe & US Regions). Rotation set to 1 page."
    },
    {
      id: "log_3",
      timestamp: new Date(Date.now() - 3000).toISOString(),
      type: "info",
      message: "To run live scraper: Load unpacking bundle into Chrome developer settings."
    }
  ];
}
