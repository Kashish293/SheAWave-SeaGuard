/ Centralized Firestore configuration and collection references
const admin = require('firebase-admin');

class Database {
  constructor() {
    this.db = null;
  }

  initialize(firebaseAdmin) {
    this.db = firebaseAdmin.firestore();
    console.log('✅ Firestore database initialized');
  }

  // Collection references
  get nets() {
    return this.db.collection('nets');
  }

  get gpsData() {
    return this.db.collection('gpsData');
  }

  get mlPredictions() {
    return this.db.collection('mlPredictions');
  }

  get alerts() {
    return this.db.collection('alerts');
  }

  get recoveries() {
    return this.db.collection('recoveries');
  }

  // Helper methods
  async getNetById(netId) {
    const snapshot = await this.nets.where('netId', '==', netId).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async getNetByQRCode(qrCodeId) {
    const snapshot = await this.nets.where('qrCodeId', '==', qrCodeId).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async getLatestGPSData(netId, limit = 10) {
    const snapshot = await this.gpsData
      .where('netId', '==', netId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getLatestPrediction(netId) {
    const snapshot = await this.mlPredictions
      .where('netId', '==', netId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
}

module.exports = new Database();
