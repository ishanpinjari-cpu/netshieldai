import numpy as np
import random
import time

ATTACK_CATEGORIES = [
    'Normal Traffic', 'Suspicious Traffic', 'Malware Communication',
    'DDoS Attack', 'Port Scanning', 'Brute Force Attempts',
    'Botnet Activity', 'Data Exfiltration', 'Unknown Anomaly'
]

PROTOCOLS = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP', 'SSH', 'FTP']


def generate_packet():
    """Generate a simulated network packet with realistic features."""
    is_attack = random.random() > 0.75
    
    protocol = random.choice(PROTOCOLS)
    src_ip = f"192.168.{random.randint(0, 5)}.{random.randint(1, 254)}"
    dst_ip = f"10.0.{random.randint(0, 5)}.{random.randint(1, 254)}"
    src_port = random.randint(1024, 65535)
    dst_port = random.choice([80, 443, 22, 53, 8080, 3306, 21, 25, 110, 143])
    
    if is_attack:
        attack_type = random.choice(ATTACK_CATEGORIES[1:])
        
        if attack_type == 'DDoS Attack':
            size = random.randint(1000, 1500)
            ttl = random.choice([1, 2, 32])
            flags = random.choice(['SYN', 'SYN', 'SYN', 'RST'])
        elif attack_type == 'Port Scanning':
            size = random.randint(40, 60)
            ttl = 64
            flags = 'SYN'
            dst_port = random.randint(1, 1024)
        elif attack_type == 'Brute Force Attempts':
            dst_port = random.choice([22, 3389, 21])
            size = random.randint(100, 300)
            ttl = 64
            flags = random.choice(['SYN', 'PSH-ACK'])
        elif attack_type == 'Data Exfiltration':
            size = random.randint(1200, 1500)
            ttl = 128
            flags = 'PSH-ACK'
        else:
            size = random.randint(40, 1500)
            ttl = random.choice([32, 64, 128])
            flags = random.choice(['SYN', 'ACK', 'FIN', 'RST', 'PSH'])
    else:
        attack_type = 'Normal Traffic'
        size = random.randint(40, 800)
        ttl = random.choice([64, 128])
        flags = random.choice(['SYN', 'ACK', 'SYN-ACK', 'PSH-ACK', 'FIN-ACK'])
    
    return {
        'src_ip': src_ip,
        'dst_ip': dst_ip,
        'src_port': src_port,
        'dst_port': dst_port,
        'protocol': protocol,
        'size': size,
        'ttl': ttl,
        'flags': flags,
        'timestamp': time.time(),
        'attack_type': attack_type,
    }


def extract_features(packet):
    """Convert a raw packet dict into a numerical feature vector."""
    protocol_map = {p: i for i, p in enumerate(PROTOCOLS)}
    flags_map = {
        'SYN': 0, 'ACK': 1, 'SYN-ACK': 2, 'FIN': 3, 'RST': 4,
        'PSH': 5, 'URG': 6, 'PSH-ACK': 7, 'FIN-ACK': 8,
    }
    
    features = [
        packet.get('src_port', 0),
        packet.get('dst_port', 0),
        protocol_map.get(packet.get('protocol', 'TCP'), 0),
        packet.get('size', 0),
        packet.get('ttl', 64),
        flags_map.get(packet.get('flags', 'SYN'), 0),
        # Derived features
        1 if packet.get('dst_port', 0) in [22, 23, 3389] else 0,  # SSH/Telnet/RDP
        1 if packet.get('size', 0) > 1000 else 0,  # Large packet
        1 if packet.get('ttl', 64) < 10 else 0,  # Low TTL
    ]
    
    return np.array(features, dtype=np.float64).reshape(1, -1)


def generate_training_data(n_samples=5000):
    """Generate a synthetic training dataset."""
    packets = [generate_packet() for _ in range(n_samples)]
    features = np.vstack([extract_features(p) for p in packets])
    labels = [p['attack_type'] for p in packets]
    
    return features, labels, packets
