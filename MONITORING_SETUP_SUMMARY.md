# 📊 DEX Mobile v6 - Production Monitoring Setup

## 🎯 Monitoring Stack Overview
- **Health Check Service**: Real-time service monitoring on port 3001
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization dashboards
- **Alertmanager**: Alert routing and notifications

## 🏥 Health Check Endpoints
- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /health/detailed`
- **Metrics**: `GET /metrics`

## 📊 Monitoring Dashboards
- **Service Health Overview**: Real-time status of all enterprise services
- **API Performance**: Response times and throughput metrics
- **Transaction Monitoring**: Success rates and error tracking
- **Resource Usage**: Memory, CPU, and system metrics
- **Security Monitoring**: Failed logins and suspicious activity

## 🚨 Alert Rules
### Critical Alerts
- Service downtime (1 minute threshold)
- Low transaction success rate (<95%)
- MEV attacks detected
- Suspicious login activity

### Warning Alerts
- High error rate (>0.1 errors/second)
- Slow response times (>2 seconds)
- High memory usage (>1GB)

## 📧 Notification Channels
- **Slack**: #dex-mobile-alerts channel
- **Email**: dev@techvitta.com
- **SMS**: Emergency alerts for critical issues
- **PagerDuty**: 24/7 on-call escalation

## 🚀 Quick Start
```bash
# Start monitoring stack
./monitoring/scripts/start-monitoring.sh

# Check health status
curl http://localhost:3001/health

# View detailed health
curl http://localhost:3001/health/detailed
```

## 📈 Key Metrics to Monitor
- **Uptime**: Target 99.9%
- **Response Time**: <500ms average
- **Error Rate**: <0.1%
- **Transaction Success**: >99%
- **Memory Usage**: <1GB
- **CPU Usage**: <80%

## 🔧 Maintenance
- Health checks run every 30 seconds
- Metrics retention: 30 days
- Alert evaluation: Every 15 seconds
- Dashboard refresh: Every 5 seconds

## 📞 Emergency Contacts
- **Primary**: dev@techvitta.com
- **Secondary**: krishna.tatikonda@techvitta.com
- **Emergency**: +91-XXXX-XXXX-XX

## 🎯 Success Criteria
- All services showing green status
- Response times under target thresholds
- Zero critical alerts
- Transaction success rate >99%
