// utilise la DB définie, ou db par défaut
const dbName = process.env.MONGO_DB || "eventix";
db = db.getSiblingDB(dbName);
// crée au moins une collection + un doc (sinon la DB n’apparaît pas)
db.createCollection("seed");
db.seed.insertOne({ seededAt: new Date() });