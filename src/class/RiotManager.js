const axios = require('axios');
const player = require('../schemas/player');

class RiotProfileManager {
  static model = player;
  
  constructor(riotApiKey, region = 'europe') {
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
  
  /**
   * Enregistre un nouveau joueur - /register [RiotID]
   */
  async registerPlayer(discordId, riotId) {
    try {
      const existingPlayer = await RiotProfileManager.model.findOne({ discordId });
      if (existingPlayer) {
        throw new Error('Ce compte Discord est déjà enregistré.');
      }

      const [gameName, tagLine] = riotId.split('#');
      if (!gameName || !tagLine) {
        throw new Error('Format Riot ID invalide. Utilisez: GameName#TAG');
      }

      // Récupérer les données Riot
      const riotData = await this.fetchRiotAccount(gameName, tagLine);
      const summonerData = await this.fetchSummonerByPuuid(riotData.puuid);
      const rankedData = await this.fetchRankedStats(summonerData.puuid);
      
      // Calculer le coût et détecter le rôle
      const pointValue = this.calculatePointValue(rankedData.tier);
      const preferredRole = await this.detectPreferredRole(riotData.puuid);

      // Créer le joueur
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
          kdaAverage: 0
        }
      });

      await newPlayer.save();
      return newPlayer;

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      throw error;
    }
  }

  // ==================== PROFIL JOUEUR - /profile @joueur ====================

  /**
   * Récupère la carte d'identité complète d'un joueur
   * Retourne: Rang, Coût, Poste préféré, KDA moyen, Winrate, Casier judiciaire
   */
  async getPlayerProfile(discordId) {
    const player = await RiotProfileManager.model.findOne({ discordId });
    if (!player) throw new Error('Joueur non trouvé');

    return {
      // Identifiants
      discordId: player.discordId,
      riotId: player.riotId,
      gameName: player.gameName,
      
      // Rang
      tier: player.tier,
      rank: player.rank,
      leaguePoints: player.leaguePoints,
      fullRank: `${player.tier} ${player.rank}`, // Ex: "GOLD II"
      
      // Coût (système de points)
      pointValue: player.pointValue,
      
      // Poste préféré
      preferredRole: player.preferredRole,
      
      // Statistiques
      stats: {
        kdaAverage: player.stats.kdaAverage,
        winrate: player.stats.winrate,
        gamesPlayed: player.stats.gamesPlayed,
        wins: player.stats.wins,
        losses: player.stats.losses
      },
      
      // Casier judiciaire (Avertissements)
      judiciary: {
        warnings: player.judiciary.warnings,
        suspensions: player.judiciary.suspensions,
        totalSanctions: player.judiciary.warnings + player.judiciary.suspensions,
        history: player.judiciary.history
      },
      
      // Disponibilité
      availability: player.availability,
      
      // Statut capitaine
      isCaptain: player.isCaptain
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
    const player = await RiotProfileManager.model.findOne({ discordId });
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
    }).select('discordId gameName tier rank pointValue preferredRole stats.winrate stats.kdaAverage');

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
        kdaAverage: player.stats.kdaAverage
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
    .select('discordId gameName tier rank pointValue preferredRole stats.winrate stats.kdaAverage')
    .sort({ pointValue: -1 }); // Tri par prix décroissant

    return players.map(p => ({
      discordId: p.discordId,
      gameName: p.gameName,
      tier: p.tier,
      rank: p.rank,
      fullRank: `${p.tier} ${p.rank}`,
      pointValue: p.pointValue,
      preferredRole: p.preferredRole,
      winrate: p.stats.winrate,
      kdaAverage: p.stats.kdaAverage
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
    .select('discordId gameName tier rank pointValue preferredRole stats.winrate stats.kdaAverage')
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
      kdaAverage: p.stats.kdaAverage
    }));
  }

  // ==================== CAPITAINE ====================

  /**
   * Définir un joueur comme capitaine
   */
  async setCaptain(discordId, isCaptain = true) {
    const player = await RiotProfileManager.model.findOneAndUpdate(
      { discordId },
      { isCaptain },
      { new: true }
    );

    if (!player) throw new Error('Joueur non trouvé');

    return {
      discordId: player.discordId,
      gameName: player.gameName,
      isCaptain: player.isCaptain
    };
  }

  /**
   * Vérifier si un joueur est capitaine
   */
  async isCaptain(discordId) {
    const player = await RiotProfileManager.model.findOne({ discordId });
    if (!player) throw new Error('Joueur non trouvé');
    
    return player.isCaptain;
  }

  // ==================== CASIER JUDICIAIRE ====================

  /**
   * Ajouter une sanction au casier judiciaire
   */
  async addJudiciaryRecord(discordId, type, reason, issuedBy) {
    const validTypes = ['WARNING', 'SUSPENSION', 'FINE'];
    
    if (!validTypes.includes(type)) {
      throw new Error(`Type de sanction invalide. Utilisez: ${validTypes.join(', ')}`);
    }

    const player = await RiotProfileManager.model.findOne({ discordId });
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

  // ==================== MISE À JOUR ====================

  /**
   * Met à jour le rang et les stats d'un joueur
   */
  async updatePlayerRank(discordId) {
    try {
      const player = await RiotProfileManager.model.findOne({ discordId });
      if (!player) throw new Error('Joueur non trouvé');

      const summonerData = await this.fetchSummonerByPuuid(player.puuid);
      const rankedData = await this.fetchRankedStats(summonerData.puuid);

      player.tier = rankedData.tier || 'UNRANKED';
      player.rank = rankedData.rank || '';
      player.leaguePoints = rankedData.leaguePoints || 0;
      player.pointValue = this.calculatePointValue(rankedData.tier);
      player.stats.wins = rankedData.wins || 0;
      player.stats.losses = rankedData.losses || 0;
      player.stats.gamesPlayed = (rankedData.wins || 0) + (rankedData.losses || 0);
      player.stats.winrate = this.calculateWinrate(rankedData.wins, rankedData.losses);

      await player.save();
      return player;

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  /**
   * Met à jour le KDA moyen d'un joueur
   */
  async updatePlayerKDA(discordId, kda) {
    const player = await RiotProfileManager.model.findOneAndUpdate(
      { discordId },
      { 'stats.kdaAverage': kda },
      { new: true }
    );

    if (!player) throw new Error('Joueur non trouvé');
    return player;
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
        throw new Error('Compte Riot introuvable. Vérifiez le Riot ID.');
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

  async fetchMatchHistory(puuid, count = 10) {
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

  async detectPreferredRole(puuid, matchCount = 10) {
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

  /**
   * Calcule la valeur en points selon le rang
   */
  calculatePointValue(tier) {
    const pointMapping = {
      'IRON': 8,
      'BRONZE': 8,
      'SILVER': 15,
      'GOLD': 15,
      'PLATINUM': 25,
      'EMERALD': 25,
      'DIAMOND': 35,
      'MASTER': 50,
      'GRANDMASTER': 50,
      'CHALLENGER': 50,
      'UNRANKED': 8
    };
    return pointMapping[tier] || 8;
  }

  /**
   * Calcule le winrate
   */
  calculateWinrate(wins, losses) {
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  }

  /**
   * Pause pour éviter le rate limit
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { RiotProfileManager };