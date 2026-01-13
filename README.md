# \# Proiect Colaborativ în Timp Real (Django + React)

# 

# Acest proiect este configurat pentru a permite colaborarea în timp real între utilizatori de pe dispozitive diferite, conectate la aceeași rețea Wi-Fi/LAN.

# 

# \## Cerințe Preliminare (Prerequisites)

# 

# \* \*\*Python 3.10+\*\*

# \* \*\*Node.js 16+\*\* și \*\*npm\*\*

# \* \*\*Virtualenv\*\* (recomandat)

# \* \*\*Două sau mai multe dispozitive\*\* conectate la aceeași rețea Wi-Fi.

# 

# ---

# 

# \##  Pasul 1: Configurare Backend (Django)

# 

# 1\.  Deschideți terminalul în folderul `backend`.

# 2\.  \*\*Creați și activați mediul virtual\*\* (dacă nu există deja):

# 

# &nbsp;   ```bash

# &nbsp;   # Windows

# &nbsp;   python -m venv venv

# &nbsp;   venv\\Scripts\\activate

# 

# &nbsp;   # Linux/Mac

# &nbsp;   source venv/bin/activate

# &nbsp;   ```

# 

# 3\.  \*\*Instalați dependențele:\*\*

# 

# &nbsp;   ```bash

# &nbsp;   pip install django daphne channels channels\_redis djangorestframework django-cors-headers djangorestframework-simplejwt xhtml2pdf

# &nbsp;   ```

# 

# 5\.  \*\*Efectuați migrările bazei de date:\*\*

# 

# &nbsp;   ```bash

# &nbsp;   python manage.py makemigrations

# &nbsp;   python manage.py migrate

# &nbsp;   ```

# 

# 6\.  \*\*Pornire Server (Mod Rețea):\*\*

# &nbsp;   Pentru a fi vizibil de pe alte laptopuri, serverul trebuie să asculte pe toate interfețele (`0.0.0.0`), nu doar pe localhost.

# 

# &nbsp;   ```bash

# &nbsp;   python manage.py runserver 0.0.0.0:8000

# &nbsp;   ```

# 

# ---

# 

# \## Pasul 2: Configurare Frontend (React)

# 

# 1\.  Deschideți un nou terminal în folderul `frontend`.

# 2\.  \*\*Instalați pachetele npm:\*\*

# 

# &nbsp;   ```bash

# &nbsp;   npm install

# &nbsp;   ```

# 

# 3.  \*\*Pornire Aplicație (Mod Rețea):\*\*

# &nbsp;   Trebuie rulat cu parametrul `--host` pentru a expune aplicația în rețea.

# 

# &nbsp;   ```bash

# &nbsp;   npm run dev -- --host

# &nbsp;   ```

# 

# &nbsp;   > Terminalul va afișa adresa de rețea, de exemplu: `Network: http://192.168.1.104:5173/`

# 

# ---

# 

# \## Pasul 3: Cum accesează utilizatorii aplicația

# 

# \### 1. Identifică IP-ul Serverului

# Pe laptopul unde rulează codul (Server), deschide un terminal și scrie `ipconfig` (Windows) sau `ifconfig` (Mac/Linux). Caută \*\*IPv4 Address\*\* (ex: `192.168.1.104`).

# 

# \### 2. Accesare

# \* \*\*De pe Laptopul Server:\*\* Deschide browserul la `http://192.168.1.104:5173` (Folosește IP-ul, \*\*NU\*\* localhost, pentru ca WebSocket-urile să fie compatibile).

# \* \*\*De pe Laptopul Client (B):\*\* Deschide browserul la aceeași adresă: `http://192.168.1.104:5173`.

# 

# ---

# 

# \## Depanare (Troubleshooting)

# 

# Dacă Laptopul B primește eroarea \*"This site can't be reached"\* sau nu se poate loga:

# 

# 1\.  \*\*Windows Firewall (Cauza #1):\*\*

# &nbsp;   \* Pe Laptopul Server, Firewall-ul blochează implicit conexiunile externe pe porturile `8000` și `5173`.

# &nbsp;   \* \*\*Soluție:\*\* Dezactivează temporar \*Windows Defender Firewall\* pentru rețelele "Private" și "Public" din \*Control Panel -> System and Security -> Windows Defender Firewall\*.

# 

# 2\.  \*\*Client Isolation:\*\*

# &nbsp;   \* Dacă sunteți pe o rețea publică (cafenea, facultate), routerul poate bloca comunicarea între dispozitive.

# &nbsp;   \* \*\*Soluție:\*\* Folosiți un \*Mobile Hotspot\* de pe telefon pentru ambele laptopuri.

# 

# 3\.  \*\*Antivirus:\*\*

# &nbsp;   \* Unele programe antivirus au propriul Firewall care poate bloca conexiunea.

# 

# ---

# 

# \## Note funcționale

# 

# \* \*\*Email:\*\* Pentru trimiterea email-urilor, configurați `EMAIL\_HOST\_USER` și `EMAIL\_HOST\_PASSWORD` (App Password) în `settings.py`.

# \* \*\*Link-uri Share:\*\* Link-urile generate vor folosi IP-ul serverului (ex: `http://192.168.1.104...`) pentru a fi accesibile de pe alte dispozitive.

