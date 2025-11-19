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
        email: "admin@eventix.fr",
        firstName: "Admin",
        lastName: "Eventix",
        passwordHash: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2",
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
