"""
Real network traffic capture module using psutil and scapy.
Captures actual network activity from the host machine.
"""

import psutil
import time
import threading
import queue
from collections import defaultdict
from datetime import datetime

# Try to import scapy for deep packet inspection
try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP, conf
    # Disable scapy verbose output
    conf.verb = 0
    HAS_SCAPY = True
except ImportError:
    HAS_SCAPY = False
    print("⚠️  scapy not available — using psutil-only mode")


class NetworkCapture:
    """Captures real network traffic from the host machine."""

    def __init__(self):
        self.running = False
        self.packet_queue = queue.Queue(maxsize=1000)
        self.capture_thread = None
        self.stats_thread = None

        # Real-time stats
        self.stats = {
            'total_packets': 0,
            'total_bytes_sent': 0,
            'total_bytes_recv': 0,
            'packets_per_second': 0,
            'bytes_sent_per_sec': 0,
            'bytes_recv_per_sec': 0,
            'active_connections': 0,
            'unique_src_ips': 0,
            'unique_dst_ips': 0,
        }

        # Tracking
        self.src_ip_counts = defaultdict(int)
        self.dst_ip_counts = defaultdict(int)
        self.protocol_counts = defaultdict(int)
        self.connection_tracker = defaultdict(lambda: {
            'bytes': 0, 'packets': 0, 'first_seen': None, 'last_seen': None
        })

        # Previous counters for rate calculation
        self._prev_net_io = None
        self._prev_time = None
        self._prev_packet_count = 0

        # Use scapy if available and we have admin rights
        self.use_scapy = HAS_SCAPY
        self._scapy_works = False

    def start(self):
        """Start capturing network traffic."""
        if self.running:
            return

        self.running = True
        print("🔍 Starting network capture...")

        # Always start psutil stats thread (works without admin)
        self.stats_thread = threading.Thread(target=self._stats_loop, daemon=True)
        self.stats_thread.start()
        print("  ✅ psutil network stats — active")

        # Try scapy packet capture (needs admin/root)
        if self.use_scapy:
            self.capture_thread = threading.Thread(target=self._scapy_capture, daemon=True)
            self.capture_thread.start()
            # Give it a moment to see if it works
            time.sleep(1)
            if self._scapy_works:
                print("  ✅ scapy deep packet capture — active")
            else:
                print("  ⚠️  scapy capture failed (need admin rights) — using psutil connection tracking")
                self.use_scapy = False
        else:
            print("  ℹ️  Running in psutil-only mode (install scapy for deep packet inspection)")

    def stop(self):
        """Stop capturing."""
        self.running = False
        print("🛑 Network capture stopped")

    def get_packet(self, timeout=0.1):
        """Get next captured packet from queue."""
        try:
            return self.packet_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def get_stats(self):
        """Get current network statistics."""
        return {
            **self.stats,
            'capture_mode': 'scapy' if self._scapy_works else 'psutil',
            'top_source_ips': self._get_top_ips(self.src_ip_counts, 10),
            'top_dest_ips': self._get_top_ips(self.dst_ip_counts, 10),
            'protocol_distribution': dict(self.protocol_counts),
            'timestamp': datetime.now().isoformat(),
        }

    def get_connections(self):
        """Get real active network connections using psutil."""
        connections = []
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status == 'ESTABLISHED' and conn.raddr:
                    connections.append({
                        'src_ip': conn.laddr.ip if conn.laddr else '0.0.0.0',
                        'src_port': conn.laddr.port if conn.laddr else 0,
                        'dst_ip': conn.raddr.ip if conn.raddr else '0.0.0.0',
                        'dst_port': conn.raddr.port if conn.raddr else 0,
                        'status': conn.status,
                        'pid': conn.pid,
                        'protocol': 'TCP',  # net_connections returns TCP by default
                        'process': self._get_process_name(conn.pid),
                        'timestamp': datetime.now().isoformat(),
                    })
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            pass
        return connections

    def _stats_loop(self):
        """Continuously collect network stats using psutil."""
        self._prev_net_io = psutil.net_io_counters()
        self._prev_time = time.time()

        while self.running:
            try:
                current_io = psutil.net_io_counters()
                current_time = time.time()
                elapsed = current_time - self._prev_time

                if elapsed > 0:
                    bytes_sent_rate = (current_io.bytes_sent - self._prev_net_io.bytes_sent) / elapsed
                    bytes_recv_rate = (current_io.bytes_recv - self._prev_net_io.bytes_recv) / elapsed
                    packets_rate = (
                        (current_io.packets_sent + current_io.packets_recv) -
                        (self._prev_net_io.packets_sent + self._prev_net_io.packets_recv)
                    ) / elapsed
                else:
                    bytes_sent_rate = 0
                    bytes_recv_rate = 0
                    packets_rate = 0

                # Count active connections
                try:
                    active_conns = len([
                        c for c in psutil.net_connections(kind='inet')
                        if c.status == 'ESTABLISHED'
                    ])
                except (psutil.AccessDenied, PermissionError):
                    active_conns = 0

                self.stats.update({
                    'total_bytes_sent': current_io.bytes_sent,
                    'total_bytes_recv': current_io.bytes_recv,
                    'total_packets': current_io.packets_sent + current_io.packets_recv,
                    'bytes_sent_per_sec': round(bytes_sent_rate),
                    'bytes_recv_per_sec': round(bytes_recv_rate),
                    'packets_per_second': round(packets_rate),
                    'active_connections': active_conns,
                    'unique_src_ips': len(self.src_ip_counts),
                    'unique_dst_ips': len(self.dst_ip_counts),
                })

                self._prev_net_io = current_io
                self._prev_time = current_time

                # Also track connections as pseudo-packets if scapy isn't running
                if not self._scapy_works:
                    self._track_connections()

            except Exception as e:
                print(f"Stats error: {e}")

            time.sleep(2)

    def _track_connections(self):
        """Track active connections as pseudo-packets (psutil fallback)."""
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status == 'ESTABLISHED' and conn.raddr:
                    src_ip = conn.laddr.ip if conn.laddr else '0.0.0.0'
                    dst_ip = conn.raddr.ip if conn.raddr else '0.0.0.0'
                    dst_port = conn.raddr.port if conn.raddr else 0

                    self.src_ip_counts[src_ip] += 1
                    self.dst_ip_counts[dst_ip] += 1
                    self.protocol_counts['TCP'] += 1

                    # Build a packet-like dict for ML prediction
                    packet_data = {
                        'src_ip': src_ip,
                        'dst_ip': dst_ip,
                        'src_port': conn.laddr.port if conn.laddr else 0,
                        'dst_port': dst_port,
                        'protocol': 'TCP',
                        'size': 0,  # psutil doesn't give per-connection bytes
                        'ttl': 64,
                        'flags': 'ESTABLISHED',
                        'pid': conn.pid,
                        'process': self._get_process_name(conn.pid),
                        'timestamp': time.time(),
                        'source': 'psutil',
                    }

                    # Enqueue for ML processing
                    try:
                        self.packet_queue.put_nowait(packet_data)
                    except queue.Full:
                        # Drop oldest
                        try:
                            self.packet_queue.get_nowait()
                            self.packet_queue.put_nowait(packet_data)
                        except queue.Empty:
                            pass

        except (psutil.AccessDenied, psutil.NoSuchProcess):
            pass

    def _scapy_capture(self):
        """Capture packets using scapy (requires admin/root)."""
        def process_packet(pkt):
            if not self.running:
                return

            self._scapy_works = True

            if IP in pkt:
                ip_layer = pkt[IP]
                src_ip = ip_layer.src
                dst_ip = ip_layer.dst
                protocol = 'OTHER'
                src_port = 0
                dst_port = 0
                flags = ''

                if TCP in pkt:
                    protocol = 'TCP'
                    src_port = pkt[TCP].sport
                    dst_port = pkt[TCP].dport
                    flags = str(pkt[TCP].flags)

                    # Map common ports to application protocols
                    if dst_port == 80:
                        protocol = 'HTTP'
                    elif dst_port == 443:
                        protocol = 'HTTPS'
                    elif dst_port == 22:
                        protocol = 'SSH'
                    elif dst_port == 21:
                        protocol = 'FTP'
                    elif dst_port == 53:
                        protocol = 'DNS'

                elif UDP in pkt:
                    protocol = 'UDP'
                    src_port = pkt[UDP].sport
                    dst_port = pkt[UDP].dport
                    if dst_port == 53:
                        protocol = 'DNS'

                elif ICMP in pkt:
                    protocol = 'ICMP'

                # Track counts
                self.src_ip_counts[src_ip] += 1
                self.dst_ip_counts[dst_ip] += 1
                self.protocol_counts[protocol] += 1

                packet_data = {
                    'src_ip': src_ip,
                    'dst_ip': dst_ip,
                    'src_port': src_port,
                    'dst_port': dst_port,
                    'protocol': protocol,
                    'size': len(pkt),
                    'ttl': ip_layer.ttl,
                    'flags': flags,
                    'timestamp': time.time(),
                    'source': 'scapy',
                }

                try:
                    self.packet_queue.put_nowait(packet_data)
                except queue.Full:
                    try:
                        self.packet_queue.get_nowait()
                        self.packet_queue.put_nowait(packet_data)
                    except queue.Empty:
                        pass

        try:
            sniff(prn=process_packet, store=False, stop_filter=lambda _: not self.running)
        except PermissionError:
            print("  ❌ scapy requires admin/root privileges")
            self._scapy_works = False
        except Exception as e:
            print(f"  ❌ scapy capture error: {e}")
            self._scapy_works = False

    def _get_process_name(self, pid):
        """Get process name from PID."""
        if pid is None:
            return 'unknown'
        try:
            return psutil.Process(pid).name()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return 'unknown'

    def _get_top_ips(self, ip_counts, n=10):
        """Get top N IPs by count."""
        sorted_ips = sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)
        return [{'ip': ip, 'count': count} for ip, count in sorted_ips[:n]]


# Singleton
network_capture = NetworkCapture()
