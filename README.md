# 🏥 AI Doctor Analysis — Healthcare Education Platform

A full-stack healthcare educational website with interactive body map, illness information, admin panel, and MySQL database backend.

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (SPA)
- **Backend**: Python Flask
- **Database**: MySQL (via PyMySQL)
- **Fonts**: Syne + DM Sans (Google Fonts)

---

## 📁 Project Structure

```
ai-doctor/
├── app.py                  # Flask main application & all API routes
├── schema.sql              # MySQL database schema + seed data
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variables template
├── templates/
│   └── index.html          # Main HTML template (all pages)
├── static/
│   ├── css/
│   │   └── style.css       # Complete stylesheet
│   └── js/
│       └── main.js         # SPA logic, API calls, admin
└── uploads/                # Medicine image uploads (auto-created)
```

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Python 3.8+ installed
- MySQL Server running
- pip package manager

### 2. Clone / Download
```bash
# Extract to your desired folder
cd ai-doctor
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Up MySQL Database
```bash
# Log in to MySQL
mysql -u root -p

# Run the schema file
SOURCE /path/to/ai-doctor/schema.sql;

# Or from command line:
mysql -u root -p < schema.sql
```

### 5. Configure Database Connection
Open `app.py` and update the DB_CONFIG section:
```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'YOUR_MYSQL_PASSWORD',  # ← Update this
    'db': 'ai_doctor_db',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}
```

### 6. Run the Application
```bash
python app.py
```

The server will start at: **http://localhost:5000**

---

## 🔐 Admin Panel Access

The admin panel is hidden from normal users.

**Access URL**: Navigate to any page and click the invisible admin link, or go to the secret path by logging in via the admin login page.

**Credentials**:
- **Email**: `admin@gmail.com`
- **Password**: `admin123`

**Admin Panel Features**:
- 📊 Dashboard with statistics
- 🦠 Add/Delete Illnesses
- 👨‍⚕️ Add/Delete Doctors
- 💊 Add/Delete Medicines
- 💡 Add/Delete Health Tips
- 💬 View & manage contact messages

---

## 🌐 Website Pages

| Page | Description |
|------|-------------|
| **Home** | Interactive body map with clickable SVG body parts |
| **Illness Info** | Dynamic page showing conditions, symptoms, care tips, medicines, and doctors for each body part |
| **About** | Platform overview with scroll animations |
| **Health Tips** | Cards with home care and medicine safety tips |
| **Contact** | Contact form + info (messages saved to DB) |
| **Admin Login** | Hidden panel accessible via admin credentials |
| **Admin Dashboard** | Full CMS for managing all health content |

---

## 🗺️ Clickable Body Parts

| Body Part | Illnesses Included |
|-----------|-------------------|
| Head | Migraine, Tension Headache, Sinusitis |
| Neck | Cervical Spondylosis, Neck Strain |
| Chest | Costochondritis, Acid Reflux (GERD), Pneumonia |
| Stomach | Gastritis, IBS, Appendicitis |
| Arms | Tennis Elbow, Carpal Tunnel Syndrome |
| Knees | Osteoarthritis, Knee Sprain |
| Legs | Varicose Veins, Shin Splints |
| Feet | Plantar Fasciitis, Gout |
| Back | Lower Back Pain, Herniated Disc |
| Shoulders | Rotator Cuff Injury, Frozen Shoulder |

---

## 🎨 Design Features

- **Blue & white medical theme** with CSS custom properties
- **Syne + DM Sans** typography pairing
- **Smooth page transitions** and scroll animations
- **Interactive SVG body map** with hover highlights
- **Responsive layout** for mobile, tablet, desktop
- **Toast notifications** for user feedback
- **Professional admin dashboard** with sidebar navigation

---

## 📌 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/body-parts` | List all body parts |
| GET | `/api/body-part/<slug>` | Get illness info for body part |
| GET | `/api/health-tips` | Get all health tips |
| POST | `/api/contact` | Submit contact message |

### Admin (requires login)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Admin login |
| POST | `/admin/logout` | Admin logout |
| GET | `/admin/stats` | Dashboard statistics |
| GET/POST | `/admin/illnesses` | List/add illnesses |
| PUT/DELETE | `/admin/illness/<id>` | Update/delete illness |
| GET/POST | `/admin/doctors` | List/add doctors |
| PUT/DELETE | `/admin/doctor/<id>` | Update/delete doctor |
| GET/POST | `/admin/medicines` | List/add medicines |
| DELETE | `/admin/medicine/<id>` | Delete medicine |
| POST | `/admin/medicine/upload-image/<id>` | Upload medicine image |
| GET | `/admin/messages` | List contact messages |
| POST | `/admin/message/<id>/read` | Mark message as read |
| GET/POST | `/admin/tips` | List/add health tips |
| DELETE | `/admin/tip/<id>` | Delete health tip |

---

## ⚕️ Medical Disclaimer

This platform is strictly for **educational purposes only**. All information provided is general in nature and should not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.

---

## 🔧 Troubleshooting

**MySQL Connection Error**: Ensure MySQL is running and credentials in `app.py` are correct.

**Module Not Found**: Run `pip install -r requirements.txt` again.

**Port Already in Use**: Change port in `app.py`: `app.run(port=5001)`

**Upload Not Working**: Ensure the `uploads/` folder exists and has write permissions.

---

*Built with ❤️ for healthcare education*
