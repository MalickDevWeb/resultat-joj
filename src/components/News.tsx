import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  Sparkles,
  Flame,
  Trophy,
  Calendar,
  Newspaper,
  Image as ImageIcon,
  Share2,
  Bookmark,
  MapPin,
  Eye,
  Mic,
  Play,
  Square,
  Volume2,
} from 'lucide-react';
import { useLecture } from '../hooks/useVoix';
import type { EtatNotifications } from '../notifications';

export interface ArticleActu {
  id: string;
  titre: string;
  titreHighlight?: string; // Partie en jaune doré pour le hero
  detailTitre?: string; // Titre affiché sur la page détaillée
  chapeau: string;
  contenu: string[];
  categorie: 'une' | 'sports' | 'evenements' | 'infos' | 'galerie';
  categorieBadge: string;
  categorieBadgeIcon: string;
  categorieType: 'athle' | 'medaille' | 'basket' | 'evenement' | 'une';
  date: string;
  lieu?: string;
  vues?: string;
  dureeAudio?: string;
  tempsLecture: string;
  image: string;
  coverImage?: string;
  phrasesVocales: string[];
}

// 1. Hero Cards officiels par catégorie
export const HERO_ARTICLES: Record<string, ArticleActu> = {
  une: {
    id: 'ceremonie-ouverture',
    titre: 'JOJ Dakar 2026 :',
    titreHighlight: 'la cérémonie d’ouverture éblouit le monde',
    chapeau: 'Une soirée inoubliable au Stade Olympique de Dakar, marquée par la culture sénégalaise et l’esprit olympique...',
    contenu: [
      'Devant plus de 50 000 spectateurs en liesse au Stade Olympique de Diamniadio, les premiers Jeux Olympiques de la Jeunesse en terre africaine se sont ouverts dans un spectacle féerique de sons, lumières et rythmes traditionnels.',
      'Portée par la culture sénégalaise, les tambours sabar et les valeurs de la Teranga, la cérémonie a célébré l’énergie de la jeunesse mondiale et la fierté de tout un continent.',
      'La vasque olympique a été embrasée sous les acclamations du public, donnant le coup d’envoi officiel de deux semaines de compétitions palpitantes à Dakar, Diamniadio et Saly.',
    ],
    categorie: 'une',
    categorieBadge: 'À la une',
    categorieBadgeIcon: '🔥',
    categorieType: 'une',
    date: 'Il y a 1h',
    tempsLecture: '3 min',
    image: '/brand/actu-ceremonie.webp',
    phrasesVocales: [
      'JOJ Dakar 2026 : la cérémonie d’ouverture éblouit le monde !',
      'Une soirée inoubliable au Stade Abdoulaye-Wade de Diamniadio, marquée par la culture sénégalaise et l’esprit olympique.',
      'Plus de 50 000 spectateurs ont célébré avec ferveur l’ouverture historique des premiers Jeux Olympiques sur le continent africain.',
    ],
  },
  sports: {
    id: 'senegal-top6-mondial',
    titre: 'Le Sénégal brille au 6e rang mondial avec',
    titreHighlight: '10 médailles dont 5 en or',
    chapeau: 'Moisson historique pour le pays hôte portée par le taekwondo, le basketball 3x3 et la lutte de plage.',
    contenu: [
      'Avec un total remarquable de 10 médailles (5 en or et 5 en bronze), la délégation sénégalaise réalise la plus belle performance de son histoire olympique aux JOJ Dakar 2026.',
      'Les titres d’or ont été conquis avec panache par Marie Sarr en taekwondo (-55 kg), l’équipe masculine de basketball 3x3, ainsi que le trio en or de lutte de plage à Saly : Maguette Diop, Ndèye Anna Diatta et Elisabeth Ebedo Diatta.',
      'Les cinq médailles de bronze remportées en judo par Matar Diop, en taekwondo par Ameth Diop et Aïda Touré, par les Lioncelles du basketball 3x3 et par Ablaye Diouf complètent ce palmarès exceptionnel.',
    ],
    categorie: 'sports',
    categorieBadge: 'Palmarès officiel',
    categorieBadgeIcon: '🏅',
    categorieType: 'medaille',
    date: 'Il y a 2h',
    tempsLecture: '3 min',
    image: '/brand/hero-resume.webp',
    phrasesVocales: [
      'Le Sénégal brille au 6e rang mondial avec 10 médailles olympiques dont 5 en or !',
      'Des sacres historiques en taekwondo, en basketball 3x3 et en lutte de plage sur le sable de Saly.',
      'Une fierté immense pour tout le peuple sénégalais et le sport africain.',
    ],
  },
  evenements: {
    id: 'programme-13-finales',
    titre: '13 grandes finales et sessions officielles',
    titreHighlight: 'au programme aujourd’hui',
    chapeau: 'De la Dakar Arena aux plages de Saly, découvrez le calendrier officiel des compétitions du jour.',
    contenu: [
      'La journée s’annonce palpitante sur les trois sites hôtes avec 13 sessions officielles inscrites au calendrier des JOJ Dakar 2026.',
      'À Diamniadio, la Dakar Arena accueille les demi-finales explosives du tournoi de Futsal tandis que le Centre des expositions vibre pour les finales de boxe et d’escrime.',
      'À Dakar, le Complexe Tour de l’Œuf s’enflamme pour le Breaking et le basketball 3x3, pendant que Saly lance ses régates de planche à voile sur l’océan Atlantique.',
    ],
    categorie: 'evenements',
    categorieBadge: 'Programme officiel',
    categorieBadgeIcon: '📅',
    categorieType: 'evenement',
    date: 'Aujourd’hui',
    tempsLecture: '3 min',
    image: '/brand/actu-stade.webp',
    phrasesVocales: [
      '13 grandes finales et sessions officielles au programme aujourd’hui aux JOJ Dakar 2026.',
      'Retrouvez le futsal à la Dakar Arena, la boxe à Diamniadio, le breaking à Dakar et la voile à Saly.',
      'Toutes les épreuves sont accessibles en direct sur l’application Podium Dakar.',
    ],
  },
  infos: {
    id: 'guide-transports-ter',
    titre: 'Guide officiel des spectateurs :',
    titreHighlight: 'TER, navettes et accès gratuit',
    chapeau: 'Tout ce qu’il faut savoir pour rejoindre les sites des épreuves et encourager les athlètes.',
    contenu: [
      'Pour faciliter les déplacements des supporters, le Train Express Régional (TER) relie la gare de Dakar à Diamniadio en moins de 35 minutes avec des rames renforcées toutes les 10 minutes.',
      'Des navettes de bus spéciales assurent la liaison directe entre Diamniadio et la station balnéaire de Saly via l’autoroute à péage.',
      'Le comité d’organisation rappelle que l’entrée est totalement gratuite pour tous les écoliers, collégiens et étudiants sur présentation de leur carte scolaire.',
    ],
    categorie: 'infos',
    categorieBadge: 'Infos Pratiques',
    categorieBadgeIcon: 'ℹ️',
    categorieType: 'evenement',
    date: 'En continu',
    tempsLecture: '2 min',
    image: '/brand/monument.webp',
    phrasesVocales: [
      'Guide officiel des transports et accès pour les JOJ Dakar 2026.',
      'Le TER relie Dakar à Diamniadio en 35 minutes et l’accès est gratuit pour les élèves et étudiants.',
      'Des navettes régulières desservent également le site balnéaire de Saly.',
    ],
  },
  galerie: {
    id: 'galerie-cliches-moments',
    titre: 'Les plus beaux clichés des Jeux :',
    titreHighlight: 'ferveur, sourires et victoires',
    chapeau: 'Plongez au cœur des émotions olympiques à travers les photos officielles de nos reporters.',
    contenu: [
      'De la communion festive autour d’Ayo la mascotte officielle aux larmes de bonheur sur les podiums, la galerie photo capture toute l’âme des JOJ Dakar 2026.',
      'Retrouvez les envolées spectaculaires du basketball 3x3, l’énergie débordante des battles de breaking et les magnifiques couchers de soleil sur l’arène de Saly Beach.',
      'Chaque jour, nos photographes accrédités immortalisent les temps forts de cette grande fête sportive africaine.',
    ],
    categorie: 'galerie',
    categorieBadge: 'Galerie Photos',
    categorieBadgeIcon: '📸',
    categorieType: 'une',
    date: 'Mise à jour 17h',
    tempsLecture: '2 min',
    image: '/brand/actu-ceremonie.webp',
    phrasesVocales: [
      'Découvrez la galerie photo officielle des Jeux Olympiques de la Jeunesse Dakar 2026.',
      'Revivez en images les victoires, la ferveur populaire et l’énergie contagieuse d’Ayo la mascotte.',
      'Toutes les photos sont à retrouver dans l’application officielle.',
    ],
  },
};

// 2. Vraies données d'actualités des JOJ Dakar 2026 (Wikipédia & Données officielles)
export const ARTICLES_LIST: ArticleActu[] = [
  // --- LES 4 ARTICLES OFFICIELS DE LA MAQUETTE media_1794507087507_cf586242 ---
  {
    id: 'senegal-brille-athletisme',
    titre: 'Le Sénégal brille en athlétisme avec 3 nouvelles médailles',
    detailTitre: 'Athlétisme au Stade Iba Mar Diop : 100m et 400m en direct',
    chapeau: 'Les athlètes sénégalais continuent de faire rêver...',
    contenu: [
      'Le mythique Stade Iba Mar Diop rénové vibre au rythme des séries et finales du sprint olympique avec des chronos de niveau mondial.',
      'Dans une atmosphère survoltée au cœur de la Médina, les athlètes profitent d’un public chaleureux et d’installations aux normes internationales.',
      'La suite des épreuves comprendra les finales du demi-fond et les relais 4×100 m programmés ce week-end.',
    ],
    categorie: 'sports',
    categorieBadge: 'Athlétisme',
    categorieBadgeIcon: '🏃',
    categorieType: 'athle',
    date: 'Il y a 2h',
    lieu: 'Stade Iba Mar Diop',
    vues: '12.5K vues',
    dureeAudio: '00:01:15',
    tempsLecture: '2 min',
    image: '/brand/actu-athle.webp',
    coverImage: '/brand/actu-cover-athle.webp',
    phrasesVocales: [
      'Le Sénégal brille en athlétisme avec 3 nouvelles médailles olympiques !',
      'Les athlètes sénégalais continuent de faire rêver au Stade Iba Mar Diop.',
      'Une moisson exceptionnelle dans une ambiance survoltée au cœur de Dakar.',
    ],
  },
  {
    id: 'mamadou-fall-argent',
    titre: 'Mamadou Fall offre une médaille d’argent au Sénégal',
    chapeau: 'Une performance exceptionnelle...',
    contenu: [
      'Au terme d’une finale palpitante à la Dakar Arena, Mamadou Fall a décroché une magnifique médaille d’argent olympique.',
      'Face aux plus grands espoirs mondiaux, le jeune Sénégalais a fait preuve d’un sang-froid et d’une ténacité exemplaires.',
      'Cette nouvelle distinction vient enrichir le palmarès historique du pays hôte aux JOJ Dakar 2026.',
    ],
    categorie: 'sports',
    categorieBadge: 'Médailles',
    categorieBadgeIcon: '🏅',
    categorieType: 'medaille',
    date: 'Il y a 3h',
    lieu: 'Dakar Arena',
    vues: '15.8K vues',
    dureeAudio: '00:01:20',
    tempsLecture: '2 min',
    image: '/brand/actu-medaille.webp',
    phrasesVocales: [
      'Mamadou Fall offre une magnifique médaille d’argent au Sénégal à la Dakar Arena !',
      'Une performance exceptionnelle face aux meilleurs espoirs mondiaux.',
      'Le public célèbre avec fierté ce nouveau sacre olympique.',
    ],
  },
  {
    id: 'senegal-demi-finale-basket',
    titre: 'Le Sénégal en demi-finale du tournoi de basketball',
    chapeau: 'Une victoire déterminante...',
    contenu: [
      'L’équipe sénégalaise a validé avec panache sa qualification pour les demi-finales du tournoi olympique au Complexe Tour de l’Œuf.',
      'Dans une ambiance festive et incandescente, les joueurs ont fait la différence grâce à un jeu collectif rapide et une défense intraitable.',
      'Le prochain rendez-vous promet une confrontation spectaculaire pour une place en finale olympique.',
    ],
    categorie: 'sports',
    categorieBadge: 'Basketball',
    categorieBadgeIcon: '🏀',
    categorieType: 'basket',
    date: 'Il y a 4h',
    lieu: 'Tour de l’Œuf',
    vues: '18.4K vues',
    dureeAudio: '00:01:10',
    tempsLecture: '2 min',
    image: '/brand/actu-basket.webp',
    phrasesVocales: [
      'Le Sénégal se qualifie pour les demi-finales du tournoi de basketball !',
      'Une victoire déterminante acquise dans la ferveur du Complexe Tour de l’Œuf.',
      'Les supporters dakarois exultent devant cette belle prestation collective.',
    ],
  },
  {
    id: 'decouvrez-sites-joj-dakar',
    titre: 'Découvrez les sites des JOJ Dakar 2026',
    chapeau: 'Des infrastructures modernes au service de la jeunesse...',
    contenu: [
      'Répartis entre Dakar, Diamniadio et la station balnéaire de Saly, les sites officiels des JOJ Dakar 2026 offrent des équipements d’avant-garde.',
      'Du Stade Abdoulaye-Wade au Pavillon d’exposition de Diamniadio en passant par la plage de Saly, chaque infrastructure a été pensée pour durer.',
      'Ces installations ultramodernes constituent un héritage durable pour le sport sénégalais et toute la jeunesse africaine.',
    ],
    categorie: 'evenements',
    categorieBadge: 'Événements',
    categorieBadgeIcon: '📍',
    categorieType: 'evenement',
    date: 'Il y a 5h',
    lieu: 'Dakar · Diamniadio · Saly',
    vues: '21.2K vues',
    dureeAudio: '00:01:30',
    tempsLecture: '3 min',
    image: '/brand/actu-stade.webp',
    phrasesVocales: [
      'Découvrez les sites d’exception des JOJ Dakar 2026.',
      'Des infrastructures modernes au service de la jeunesse à Dakar, Diamniadio et Saly.',
      'Un héritage durable pour tout le sport africain.',
    ],
  },
  {
    id: 'athletisme-iba-mar-diop',
    titre: 'Athlétisme au Stade Iba Mar Diop : 100m et 400m en direct',
    chapeau: 'Les jeunes sprinteurs mondiaux enflamment la piste dakaroise...',
    contenu: [
      'Le mythique Stade Iba Mar Diop rénové vibre au rythme des séries et finales du sprint olympique avec des chronos de niveau mondial.',
      'Dans une atmosphère survoltée au cœur de la Médina, les athlètes profitent d’un public chaleureux et d’installations aux normes internationales.',
      'La suite des épreuves comprendra les finales du demi-fond et les relais 4×100 m programmés ce week-end.',
    ],
    categorie: 'sports',
    categorieBadge: 'Athlétisme',
    categorieBadgeIcon: '🏃',
    categorieType: 'athle',
    date: 'Il y a 4h',
    lieu: 'Stade Iba Mar Diop',
    vues: '12.5K vues',
    dureeAudio: '00:01:15',
    tempsLecture: '2 min',
    image: '/brand/actu-cover-athle.webp',
    phrasesVocales: [
      'Athlétisme au Stade Iba Mar Diop : 100 mètres et 400 mètres en direct.',
      'Les jeunes sprinteurs mondiaux enflamment la piste dakaroise.',
      'Le mythique Stade Iba Mar Diop rénové vibre au rythme des séries et finales du sprint olympique.',
    ],
  },
  // --- SPORTS (Données réelles des podiums sénégalais et compétitions) ---
  {
    id: 'taekwondo-marie-sarr-or',
    titre: 'Marie Sarr sacrée championne olympique de Taekwondo (55 kg)',
    chapeau: 'Victoire éclatante 2-0 au Gymnase Iba Mar Diop devant un public en fusion...',
    contenu: [
      'Au terme d’un parcours sans faute, la prodige sénégalaise Marie Sarr a décroché la médaille d’or dans la catégorie des 55 kg filles face à la Tunisienne Yasmine Haouani.',
      'Portée par les chants de ses supporters dans un Gymnase Iba Mar Diop plein à craquer, la jeune dakaroise a fait preuve d’une maîtrise technique exceptionnelle pour s’imposer avec brio.',
      'Cette consécration offre au Sénégal son premier titre olympique de l’histoire en taekwondo aux Jeux de la Jeunesse.',
    ],
    categorie: 'sports',
    categorieBadge: '🥋 Taekwondo',
    categorieBadgeIcon: '🥋',
    categorieType: 'medaille',
    date: 'Il y a 2h',
    lieu: 'Gymnase Iba Mar Diop',
    vues: '8.7K vues',
    dureeAudio: '00:01:05',
    tempsLecture: '2 min',
    image: '/brand/actu-medaille.webp',
    phrasesVocales: [
      'Marie Sarr est sacrée championne olympique de taekwondo en 55 kg filles !',
      'Une victoire éclatante deux sets à zéro acquise au Gymnase Iba Mar Diop de Dakar.',
      'Elle offre au Sénégal un titre historique devant son public.',
    ],
  },
  {
    id: 'basket-3x3-senegal-or',
    titre: 'Les Lionceaux du basketball 3x3 décrochent la médaille d’or',
    chapeau: 'Frédéric Clovice Mané, Ibrahima Ndiaye, Papa Mamadou Cissé et Sacoura Diop champions...',
    contenu: [
      'L’équipe nationale masculine de basketball 3x3 a fait vibrer la capitale en remportant la grande finale du tournoi olympique au Complexe Tour de l’Œuf.',
      'Grâce à une adresse extérieure décisive et une solidarité sans faille, les quatre Lionceaux ont surclassé leurs adversaires dans une ambiance incandescente.',
      'Ce titre d’or confirme l’excellence de la formation sénégalaise dans la discipline du basketball à trois contre trois.',
    ],
    categorie: 'sports',
    categorieBadge: '🏀 Basketball 3x3',
    categorieBadgeIcon: '🏀',
    categorieType: 'basket',
    date: 'Il y a 3h',
    lieu: 'Tour de l’Œuf',
    vues: '14.2K vues',
    dureeAudio: '00:01:10',
    tempsLecture: '2 min',
    image: '/brand/actu-basket.webp',
    phrasesVocales: [
      'Les Lionceaux du Sénégal remportent la médaille d’or en basketball 3x3 !',
      'Frédéric Clovice Mané, Ibrahima Ndiaye, Papa Mamadou Cissé et Sacoura Diop triomphent au Complexe Tour de l’Œuf.',
      'Une performance magistrale saluée par tous les supporters dakarois.',
    ],
  },
  {
    id: 'lutte-plage-saly-triple-or',
    titre: 'Triplé d’or historique pour le Sénégal en lutte de plage à Saly',
    chapeau: 'Maguette Diop (80 kg), Ndèye Anna Diatta (45 kg) et Elisabeth Ebedo Diatta (55 kg) au sommet...',
    contenu: [
      'Sur le sable chaud de Saly Beach West, la lutte sénégalaise a régné en maître incontesté en raflant trois médailles d’or en une seule journée.',
      'Maguette Diop a dominé la catégorie des 80 kg garçons avec une puissance irrésistible, tandis que Ndèye Anna Diatta (45 kg) et Elisabeth Ebedo Diatta (55 kg) ont survolé les épreuves féminines.',
      'Ablaye Diouf ajoute à cette fête sportive une médaille de bronze en 90 kg garçons, confirmant la suprématie nationale sur le sable.',
    ],
    categorie: 'sports',
    categorieBadge: '🤼 Lutte de plage',
    categorieBadgeIcon: '🤼',
    categorieType: 'medaille',
    date: 'Il y a 4h',
    lieu: 'Saly Beach West',
    vues: '11.8K vues',
    dureeAudio: '00:01:20',
    tempsLecture: '3 min',
    image: '/brand/athlete-1.webp',
    phrasesVocales: [
      'Triplé d’or historique en lutte de plage pour le Sénégal sur le sable de Saly !',
      'Maguette Diop, Ndèye Anna Diatta et Elisabeth Ebedo Diatta décrochent le titre olympique.',
      'Une moisson exceptionnelle qui fait chavirer de joie la Petite Côte.',
    ],
  },
  {
    id: 'judo-matar-diop-bronze',
    titre: 'Matar Diop s’adjuge le bronze en Judo 66 kg à Diamniadio',
    chapeau: 'Un ippon spectaculaire au Pavillon E offre une médaille au jeune judoka sénégalais...',
    contenu: [
      'Au Centre des expositions de Diamniadio, Matar Diop a conquis une superbe médaille de bronze dans la catégorie des moins de 66 kg garçons.',
      'Opposé à un adversaire coriace lors de la finale pour la troisième place, le jeune Sénégalais a trouvé l’ouverture sur un mouvement de hanche parfait pour conclure par ippon.',
      'Cette récompense est le fruit d’un travail acharné au dojo national et lance idéalement les épreuves d’arts martiaux.',
    ],
    categorie: 'sports',
    categorieBadge: '🥋 Judo',
    categorieBadgeIcon: '🥋',
    categorieType: 'medaille',
    date: 'Il y a 5h',
    lieu: 'Diamniadio Pavillon E',
    vues: '6.9K vues',
    dureeAudio: '00:01:00',
    tempsLecture: '2 min',
    image: '/brand/athlete-3.webp',
    phrasesVocales: [
      'Matar Diop décroche la médaille de bronze en judo 66 kg à Diamniadio !',
      'Un ippon spectaculaire dans les dernières secondes de la petite finale.',
      'Le judo sénégalais fête sa première médaille olympique dans ces Jeux.',
    ],
  },

  // --- ÉVÉNEMENTS (Programme officiel des 13 sessions d'aujourd'hui) ---
  {
    id: 'evenement-futsal-dakar-arena',
    titre: 'Futsal masculin : demi-finales explosives à la Dakar Arena',
    chapeau: 'Les 4 meilleures nations s’affrontent dès 15h00 dans l’écrin de Diamniadio...',
    contenu: [
      'La magnifique Dakar Arena de 15 000 places accueille aujourd’hui les demi-finales très attendues du tournoi olympique de futsal.',
      'Les spectateurs sont attendus en nombre pour assister à des rencontres à très haute intensité tactique et technique.',
      'Les vainqueurs se qualifieront pour la grande finale de demain et s’assureront une place sur le podium olympique.',
    ],
    categorie: 'evenements',
    categorieBadge: '⚽ Futsal',
    categorieBadgeIcon: '⚽',
    categorieType: 'evenement',
    date: '15h00 · Diamniadio',
    tempsLecture: '2 min',
    image: '/brand/actu-stade.webp',
    phrasesVocales: [
      'Les demi-finales du tournoi de futsal débutent à 15 heures à la Dakar Arena de Diamniadio.',
      'Un spectacle garanti dans l’une des plus belles enceintes sportives du continent.',
      'Les vainqueurs décrocheront leur billet pour la finale olympique.',
    ],
  },
  {
    id: 'evenement-boxe-diamniadio',
    titre: 'Boxe : finales des 55 kg et 65 kg garçons au Pavillon C',
    chapeau: 'Les pugilistes montent sur le ring à 16h30 au Centre des expositions...',
    contenu: [
      'Le Pavillon C du Centre des expositions de Diamniadio s’apprête à vibrer pour les combats décisifs des catégories 55 kg et 65 kg garçons ainsi que 48 kg filles.',
      'Chaque combat se disputera en trois rounds de trois minutes sous l’œil des juges internationaux de l’IBA.',
      'La remise des médailles d’or, d’argent et de bronze aura lieu dès la fin de chaque catégorie.',
    ],
    categorie: 'evenements',
    categorieBadge: '🥊 Boxe',
    categorieBadgeIcon: '🥊',
    categorieType: 'evenement',
    date: '16h30 · Diamniadio',
    tempsLecture: '2 min',
    image: '/brand/athlete-4.webp',
    phrasesVocales: [
      'Finales de boxe dès 16 heures 30 au Pavillon C du Centre des expositions de Diamniadio.',
      'Les combats pour les médailles d’or en 55 kg et 65 kg s’annoncent spectaculaires.',
      'Les résultats officiels seront validés immédiatement après les décisions des juges.',
    ],
  },
  {
    id: 'evenement-breaking-tour-oeuf',
    titre: 'Battles de Breaking B-Boys & B-Girls au Complexe Tour de l’Œuf',
    chapeau: 'Danse urbaine, acrobaties et DJ sets en direct à partir de 18h00...',
    contenu: [
      'Discipline jeune et urbaine par excellence, le Breaking investit le Complexe Tour de l’Œuf pour une soirée de duels 1 contre 1 mémorables.',
      'Les seize meilleurs b-boys et b-girls du monde rivaliseront de créativité, de musicalité et de prouesses athlétiques.',
      'L’accès est libre pour tous les détenteurs de billets avec animations musicales prévues entre les rounds.',
    ],
    categorie: 'evenements',
    categorieBadge: '🕺 Breaking',
    categorieBadgeIcon: '🕺',
    categorieType: 'evenement',
    date: '18h00 · Dakar',
    tempsLecture: '2 min',
    image: '/brand/actu-basket.webp',
    phrasesVocales: [
      'Le Breaking fait son entrée aux JOJ Dakar 2026 au Complexe Tour de l’Œuf à 18 heures.',
      'Des battles de haut niveau entre les meilleurs jeunes danseurs urbains de la planète.',
      'Une ambiance musicale festive en plein cœur de Dakar.',
    ],
  },
  {
    id: 'evenement-escrime-pavillon-a',
    titre: 'Escrime : sabre individuel garçons et filles au Pavillon A',
    chapeau: 'Précision et vitesse sur les pistes de Diamniadio dès 10h00...',
    contenu: [
      'Le Pavillon A du Centre des expositions de Diamniadio accueille les épreuves de sabre individuel garçons et filles avec des poules éliminatoires le matin et le tableau final l’après-midi.',
      'Les tireurs s’affrontent sur des pistes aux normes olympiques équipées du système vidéo d’arbitrage le plus moderne.',
      'Les finales pour les médailles d’or débuteront à 17h15.',
    ],
    categorie: 'evenements',
    categorieBadge: '🤺 Escrime',
    categorieBadgeIcon: '🤺',
    categorieType: 'evenement',
    date: '10h00 · Diamniadio',
    tempsLecture: '2 min',
    image: '/brand/actu-ceremonie-defile.webp',
    phrasesVocales: [
      'Les épreuves de sabre individuel se déroulent au Pavillon A du Centre des expositions.',
      'Les meilleures lames de la jeunesse mondiale en lice pour le titre olympique.',
      'Suivez les scores touche par touche sur l’application.',
    ],
  },
  {
    id: 'evenement-voile-plan-eau-saly',
    titre: 'Windsurfing Opening Series : départ sur le plan d’eau de Saly',
    chapeau: 'Régates sous le vent de la Petite Côte avec les espoirs de la voile...',
    contenu: [
      'Les régates de planche à voile s’élancent aujourd’hui sur le splendide plan d’eau de Saly, réputé pour ses alizés constants et sa température clémente.',
      'Les compétiteurs s’affronteront sur plusieurs manches de qualification avant la Medal Race décisive.',
      'Les spectateurs peuvent suivre le départ depuis la plage aménagée de Saly Beach.',
    ],
    categorie: 'evenements',
    categorieBadge: '⛵ Voile',
    categorieBadgeIcon: '⛵',
    categorieType: 'evenement',
    date: '11h00 · Saly',
    tempsLecture: '2 min',
    image: '/brand/athlete-2.webp',
    phrasesVocales: [
      'Départ des régates de planche à voile sur le plan d’eau de Saly à 11 heures.',
      'Des conditions de vent idéales sur la Petite Côte sénégalaise pour les jeunes navigateurs.',
      'Les classements des manches seront actualisés après chaque course.',
    ],
  },

  // --- INFOS PRATIQUES (Transports, billets, village, PWA) ---
  {
    id: 'infos-ter-dakar-diamniadio',
    titre: 'TER Dakar-Diamniadio : rames directes renforcées pour les Jeux',
    chapeau: 'Rejoignez la Dakar Arena et le Stade Abdoulaye-Wade en 35 minutes...',
    contenu: [
      'Le Train Express Régional (TER) renforce sa cadence avec un départ toutes les 10 minutes depuis la Gare centrale de Dakar jusqu’au pôle de Diamniadio.',
      'Un pass supporter spécial « Dakar 2026 » permet des trajets illimités à tarif préférentiel sur l’ensemble de la quinzaine olympique.',
      'Des agents d’accueil bilingues français-wolof guident les voyageurs à chaque station pour fluidifier l’accès aux stades.',
    ],
    categorie: 'infos',
    categorieBadge: '🚆 Transports',
    categorieBadgeIcon: '🚆',
    categorieType: 'evenement',
    date: 'Guide transport',
    tempsLecture: '2 min',
    image: '/brand/actu-stade.webp',
    phrasesVocales: [
      'Le TER Dakar-Diamniadio circule toutes les 10 minutes pour desservir les sites des Jeux.',
      'Un trajet fluide et rapide en 35 minutes pour rejoindre la Dakar Arena et le Stade Olympique.',
      'Des pass supporters sont disponibles dans toutes les gares.',
    ],
  },
  {
    id: 'infos-billetterie-gratuite',
    titre: 'Accès gratuit aux tribunes pour tous les élèves et étudiants',
    chapeau: 'Le comité d’organisation ouvre les Jeux à toute la jeunesse sénégalaise...',
    contenu: [
      'Conformément aux engagements du COJOJ Dakar 2026, l’accès à toutes les compétitions en journée est gratuit pour les élèves et étudiants munis de leur carte scolaire ou universitaire.',
      'Des zones dédiées dans les tribunes permettent aux groupes scolaires de venir encourager les athlètes dans une ferveur conviviale.',
      'Les réservations de places assises pour les cérémonies et grandes finales du soir s’effectuent en ligne sur la plateforme officielle.',
    ],
    categorie: 'infos',
    categorieBadge: '🎟️ Billetterie',
    categorieBadgeIcon: '🎟️',
    categorieType: 'medaille',
    date: 'Infos billets',
    tempsLecture: '2 min',
    image: '/brand/ayo.webp',
    phrasesVocales: [
      'Accès gratuit aux tribunes des JOJ Dakar 2026 pour tous les écoliers et étudiants.',
      'Une belle opportunité pour la jeunesse sénégalaise de vivre la magie olympique en direct.',
      'Présentez simplement votre carte scolaire à l’entrée des sites.',
    ],
  },
  {
    id: 'infos-mode-hors-ligne',
    titre: 'Consultez les résultats même sans réseau grâce au mode hors-ligne',
    chapeau: 'L’application Podium Dakar sauvegarde automatiquement scores et médailles...',
    contenu: [
      'Grâce à la technologie PWA (Progressive Web App) et au Service Worker intégré, l’application Podium Dakar fonctionne sans coupure même en zone à faible couverture réseau.',
      'Tous les résultats consultés, les fiches des champions et le tableau des médailles restent accessibles hors-ligne et se mettent à jour automatiquement dès le retour de la connexion.',
      'Vous pouvez également dicter vos recherches et écouter les résumés vocaux en toute fluidité.',
    ],
    categorie: 'infos',
    categorieBadge: '📲 Application PWA',
    categorieBadgeIcon: '📲',
    categorieType: 'basket',
    date: 'Technologie',
    tempsLecture: '2 min',
    image: '/brand/ayo-head.webp',
    phrasesVocales: [
      'L’application Podium Dakar fonctionne en mode hors-ligne grâce à sa technologie PWA.',
      'Consultez les résultats, podiums et médailles même sans connexion Internet.',
      'Vos données sont automatiquement synchronisées dès que le réseau redevient disponible.',
    ],
  },

  // --- GALERIE (Photos des temps forts, Ayo, Stades) ---
  {
    id: 'galerie-ayo-mascotte',
    titre: 'Ayo la mascotte officielle, idole des supporters et des familles',
    chapeau: 'Le lionceau énergique et souriant fait danser les tribunes sur tous les sites...',
    contenu: [
      'Véritable star de ces Jeux Olympiques de la Jeunesse, Ayo la mascotte officielle sillonne les trois pôles de Dakar, Diamniadio et Saly pour partager son enthousiasme communicatif.',
      'Toujours prêt pour un selfie ou une démonstration de danse traditionnelle, Ayo incarne la joie, la jeunesse et la générosité de la Teranga sénégalaise.',
      'Retrouvez les peluches et produits dérivés officiels dans toutes les boutiques des Jeux.',
    ],
    categorie: 'galerie',
    categorieBadge: '🦁 Mascotte',
    categorieBadgeIcon: '🦁',
    categorieType: 'une',
    date: 'En images',
    tempsLecture: '1 min',
    image: '/brand/ayo.webp',
    phrasesVocales: [
      'Ayo, la mascotte officielle des JOJ Dakar 2026, régale petits et grands sur tous les sites.',
      'Symbole d’énergie et de bienveillance, elle incarne l’esprit de fête de la jeunesse africaine.',
      'Découvrez toutes ses apparitions dans notre galerie officielle.',
    ],
  },
  {
    id: 'galerie-stade-abdoulaye-wade',
    titre: 'Le Stade Olympique sous les illuminations féeriques de la cérémonie',
    chapeau: 'Vue aérienne spectaculaire de l’écrin illuminé aux couleurs du Sénégal...',
    contenu: [
      'Le Stade Abdoulaye-Wade de Diamniadio a offert un tableau visuel époustouflant lors de la soirée inaugurale des Jeux.',
      'Sous un feu d’artifice éclatant aux couleurs vert, or et rouge, l’enceinte ultramoderne a illuminé le ciel étoilé de Diamniadio devant un parterre de dignitaires et d’athlètes venus du monde entier.',
      'Une image forte qui restera gravée dans l’histoire du sport olympique africain.',
    ],
    categorie: 'galerie',
    categorieBadge: '🏟️ Architecture',
    categorieBadgeIcon: '🏟️',
    categorieType: 'evenement',
    date: 'En images',
    tempsLecture: '2 min',
    image: '/brand/actu-stade.webp',
    phrasesVocales: [
      'Le Stade Abdoulaye-Wade illuminé aux couleurs du Sénégal lors de la cérémonie d’ouverture.',
      'Un spectacle de sons et lumières grandiose devant 50 000 spectateurs.',
      'Une vue aérienne inoubliable de l’écrin olympique de Diamniadio.',
    ],
  },
  {
    id: 'galerie-podiums-senegal',
    titre: 'Larmes de joie et ferveur patriotique sur les podiums',
    chapeau: 'Marie Sarr et les Lionceaux entonnant l’hymne national avec le public dakarois...',
    contenu: [
      'Les cérémonies protocolaires ont donné lieu à des moments d’intense émotion avec les athlètes sénégalais chantant l’hymne « Pincez tous vos koras » main sur le cœur.',
      'La fierté des familles, des entraîneurs et de tout le public a illuminé chaque remise de médaille, célébrant le triomphe de la jeunesse sportive du pays hôte.',
      'Un hommage vibrant au travail accompli par les centres de formation nationaux.',
    ],
    categorie: 'galerie',
    categorieBadge: '🥇 Podiums',
    categorieBadgeIcon: '🥇',
    categorieType: 'medaille',
    date: 'En images',
    tempsLecture: '2 min',
    image: '/brand/actu-medaille.webp',
    phrasesVocales: [
      'Émotion et fierté sur les podiums des champions sénégalais aux JOJ Dakar 2026.',
      'Des moments de communion inoubliables au son de l’hymne national.',
      'Revivez ces instants magiques en photo dans l’application.',
    ],
  },
  {
    id: 'galerie-saly-beach-sunset',
    titre: 'L’arène de sable de Saly Beach baignée par le coucher de soleil',
    chapeau: 'Un décor de carte postale pour la lutte de plage et le beach-volley...',
    contenu: [
      'Installée directement face à l’océan Atlantique sur la Petite Côte, l’arène de Saly Beach offre l’un des cadres les plus spectaculaires de l’histoire des Jeux Olympiques.',
      'Au crépuscule, les combats de lutte de plage se disputent sous une lumière dorée captivante qui ravit photographes et spectateurs.',
      'Le mariage parfait entre la tradition sportive sénégalaise et la beauté naturelle du littoral.',
    ],
    categorie: 'galerie',
    categorieBadge: '🌊 Saly Beach',
    categorieBadgeIcon: '🌊',
    categorieType: 'athle',
    date: 'En images',
    tempsLecture: '2 min',
    image: '/brand/athlete-1.webp',
    phrasesVocales: [
      'L’arène de lutte de plage de Saly Beach au coucher du soleil.',
      'Un cadre paradisiaque sur la Petite Côte sénégalaise pour les épreuves sur sable.',
      'Des clichés spectaculaires à retrouver dans la galerie.',
    ],
  },
];

interface NewsProps {
  onOpenAssistant?: () => void;
  onToast?: (msg: string) => void;
  /** Les vraies notifications du téléphone (spec 009). */
  notifications?: { etat: EtatNotifications; basculer: () => Promise<string> };
}

export function News({ onOpenAssistant, onToast, notifications }: NewsProps) {
  const [selectedFilter, setSelectedFilter] = useState<'une' | 'sports' | 'evenements' | 'infos' | 'galerie'>('une');
  const notifActive = notifications?.etat === 'actives';
  const [articleOuvert, setArticleOuvert] = useState<ArticleActu | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Filtres thématiques conformes à la maquette media_1794507087507_cf586242
  const FILTERS = [
    { id: 'une' as const, label: 'À la une', icon: '★' },
    { id: 'sports' as const, label: 'Sports', icon: '🏆' },
    { id: 'evenements' as const, label: 'Événements', icon: '📅' },
    { id: 'infos' as const, label: 'Infos', icon: '📰' },
    { id: 'galerie' as const, label: 'Galerie', icon: '🖼️' },
  ];

  const toggleNotifs = async () => {
    if (!notifications) return;
    const phrase = await notifications.basculer();
    onToast?.(phrase);
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Carte phare active selon le filtre sélectionné
  const heroActif = HERO_ARTICLES[selectedFilter] ?? HERO_ARTICLES.une;

  // Exactement les 4 cartes de la maquette media_1794507087507_cf586242 sur l'onglet À la une
  const articlesAffiches = selectedFilter === 'une'
    ? ARTICLES_LIST.slice(0, 4)
    : ARTICLES_LIST.filter((a) => a.categorie === selectedFilter);

  return (
    <div className="actu-page" ref={topRef}>
      {/* 1. Barre de titre officielle : Icône mégaphone vert + Titre + Bouton Activer les notifications */}
      <section className="actu-top-bar" aria-labelledby="actu-heading">
        <div className="actu-top-left">
          <div className="actu-megaphone-circle" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00853f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 11 18-5v12L3 14v-3z" fill="#00853f" fillOpacity="0.14" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              <path d="M16 8a4.5 4.5 0 0 1 0 8" />
              <path d="M19 6a7.5 7.5 0 0 1 0 12" />
            </svg>
          </div>
          <div className="actu-titles">
            <h2 id="actu-heading">Actualités des Jeux</h2>
            <p>Restez informé en temps réel sur les JOJ Dakar 2026</p>
          </div>
        </div>

        <button
          type="button"
          className={`actu-btn-notif ${notifActive ? 'is-active' : ''}`}
          onClick={() => void toggleNotifs()}
          aria-pressed={notifActive}
          hidden={!notifications}
        >
          <Bell size={14} className="actu-bell-icon" aria-hidden="true" fill={notifActive ? '#fff' : 'none'} />
          <span>{notifActive ? 'Notifications activées' : 'Activer les notifications'}</span>
        </button>
      </section>

      {/* 2. Filtres thématiques horizontaux à défilement */}
      <nav className="actu-nav-filters" role="tablist" aria-label="Filtrer les actualités">
        {FILTERS.map((f) => {
          const isActive = selectedFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`actu-pill-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setSelectedFilter(f.id)}
            >
              <span className="actu-pill-ico" aria-hidden="true">{f.icon}</span>
              <span className="actu-pill-lbl">{f.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. Carte Événement Phare dynamique selon la catégorie sélectionnée */}
      <article
        className="actu-hero-card"
        onClick={() => setArticleOuvert(heroActif)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setArticleOuvert(heroActif); }}
        aria-label={`Lire l'article à la une : ${heroActif.titre}`}
      >
        <div className="actu-hero-bg-wrap" aria-hidden="true">
          <img
            src={heroActif.image}
            alt=""
            className="actu-hero-bg-img"
          />
          <div className="actu-hero-overlay" />
          {/* Liseré tricolore sénégalais sur l'arrondi inférieur droit */}
          <div className="actu-hero-swoosh" aria-hidden="true">
            <svg viewBox="0 0 140 46" preserveAspectRatio="none" className="actu-hero-swoosh-svg">
              <path d="M0,40 Q40,15 90,26 T140,8 L140,46 L0,46 Z" fill="#e31b23" />
              <path d="M0,32 Q40,9 90,19 T140,0 L140,12 Q90,25 0,38 Z" fill="#fdef42" />
              <path d="M0,24 Q40,3 90,12 T140,-7 L140,3 Q90,18 0,30 Z" fill="#00853f" />
            </svg>
          </div>
        </div>

        <div className="actu-hero-content">
          <div className="actu-hero-badges-row">
            <span className="actu-badge-flame">
              <Flame size={12} fill="#ffffff" aria-hidden="true" />
              <span>{heroActif.categorieBadge}</span>
            </span>
            <span className="actu-badge-time">
              <Clock size={11} aria-hidden="true" />
              <span>{heroActif.date}</span>
            </span>
          </div>

          <h3 className="actu-hero-title">
            <span>{heroActif.titre}</span>{' '}
            {heroActif.titreHighlight && (
              <span className="gold-highlight">{heroActif.titreHighlight}</span>
            )}
          </h3>

          <p className="actu-hero-chapo">{heroActif.chapeau}</p>

          <div className="actu-hero-bottom-row">
            <span className="actu-hero-btn-read">
              <span>Lire l’article</span>
              <span className="actu-hero-arrow">➔</span>
            </span>

            {/* Pagination carrousel comme sur la maquette : trait vert + 3 points */}
            <div className="actu-hero-dots" aria-hidden="true">
              <span className="actu-dot-bar is-active" />
              <span className="actu-dot-circle" />
              <span className="actu-dot-circle" />
              <span className="actu-dot-circle" />
            </div>
          </div>
        </div>
      </article>

      {/* 4. Liste des cartes d'actualités (Format blanc épuré avec vignette + flèche verte) */}
      <section className="actu-list-section" aria-label="Dernières actualités">
        {articlesAffiches.map((art) => (
          <article
            key={art.id}
            className="actu-item-card"
            onClick={() => setArticleOuvert(art)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setArticleOuvert(art); }}
            aria-label={`Lire : ${art.titre}`}
          >
            <div className="actu-item-thumb-box">
              <img src={art.image} alt={art.titre} loading="lazy" />
            </div>

            <div className="actu-item-info">
              <div className="actu-item-meta-row">
                <span className={`actu-item-cat-badge ${art.categorieType}`}>
                  <span className="cat-badge-ico" aria-hidden="true">{art.categorieBadgeIcon}</span>
                  <span>{art.categorieBadge}</span>
                </span>
                <span className="actu-item-time">
                  <Clock size={11} aria-hidden="true" />
                  <span>{art.date}</span>
                </span>
              </div>

              <h4 className="actu-item-title">{art.titre}</h4>
              <p className="actu-item-chapo">{art.chapeau}</p>
            </div>

            <div className="actu-item-arrow-circle" aria-hidden="true">
              <ChevronRight size={16} strokeWidth={2.5} />
            </div>
          </article>
        ))}
      </section>

      {/* 5. Revenir en haut : à la fin de la liste, pas flottant, pour ne jamais recouvrir les articles. */}
      <button type="button" className="actu-remonter" onClick={scrollToTop}>
        <ArrowUp size={18} strokeWidth={2.6} aria-hidden="true" />
        Revenir en haut
      </button>

      {/* 6. Page détaillée d'article plein écran (pixel-exact d'après maquette media_1794506978528_b2b36ac8) */}
      {articleOuvert && typeof document !== 'undefined' && createPortal(
        <ArticleDetailPage
          article={articleOuvert}
          onBack={() => setArticleOuvert(null)}
          onOpenAssistant={onOpenAssistant}
        />,
        document.body
      )}
    </div>
  );
}

/** Lecteur vocal audio officiel haute fidélité Dakar 2026 */
function ArticleVoicePlayer({ article }: { article: ArticleActu }) {
  const { lit, basculer } = useLecture(`article-${article.id}`);
  const phrases = [
    article.titre,
    article.chapeau,
    ...article.contenu,
  ];

  // 22 barres pour simuler une onde vocale naturelle
  const BARS = [6, 14, 20, 10, 16, 26, 12, 18, 28, 22, 14, 24, 28, 16, 12, 22, 18, 10, 16, 8, 14, 6];

  return (
    <div className={`actu-detail-audio-box ${lit ? 'is-playing' : ''}`}>
      <div className="actu-audio-header">
        <div className="actu-audio-mic-circle" aria-hidden="true">
          <Mic size={18} strokeWidth={2.4} color="#059669" />
        </div>
        <div>
          <h4 className="actu-audio-title">Écouter cet article à voix haute</h4>
          <p className="actu-audio-subtitle">Synthèse vocale officielle Dakar 2026</p>
        </div>
      </div>

      <div className="actu-audio-controls">
        <button
          type="button"
          className="actu-audio-play-btn"
          onClick={() => basculer(phrases)}
          aria-label={lit ? 'Arrêter la lecture' : 'Écouter l’article'}
        >
          {lit ? (
            <Square size={16} fill="#ffffff" />
          ) : (
            <Play size={20} fill="#ffffff" style={{ marginLeft: 2 }} />
          )}
        </button>

        <div className="actu-audio-wave" aria-hidden="true">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="actu-audio-bar"
              style={{
                height: `${h}px`,
                animationDelay: lit ? `${(i * 0.05).toFixed(2)}s` : undefined,
              }}
            />
          ))}
        </div>

        <span className="actu-audio-time">{article.dureeAudio || '00:01:15'}</span>

        <Volume2 size={20} className="actu-audio-volume-ico" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Page complète d'article détaillée (reproduction pixel-exact de media_1794506978528_b2b36ac8) */
function ArticleDetailPage({
  article,
  onBack,
  onOpenAssistant,
}: {
  article: ArticleActu;
  onBack: () => void;
  onOpenAssistant?: () => void;
}) {
  const [sauvegarde, setSauvegarde] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const notifier = (txt: string) => {
    setToastMsg(txt);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const partager = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: article.titre,
          text: article.chapeau,
          url: window.location.href,
        });
      } catch {
        // Ignorer si annulé par l'utilisateur
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      notifier('Lien copié dans le presse-papier !');
    }
  };

  return (
    <main className="actu-detail-fullpage" aria-label={`Article : ${article.titre}`}>
      {/* 1. Zone Hero avec image et navigation flottante */}
      <div className="actu-detail-hero-box">
        <img
          src={article.coverImage || article.image || '/brand/actu-cover-athle.webp'}
          alt=""
          className="actu-detail-hero-img"
        />
        <div className="actu-detail-hero-gradient" aria-hidden="true" />

        <div className="actu-detail-topbar">
          <button
            type="button"
            className="actu-detail-btn-back"
            onClick={onBack}
            aria-label="Retour aux actualités"
          >
            <ChevronLeft size={24} strokeWidth={2.8} color="#0f172a" />
          </button>

          <div className="actu-detail-logo-wrap" aria-hidden="true">
            <span className="actu-detail-logo-txt"><b>JOJ</b><small>DAKAR 2026</small></span>
          </div>

          <div className="actu-detail-actions-right">
            <button
              type="button"
              className="actu-detail-btn-action"
              onClick={partager}
              aria-label="Partager l’article"
              title="Partager"
            >
              <Share2 size={20} strokeWidth={2.2} color="#0f172a" />
            </button>
            <button
              type="button"
              className="actu-detail-btn-action"
              onClick={() => {
                setSauvegarde(!sauvegarde);
                notifier(!sauvegarde ? 'Article enregistré' : 'Article retiré des favoris');
              }}
              aria-label={sauvegarde ? 'Article sauvegardé' : 'Sauvegarder l’article'}
              title="Sauvegarder"
            >
              <Bookmark
                size={20}
                strokeWidth={2.2}
                color={sauvegarde ? '#00853f' : '#0f172a'}
                fill={sauvegarde ? '#00853f' : 'none'}
              />
            </button>
          </div>
        </div>

        <span className="actu-detail-cat-pill">
          <span className="actu-cat-icon" aria-hidden="true">{article.categorieBadgeIcon}</span>
          <span>{article.categorieBadge}</span>
        </span>
      </div>

      {/* 2. Carte de contenu blanche arrondie qui chevauche le hero */}
      <div className="actu-detail-card">
        <h1 className="actu-detail-title">
          {article.detailTitre || (article.titreHighlight ? <>{article.titre} <span className="actu-detail-title-hl">{article.titreHighlight}</span></> : article.titre)}
        </h1>

        <div className="actu-detail-meta-line">
          <span className="actu-meta-item">
            <Calendar size={14} aria-hidden="true" />
            <span>{article.detailTitre ? 'Il y a 4h' : article.date}</span>
          </span>
          <span className="actu-meta-pipe" aria-hidden="true">|</span>
          <span className="actu-meta-item">
            <MapPin size={14} aria-hidden="true" />
            <span>{article.lieu || 'Stade Iba Mar Diop'}</span>
          </span>
          <span className="actu-meta-pipe" aria-hidden="true">|</span>
          <span className="actu-meta-item">
            <Eye size={14} aria-hidden="true" />
            <span>{article.vues || '12.5K vues'}</span>
          </span>
        </div>

        {/* 3. Lecteur vocal audio officiel Dakar 2026 */}
        <ArticleVoicePlayer article={article} />

        {/* 4. Corps textuel complet */}
        <div className="actu-detail-body">
          <p className="actu-detail-lead">{article.chapeau}</p>
          {article.contenu.map((p, idx) => (
            <p key={idx} className="actu-detail-para">{p}</p>
          ))}
        </div>

        {/* 5. Galerie 4 vignettes */}
        <div className="actu-detail-gallery" aria-label="Galerie photos">
          <div className="actu-thumb-box">
            <img src="/brand/actu-galerie-1.webp" alt="Stade Iba Mar Diop" loading="lazy" />
            <span className="actu-thumb-badge" aria-hidden="true">
              <ImageIcon size={12} strokeWidth={2.4} />
              <span>+8</span>
            </span>
          </div>
          <div className="actu-thumb-box">
            <img src="/brand/actu-galerie-2.webp" alt="Course d'athlétisme" loading="lazy" />
          </div>
          <div className="actu-thumb-box">
            <img src="/brand/actu-galerie-3.webp" alt="Drapeau du Sénégal" loading="lazy" />
          </div>
          <div className="actu-thumb-box">
            <img src="/brand/actu-galerie-4.webp" alt="Supporters sénégalais" loading="lazy" />
          </div>
        </div>

        {/* 6. Option d'interaction avec l'assistant */}
        {onOpenAssistant && (
          <div className="actu-detail-assistant-wrap">
            <button
              type="button"
              className="actu-detail-btn-ask"
              onClick={() => {
                onBack();
                onOpenAssistant();
              }}
            >
              <Sparkles size={16} aria-hidden="true" />
              <span>Poser une question à l’assistant sur cet article</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. Pied de page avec bouton vert et skyline de Dakar */}
      <footer className="actu-detail-footer">
        <button
          type="button"
          className="actu-detail-btn-more"
          onClick={onBack}
        >
          <Trophy size={18} strokeWidth={2.2} />
          <span>Voir plus d’actualités</span>
          <ChevronRight size={18} strokeWidth={2.8} />
        </button>
      </footer>

      {toastMsg && (
        <div className="actu-detail-toast" role="status">
          {toastMsg}
        </div>
      )}
    </main>
  );
}
