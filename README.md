# Acest proiect este configurat pentru a permite colaborarea în timp real între utilizatori de pe dispozitive diferite, conectate la aceeași rețea Wi-Fi/LAN.



# Cerințe Preliminare (Prerequisites)

- Python 3.10+

- Node.js 16+ și npm

- Virtualenv (recomandat)

- Două sau mai multe dispozitive conectate la aceeași rețea Wi-Fi.                  

# Pasul 1: Configurare Backend (Django)

1. Deschideți terminalul în folderul backend.

2. Creați și activați mediul virtual (dacă nu există deja):
```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # Linux/Mac
    source venv/bin/activate
```
3. Instalați dependențele:
```bash
  pip install django daphne channels channels_redis djangorestframework django-cors-headers djangorestframework-simplejwt xhtml2pdf
```
4. Efectuați migrările bazei de date:

```bash
    python manage.py makemigrations
    python manage.py migrate
```

5. Pornire Server (Mod Rețea):

Pentru a fi vizibil de pe alte laptopuri, serverul trebuie să asculte pe toate interfețele (0.0.0.0), nu doar pe localhost.

```bash
    python manage.py runserver 0.0.0.0:8000
```

# Pasul 2: Configurare Frontend (React)

1. Deschideți un nou terminal în folderul frontend.

2. Instalați pachetele npm:

```bash
    npm install
```

3. Pornire Aplicație (Mod Rețea):

Trebuie rulat cu parametrul --host pentru a expune aplicația în rețea.

```bash
  npm run dev -- --host
```

 <mark> Terminalul va afișa adresa de rețea, de exemplu: Network: http://192.168.1.104:5173/

# Pasul 3: Cum accesează utilizatorii aplicația

1. Identifică IP-ul Serverului:

Pe laptopul unde rulează codul (Server), deschide un terminal și scrie *ipconfig* (Windows) sau *ifconfig* (Mac/Linux). Caută IPv4 Address (ex: 192.168.1.104).

2. Accesare:

De pe Laptopul Server: Deschide browserul la http://192.168.1.104:5173 (Folosește IP-ul, NU localhost, pentru ca WebSocket-urile să fie compatibile).

De pe Laptopul Client : Deschide browserul la aceeași adresă: http://192.168.1.104:5173.

# Pasul 4: Depanare (Troubleshooting) - Dacă nu merge conexiunea

Dacă Laptopul client primește eroarea "This site can't be reached" sau nu se poate loga:

1. Windows Firewall :

Pe Laptopul Server, Firewall-ul blochează implicit conexiunile externe pe porturile 8000 și 5173.

Soluție: Dezactivează temporar Windows Defender Firewall pentru rețelele "Private" și "Public" din Control Panel -> System and Security -> Windows Defender Firewall.

2. Client Isolation:

Dacă sunteți pe o rețea publică (cafenea, facultate), routerul poate bloca comunicarea între dispozitive.

Soluție: Folosiți un Mobile Hotspot de pe telefon pentru ambele laptopuri.

3. Antivirus:

Unele programe antivirus au propriul Firewall care poate bloca conexiunea.

# Note funcționale

**Email**: Pentru trimiterea email-urilor, configurați EMAIL_HOST_USER și EMAIL_HOST_PASSWORD (App Password) în settings.py.

**Link-uri Share**: Link-urile generate vor folosi IP-ul serverului (ex: http://192.168.1.104...) pentru a fi accesibile de pe alte dispozitive. 
