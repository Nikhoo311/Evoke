const mongoose = require("mongoose");

const MatchStatsSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    index: true
  },
  gameMode: String,
  gameDuration: Number, // en secondes
  gameCreation: Date,
  
  // Résultat
  win: Boolean,
  
  // Champion & Cosmétique
  championName: String,
  championId: Number,
  skinUsed: String,
  
  // KDA
  kills: Number,
  deaths: Number,
  assists: Number,
  kda: Number, // calculé
  
  // Farm & Économie
  totalMinionsKilled: Number,
  neutralMinionsKilled: Number,
  totalCS: Number, // minions + jungle
  csPerMinute: Number,
  goldEarned: Number,
  goldSpent: Number,
  goldPerMinute: Number,
  
  // Items
  items: [Number], // IDs des items
  itemsValue: Number, // valeur totale des items
  
  // Vision
  visionScore: Number,
  wardsPlaced: Number,
  wardsKilled: Number,
  controlWardsPlaced: Number,
  visionScorePerMinute: Number,
  
  // Dégâts
  totalDamageDealt: Number,
  totalDamageDealtToChampions: Number,
  physicalDamageDealt: Number,
  magicDamageDealt: Number,
  trueDamageDealt: Number,
  totalDamageTaken: Number,
  damagePerMinute: Number,
  
  // Objectifs
  turretKills: Number,
  inhibitorKills: Number,
  dragonKills: Number,
  baronKills: Number,
  
  // Sorts & Compétences
  spell1Casts: Number,
  spell2Casts: Number,
  spell3Casts: Number,
  spell4Casts: Number,
  totalSpellCasts: Number,
  summonerSpell1Casts: Number,
  summonerSpell2Casts: Number,
  
  // Multikills
  doubleKills: Number,
  tripleKills: Number,
  quadraKills: Number,
  pentaKills: Number,
  
  // Divers
  totalTimeSpentDead: Number, // en secondes
  longestTimeSpentLiving: Number,
  timePlayed: Number,
  totalDistanceTraveled: Number, // distance parcourue
  pings: Number, // nombre de pings utilisés
  
  // Position jouée
  teamPosition: {
    type: String,
    enum: ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'INVALID']
  },
  role: String,
  lane: String,
  
  // Performance
  largestKillingSpree: Number,
  largestMultiKill: Number,
  firstBloodKill: Boolean,
  firstTowerKill: Boolean,
  
  // Contrôle de foule
  totalTimeCCDealt: Number,
  timeCCingOthers: Number,
  
  // Soins & Shields
  totalHeal: Number,
  totalHealsOnTeammates: Number,
  totalDamageShieldedOnTeammates: Number
}, { _id: false });

module.exports = MatchStatsSchema;