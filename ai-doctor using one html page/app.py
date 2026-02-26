from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import pymysql
import os
from functools import wraps
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'ai-doctor-secret-key-2024-healthcare'

# File upload config
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ===== DB CONFIG =====
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',       # Change to your MySQL password
    'db': 'ai_doctor_db',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db():
    return pymysql.connect(**DB_CONFIG)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

# ===== PUBLIC API ROUTES =====

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/body-parts', methods=['GET'])
def get_body_parts():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM body_parts ORDER BY id")
            parts = cursor.fetchall()
        conn.close()
        return jsonify({'success': True, 'data': parts})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/body-part/<slug>', methods=['GET'])
def get_body_part_info(slug):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            # Get body part
            cursor.execute("SELECT * FROM body_parts WHERE slug = %s", (slug,))
            part = cursor.fetchone()
            if not part:
                return jsonify({'success': False, 'message': 'Body part not found'}), 404

            # Get illnesses
            cursor.execute("""
                SELECT i.*, 
                    GROUP_CONCAT(DISTINCT m.name SEPARATOR '|') as medicine_names,
                    GROUP_CONCAT(DISTINCT m.description SEPARATOR '||') as medicine_descs,
                    GROUP_CONCAT(DISTINCT m.dosage SEPARATOR '||') as medicine_dosages,
                    GROUP_CONCAT(DISTINCT m.side_effects SEPARATOR '||') as medicine_sides,
                    GROUP_CONCAT(DISTINCT m.is_otc SEPARATOR '|') as medicine_otc
                FROM illnesses i 
                LEFT JOIN medicines m ON m.illness_id = i.id
                WHERE i.body_part_id = %s AND i.is_active = 1
                GROUP BY i.id
                ORDER BY i.id
            """, (part['id'],))
            illnesses = cursor.fetchall()

            # Parse medicine data for each illness
            for ill in illnesses:
                medicines = []
                if ill['medicine_names']:
                    names = ill['medicine_names'].split('|')
                    descs = ill['medicine_descs'].split('||') if ill['medicine_descs'] else []
                    dosages = ill['medicine_dosages'].split('||') if ill['medicine_dosages'] else []
                    sides = ill['medicine_sides'].split('||') if ill['medicine_sides'] else []
                    otcs = ill['medicine_otc'].split('|') if ill['medicine_otc'] else []
                    for i, name in enumerate(names):
                        if name:
                            medicines.append({
                                'name': name,
                                'description': descs[i] if i < len(descs) else '',
                                'dosage': dosages[i] if i < len(dosages) else '',
                                'side_effects': sides[i] if i < len(sides) else '',
                                'is_otc': otcs[i] == '1' if i < len(otcs) else False
                            })
                ill['medicines'] = medicines
                ill['symptoms_list'] = ill['symptoms'].split('|') if ill['symptoms'] else []
                ill['care_list'] = ill['care_tips'].split('|') if ill['care_tips'] else []
                # Remove raw fields
                for k in ['medicine_names','medicine_descs','medicine_dosages','medicine_sides','medicine_otc']:
                    ill.pop(k, None)

            # Get doctors
            cursor.execute("""
                SELECT * FROM doctors 
                WHERE (body_part_id = %s OR body_part_id IS NULL) AND is_active = 1
                ORDER BY experience_years DESC LIMIT 3
            """, (part['id'],))
            doctors = cursor.fetchall()

        conn.close()
        return jsonify({
            'success': True,
            'data': {
                'part': part,
                'illnesses': illnesses,
                'doctors': doctors
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health-tips', methods=['GET'])
def get_health_tips():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM health_tips WHERE is_active = 1 
                ORDER BY category, sort_order
            """)
            tips = cursor.fetchall()
        conn.close()
        # Group by category
        grouped = {}
        for tip in tips:
            cat = tip['category']
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(tip)
        return jsonify({'success': True, 'data': grouped})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        message = data.get('message', '').strip()

        if not all([name, email, message]):
            return jsonify({'success': False, 'message': 'All fields are required'})

        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO contact_messages (name, email, message) VALUES (%s, %s, %s)",
                (name, email, message)
            )
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Message sent successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ===== ADMIN ROUTES =====

@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    email = data.get('email', '')
    password = data.get('password', '')

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM admin_users WHERE email = %s AND password = %s",
                (email, password)
            )
            admin = cursor.fetchone()
        conn.close()

        if admin:
            session['admin_logged_in'] = True
            session['admin_name'] = admin['name']
            session['admin_email'] = admin['email']
            return jsonify({'success': True, 'name': admin['name']})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/logout', methods=['POST'])
def admin_logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/admin/check', methods=['GET'])
def admin_check():
    if session.get('admin_logged_in'):
        return jsonify({'success': True, 'name': session.get('admin_name')})
    return jsonify({'success': False})

@app.route('/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as c FROM illnesses WHERE is_active=1")
            illnesses = cursor.fetchone()['c']
            cursor.execute("SELECT COUNT(*) as c FROM doctors WHERE is_active=1")
            doctors = cursor.fetchone()['c']
            cursor.execute("SELECT COUNT(*) as c FROM medicines")
            medicines = cursor.fetchone()['c']
            cursor.execute("SELECT COUNT(*) as c FROM contact_messages WHERE is_read=0")
            messages = cursor.fetchone()['c']
        conn.close()
        return jsonify({'success': True, 'data': {
            'illnesses': illnesses, 'doctors': doctors,
            'medicines': medicines, 'messages': messages
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Illness CRUD ---
@app.route('/admin/illnesses', methods=['GET'])
@admin_required
def admin_get_illnesses():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT i.*, bp.name as body_part_name 
                FROM illnesses i 
                JOIN body_parts bp ON bp.id = i.body_part_id
                ORDER BY bp.name, i.name
            """)
            items = cursor.fetchall()
        conn.close()
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/illness', methods=['POST'])
@admin_required
def admin_add_illness():
    try:
        data = request.get_json()
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (data['body_part_id'], data['name'], data['description'],
                  data['symptoms'], data['care_tips'], data.get('severity', 'mild')))
            illness_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': illness_id, 'message': 'Illness added successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/illness/<int:illness_id>', methods=['PUT'])
@admin_required
def admin_update_illness(illness_id):
    try:
        data = request.get_json()
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE illnesses SET body_part_id=%s, name=%s, description=%s,
                symptoms=%s, care_tips=%s, severity=%s, is_active=%s
                WHERE id=%s
            """, (data['body_part_id'], data['name'], data['description'],
                  data['symptoms'], data['care_tips'], data.get('severity','mild'),
                  data.get('is_active', 1), illness_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Illness updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/illness/<int:illness_id>', methods=['DELETE'])
@admin_required
def admin_delete_illness(illness_id):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM illnesses WHERE id=%s", (illness_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Illness deleted'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Doctor CRUD ---
@app.route('/admin/doctors', methods=['GET'])
@admin_required
def admin_get_doctors():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT d.*, bp.name as body_part_name 
                FROM doctors d 
                LEFT JOIN body_parts bp ON bp.id = d.body_part_id
                ORDER BY d.name
            """)
            items = cursor.fetchall()
        conn.close()
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/doctor', methods=['POST'])
@admin_required
def admin_add_doctor():
    try:
        data = request.get_json()
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO doctors (body_part_id, name, specialization, hospital, phone, email, address, experience_years)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (data.get('body_part_id'), data['name'], data['specialization'],
                  data.get('hospital',''), data.get('phone',''), data.get('email',''),
                  data.get('address',''), data.get('experience_years', 0)))
            doctor_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': doctor_id, 'message': 'Doctor added successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/doctor/<int:doctor_id>', methods=['PUT'])
@admin_required
def admin_update_doctor(doctor_id):
    try:
        data = request.get_json()
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE doctors SET body_part_id=%s, name=%s, specialization=%s, hospital=%s,
                phone=%s, email=%s, address=%s, experience_years=%s, is_active=%s
                WHERE id=%s
            """, (data.get('body_part_id'), data['name'], data['specialization'],
                  data.get('hospital',''), data.get('phone',''), data.get('email',''),
                  data.get('address',''), data.get('experience_years',0),
                  data.get('is_active',1), doctor_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Doctor updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/doctor/<int:doctor_id>', methods=['DELETE'])
@admin_required
def admin_delete_doctor(doctor_id):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM doctors WHERE id=%s", (doctor_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Doctor deleted'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Medicine CRUD ---
@app.route('/admin/medicines', methods=['GET'])
@admin_required
def admin_get_medicines():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT m.*, i.name as illness_name 
                FROM medicines m 
                JOIN illnesses i ON i.id = m.illness_id
                ORDER BY i.name, m.name
            """)
            items = cursor.fetchall()
        conn.close()
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/medicine', methods=['POST'])
@admin_required
def admin_add_medicine():
    try:
        data = request.get_json()
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO medicines (illness_id, name, description, dosage, side_effects, is_otc)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (data['illness_id'], data['name'], data['description'],
                  data.get('dosage',''), data.get('side_effects',''), data.get('is_otc', 0)))
            med_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'id': med_id, 'message': 'Medicine added successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/medicine/<int:med_id>', methods=['DELETE'])
@admin_required
def admin_delete_medicine(med_id):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM medicines WHERE id=%s", (med_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Medicine deleted'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/medicine/upload-image/<int:med_id>', methods=['POST'])
@admin_required
def admin_upload_medicine_image(med_id):
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'message': 'No file uploaded'})
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"med_{med_id}_{int(datetime.now().timestamp())}.{file.filename.rsplit('.',1)[1]}")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            conn = get_db()
            with conn.cursor() as cursor:
                cursor.execute("UPDATE medicines SET image_path=%s WHERE id=%s", (filename, med_id))
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'filename': filename})
        return jsonify({'success': False, 'message': 'Invalid file type'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Messages ---
@app.route('/admin/messages', methods=['GET'])
@admin_required
def admin_get_messages():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM contact_messages ORDER BY created_at DESC")
            items = cursor.fetchall()
        conn.close()
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/message/<int:msg_id>/read', methods=['POST'])
@admin_required
def admin_mark_read(msg_id):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("UPDATE contact_messages SET is_read=1 WHERE id=%s", (msg_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Health Tips CRUD ---
@app.route('/admin/tips', methods=['GET'])
@admin_required
def admin_get_tips():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM health_tips ORDER BY category, sort_order")
            items = cursor.fetchall()
        conn.close()
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/tip', methods=['POST'])
@admin_required
def admin_add_tip():
    try:
        data = request.get_json()
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO health_tips (category, title, description, icon, sort_order)
                VALUES (%s, %s, %s, %s, %s)
            """, (data.get('category','home_care'), data['title'], data['description'],
                  data.get('icon','💡'), data.get('sort_order', 0)))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Health tip added'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/tip/<int:tip_id>', methods=['DELETE'])
@admin_required
def admin_delete_tip(tip_id):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM health_tips WHERE id=%s", (tip_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Tip deleted'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/body-parts', methods=['GET'])
@admin_required
def admin_body_parts():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM body_parts ORDER BY name")
            parts = cursor.fetchall()
        conn.close()
        return jsonify({'success': True, 'data': parts})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/illnesses-list', methods=['GET'])
@admin_required
def admin_illnesses_list():
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name FROM illnesses WHERE is_active=1 ORDER BY name")
            items = cursor.fetchall()
        conn.close()
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
