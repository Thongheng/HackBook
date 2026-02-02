<div align="center">  
  # HackBook
  
  **The Handbook for Hackers.**
  
  <p align="center">
    A comprehensive suite of browser-based offensive security tools designed for CTF players, pentesters, and security researchers.
  </p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

---

## 🚀 Features

HackBook provides a unified interface for payload generation, encoding, and exploitation helper tools. All tools run entirely client-side for privacy and speed.

### 🛠️ Offensive Tools

| Tool | Description | Key Features |
|------|-------------|--------------|
| **JWT Forge** | Manipulate JSON Web Tokens | None-Algo Bypass, HMAC-SHA256 Signing, Header/Payload Editing |
| **CSRF Generator** | Build Cross-Site Request Forgery PoCs | Auto-submit Forms, `fetch()` API PoCs for JSON endpoints |
| **MSFVenom Builder** | GUI for Metasploit Payload generation | Dropdown selectors for Payloads/Encoders/Formats, Bad Char config |
| **XSS Factory** | Generate Cross-Site Scripting vectors | Polyglots, SVG vectors, Base64/CharCode obfuscators |
| **PHP Filter Chain** | LFI exploitation helper | Generate massive `php://filter` chains to gain RCE via LFI |
| **Data Encoder** | Universal data transformer | Base64, Hex, URL, HTML Entities, Quote Escaping |

## 💻 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Thongheng/HackBook.git
   cd HackBook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Deployment to GitHub Pages

This project uses **GitHub Actions** for automatic deployment.

1. **Push to `main`**:
   Any push to the `main` branch will trigger the deployment workflow.
2. **Configure Settings**:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment**, select **Source**: `GitHub Actions`.
   - The site will deploy automatically after the action completes.

## 🛡️ Disclaimer

**HackBook is for educational and authorized testing purposes only.** 
The authors are not responsible for any misuse of these tools. Always ensure you have permission before testing any system.
