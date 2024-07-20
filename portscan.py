from scapy.all import *
import socket

def stealth_scan(target_ip, ports):
    open_ports = []

    for port in ports:
        # Craft a stealth SYN packet
        syn_packet = IP(dst=target_ip) / TCP(dport=port, flags='S')
        response = sr1(syn_packet, timeout=1, verbose=0)

        if response and response.haslayer(TCP) and response.getlayer(TCP).flags == 0x12:
            # Send RST to close the connection
            rst_packet = IP(dst=target_ip) / TCP(dport=port, flags='R')
            send(rst_packet, verbose=0)
            open_ports.append(port)

    return open_ports

def get_service_name(port):
    try:
        return socket.getservbyport(port)
    except:
        return 'Unknown'

def display_open_ports(target_ip, ports):
    open_ports = stealth_scan(target_ip, ports)

    results = []
    if open_ports:
        for port in open_ports:
            service = get_service_name(port)
            results.append(f"Port {port}: {service}")
    return results

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description='Stealth Port Scanner')
    parser.add_argument('target', type=str, help='Target IP address')
    parser.add_argument('--ports', type=int, nargs='+', default=range(1, 1024), help='Ports to scan (default: 1-1023)')
    
    args = parser.parse_args()
    
    results = display_open_ports(args.target, args.ports)
    print(json.dumps(results))
