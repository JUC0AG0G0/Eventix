// Utilise la DB définie, ou db par défaut
const dbName = process.env.MONGO_DB || "eventix";
db = db.getSiblingDB(dbName);

// Fonction utilitaire pour générer des UUIDs v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Fonction utilitaire pour générer une date aléatoire récente
function getRandomRecentDate() {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30); // 0-30 jours
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return date;
}

console.log("🌱 Initialisation de la base de données:", dbName);

// ========================================
// 1. CRÉATION DE LA COLLECTION "user"
// ========================================

console.log("👥 Création de la collection 'user'...");
db.createCollection("user");

// Génération des utilisateurs de base
const adminId = generateUUID();
const userIds = [
    adminId,
    generateUUID(),
    generateUUID(),
    generateUUID(),
    generateUUID()
];

const users = [
    {
        id: adminId,
        role: "admin",
        email: "admin@eventix.fr",
        password: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2" // hash pour "admin123"
    },
    {
        id: userIds[1],
        role: "client",
        email: "jean.dupont@example.fr",
        password: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2"
    },
    {
        id: userIds[2],
        role: "client",
        email: "marie.martin@domain.com",
        password: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2"
    },
    {
        id: userIds[3],
        role: "client",
        email: "pierre.bernard@email.fr",
        password: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2"
    },
    {
        id: userIds[4],
        role: "client",
        email: "sophie.moreau@test.fr",
        password: "$2b$10$8K1p/a0drtAzjSKe6QI8POAhOVQ8XNpJ7r3p8YqKt2cR4gD7eZ8V2"
    }
];

// Insertion des utilisateurs
db.user.insertMany(users);
console.log(`✅ ${users.length} utilisateurs créés`);

// ========================================
// 2. CRÉATION DE LA COLLECTION "event"
// ========================================

console.log("🎉 Création de la collection 'event'...");
db.createCollection("event");

// Génération des événements avec des données réalistes
const events = [
    {
        id: generateUUID(),
        Nom: "Sortie cinéma",
        Description: "Lorem Elsass ipsum Huguette s'guelt commodo kuglopf Miss Dahlias sagittis elit et munster gravida schpeck ac ornare geïz und condimentum Coopé de Truchtersheim wurscht leo tchao varius",
        Image: "https://salles-cinema.com/wp-content/uploads/2024/07/pathe-palace-opera.jpg",
        nbPlaceTotal: 60,
        nbPlaceOccupe: 14,
        personneInscrites: [userIds[1], userIds[2], userIds[3]].slice(0, 3), // 3 personnes inscrites
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        id: generateUUID(),
        Nom: "Sortie au zoo",
        Description: "Une soirée au zoo exceptionnelle avec des musiciens locaux talentueux. Venez découvrir les classiques du zoo dans une ambiance intimiste et chaleureuse.",
        Image: "https://www.zoodejurques.fr/wp-content/uploads/2023/11/ZOODEJURQUES_Banniere_Siteweb-scaled.jpg",
        nbPlaceTotal: 80,
        nbPlaceOccupe: 75,
        personneInscrites: [userIds[1], userIds[2], userIds[3], userIds[4]].slice(0, 4),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        id: generateUUID(),
        Nom: "Randonnée en montagne",
        Description: "Découvrez les magnifiques paysages des Vosges lors de cette randonnée guidée. Niveau modéré, prévoir de bonnes chaussures et un pique-nique.",
        Image: "https://magazine.sportihome.com/wp-content/uploads/2019/05/rando-vosges-1-696x367.jpg",
        nbPlaceTotal: 25,
        nbPlaceOccupe: 8,
        personneInscrites: [userIds[2], userIds[4]].slice(0, 2),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        id: generateUUID(),
        Nom: "Atelier cuisine alsacienne",
        Description: "Apprenez à cuisiner les spécialités alsaciennes avec un chef local. Au programme : tarte flambée, choucroute et kougelhopf !",
        Image: "https://www.recettes-alsace.fr/recettes/wp-content/uploads/2013/11/kouglof-400x300.jpg",
        nbPlaceTotal: 15,
        nbPlaceOccupe: 12,
        personneInscrites: [userIds[1], userIds[3], userIds[4]].slice(0, 3),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    },
    {
        id: generateUUID(),
        Nom: "Soirée karaoké",
        Description: "Venez chanter vos tubes préférés lors de cette soirée karaoké conviviale. Ambiance garantie et prix spéciaux sur les boissons !",
        Image: "https://laser-time.fr/content/uploads/2024/06/Karaoke_home.jpg",
        nbPlaceTotal: 50,
        nbPlaceOccupe: 0,
        personneInscrites: [],
        Status: "annulé",
        EditDate: getRandomRecentDate()
    },
    {
        id: generateUUID(),
        Nom: "Exposition d'art moderne",
        Description: "Découvrez les œuvres d'artistes contemporains dans cette exposition exclusive. Visite guidée incluse avec un critique d'art reconnu.",
        Image: "https://parisjetaime.com/data/layout_image/28778_Art-Paris-art-fair-2022-D%C3%A9tail-galerie--630x405--%C2%A9-Marc-Domage.jpg",
        nbPlaceTotal: 40,
        nbPlaceOccupe: 22,
        personneInscrites: [userIds[1], userIds[2]].slice(0, 2),
        Status: "Ok",
        EditDate: getRandomRecentDate()
    }
];

// Insertion des événements
db.event.insertMany(events);
console.log(`✅ ${events.length} événements créés`);

// ========================================
// 3. CRÉATION D'INDEX POUR LES PERFORMANCES
// ========================================

console.log("🔍 Création des index...");

// Index sur les champs fréquemment utilisés
db.user.createIndex({ "email": 1 }, { unique: true });
db.user.createIndex({ "id": 1 }, { unique: true });

db.event.createIndex({ "id": 1 }, { unique: true });
db.event.createIndex({ "Status": 1 });
db.event.createIndex({ "EditDate": 1 });

console.log("✅ Index créés");

// ========================================
// 4. CRÉATION DE LA COLLECTION DE SEED (pour tracking)
// ========================================

db.createCollection("seed");
db.seed.insertOne({
    seededAt: new Date(),
    version: "1.0",
    collections: ["user", "event"],
    userCount: users.length,
    eventCount: events.length
});

console.log("🎯 Seed terminé avec succès !");
console.log("📊 Résumé:");
console.log(`   - ${users.length} utilisateurs créés`);
console.log(`   - ${events.length} événements créés`);
console.log(`   - Collections indexées pour les performances`);
console.log("");