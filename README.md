# Projet de développement

Ce projet utilise Docker, Docker Compose et Node.js avec NestJS.

## Prérequis

### 1. Docker et Docker Compose
Assurez-vous d'avoir Docker installé avec Docker Compose :

```bash
sudo apt-get install docker-compose-plugin
```

**Vérification de l'installation :**
```bash
docker --version
docker compose version
```

### 2. Node.js et npm
Installez Node.js et npm :

```bash
# Vérification
node --version
npm --version
```

## Configuration

### Fichier d'environnement
1. Créez un fichier `.env.dev` à la racine du projet
2. Utilisez le fichier `.env.exemple` comme modèle - il contient tous les paramètres nécessaires

```bash
cp .env.exemple .env.dev
```

Modifiez ensuite `.env.dev` avec vos propres valeurs.

## Développement avec WebStorm

1. Ouvrez le projet dans WebStorm
2. Sélectionnez la configuration de développement dans le menu déroulant en haut à droite
3. Lancez le projet (configuration de dev uniquement disponible actuellement)

Le projet se lancera en mode développement avec hot reload activé.

## Services disponibles

Une fois le projet lancé, les services suivants sont accessibles :

- **NestJS Application** : http://0.0.0.0:9010/
- **Test de connexion base de données** : http://0.0.0.0:9010/health
- **Documentation Swagger** : http://localhost:9010/docs#/
- **Mongo Express** : http://0.0.0.0:8081/

## Structure du projet

- `.env.exemple` : Fichier d'exemple pour la configuration d'environnement
- `.env.dev` : Fichier de configuration pour le développement (à créer)
- Configuration Docker avec Docker Compose
- Application NestJS avec hot reload en développement