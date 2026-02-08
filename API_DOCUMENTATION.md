# 📡 SeaGuard API Documentation

Complete API reference for the SeaGuard backend system.

**Base URL**: `http://localhost:5000`

---

## 🔐 Authentication

Currently, the API does not require authentication. In production, implement JWT or API key authentication.

---

## 📍 Net Registration & Management

### Register a New Net

**Endpoint**: `POST /api/nets`

**Description**: Register a new fishing net in the system.

**Request Body**:
```json
{
  "netId": "NET-001",
  "qrCodeId": "QR-12345",
  "ownerId": "FISHER-001",
  "deploymentLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "deploymentTime": "2024-01-15T10:00:00Z"  // Optional, defaults to now
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Net registered successfully",
  "data": {
    "id": "firestore-doc-id",
    "netId": "NET-001"
  }
}
```

---

### Get All Nets

**Endpoint**: `GET /api/nets`

**Query Parameters**:
- `status` (optional): Filter by status (`active`, `ghost_suspected`, `ghost_confirmed`, `recovered`)
- `ownerId` (optional): Filter by owner ID
- `limit` (optional): Maximum number of results (default: 100)

**Example**: `GET /api/nets?status=ghost_confirmed&limit=50`

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "firestore-doc-id",
      "netId": "NET-001",
      "qrCodeId": "QR-12345",
      "ownerId": "FISHER-001",
      "deploymentLocation": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "deploymentTime": "2024-01-15T10:00:00Z",
      "status": "ghost_confirmed",
      "mlRiskScore": 0.85,
      "lastClassification": {
        "label": "ghost_net",
        "confidence": 0.85,
        "timestamp": "2024-01-16T14:30:00Z"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-16T14:30:00Z"
    }
  ]
}
```

---

### Get Net by ID

**Endpoint**: `GET /api/nets/:netId`

**Example**: `GET /api/nets/NET-001`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "firestore-doc-id",
    "netId": "NET-001",
    "qrCodeId": "QR-12345",
    "ownerId": "FISHER-001",
    "status": "ghost_confirmed",
    "mlRiskScore": 0.85,
    "latestGPS": {
      "latitude": 37.7850,
      "longitude": -122.4300,
      "timestamp": "2024-01-16T14:30:00Z"
    },
    "latestPrediction": {
      "classification": "ghost_net",
      "confidence": 0.85,
      "driftPrediction": {...}
    }
  }
}
```

---

### Get Net by QR Code

**Endpoint**: `GET /api/nets/qr/:qrCodeId`

**Example**: `GET /api/nets/qr/QR-12345`

**Response**: Same as Get Net by ID

---

### Update Net

**Endpoint**: `PUT /api/nets/:netId`

**Request Body**:
```json
{
  "ownerId": "FISHER-002",  // Optional
  "status": "recovered"     // Optional
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Net updated successfully"
}
```

---

### Update Net Status

**Endpoint**: `PATCH /api/nets/:netId/status`

**Request Body**:
```json
{
  "status": "recovered"
}
```

**Valid statuses**: `active`, `ghost_suspected`, `ghost_confirmed`, `recovered`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Net status updated successfully"
}
```

---

## 📡 GPS Data Ingestion

### Ingest GPS Data

**Endpoint**: `POST /api/gps/ingest`

**Description**: Ingest GPS data from buoys. Automatically triggers feature extraction and ML classification.

**Request Body (Single)**:
```json
{
  "netId": "NET-001",
  "latitude": 37.7850,
  "longitude": -122.4300,
  "timestamp": "2024-01-16T14:30:00Z",  // Optional, defaults to now
  "source": "lora"  // Optional: lora, gsm, satellite
}
```

**Request Body (Batch)**:
```json
[
  {
    "netId": "NET-001",
    "latitude": 37.7850,
    "longitude": -122.4300,
    "source": "lora"
  },
  {
    "netId": "NET-002",
    "latitude": 38.7850,
    "longitude": -123.4300,
    "source": "satellite"
  }
]
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Processed 2/2 GPS data points",
  "results": [
    {
      "netId": "NET-001",
      "success": true,
      "gpsId": "firestore-gps-doc-id",
      "featuresExtracted": true
    }
  ]
}
```

**What Happens Automatically**:
1. GPS data is stored in Firestore
2. Features are extracted (speed, acceleration, etc.)
3. ML classification is performed
4. If ghost net detected, drift prediction is generated
5. Alerts are triggered if confidence exceeds threshold
6. Net status is updated automatically

---

### Get GPS History

**Endpoint**: `GET /api/gps/:netId`

**Query Parameters**:
- `limit` (optional): Maximum number of results (default: 100)
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)

**Example**: `GET /api/gps/NET-001?limit=50&startDate=2024-01-15T00:00:00Z`

**Response** (200 OK):
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": "firestore-doc-id",
      "netId": "NET-001",
      "latitude": 37.7850,
      "longitude": -122.4300,
      "timestamp": "2024-01-16T14:30:00Z",
      "source": "lora",
      "features": {
        "speed": 1.2,
        "acceleration": 0.05,
        "direction": 145.5,
        "directionChange": 3.2,
        "distanceFromDeployment": 12.5,
        "movementRandomness": 28.3,
        "driftConsistency": 0.82
      },
      "processed": true
    }
  ]
}
```

---

### Get Latest GPS Position

**Endpoint**: `GET /api/gps/:netId/latest`

**Example**: `GET /api/gps/NET-001/latest`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "firestore-doc-id",
    "netId": "NET-001",
    "latitude": 37.7850,
    "longitude": -122.4300,
    "timestamp": "2024-01-16T14:30:00Z",
    "features": {...}
  }
}
```

---

## 📊 Dashboard APIs

### Live Map Data

**Endpoint**: `GET /api/dashboard/live-map`

**Description**: Get all active net locations for map visualization.

**Query Parameters**:
- `status` (optional): Filter by status

**Example**: `GET /api/dashboard/live-map`

**Response** (200 OK):
```json
{
  "success": true,
  "count": 150,
  "data": [
    {
      "netId": "NET-001",
      "qrCodeId": "QR-12345",
      "ownerId": "FISHER-001",
      "status": "ghost_confirmed",
      "mlRiskScore": 0.85,
      "lastClassification": {
        "label": "ghost_net",
        "confidence": 0.85,
        "timestamp": "2024-01-16T14:30:00Z"
      },
      "location": {
        "latitude": 37.7850,
        "longitude": -122.4300,
        "timestamp": "2024-01-16T14:30:00Z"
      },
      "deploymentLocation": {
        "latitude": 37.7749,
        "longitude": -122.4194
      }
    }
  ]
}
```

---

### Get Ghost Nets

**Endpoint**: `GET /api/dashboard/ghost-nets`

**Description**: Get all suspected or confirmed ghost nets.

**Response** (200 OK):
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "netId": "NET-001",
      "status": "ghost_confirmed",
      "mlRiskScore": 0.85,
      "latestLocation": {...},
      "latestPrediction": {
        "classification": "ghost_net",
        "confidence": 0.85,
        "driftPrediction": {
          "predictions": [
            {
              "timeHorizon": "6h",
              "predictedLocations": [...]
            },
            {
              "timeHorizon": "24h",
              "predictedLocations": [...]
            },
            {
              "timeHorizon": "72h",
              "predictedLocations": [...]
            }
          ]
        }
      }
    }
  ]
}
```

---

### System Analytics

**Endpoint**: `GET /api/dashboard/analytics`

**Description**: Get system-wide analytics and statistics.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalNets": 150,
    "statusCounts": {
      "active": 120,
      "ghost_suspected": 15,
      "ghost_confirmed": 10,
      "recovered": 5
    },
    "riskDistribution": {
      "high": 10,
      "medium": 15,
      "low": 125
    },
    "recentAlerts": [...],
    "recentRecoveries": [...],
    "timestamp": "2024-01-16T15:00:00Z"
  }
}
```

---

### Net Movement History

**Endpoint**: `GET /api/dashboard/net/:netId/history`

**Query Parameters**:
- `limit` (optional): Maximum GPS points (default: 100)

**Example**: `GET /api/dashboard/net/NET-001/history?limit=200`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "net": {...},
    "gpsHistory": [...],
    "predictions": [...]
  }
}
```

---

### Net Risk Assessment

**Endpoint**: `GET /api/dashboard/net/:netId/risk`

**Description**: Get detailed ML risk assessment for a net.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "netId": "NET-001",
    "currentStatus": "ghost_confirmed",
    "currentRiskScore": 0.85,
    "latestPrediction": {...},
    "latestLocation": {...},
    "predictionHistory": [
      {
        "timestamp": "2024-01-16T14:30:00Z",
        "confidence": 0.85,
        "classification": "ghost_net"
      }
    ],
    "riskTrend": "increasing",  // increasing, decreasing, stable
    "assessmentTime": "2024-01-16T15:00:00Z"
  }
}
```

---

## 🔍 Recovery & QR Code

### Scan QR Code

**Endpoint**: `POST /api/recovery/scan`

**Description**: Handle QR code scan from recovery team.

**Request Body**:
```json
{
  "qrCodeId": "QR-12345"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Net found",
  "data": {
    "netId": "NET-001",
    "qrCodeId": "QR-12345",
    "ownerId": "FISHER-001",
    "status": "ghost_confirmed",
    "deploymentLocation": {...},
    "deploymentTime": "2024-01-15T10:00:00Z",
    "currentLocation": {...},
    "mlRiskScore": 0.85,
    "lastClassification": {...},
    "latestPrediction": {...},
    "canRecover": true
  }
}
```

---

### Confirm Recovery

**Endpoint**: `POST /api/recovery/confirm/:netId`

**Description**: Confirm that a net has been recovered.

**Request Body**:
```json
{
  "recoveredBy": "CLEANUP-TEAM-01",  // Optional
  "recoveryNotes": "Net recovered successfully"  // Optional
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Net recovery confirmed successfully",
  "data": {
    "recoveryId": "firestore-recovery-doc-id",
    "netId": "NET-001",
    "recoveredAt": "2024-01-16T15:30:00Z"
  }
}
```

**What Happens**:
1. Recovery record is created
2. Net status is updated to "recovered"
3. ML monitoring is stopped for this net

---

### Get Recovery History

**Endpoint**: `GET /api/recovery/history`

**Query Parameters**:
- `limit` (optional): Maximum results (default: 50)
- `ownerId` (optional): Filter by owner

**Response** (200 OK):
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "firestore-doc-id",
      "netId": "NET-001",
      "qrCodeId": "QR-12345",
      "ownerId": "FISHER-001",
      "recoveredBy": "CLEANUP-TEAM-01",
      "recoveryNotes": "Net recovered successfully",
      "recoveryLocation": {
        "latitude": 37.7900,
        "longitude": -122.4350
      },
      "deploymentLocation": {...},
      "deploymentTime": "2024-01-15T10:00:00Z",
      "recoveredAt": "2024-01-16T15:30:00Z",
      "wasGhostNet": true,
      "finalRiskScore": 0.85
    }
  ]
}
```

---

## 🏥 Health & Status

### API Status

**Endpoint**: `GET /`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "🌊 SeaGuard Backend API is running",
  "version": "1.0.0",
  "timestamp": "2024-01-16T15:00:00Z"
}
```

---

### Health Check

**Endpoint**: `GET /health`

**Description**: Check health of backend and ML service.

**Response** (200 OK):
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "healthy",
    "mlService": "healthy"
  },
  "timestamp": "2024-01-16T15:00:00Z"
}
```

---

## 🤖 ML Service Endpoints

**Base URL**: `http://localhost:5001`

### ML Health Check

**Endpoint**: `GET /ml/health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "SeaGuard ML Service",
  "version": "1.0.0",
  "models": {
    "classifier": true,
    "drift_predictor": true
  },
  "timestamp": "2024-01-16T15:00:00Z"
}
```

---

### Model Information

**Endpoint**: `GET /ml/model-info`

**Response** (200 OK):
```json
{
  "classifier": {
    "name": "Ghost Net Classifier",
    "version": "1.0.0",
    "algorithm": "Random Forest",
    "features": [
      "speed",
      "acceleration",
      "direction",
      "directionChange",
      "distanceFromDeployment",
      "movementRandomness",
      "driftConsistency"
    ],
    "loaded": true
  },
  "drift_predictor": {...}
}
```

---

## ❌ Error Responses

All endpoints return consistent error responses:

**400 Bad Request**:
```json
{
  "success": false,
  "status": "fail",
  "message": "Invalid coordinates"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "status": "fail",
  "message": "Net not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "status": "error",
  "message": "Something went wrong"
}
```

---

## 📝 Notes

1. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
2. **Coordinates**: Latitude (-90 to 90), Longitude (-180 to 180)
3. **Automatic Processing**: GPS ingestion automatically triggers ML pipeline
4. **Rate Limiting**: Not implemented yet - add in production
5. **Authentication**: Not implemented yet - add in production

---

**For more information, see the main [README.md](README.md)**
