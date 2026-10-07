"""
NetShield AI — ML Service
Real-time network anomaly detection with actual ML models.
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import time
import threading

sys.path.insert(0, os.path.dirname(__file__))

from config import PORT
from models.model_manager import model_manager
from services.traffic_simulator import generate_packet, extract_features, ATTACK_CATEGORIES
from services.network_capture import network_capture

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25,
)

# --- State ---
realtime_active = False
realtime_thread = None


# =============================================
#  REST API Endpoints
# =============================================

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'NetShield AI ML Service',
        'models_ready': model_manager.is_ready,
        'models_loaded': list(model_manager.models.keys()),
        'capture_mode': 'scapy' if network_capture._scapy_works else 'psutil',
        'capture_running': network_capture.running,
    })


@app.route('/predict', methods=['POST'])
def predict():
    """Predict attack category for a given packet."""
    data = request.json or {}
    model_name = data.get('model', 'random_forest')
    packet = data.get('packet', generate_packet())

    result = model_manager.predict(packet, model_name)
    result['packet'] = {
        'src_ip': packet.get('src_ip', ''),
        'dst_ip': packet.get('dst_ip', ''),
        'src_port': packet.get('src_port', 0),
        'dst_port': packet.get('dst_port', 0),
        'protocol': packet.get('protocol', ''),
        'size': packet.get('size', 0),
    }
    return jsonify(result)


@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Predict on multiple packets at once."""
    data = request.json or {}
    packets = data.get('packets', [])
    model_name = data.get('model', 'random_forest')

    results = []
    for pkt in packets[:50]:  # Cap at 50
        result = model_manager.predict(pkt, model_name)
        result['packet'] = pkt
        results.append(result)

    return jsonify({'predictions': results, 'count': len(results)})


@app.route('/train', methods=['POST'])
def train():
    """Train a specific model."""
    data = request.json or {}
    model_name = data.get('model', 'random_forest')
    n_samples = data.get('n_samples', 5000)

    # Train in background thread
    def do_train():
        model_manager.train_model(model_name, n_samples)
        socketio.emit('training:complete', {
            'model': model_name,
            'metrics': model_manager.metrics.get(model_name, {}),
        })

    thread = threading.Thread(target=do_train, daemon=True)
    thread.start()

    return jsonify({'status': 'training_started', 'model': model_name, 'n_samples': n_samples})


@app.route('/train/progress/<model_name>', methods=['GET'])
def train_progress(model_name):
    """Get training progress."""
    return jsonify(model_manager.get_training_progress(model_name))


@app.route('/models', methods=['GET'])
def get_models():
    """List all available models with metrics."""
    return jsonify(model_manager.get_model_list())


@app.route('/metrics/<model_name>', methods=['GET'])
def get_metrics(model_name):
    """Get detailed metrics for a specific model."""
    metrics = model_manager.metrics.get(model_name)
    if not metrics:
        return jsonify({'error': 'Model not found or not trained'}), 404
    return jsonify(metrics)


@app.route('/network/stats', methods=['GET'])
def network_stats():
    """Get real-time network statistics."""
    return jsonify(network_capture.get_stats())


@app.route('/network/connections', methods=['GET'])
def network_connections():
    """Get active network connections."""
    conns = network_capture.get_connections()
    return jsonify({'connections': conns, 'count': len(conns)})


@app.route('/capture/start', methods=['POST'])
def start_capture():
    """Start network capture."""
    network_capture.start()
    return jsonify({'status': 'started', 'mode': 'scapy' if network_capture._scapy_works else 'psutil'})


@app.route('/capture/stop', methods=['POST'])
def stop_capture():
    """Stop network capture."""
    network_capture.stop()
    return jsonify({'status': 'stopped'})


@app.route('/simulate', methods=['POST'])
def simulate():
    """Generate simulated packets and predict."""
    count = request.json.get('count', 10) if request.json else 10
    packets = []

    for _ in range(min(count, 100)):
        packet = generate_packet()
        prediction = model_manager.predict(packet)
        packets.append({**packet, **prediction})

    return jsonify({'packets': packets, 'count': len(packets)})


@app.route('/insights', methods=['GET'])
def get_insights():
    """Generate AI insights based on real capture data."""
    stats = network_capture.get_stats()
    insights = []

    # Generate real insights from capture data
    recv_rate_mb = stats.get('bytes_recv_per_sec', 0) / (1024 * 1024)
    sent_rate_mb = stats.get('bytes_sent_per_sec', 0) / (1024 * 1024)
    active = stats.get('active_connections', 0)

    if recv_rate_mb > 10:
        insights.append({
            'text': f'High incoming traffic: {recv_rate_mb:.1f} MB/s. Potential volumetric attack.',
            'category': 'Traffic', 'severity': 'warning'
        })

    if active > 100:
        insights.append({
            'text': f'{active} active connections detected. Monitor for unusual patterns.',
            'category': 'Connections', 'severity': 'warning'
        })
    elif active > 0:
        insights.append({
            'text': f'{active} active connections. Network activity is normal.',
            'category': 'Health', 'severity': 'info'
        })

    # Model status
    loaded = list(model_manager.models.keys())
    if loaded:
        best_model = max(loaded, key=lambda m: model_manager.metrics.get(m, {}).get('accuracy', 0))
        best_acc = model_manager.metrics.get(best_model, {}).get('accuracy', 0)
        insights.append({
            'text': f'Best model: {best_model.replace("_", " ").title()} with {best_acc}% accuracy.',
            'category': 'AI', 'severity': 'info'
        })

    # Capture mode
    mode = stats.get('capture_mode', 'psutil')
    if mode == 'scapy':
        insights.append({
            'text': 'Deep packet inspection active (scapy). Full protocol analysis enabled.',
            'category': 'System', 'severity': 'info'
        })
    else:
        insights.append({
            'text': 'Running in connection-tracking mode (psutil). Run as admin for deep packet inspection.',
            'category': 'System', 'severity': 'warning'
        })

    # Top talkers
    top_src = stats.get('top_source_ips', [])
    if top_src and top_src[0].get('count', 0) > 50:
        insights.append({
            'text': f'Top talker: {top_src[0]["ip"]} ({top_src[0]["count"]} connections). Verify this is expected.',
            'category': 'Traffic', 'severity': 'warning'
        })

    return jsonify(insights)


@app.route('/categories', methods=['GET'])
def get_categories():
    return jsonify(ATTACK_CATEGORIES)


# =============================================
#  WebSocket — Real-time Data Stream
# =============================================

@socketio.on('connect')
def handle_connect():
    print(f'🔌 Client connected to ML service')
    emit('connection:status', {
        'status': 'connected',
        'models_ready': model_manager.is_ready,
        'capture_running': network_capture.running,
    })


@socketio.on('disconnect')
def handle_disconnect():
    print(f'🔌 Client disconnected from ML service')


@socketio.on('stream:start')
def handle_start_stream():
    """Start real-time prediction stream."""
    global realtime_active, realtime_thread

    if realtime_active:
        return

    realtime_active = True
    if not network_capture.running:
        network_capture.start()

    realtime_thread = threading.Thread(target=_realtime_loop, daemon=True)
    realtime_thread.start()
    emit('stream:status', {'active': True})
    print('▶️  Real-time stream started')


@socketio.on('stream:stop')
def handle_stop_stream():
    """Stop real-time prediction stream."""
    global realtime_active
    realtime_active = False
    emit('stream:status', {'active': False})
    print('⏹️  Real-time stream stopped')


def _realtime_loop():
    """Main real-time loop: capture → predict → emit."""
    global realtime_active
    packet_buffer = []
    alert_cooldown = {}

    while realtime_active:
        try:
            # 1) Get network stats
            stats = network_capture.get_stats()

            # Format for frontend
            net_stats = {
                'totalPackets': stats.get('total_packets', 0),
                'activeConnections': stats.get('active_connections', 0),
                'incomingTraffic': round(stats.get('bytes_recv_per_sec', 0) / (1024 * 1024), 1),  # MB/s
                'outgoingTraffic': round(stats.get('bytes_sent_per_sec', 0) / (1024 * 1024), 1),
                'packetRate': stats.get('packets_per_second', 0),
                'threatsBlocked': 0,
                'devicesOnline': stats.get('active_connections', 0),
            }

            socketio.emit('stats:update', net_stats)

            # Traffic point for chart
            socketio.emit('traffic:update', {
                'time': time.strftime('%I:%M:%S %p'),
                'incoming': round(stats.get('bytes_recv_per_sec', 0) / 1024),  # KB/s
                'outgoing': round(stats.get('bytes_sent_per_sec', 0) / 1024),
            })

            # Protocol distribution
            socketio.emit('protocols:update', stats.get('protocol_distribution', {}))

            # Top IPs
            socketio.emit('topips:update', {
                'sourceIPs': stats.get('top_source_ips', []),
                'destIPs': stats.get('top_dest_ips', []),
            })

            # 2) Process captured packets through ML
            packets_processed = 0
            threats_detected = 0

            while packets_processed < 20:  # Process up to 20 packets per cycle
                pkt = network_capture.get_packet(timeout=0.05)
                if pkt is None:
                    break

                # Run ML prediction
                prediction = model_manager.predict(pkt)
                enriched = {
                    **pkt,
                    **prediction,
                    'id': f"{time.time()}-{packets_processed}",
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S'),
                }

                socketio.emit('packet:new', enriched)
                packets_processed += 1

                # If anomaly detected, emit detection + alert
                if prediction['category'] != 'Normal Traffic':
                    threats_detected += 1

                    socketio.emit('detection:new', enriched)

                    # Generate alert for high-risk detections (with cooldown)
                    if prediction['risk_score'] >= 50:
                        alert_key = f"{pkt.get('dst_ip')}:{prediction['category']}"
                        now = time.time()
                        if alert_key not in alert_cooldown or (now - alert_cooldown[alert_key]) > 30:
                            alert_cooldown[alert_key] = now
                            socketio.emit('alert:new', {
                                '_id': str(int(now * 1000)),
                                'threatName': prediction['category'],
                                'severity': prediction['risk_level'],
                                'time': time.strftime('%Y-%m-%dT%H:%M:%S'),
                                'srcIP': pkt.get('src_ip', ''),
                                'dstIP': pkt.get('dst_ip', ''),
                                'dstPort': pkt.get('dst_port', 0),
                                'affectedDevice': f"{pkt.get('dst_ip', '')}:{pkt.get('dst_port', 0)}",
                                'confidence': prediction['confidence'],
                                'riskScore': prediction['risk_score'],
                                'recommendedAction': _get_action(prediction['category']),
                                'read': False,
                                'process': pkt.get('process', 'unknown'),
                            })

            # Update threat count
            if threats_detected > 0:
                socketio.emit('stats:threats', {'count': threats_detected})

        except Exception as e:
            print(f"Realtime loop error: {e}")

        time.sleep(2)


def _get_action(category):
    """Get recommended action for a threat category."""
    actions = {
        'DDoS Attack': 'Enable rate limiting and block source IP',
        'Port Scanning': 'Monitor source and restrict access',
        'Brute Force Attempts': 'Lock account and block IP after 5 attempts',
        'Malware Communication': 'Isolate affected device immediately',
        'Botnet Activity': 'Quarantine device and scan for malware',
        'Data Exfiltration': 'Block outbound transfer and investigate',
        'Suspicious Traffic': 'Monitor and log for further analysis',
        'Unknown Anomaly': 'Investigate traffic pattern manually',
    }
    return actions.get(category, 'Investigate and take action')


# =============================================
#  Startup
# =============================================

def startup():
    """Initialize everything on startup."""
    print("\n" + "=" * 50)
    print("🛡️  NetShield AI — ML Service")
    print("=" * 50)

    # 1) Auto-train or load ML models
    model_manager.auto_init()

    # 2) Start network capture
    network_capture.start()

    print(f"🌐 REST API: http://localhost:{PORT}")
    print(f"🔌 WebSocket: ws://localhost:{PORT}")
    print(f"💚 Health: http://localhost:{PORT}/health")
    print("=" * 50 + "\n")


if __name__ == '__main__':
    startup()
    socketio.run(app, host='0.0.0.0', port=PORT, debug=False, allow_unsafe_werkzeug=True)
