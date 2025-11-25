// Utilise la DB définie, ou db par défaut
const dbName = process.env.MONGO_DB || "eventix";
db = db.getSiblingDB(dbName);

// Fonction utilitaire pour générer une date aléatoire récente
function getRandomRecentDate() {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    return new Date(now - daysAgo * 24 * 60 * 60 * 1000);
}

console.log("🌱 Initialisation de la base de données:", dbName);

// ========================================
// 1. CRÉATION DE LA COLLECTION "users"
// ========================================

if (!db.getCollectionNames().includes("users")) {
    console.log("👥 Création de la collection 'users'...");
    db.createCollection("users");
}

const now = new Date();

const users = [
    {
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "Eventix",
        passwordHash: "$2b$10$B2D4b1WabzRiwTXsKiMbMuZ8cyUIUFfo4h7qhiG/6I1YTZ9HsHLdS",
        role: "admin",
        createdAt: now,
        updatedAt: now,
        __v: 0
    },
    {
        email: "jean.dupont@example.fr",
        firstName: "Jean",
        lastName: "Dupont",
        passwordHash: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2",
        role: "user",
        createdAt: getRandomRecentDate(),
        updatedAt: now,
        __v: 0
    },
    {
        email: "marie.martin@domain.com",
        firstName: "Marie",
        lastName: "Martin",
        passwordHash: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2",
        role: "user",
        createdAt: getRandomRecentDate(),
        updatedAt: now,
        __v: 0
    },
    {
        email: "pierre.bernard@email.fr",
        firstName: "Pierre",
        lastName: "Bernard",
        passwordHash: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2",
        role: "user",
        createdAt: getRandomRecentDate(),
        updatedAt: now,
        __v: 0
    },
    {
        email: "sophie.moreau@test.fr",
        firstName: "Sophie",
        lastName: "Moreau",
        passwordHash: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2",
        role: "user",
        createdAt: getRandomRecentDate(),
        updatedAt: now,
        __v: 0
    }
];

// Reset optionnel
// db.users.deleteMany({});

const insertedUsers = db.users.insertMany(users);
console.log(`✅ ${users.length} utilisateurs créés dans la collection 'users'`);

// Récupération des vrais ObjectId des users
const userIds = Object.values(insertedUsers.insertedIds);

// ========================================
// 2. CRÉATION DE LA COLLECTION "event"
// ========================================

if (!db.getCollectionNames().includes("event")) {
    console.log("🎉 Création de la collection 'event'...");
    db.createCollection("event");
}

function pickIds(arr, n) {
    return arr.slice(0, Math.min(n, arr.length));
}

const events = [
    {
        Nom: "Sortie cinéma",
        Description: "Lorem Elsass ipsum Huguette s'guelt commodo kuglopf Miss Dahlias sagittis elit et munster gravida schpeck ac ornare geïz und condimentum Coopé de Truchtersheim wurscht leo tchao varius",
        Image: "https://salles-cinema.com/wp-content/uploads/2024/07/pathe-palace-opera.jpg",
        nbPlaceTotal: 60,
        nbPlaceOccupe: 3,
        personneInscrites: pickIds(userIds, 3),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Sortie au zoo",
        Description: "Une soirée au zoo exceptionnelle avec des musiciens locaux talentueux. Venez découvrir les classiques du zoo dans une ambiance intimiste et chaleureuse.",
        Image: "https://www.zoodejurques.fr/wp-content/uploads/2023/11/ZOODEJURQUES_Banniere_Siteweb-scaled.jpg",
        nbPlaceTotal: 80,
        nbPlaceOccupe: 4,
        personneInscrites: pickIds(userIds, 4),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Randonnée en montagne",
        Description: "Découvrez les magnifiques paysages des Vosges lors de cette randonnée guidée. Niveau modéré, prévoir de bonnes chaussures et un pique-nique.",
        Image: "https://magazine.sportihome.com/wp-content/uploads/2019/05/rando-vosges-1-696x367.jpg",
        nbPlaceTotal: 25,
        nbPlaceOccupe: 2,
        personneInscrites: pickIds(userIds, 2),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier cuisine alsacienne",
        Description: "Apprenez à cuisiner les spécialités alsaciennes avec un chef local. Au programme : tarte flambée, choucroute et kougelhopf !",
        Image: "https://www.recettes-alsace.fr/recettes/wp-content/uploads/2013/11/kouglof-400x300.jpg",
        nbPlaceTotal: 15,
        nbPlaceOccupe: 3,
        personneInscrites: pickIds(userIds, 3),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Soirée karaoké",
        Description: "Venez chanter vos tubes préférés lors de cette soirée karaoké conviviale. Ambiance garantie et prix spéciaux sur les boissons !",
        Image: "https://laser-time.fr/content/uploads/2024/06/Karaoke_home.jpg",
        nbPlaceTotal: 50,
        nbPlaceOccupe: 2,
        personneInscrites: pickIds(userIds, 2),
        Status: "annulé",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Exposition d'art moderne",
        Description: "Découvrez les œuvres d'artistes contemporains dans cette exposition exclusive. Visite guidée incluse avec un critique d'art reconnu.",
        Image: "https://parisjetaime.com/data/layout_image/28778_Art-Paris-art-fair-2022-D%C3%A9tail-galerie--630x405--%C2%A9-Marc-Domage.jpg",
        nbPlaceTotal: 40,
        nbPlaceOccupe: 2,
        personneInscrites: pickIds(userIds, 2),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier poterie",
        Description: "Initiez-vous à la poterie artisanale avec un animateur spécialisé. Création d’un bol ou d’un vase au choix.",
        Image: "https://www.terre-de-veyle.fr/wp-content/uploads/2023/04/formation-a-l-atelier-poterie-adultes.jpg",
        nbPlaceTotal: 20,
        nbPlaceOccupe: 5,
        personneInscrites: pickIds(userIds, 5),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Soirée jeux de société",
        Description: "Sélection de jeux modernes, ambiance détente. Parfait pour découvrir de nouvelles mécaniques ludiques.",
        Image: "https://palaiseautierslieu.fr/wp-content/uploads/2022/12/6-1.jpg",
        nbPlaceTotal: 30,
        nbPlaceOccupe: 4,
        personneInscrites: pickIds(userIds, 4),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Cours de yoga en plein air",
        Description: "Session matinale zen, accessible débutants. Prévoir un tapis.",
        Image: "https://chin-mudra.yoga/assets/uploads/blog/faire-du-yoga-pein-air-bienfaits-1652206116627aaa24df121.jpg",
        nbPlaceTotal: 25,
        nbPlaceOccupe: 6,
        personneInscrites: pickIds(userIds, 6),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Visite guidée du centre historique",
        Description: "Balade commentée pour redécouvrir les ruelles anciennes et leurs secrets.",
        Image: "https://www.mon-week-end-en-alsace.com/app/uploads/2020/09/place-reunion-mulhouse.jpg",
        nbPlaceTotal: 40,
        nbPlaceOccupe: 10,
        personneInscrites: pickIds(userIds, 10),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Soirée astronomique",
        Description: "Observation des étoiles avec télescopes et intervenant passionné.",
        Image: "https://www.laroche-bernard.com/wp-content/uploads/2025/03/Soiree-astronomique-1024x538.jpg",
        nbPlaceTotal: 50,
        nbPlaceOccupe: 7,
        personneInscrites: pickIds(userIds, 7),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier cocktail",
        Description: "Apprenez l’art du shaker avec un barman confirmé.",
        Image: "https://degustationsdevins.com/48-large_default/cours-cocktail-classiques.jpg",
        nbPlaceTotal: 15,
        nbPlaceOccupe: 3,
        personneInscrites: pickIds(userIds, 3),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Tournoi de mini-golf",
        Description: "Parcours ludique avec classement final et récompenses symboliques.",
        Image: "https://asap-benoit.fr/wp-content/uploads/2019/08/Trophee-mini-golf-2019-1-1024x681.jpg",
        nbPlaceTotal: 35,
        nbPlaceOccupe: 8,
        personneInscrites: pickIds(userIds, 8),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Initiation à la danse latine",
        Description: "Découverte salsa et bachata avec un duo d’instructeurs.",
        Image: "https://www.salsadanse.com/wp-content/uploads/2022/08/cours-decouverte-danses-latines-apprendre-danser.png",
        nbPlaceTotal: 30,
        nbPlaceOccupe: 5,
        personneInscrites: pickIds(userIds, 5),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier photographie",
        Description: "Notions de cadrage, lumière, et utilisation pratique du matériel.",
        Image: "https://www.associationlamano.com/wp-content/uploads/2016/02/Capture-1026x576.jpg",
        nbPlaceTotal: 20,
        nbPlaceOccupe: 4,
        personneInscrites: pickIds(userIds, 4),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Découverte escalade",
        Description: "Séance sécurisée pour tous niveaux, matériel fourni.",
        Image: "https://climbingdistrict.com/app/uploads/2024/11/2024.01.13-14-15-Climbing-District-%C2%A9-Arthur-Delicque-1704-scaled.jpg",
        nbPlaceTotal: 15,
        nbPlaceOccupe: 2,
        personneInscrites: pickIds(userIds, 2),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Sortie kayak",
        Description: "Balade en rivière paisible, idéale pour débutants.",
        Image: "https://www.explore-grandest.com/app/uploads/2025/04/sortie-kayak-sur-la-meuse-art-ge-pierre-defontaine-7-1920par1080.jpg",
        nbPlaceTotal: 25,
        nbPlaceOccupe: 5,
        personneInscrites: pickIds(userIds, 5),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Découverte œnologique",
        Description: "Dégustation de vins locaux et initiation aux arômes.",
        Image: "https://www.vinotrip.com/fr/224-large_default/cadeau-stage-oenologie.jpg",
        nbPlaceTotal: 18,
        nbPlaceOccupe: 6,
        personneInscrites: pickIds(userIds, 6),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier écriture créative",
        Description: "Exercices ludiques pour développer son imagination.",
        Image: "https://www.ville-lethor.fr/medias/2024/03/atelier_ecriture1.png",
        nbPlaceTotal: 12,
        nbPlaceOccupe: 2,
        personneInscrites: pickIds(userIds, 2),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Soirée quiz",
        Description: "Défis thématiques par équipes, bonne humeur assurée.",
        Image: "https://images.epagine.fr/191/9782501065191_1_75.jpg",
        nbPlaceTotal: 50,
        nbPlaceOccupe: 12,
        personneInscrites: pickIds(userIds, 12),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier DIY déco",
        Description: "Création d’objets décoratifs à partir de matériaux recyclés.",
        Image: "https://www.fabrikable.fr/wp-content/uploads/2024/08/diy-pour-enfants-halloween-deco-activites--scaled.jpg",
        nbPlaceTotal: 16,
        nbPlaceOccupe: 4,
        personneInscrites: pickIds(userIds, 4),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Balade à vélo",
        Description: "Circuit facile en nature avec pauses panoramiques.",
        Image: "https://velotour.fr/wp-content/uploads/2024/02/53162937927_3303f7d8ee_c.jpg",
        nbPlaceTotal: 40,
        nbPlaceOccupe: 9,
        personneInscrites: pickIds(userIds, 9),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Séance méditation",
        Description: "Apprentissage de techniques simples pour se détendre.",
        Image: "https://image.jimcdn.com/app/cms/image/transf/dimension=940x10000:format=jpg/path/s449a8d0c7f9ab66c/image/iadb0da294630455c/version/1580669553/introduction-%C3%A0-la-m%C3%A9ditation-petits-groupes-gen%C3%A8ve.jpg",
        nbPlaceTotal: 30,
        nbPlaceOccupe: 5,
        personneInscrites: pickIds(userIds, 5),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Workshop dessin",
        Description: "Initiation au croquis en extérieur.",
        Image: "https://cetcreation.com/wp-content/uploads/2018/02/Workshop-atelier-brainstorming.jpg",
        nbPlaceTotal: 20,
        nbPlaceOccupe: 3,
        personneInscrites: pickIds(userIds, 3),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Chasse au trésor urbaine",
        Description: "Énigmes et exploration dans les rues.",
        Image: "https://toploisirs.fr/wp-content/uploads/2019/03/Couv-tresor-templiers.jpg",
        nbPlaceTotal: 60,
        nbPlaceOccupe: 15,
        personneInscrites: pickIds(userIds, 15),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier peinture sur bois",
        Description: "Création personnalisée d’objets décoratifs.",
        Image: "https://www.ozart.art/wp-content/uploads/2025/03/ozart-atelier-peinture-sur-bois-valence-1024x512.webp",
        nbPlaceTotal: 18,
        nbPlaceOccupe: 4,
        personneInscrites: pickIds(userIds, 4),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Projection plein air",
        Description: "Film classique diffusé en extérieur, couverture recommandée.",
        Image: "https://www.cannes-france.com/app/uploads/cannes-tourisme/2022/05/thumbs/cine-quartiers-la-frayeremairie-de-cannes-640x360.jpg",
        nbPlaceTotal: 80,
        nbPlaceOccupe: 20,
        personneInscrites: pickIds(userIds, 20),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Initiation au théâtre",
        Description: "Jeux scéniques, improvisation et expression de soi.",
        Image: "https://www.cholet.fr/dossiers/images/20211209085743_9559_imggd.jpg",
        nbPlaceTotal: 14,
        nbPlaceOccupe: 3,
        personneInscrites: pickIds(userIds, 3),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Cours de pâtisserie",
        Description: "Réalisation de desserts simples mais techniques.",
        Image: "https://www.mazetconfiseur.com/782-large_default/cours-de-cuisine-cours-de-patisserie-2h30-autour-du-praline-accompagne-du-chef-patissier-pour-apprendre-les-astuces-de-pro.jpg",
        nbPlaceTotal: 12,
        nbPlaceOccupe: 6,
        personneInscrites: pickIds(userIds, 6),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Marche nordique",
        Description: "Session sportive modérée en forêt.",
        Image: "https://www.lequipe.fr/_medias/img-photo-jpg/la-marche-nordique-est-parfaite-pour-travailler-sur-l-ensemble-du-corps-benjamin-boccas-mediascop/1500000001451358/0:0,1997:1331-828-552-75/275e0.jpg",
        nbPlaceTotal: 30,
        nbPlaceOccupe: 8,
        personneInscrites: pickIds(userIds, 8),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier broderie",
        Description: "Découverte des bases et création d’un petit motif.",
        Image: "https://cdn.aws.wecandoo.com/jIMUVgc8jVkO5CDNatHZfJetDUfpwt094qGX6aUI.jpeg",
        nbPlaceTotal: 10,
        nbPlaceOccupe: 3,
        personneInscrites: pickIds(userIds, 3),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Initiation au tir à l’arc",
        Description: "Découverte sécurisée et encadrée du tir sportif.",
        Image: "https://www.grand-parc.fr/img/visuel/tir-a-l-arc-initiation-adulte-enfant.jpg",
        nbPlaceTotal: 20,
        nbPlaceOccupe: 4,
        personneInscrites: pickIds(userIds, 4),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Atelier jardinage",
        Description: "Plantation, entretien et astuces pour potager.",
        Image: "https://www.jds.fr/medias/image/atelier-jardinage-famille-18614-1200-0-F.webp",
        nbPlaceTotal: 16,
        nbPlaceOccupe: 5,
        personneInscrites: pickIds(userIds, 5),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Découverte paddle",
        Description: "Séance d’initiation sur plan d’eau calme.",
        Image: "https://guidapp.s3.eu-central-1.amazonaws.com/activity_modern/canoe-torreilles.fr/decouverte-ludique-en-maxi-paddle-mediterranee-1657556231.jpeg",
        nbPlaceTotal: 25,
        nbPlaceOccupe: 7,
        personneInscrites: pickIds(userIds, 7),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Conférence histoire locale",
        Description: "Présentation passionnante sur les événements marquants de la région.",
        Image: "https://grans.fr/wp-content/uploads/2024/08/pexels-photo-2774556.webp",
        nbPlaceTotal: 60,
        nbPlaceOccupe: 9,
        personneInscrites: pickIds(userIds, 9),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        Nom: "Balade botanique",
        Description: "Découverte des plantes locales avec un guide naturaliste.",
        Image: "https://www.grandlieu-tourisme.fr/sites/default/files/2021-07/4.jpg",
        nbPlaceTotal: 30,
        nbPlaceOccupe: 6,
        personneInscrites: pickIds(userIds, 6),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    }
];

db.event.insertMany(events);
console.log(`✅ ${events.length} événements créés`);

// ========================================
// 3. INDEX
// ========================================

console.log("🔍 Création des index...");

db.users.createIndex({ email: 1 }, { unique: true });
db.event.createIndex({ Status: 1 });
db.event.createIndex({ EditDate: 1 });

console.log("✅ Index créés");

// ========================================
// 4. COLLECTION "seed"
// ========================================

if (!db.getCollectionNames().includes("seed")) {
    db.createCollection("seed");
}

db.seed.insertOne({
    seededAt: new Date(),
    version: "1.1",
    collections: ["users", "event"],
    userCount: users.length,
    eventCount: events.length
});

console.log("🎯 Seed terminé avec succès !");
