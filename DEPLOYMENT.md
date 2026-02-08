# 🚀 SeaGuard Deployment Guide

Complete guide for deploying the SeaGuard backend system to production.

## 📋 Prerequisites

### Required Services
- **Firebase Project** with Firestore enabled
- **Node.js** 18+ runtime environment
- **Python** 3.9+ runtime environment
- **Cloud hosting** (Google Cloud, AWS, Azure, or similar)

### Optional Services
- **Email Service** (SendGrid, AWS SES) for email alerts
- **SMS Service** (Twilio, AWS SNS) for SMS alerts
- **Push Notification Service** (Firebase Cloud Messaging) for mobile alerts
- **Ocean Current API** (NOAA, Copernicus) for improved drift prediction

---

## 🏗️ Deployment Architecture

### Option 1: Single Server Deployment (Development/Small Scale)

```
┌─────────────────────────────────────┐
│      Single Cloud Instance          │
│  ┌──────────────┐  ┌──────────────┐ │
│  │  Node.js     │  │   Python     │ │
│  │  Backend     │  │  ML Service  │ │
│  │  (Port 5000) │  │  (Port 5001) │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │   Firestore  │
    │   Database   │
    └──────────────┘
```

### Option 2: Microservices Deployment (Production/Large Scale)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Load        │     │  Node.js     │     │   Python     │
│  Balancer    │────▶│  Backend     │────▶│  ML Service  │
│              │     │  (Multiple)  │     │  (Multiple)  │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Firestore  │     │  ML Model    │
                     │   Database   │     │   Storage    │
                     └──────────────┘     └──────────────┘
```

---

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Firebase

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database

2. **Generate Service Account Key**:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `firebaseKey.json`

3. **Configure Firestore Indexes** (for better query performance):
   ```javascript
   // Create composite indexes for:
   // - gpsData: netId + timestamp
   // - mlPredictions: netId + timestamp
   // - alerts: netId + createdAt
   ```

### Step 2: Deploy Node.js Backend

#### Google Cloud Run (Recommended)

1. **Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

2. **Build and Deploy**:
```bash
# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/seaguard-backend

# Deploy to Cloud Run
gcloud run deploy seaguard-backend \
  --image gcr.io/YOUR_PROJECT_ID/seaguard-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="ML_SERVICE_URL=https://your-ml-service-url"
```

#### AWS Elastic Beanstalk

1. **Create `Procfile`**:
```
web: node server.js
```

2. **Deploy**:
```bash
eb init -p node.js seaguard-backend
eb create seaguard-backend-env
eb deploy
```

#### Azure App Service

```bash
az webapp create --resource-group seaguard-rg \
  --plan seaguard-plan \
  --name seaguard-backend \
  --runtime "NODE|18-lts"

az webapp deployment source config-zip \
  --resource-group seaguard-rg \
  --name seaguard-backend \
  --src seaguard-backend.zip
```

### Step 3: Deploy Python ML Service

#### Google Cloud Run

1. **Create Dockerfile**:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service/ .

EXPOSE 5001

CMD ["python", "app.py"]
```

2. **Deploy**:
```bash
cd ml-service

gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/seaguard-ml

gcloud run deploy seaguard-ml \
  --image gcr.io/YOUR_PROJECT_ID/seaguard-ml \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

#### AWS Lambda + API Gateway

1. **Create Lambda deployment package**:
```bash
cd ml-service
pip install -r requirements.txt -t .
zip -r ml-service.zip .
```

2. **Deploy via AWS Console or CLI**

#### Azure Functions

```bash
func init SeaGuardML --python
func new --name MLClassifier --template "HTTP trigger"
# Copy ML service code
func azure functionapp publish seaguard-ml-functions
```

### Step 4: Configure Environment Variables

Set these environment variables in your deployment:

**Node.js Backend**:
```env
PORT=5000
NODE_ENV=production
ML_SERVICE_URL=https://your-ml-service-url
GHOST_NET_THRESHOLD=0.75
GHOST_NET_SUSPECTED_THRESHOLD=0.50
ALERT_EMAIL_ENABLED=true
ALERT_SMS_ENABLED=true
LOG_LEVEL=info
```

**Python ML Service**:
```env
ML_SERVICE_PORT=5001
```

### Step 5: Set Up Secrets Management

**Google Cloud Secret Manager**:
```bash
# Store Firebase key
gcloud secrets create firebase-key --data-file=firebaseKey.json

# Grant access to Cloud Run service
gcloud secrets add-iam-policy-binding firebase-key \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT \
  --role=roles/secretmanager.secretAccessor
```

**AWS Secrets Manager**:
```bash
aws secretsmanager create-secret \
  --name seaguard/firebase-key \
  --secret-string file://firebaseKey.json
```

**Azure Key Vault**:
```bash
az keyvault secret set \
  --vault-name seaguard-vault \
  --name firebase-key \
  --file firebaseKey.json
```

### Step 6: Set Up Monitoring & Logging

#### Google Cloud

```bash
# Enable Cloud Logging
gcloud logging write seaguard-logs "System started" --severity=INFO

# Set up alerts
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="SeaGuard Error Alert" \
  --condition-display-name="Error rate high"
```

#### AWS CloudWatch

```bash
# Create log group
aws logs create-log-group --log-group-name /seaguard/backend

# Create metric alarm
aws cloudwatch put-metric-alarm \
  --alarm-name seaguard-errors \
  --alarm-description "Alert on errors" \
  --metric-name Errors \
  --namespace AWS/Lambda
```

### Step 7: Set Up Auto-Scaling

#### Google Cloud Run (Automatic)
```bash
gcloud run services update seaguard-backend \
  --min-instances=1 \
  --max-instances=100 \
  --concurrency=80
```

#### AWS Auto Scaling
```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name seaguard-asg \
  --min-size 1 \
  --max-size 10 \
  --desired-capacity 2
```

### Step 8: Configure CDN & Load Balancer

#### Google Cloud Load Balancer
```bash
gcloud compute backend-services create seaguard-backend \
  --global \
  --load-balancing-scheme=EXTERNAL

gcloud compute url-maps create seaguard-lb \
  --default-service=seaguard-backend
```

#### AWS Application Load Balancer
```bash
aws elbv2 create-load-balancer \
  --name seaguard-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345
```

---

## 🔒 Security Checklist

- [ ] **API Authentication**: Implement JWT or API key authentication
- [ ] **Rate Limiting**: Add rate limiting to prevent abuse
- [ ] **HTTPS Only**: Enforce HTTPS for all endpoints
- [ ] **CORS Configuration**: Restrict CORS to trusted domains
- [ ] **Input Validation**: All inputs validated (already implemented)
- [ ] **Secret Management**: Use cloud secret managers
- [ ] **Firestore Rules**: Configure security rules
- [ ] **DDoS Protection**: Enable cloud DDoS protection
- [ ] **Audit Logging**: Enable comprehensive audit logs
- [ ] **Regular Updates**: Keep dependencies updated

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Nets collection
    match /nets/{netId} {
      allow read: if true;  // Public read for dashboard
      allow write: if request.auth != null;  // Authenticated writes only
    }
    
    // GPS data
    match /gpsData/{gpsId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // ML predictions
    match /mlPredictions/{predId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Alerts
    match /alerts/{alertId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Recoveries
    match /recoveries/{recoveryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📊 Performance Optimization

### Database Optimization

1. **Create Indexes**:
```javascript
// Firestore composite indexes
gpsData: [netId, timestamp]
mlPredictions: [netId, timestamp]
alerts: [netId, createdAt]
nets: [status, mlRiskScore]
```

2. **Enable Caching**:
```javascript
// Add Redis for caching
const redis = require('redis');
const client = redis.createClient();

// Cache frequently accessed data
await client.set(`net:${netId}`, JSON.stringify(netData), 'EX', 300);
```

### ML Service Optimization

1. **Model Caching**: Models loaded once on startup
2. **Batch Processing**: Process multiple nets in single request
3. **Async Processing**: Use message queues for non-urgent predictions

### CDN Configuration

```bash
# Cache static responses
Cache-Control: public, max-age=300

# Don't cache dynamic data
Cache-Control: no-cache, no-store, must-revalidate
```

---

## 🧪 Testing in Production

### Smoke Tests

```bash
# Test backend health
curl https://your-backend-url/health

# Test ML service health
curl https://your-ml-service-url/ml/health

# Test net registration
curl -X POST https://your-backend-url/api/nets \
  -H "Content-Type: application/json" \
  -d '{"netId":"TEST-001","qrCodeId":"QR-TEST","ownerId":"TEST",...}'
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://your-backend-url/api/nets

# Using k6
k6 run load-test.js
```

---

## 📈 Monitoring & Alerts

### Key Metrics to Monitor

1. **API Metrics**:
   - Request rate
   - Response time (p50, p95, p99)
   - Error rate
   - Throughput

2. **ML Service Metrics**:
   - Inference latency
   - Model accuracy
   - Prediction rate
   - Queue depth

3. **Database Metrics**:
   - Read/write operations
   - Query latency
   - Storage usage

4. **Business Metrics**:
   - Active nets
   - Ghost nets detected
   - Recovery rate
   - Alert response time

### Alert Configuration

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: Slow Response Time
    condition: p95_latency > 1s
    duration: 5m
    severity: warning
    
  - name: ML Service Down
    condition: ml_health == unhealthy
    duration: 1m
    severity: critical
```

---

## 🔄 Continuous Deployment

### GitHub Actions

```yaml
name: Deploy SeaGuard

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy seaguard-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/seaguard-backend
            
  deploy-ml-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy ML Service
        run: |
          gcloud run deploy seaguard-ml \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/seaguard-ml
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: ML service returns 503
- **Solution**: Check ML service logs, ensure model files are present

**Issue**: High latency on GPS ingestion
- **Solution**: Enable batch processing, add caching layer

**Issue**: Firestore quota exceeded
- **Solution**: Optimize queries, add indexes, consider sharding

**Issue**: False positive ghost net detections
- **Solution**: Retrain ML model with more data, adjust threshold

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review error logs and alerts
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Retrain ML models with new data
- **Annually**: Review and optimize cloud costs

### Backup Strategy

```bash
# Automated Firestore backups
gcloud firestore export gs://seaguard-backups/$(date +%Y%m%d)

# Backup ML models
gsutil cp -r ml-service/models gs://seaguard-ml-models/backup/
```

---

**For questions or issues, refer to the [README.md](README.md) or [API Documentation](API_DOCUMENTATION.md)**
