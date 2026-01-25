const axios = require('axios');
const player = require('../schemas/player');
const UserError = require('./ErrorUser');
const BaseManager = require('./BaseManager');

class RiotProfileManager extends BaseManager {
  static model = player;
  
  constructor(riotApiKey, region = 'europe') {
    super(RiotProfileManager.model)
    this.apiKey = riotApiKey;
    this.region = region;
    this.platformRouting = {
      'europe': 'euw1',
      'americas': 'na1',
      'asia': 'kr'
    };
    this.platform = this.platformRouting[region] || 'euw1';
    
    this.accountUrl = `https://${region}.api.riotgames.com`;
    this.summonerUrl = `https://${this.platform}.api.riotgames.com`;
  }

  async init() {
    await this.fillCache("discordId");
  }

  /**
   * Enregistre un nouveau joueur - /register [RiotID]
   */
  async registerPlayer(discordId, riotId) {
    try {
      const existingPlayer = this.cache.get(discordId);
      if (existingPlayer) {
        throw new UserError('Ce compte Discord est déjà enregistré.');
      }

      const [gameName, tagLine] = riotId.split('#');
      if (!gameName || !tagLine) {
        throw new UserError('Format Riot ID invalide. Utilisez: GameName#TAG');
      }

      // Récupérer les données Riot
      const riotData = await this.fetchRiotAccount(gameName, tagLine);
      const summonerData = await this.fetchSummonerByPuuid(riotData.puuid);
      const rankedData = await this.fetchRankedStats(summonerData.puuid);
      
      // Calculer le coût et détecter le rôle
      const pointValue = this.calculatePointValue(rankedData.tier);
      const preferredRole = await this.detectPreferredRole(riotData.puuid);
      
      // Calculer le championPool et KDA
      const { championPool, kdaAverage } = await this.calculateChampionPoolAndKDA(riotData.puuid);

      const newPlayer = new RiotProfileManager.model({
        discordId,
        riotId: `${gameName}#${tagLine}`,
        gameName,
        tagLine,
        puuid: riotData.puuid,
        summonerId: summonerData.id,
        accountId: summonerData.accountId,
        tier: rankedData.tier || 'UNRANKED',
        rank: rankedData.rank || '',
        leaguePoints: rankedData.leaguePoints || 0,
        pointValue,
        preferredRole,
        stats: {
          wins: rankedData.wins || 0,
          losses: rankedData.losses || 0,
          gamesPlayed: (rankedData.wins || 0) + (rankedData.losses || 0),
          winrate: this.calculateWinrate(rankedData.wins, rankedData.losses),
          kdaAverage: kdaAverage
        },
        championPool: championPool
      });

      await newPlayer.save();
      this.cache.set(discordId, newPlayer);
      return newPlayer;

    } catch (error) {
      if (error.isUserError) throw error;
        console.error('Erreur lors de l\'enregistrement:', error);
        throw error;
    }
  }

  // ==================== PROFIL JOUEUR - /profile @joueur ====================

  /**
   * Récupère la carte d'identité complète d'un joueur
   * Retourne: Rang, Coût, Poste préféré, KDA moyen, Winrate, Casier judiciaire, Champion Pool
   */
  async getPlayerProfile(discordId) {
    const player = this.cache.get(discordId);
    if (!player) throw new Error('Joueur non trouvé');

    return {
      discordId: player.discordId,
      riotId: player.riotId,
      gameName: player.gameName,
      
      // Rang
      tier: player.tier,
      rank: player.rank,
      leaguePoints: player.leaguePoints,
      fullRank: `${player.tier} ${player.rank}`,
      
      // Coût (système de points)
      pointValue: player.pointValue,
      
      preferredRole: player.preferredRole,
      
      stats: {
        kdaAverage: player.stats.kdaAverage,
        winrate: player.stats.winrate,
        gamesPlayed: player.stats.gamesPlayed,
        wins: player.stats.wins,
        losses: player.stats.losses
      },
      
      championPool: player.championPool,
      
      judiciary: {
        warnings: player.judiciary.warnings,
        suspensions: player.judiciary.suspensions,
        totalSanctions: player.judiciary.warnings + player.judiciary.suspensions,
        history: player.judiciary.history
      },
      
      // Disponibilité
      availability: player.availability,

      mvpCount: player.mvpCount
    };
  }

  // ==================== DISPONIBILITÉ - /status [disponible/absent] ====================

  /**
   * Met à jour la disponibilité d'un joueur pour les 6 semaines de tournoi
   */
  async setAvailability(discordId, available) {
    const status = available ? 'AVAILABLE' : 'UNAVAILABLE';
    
    const player = await RiotProfileManager.model.findOneAndUpdate(
      { discordId },
      { availability: status },
      { new: true }
    );

    if (!player) throw new Error('Joueur non trouvé');
    this.cache.set(discordId, player);

    return {
      discordId: player.discordId,
      gameName: player.gameName,
      availability: player.availability,
      message: available 
        ? `${player.gameName} est maintenant disponible pour la draft`
        : `${player.gameName} s'est retiré du marché`
    };
  }

  /**
   * Vérifie si un joueur est disponible
   */
  async isAvailable(discordId) {
    const player = this.cache.get(discordId);
    if (!player) throw new Error('Joueur non trouvé');
    
    return player.availability === 'AVAILABLE';
  }

  // ==================== MARKET - /market ====================

  /**
   * Affiche la liste des joueurs disponibles pour la Draft
   * Triée par poste et par prix
   */
  async getMarket() {
    const players = await RiotProfileManager.model.find({ 
      availability: 'AVAILABLE' 
    }).select('discordId gameName tier rank pointValue preferredRole stats.winrate stats.kdaAverage championPool');

    // Grouper par rôle
    const market = {
      TOP: [],
      JUNGLE: [],
      MID: [],
      ADC: [],
      SUPPORT: [],
      FILL: []
    };

    players.forEach(player => {
      const role = player.preferredRole || 'FILL';
      market[role].push({
        discordId: player.discordId,
        gameName: player.gameName,
        tier: player.tier,
        rank: player.rank,
        fullRank: `${player.tier} ${player.rank}`,
        pointValue: player.pointValue,
        preferredRole: player.preferredRole,
        winrate: player.stats.winrate,
        kdaAverage: player.stats.kdaAverage,
        topChampions: player.championPool.slice(0, 3).map(c => c.championName)
      });
    });

    // Trier chaque rôle par prix (du plus cher au moins cher)
    Object.keys(market).forEach(role => {
      market[role].sort((a, b) => b.pointValue - a.pointValue);
    });

    return market;
  }

  /**
   * Récupère les joueurs disponibles par rôle spécifique
   */
  async getPlayersByRole(role) {
    const validRoles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT', 'FILL'];
    
    if (!validRoles.includes(role)) {
      throw new Error(`Rôle invalide. Utilisez: ${validRoles.join(', ')}`);
    }

    const players = await RiotProfileManager.model.find({ 
      availability: 'AVAILABLE',
      preferredRole: role 
    })
    .select('discordId gameName tier rank pointValue preferredRole stats.winrate stats.kdaAverage championPool')
    .sort({ pointValue: -1 });

    return players.map(p => ({
      discordId: p.discordId,
      gameName: p.gameName,
      tier: p.tier,
      rank: p.rank,
      fullRank: `${p.tier} ${p.rank}`,
      pointValue: p.pointValue,
      preferredRole: p.preferredRole,
      winrate: p.stats.winrate,
      kdaAverage: p.stats.kdaAverage,
      topChampions: p.championPool.slice(0, 3).map(c => c.championName)
    }));
  }

  /**
   * Récupère les joueurs par fourchette de prix
   */
  async getPlayersByPointRange(minPoints, maxPoints) {
    const players = await RiotProfileManager.model.find({
      availability: 'AVAILABLE',
      pointValue: { $gte: minPoints, $lte: maxPoints }
    })
    .select('discordId gameName tier rank pointValue preferredRole stats.winrate stats.kdaAverage championPool')
    .sort({ pointValue: -1 });

    return players.map(p => ({
      discordId: p.discordId,
      gameName: p.gameName,
      tier: p.tier,
      rank: p.rank,
      fullRank: `${p.tier} ${p.rank}`,
      pointValue: p.pointValue,
      preferredRole: p.preferredRole,
      winrate: p.stats.winrate,
      kdaAverage: p.stats.kdaAverage,
      topChampions: p.championPool.slice(0, 3).map(c => c.championName)
    }));
  }

  // ==================== CASIER JUDICIAIRE ====================

  /**
   * Ajouter une sanction au casier judiciaire
   */
  async addJudiciaryRecord(discordId, type, reason, issuedBy) {
    const validTypes = ['WARNING', 'SUSPENSION', 'FINE'];
    
    if (!validTypes.includes(type)) {
      throw new UserError(`Type de sanction invalide. Utilisez: ${validTypes.join(', ')}`);
    }

    const player = this.cache.get(discordId);
    if (!player) throw new Error('Joueur non trouvé');

    player.judiciary.history.push({ 
      type, 
      reason, 
      issuedBy, 
      date: new Date() 
    });

    if (type === 'WARNING') {
      player.judiciary.warnings += 1;
    } else if (type === 'SUSPENSION') {
      player.judiciary.suspensions += 1;
    }

    await player.save();
    
    return {
      discordId: player.discordId,
      gameName: player.gameName,
      sanctionType: type,
      totalWarnings: player.judiciary.warnings,
      totalSuspensions: player.judiciary.suspensions
    };
  }

  /**
   * Attribue un MVP à un joueur
   */
  async awardMVP(discordId) {
    const player = await RiotProfileManager.model.findOneAndUpdate(
      { discordId },
      { $inc: { mvpCount: 1 } },
      { new: true }
    );

    if (!player) throw new Error('Joueur non trouvé');

    return {
      discordId: player.discordId,
      gameName: player.gameName,
      mvpCount: player.mvpCount
    };
  }

  /**
   * Met à jour le rang, stats et champion pool d'un joueur
   */
  async updatePlayerData(discordId) {
    try {
      const player = this.cache.get(discordId);
      if (!player) throw new Error('Joueur non trouvé');

      const summonerData = await this.fetchSummonerByPuuid(player.puuid);
      const rankedData = await this.fetchRankedStats(summonerData.puuid);

      // Mettre à jour le rang
      player.tier = rankedData.tier || 'UNRANKED';
      player.rank = rankedData.rank || '';
      player.leaguePoints = rankedData.leaguePoints || 0;
      player.pointValue = this.calculatePointValue(rankedData.tier);
      player.stats.wins = rankedData.wins || 0;
      player.stats.losses = rankedData.losses || 0;
      player.stats.gamesPlayed = (rankedData.wins || 0) + (rankedData.losses || 0);
      player.stats.winrate = this.calculateWinrate(rankedData.wins, rankedData.losses);

      // Mettre à jour le rôle préféré et champion pool
      player.preferredRole = await this.detectPreferredRole(player.puuid);
      const { championPool, kdaAverage } = await this.calculateChampionPoolAndKDA(player.puuid);
      player.championPool = championPool;
      player.stats.kdaAverage = kdaAverage;

      await player.save();
      this.cache.set(discordId, player);
      return player;

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  // ==================== CALCUL CHAMPION POOL & KDA ====================

  /**
   * Calcule le champion pool (top 3) et le KDA moyen à partir des matchs récents
   */
  async calculateChampionPoolAndKDA(puuid, matchCount = 20) {
    try {
      const matchIds = await this.fetchMatchHistory(puuid, matchCount);
      const championStats = {};
      let totalKills = 0, totalDeaths = 0, totalAssists = 0;
      let validMatches = 0;

      for (const matchId of matchIds) {
        try {
          const match = await this.fetchMatchDetails(matchId);
          const participant = match.info.participants.find(p => p.puuid === puuid);

          if (!participant) continue;

          // Comptabiliser les stats pour le KDA
          totalKills += participant.kills;
          totalDeaths += participant.deaths;
          totalAssists += participant.assists;
          validMatches++;

          // Champion Pool
          const champId = participant.championId;
          const champName = participant.championName;
          const kda = participant.deaths === 0 
            ? participant.kills + participant.assists 
            : (participant.kills + participant.assists) / participant.deaths;

          if (!championStats[champId]) {
            championStats[champId] = {
              championName: champName,
              championId: champId,
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
              totalKDA: 0
            };
          }

          championStats[champId].gamesPlayed++;
          if (participant.win) {
            championStats[champId].wins++;
          } else {
            championStats[champId].losses++;
          }
          championStats[champId].totalKDA += kda;

          await this.sleep(100);
        } catch (error) {
          console.error(`Erreur pour le match ${matchId}:`, error.message);
        }
      }

      // Calculer le KDA moyen
      const kdaAverage = validMatches > 0
        ? totalDeaths === 0
          ? totalKills + totalAssists
          : parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2))
        : 0;

      // Convertir le champion pool en tableau et calculer les stats
      const championPool = Object.values(championStats)
        .map(champ => ({
          championName: champ.championName,
          championId: champ.championId,
          gamesPlayed: champ.gamesPlayed,
          wins: champ.wins,
          losses: champ.losses,
          winrate: parseFloat(((champ.wins / champ.gamesPlayed) * 100).toFixed(1)),
          averageKDA: parseFloat((champ.totalKDA / champ.gamesPlayed).toFixed(2))
        }))
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
        .slice(0, 3);

      return { championPool, kdaAverage };

    } catch (error) {
      console.error('Erreur lors du calcul du champion pool:', error);
      return { championPool: [], kdaAverage: 0 };
    }
  }

  // ==================== APPELS API RIOT ====================

  async fetchRiotAccount(gameName, tagLine) {
    try {
      const response = await axios.get(
        `${this.accountUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        { headers: { 'X-Riot-Token': this.apiKey } }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new UserError('Compte Riot introuvable. Vérifiez le Riot ID.');
      }
      throw new Error('Erreur API Riot: ' + error.message);
    }
  }

  async fetchSummonerByPuuid(puuid) {
    try {
      const response = await axios.get(
        `${this.summonerUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        { headers: { 'X-Riot-Token': this.apiKey } }
      );
      return response.data;
    } catch (error) {
      throw new Error('Erreur lors de la récupération de l\'invocateur: ' + error.message);
    }
  }

  async fetchRankedStats(puuid) {
    try {
      const response = await axios.get(
        `${this.summonerUrl}/lol/league/v4/entries/by-puuid/${puuid}`,
        { headers: { 'X-Riot-Token': this.apiKey } }
      );
      
      const soloQueue = response.data.find(queue => queue.queueType === 'RANKED_SOLO_5x5');
      return soloQueue || { tier: 'UNRANKED', rank: '', leaguePoints: 0, wins: 0, losses: 0 };
    } catch (error) {
      throw new Error('Erreur lors de la récupération du rang: ' + error.message);
    }
  }

  async fetchMatchHistory(puuid, count = 20) {
    try {
      const response = await axios.get(
        `${this.accountUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
        { headers: { 'X-Riot-Token': this.apiKey } }
      );
      return response.data;
    } catch (error) {
      throw new Error('Erreur lors de la récupération de l\'historique: ' + error.message);
    }
  }

  async fetchMatchDetails(matchId) {
    try {
      const response = await axios.get(
        `${this.accountUrl}/lol/match/v5/matches/${matchId}`,
        { headers: { 'X-Riot-Token': this.apiKey } }
      );
      return response.data;
    } catch (error) {
      throw new Error('Erreur lors de la récupération du match: ' + error.message);
    }
  }

  async detectPreferredRole(puuid, matchCount = 20) {
    const matchIds = await this.fetchMatchHistory(puuid, matchCount);
    const roleCount = { TOP: 0, JUNGLE: 0, MID: 0, ADC: 0, SUPPORT: 0 };

    for (const matchId of matchIds) {
      try {
        const match = await this.fetchMatchDetails(matchId);
        const participant = match.info.participants.find(p => p.puuid === puuid);

        if (!participant || participant.teamPosition === 'INVALID') continue;

        switch (participant.teamPosition) {
          case 'TOP': roleCount.TOP++; break;
          case 'JUNGLE': roleCount.JUNGLE++; break;
          case 'MIDDLE': roleCount.MID++; break;
          case 'BOTTOM': roleCount.ADC++; break;
          case 'UTILITY': roleCount.SUPPORT++; break;
        }
        
        await this.sleep(100);
      } catch (error) {
        console.error(`Erreur détection rôle pour match ${matchId}:`, error.message);
      }
    }

    return Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0][0];
  }

  // ==================== UTILITAIRES ====================

  calculatePointValue(tier) {
    const pointMapping = {
      'IRON': 8, 'BRONZE': 8, 'SILVER': 15, 'GOLD': 15,
      'PLATINUM': 25, 'EMERALD': 25, 'DIAMOND': 35,
      'MASTER': 50, 'GRANDMASTER': 50, 'CHALLENGER': 50,
      'UNRANKED': 8
    };
    return pointMapping[tier] || 8;
  }

  calculateWinrate(wins, losses) {
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { RiotProfileManager };