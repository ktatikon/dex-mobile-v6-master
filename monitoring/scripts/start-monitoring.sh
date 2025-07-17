#!/bin/bash

echo "🚀 Starting DEX Mobile v6 Production Monitoring..."

# Start health check service
echo "🏥 Starting health check service..."
cd monitoring
node health-check.js &
HEALTH_PID=$!
echo "Health check service started with PID: $HEALTH_PID"

# Start Prometheus (if available)
if command -v prometheus &> /dev/null; then
    echo "📊 Starting Prometheus..."
    prometheus --config.file=configs/prometheus.yml &
    PROMETHEUS_PID=$!
    echo "Prometheus started with PID: $PROMETHEUS_PID"
fi

# Start Grafana (if available)
if command -v grafana-server &> /dev/null; then
    echo "📈 Starting Grafana..."
    grafana-server --config=configs/grafana.ini &
    GRAFANA_PID=$!
    echo "Grafana started with PID: $GRAFANA_PID"
fi

# Start Alertmanager (if available)
if command -v alertmanager &> /dev/null; then
    echo "🚨 Starting Alertmanager..."
    alertmanager --config.file=configs/alertmanager.yml &
    ALERTMANAGER_PID=$!
    echo "Alertmanager started with PID: $ALERTMANAGER_PID"
fi

echo "✅ Monitoring stack started successfully!"
echo "🔗 Health Check: http://localhost:3001/health"
echo "📊 Prometheus: http://localhost:9090"
echo "📈 Grafana: http://localhost:3000"
echo "🚨 Alertmanager: http://localhost:9093"

# Save PIDs for cleanup
echo "$HEALTH_PID" > monitoring.pids
[ ! -z "$PROMETHEUS_PID" ] && echo "$PROMETHEUS_PID" >> monitoring.pids
[ ! -z "$GRAFANA_PID" ] && echo "$GRAFANA_PID" >> monitoring.pids
[ ! -z "$ALERTMANAGER_PID" ] && echo "$ALERTMANAGER_PID" >> monitoring.pids
