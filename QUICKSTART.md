# ⚡ SeaGuard - Quick Start Guide

Get SeaGuard up and running in 5 minutes!

---

## 🚀 Installation (2 minutes)

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
cd ml-service
pip install -r requirements.txt
cd ..
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Your .env is already configured with defaults!
# No changes needed for local development
```

**Note**: Your `firebaseKey.json` is already in place ✅

---

## ▶️ Start the System (1 minute)

### Option 1: Two Terminals (Recommended)

**Terminal 1 - Backend:**
```bash
npm start
```
✅ Backend running on http://localhost:5000

**Terminal 2 - ML Service:**
```bash
npm run ml-service
```
✅ ML Service running on http://localhost:5001

### Option 2: Background Mode

**Windows PowerShell:**
```powershell
# Start backend in background
Start-Process -NoNewWindow npm -ArgumentList "start"

# Start ML service in background
cd ml-service
Start-Process -NoNewWindow python -ArgumentList "app.py"
cd ..
```

---

## ✅ Verify Installation (1 minute)

### 1. Check Backend Health
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "healthy",
    "mlService": "healthy"
  }
}
```

### 2. Check ML Service
```bash
curl http://localhost:5001/ml/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "SeaGuard ML Service",
  "models": {
    "classifier": true,
    "drift_predictor": true
  }
}
```

---

## 🧪 Test the System (1 minute)

### 1. Register a Test Net
```bash
curl -X POST http://localhost:5000/api/nets \
  -H "Content-Type: application/json" \
  -d "{\"netId\":\"TEST-001\",\"qrCodeId\":\"QR-TEST-001\",\"ownerId\":\"FISHER-TEST\",\"deploymentLocation\":{\"latitude\":37.7749,\"longitude\":-122.4194}}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Net registered successfully",
  "data": {
    "id": "firestore-doc-id",
    "netId": "TEST-001"
  }
}
```

### 2. Simulate GPS Data (This triggers the entire ML pipeline!)
```bash
curl -X POST http://localhost:5000/api/gps/ingest \
  -H "Content-Type: application/json" \
  -d "{\"netId\":\"TEST-001\",\"latitude\":37.7850,\"longitude\":-122.4300,\"source\":\"lora\"}"
```

**What happens automatically:**
1. ✅ GPS data stored in Firestore
2. ✅ Features extracted (speed, acceleration, etc.)
3. ✅ ML classification performed
4. ✅ Prediction stored
5. ✅ Alert triggered (if ghost net detected)
6. ✅ Net status updated

**Expected Response:**
```json
{
  "success": true,
  "message": "Processed 1/1 GPS data points",
  "results": {
    "netId": "TEST-001",
    "success": true,
    "gpsId": "firestore-gps-doc-id",
    "featuresExtracted": false
  }
}
```

**Note**: `featuresExtracted: false` because we need at least 5 GPS data points for ML. Keep sending more GPS data!

### 3. Send More GPS Data (to trigger ML)

```bash
# Send 5 more GPS points to trigger ML classification
curl -X POST http://localhost:5000/api/gps/ingest \
  -H "Content-Type: application/json" \
  -d "[
    {\"netId\":\"TEST-001\",\"latitude\":37.7860,\"longitude\":-122.4310,\"source\":\"lora\"},
    {\"netId\":\"TEST-001\",\"latitude\":37.7870,\"longitude\":-122.4320,\"source\":\"lora\"},
    {\"netId\":\"TEST-001\",\"latitude\":37.7880,\"longitude\":-122.4330,\"source\":\"lora\"},
    {\"netId\":\"TEST-001\",\"latitude\":37.7890,\"longitude\":-122.4340,\"source\":\"lora\"},
    {\"netId\":\"TEST-001\",\"latitude\":37.7900,\"longitude\":-122.4350,\"source\":\"lora\"}
  ]"
```

Now ML classification will run! ✅

### 4. Check Net Status
```bash
curl http://localhost:5000/api/nets/TEST-001
```

You'll see:
- Latest GPS location
- ML risk score
- Classification result
- Drift prediction (if ghost net)

### 5. View Dashboard Analytics
```bash
curl http://localhost:5000/api/dashboard/analytics
```

---

## 🎓 Optional: Train ML Model

Train the classifier with synthetic data:

```bash
npm run ml-train
```

**Output:**
```
🌊 SeaGuard Ghost Net Classifier Training
==================================================

🔄 Generating training data...
📊 Dataset: 1000 samples
   Normal nets: 500
   Ghost nets: 500

📈 Training set: 800 samples
📉 Test set: 200 samples

🌲 Training Random Forest classifier...

📊 Model Evaluation:
   Cross-validation AUC: 0.923 (+/- 0.015)
   
   Test Set Metrics:
   Accuracy: 0.875
   ROC-AUC: 0.912

✅ Model saved to: ml-service/models/ghost_net_classifier.pkl
```

---

## 📚 Next Steps

### Explore the APIs

**All Nets:**
```bash
curl http://localhost:5000/api/nets
```

**Live Map Data:**
```bash
curl http://localhost:5000/api/dashboard/live-map
```

**Ghost Nets:**
```bash
curl http://localhost:5000/api/dashboard/ghost-nets
```

**GPS History:**
```bash
curl http://localhost:5000/api/gps/TEST-001
```

**QR Code Scan:**
```bash
curl -X POST http://localhost:5000/api/recovery/scan \
  -H "Content-Type: application/json" \
  -d "{\"qrCodeId\":\"QR-TEST-001\"}"
```

**Confirm Recovery:**
```bash
curl -X POST http://localhost:5000/api/recovery/confirm/TEST-001 \
  -H "Content-Type: application/json" \
  -d "{\"recoveredBy\":\"CLEANUP-TEAM-01\",\"recoveryNotes\":\"Test recovery\"}"
```

---

## 📖 Documentation

- **[README.md](README.md)** - Complete system overview
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - All API endpoints
- **[ML_GUIDE.md](ML_GUIDE.md)** - ML integration details
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[SYSTEM_SUMMARY.md](SYSTEM_SUMMARY.md)** - Implementation summary

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <process_id> /F
```

### ML Service won't start
```bash
# Check Python version (need 3.9+)
python --version

# Reinstall dependencies
cd ml-service
pip install -r requirements.txt --force-reinstall
```

### "Net not found" error
Make sure you registered the net first:
```bash
curl -X POST http://localhost:5000/api/nets \
  -H "Content-Type: application/json" \
  -d "{\"netId\":\"TEST-001\",...}"
```

### ML not running
You need at least 5 GPS data points for ML to trigger. Check:
```bash
curl http://localhost:5000/api/gps/TEST-001
```

---

## 🎯 Quick Test Script

Save this as `test.sh` (Linux/Mac) or `test.ps1` (Windows):

**Windows PowerShell (test.ps1):**
```powershell
# Register net
Invoke-RestMethod -Uri "http://localhost:5000/api/nets" -Method POST -ContentType "application/json" -Body '{"netId":"TEST-001","qrCodeId":"QR-TEST-001","ownerId":"FISHER-TEST","deploymentLocation":{"latitude":37.7749,"longitude":-122.4194}}'

# Send 6 GPS points
$gpsData = @(
  @{netId="TEST-001";latitude=37.7850;longitude=-122.4300;source="lora"}
  @{netId="TEST-001";latitude=37.7860;longitude=-122.4310;source="lora"}
  @{netId="TEST-001";latitude=37.7870;longitude=-122.4320;source="lora"}
  @{netId="TEST-001";latitude=37.7880;longitude=-122.4330;source="lora"}
  @{netId="TEST-001";latitude=37.7890;longitude=-122.4340;source="lora"}
  @{netId="TEST-001";latitude=37.7900;longitude=-122.4350;source="lora"}
)

Invoke-RestMethod -Uri "http://localhost:5000/api/gps/ingest" -Method POST -ContentType "application/json" -Body ($gpsData | ConvertTo-Json)

# Check result
Invoke-RestMethod -Uri "http://localhost:5000/api/nets/TEST-001"
```

Run: `.\test.ps1`

---

## ✨ You're Ready!

Your SeaGuard system is now running and ready to detect ghost fishing nets!

**System Status:**
- ✅ Backend API running on port 5000
- ✅ ML Service running on port 5001
- ✅ Firestore database connected
- ✅ All features operational

**What's Working:**
- ✅ Net registration
- ✅ GPS data ingestion
- ✅ Feature extraction
- ✅ ML classification
- ✅ Drift prediction
- ✅ Alert system
- ✅ QR code recovery
- ✅ Dashboard APIs

---

**Need help? Check the full documentation in [README.md](README.md)**

**Happy ghost net hunting! 🌊**
