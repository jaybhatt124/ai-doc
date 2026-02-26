-- AI Doctor Analysis Database Schema
-- Run this file to set up the database

CREATE DATABASE IF NOT EXISTS ai_doctor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_doctor_db;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Body parts table
CREATE TABLE IF NOT EXISTS body_parts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    svg_area VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Illnesses table
CREATE TABLE IF NOT EXISTS illnesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    body_part_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    care_tips TEXT NOT NULL,
    severity ENUM('mild','moderate','severe') DEFAULT 'mild',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE CASCADE
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    illness_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    dosage VARCHAR(255),
    side_effects TEXT,
    image_path VARCHAR(500),
    is_otc TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (illness_id) REFERENCES illnesses(id) ON DELETE CASCADE
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    body_part_id INT,
    name VARCHAR(200) NOT NULL,
    specialization VARCHAR(200) NOT NULL,
    hospital VARCHAR(300),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    experience_years INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (body_part_id) REFERENCES body_parts(id) ON DELETE SET NULL
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health tips table
CREATE TABLE IF NOT EXISTS health_tips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('home_care','medicine_safety','nutrition','fitness','mental_health') DEFAULT 'home_care',
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '💡',
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== DEFAULT DATA =====

-- Admin user (password: admin123)
INSERT IGNORE INTO admin_users (email, password, name) VALUES 
('admin@gmail.com', 'admin123', 'Administrator');

-- Body Parts
INSERT IGNORE INTO body_parts (slug, name, svg_area) VALUES
('head', 'Head', 'head'),
('neck', 'Neck', 'neck'),
('shoulders', 'Shoulders', 'shoulders'),
('chest', 'Chest', 'chest'),
('stomach', 'Stomach', 'stomach'),
('arms', 'Arms', 'arms'),
('back', 'Back', 'back'),
('knees', 'Knees', 'knees'),
('legs', 'Legs', 'legs'),
('feet', 'Feet', 'feet');

-- Illnesses for HEAD
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(1, 'Migraine', 
'A migraine is a severe, recurring headache that typically affects one side of the head. It is a neurological condition that can cause intense throbbing or pulsing pain, often accompanied by nausea and light sensitivity.', 
'Throbbing pain on one side|Nausea and vomiting|Sensitivity to light and sound|Visual disturbances (aura)|Dizziness|Fatigue', 
'Rest in a dark, quiet room|Apply cold or warm compress|Stay hydrated|Avoid trigger foods|Reduce stress|Maintain regular sleep schedule', 
'moderate'),
(1, 'Tension Headache',
'Tension headaches are the most common type of headache, causing a dull, aching head pain and a sensation of tightness or pressure around the forehead or the back of the head and neck.',
'Dull, aching head pain|Tightness around forehead|Tenderness in scalp, neck and shoulders|Pressure behind eyes',
'Practice relaxation techniques|Get regular sleep|Stay well hydrated|Take short breaks from screen time|Gentle neck stretches',
'mild'),
(1, 'Sinusitis',
'Sinusitis is inflammation or swelling of the tissue lining the sinuses. It can be caused by infection, allergies, or autoimmune issues.',
'Facial pain and pressure|Nasal congestion|Thick nasal discharge|Reduced sense of smell|Headache|Fever',
'Use saline nasal rinse|Apply warm compress on face|Stay hydrated|Use humidifier|Elevate head while sleeping',
'mild');

-- Illnesses for NECK
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(2, 'Cervical Spondylosis',
'Cervical spondylosis is a general term for age-related wear and tear affecting the spinal disks in the neck. It can cause neck pain, stiffness, and in severe cases, neurological symptoms.',
'Neck pain and stiffness|Headaches starting from neck|Muscle spasm|Numbness in shoulders or arms|Grinding sensation when turning head',
'Practice good posture|Use ergonomic pillows|Do gentle neck exercises|Apply heat therapy|Avoid prolonged phone/computer use',
'moderate'),
(2, 'Neck Strain',
'A neck strain is a stretch or tear of the muscles or tendons supporting the neck. Often caused by poor posture, sudden movements, or sleeping in wrong position.',
'Pain and tenderness|Reduced range of motion|Muscle tightness|Headache|Shoulder pain',
'Rest and avoid strenuous activity|Ice pack for first 48 hours|Then apply heat therapy|Over-the-counter pain relief|Gentle stretching',
'mild');

-- Illnesses for CHEST
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(3, 'Costochondritis',
'Costochondritis is inflammation of the cartilage that connects a rib to the breastbone. It causes chest pain that may feel like a heart attack.',
'Sharp chest pain|Tenderness when pressing ribs|Pain worsens with activity|Pain improves with rest',
'Rest and avoid strenuous activities|Apply ice or heat|Practice gentle breathing exercises|Anti-inflammatory medication',
'mild'),
(3, 'Acid Reflux (GERD)',
'Gastroesophageal reflux disease occurs when stomach acid frequently flows back into the tube connecting your mouth and stomach. This backwash can irritate the lining of the esophagus.',
'Burning chest sensation|Regurgitation of food|Difficulty swallowing|Chest pain|Chronic cough|Hoarse voice',
'Eat smaller meals|Avoid lying down after eating|Elevate head of bed|Avoid trigger foods|Maintain healthy weight|Quit smoking',
'moderate'),
(3, 'Pneumonia',
'Pneumonia is an infection that inflames air sacs in one or both lungs. The air sacs may fill with fluid or pus causing cough, fever, chills, and difficulty breathing.',
'Chest pain when breathing|Cough with phlegm|Fever and chills|Shortness of breath|Fatigue|Nausea',
'Get plenty of rest|Stay well hydrated|Take prescribed antibiotics completely|Use fever-reducing medicine|Seek immediate care if breathing worsens',
'severe');

-- Illnesses for STOMACH
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(4, 'Gastritis',
'Gastritis is inflammation of the stomach lining. It can be caused by H. pylori bacteria, regular use of pain relievers, or excessive alcohol consumption.',
'Burning or gnawing stomach pain|Nausea|Vomiting|Feeling of fullness|Loss of appetite|Bloating',
'Eat smaller, more frequent meals|Avoid spicy and fatty foods|Reduce alcohol and caffeine|Manage stress|Avoid NSAIDs',
'moderate'),
(4, 'Irritable Bowel Syndrome',
'IBS is a common disorder affecting the large intestine causing cramping, abdominal pain, bloating, gas, and diarrhea or constipation.',
'Abdominal pain and cramping|Bloating and gas|Diarrhea or constipation|Mucus in stool|Urgency to use bathroom',
'Identify and avoid trigger foods|Eat high-fiber diet|Stay hydrated|Manage stress|Regular exercise|Probiotics',
'mild'),
(4, 'Appendicitis',
'Appendicitis is inflammation of the appendix, a finger-shaped pouch projecting from your colon. It causes pain that begins around the navel and shifts to lower right abdomen.',
'Pain around navel moving to lower right|Nausea and vomiting|Loss of appetite|Fever|Bloating',
'SEEK IMMEDIATE MEDICAL ATTENTION|Do not eat or drink|Do not use heating pad|Hospitalization required|Surgery may be needed',
'severe');

-- Illnesses for ARMS
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(5, 'Tennis Elbow',
'Tennis elbow is a painful condition caused by overuse of the arm, forearm, and hand muscles resulting in inflammation around the elbow.',
'Pain on outer part of elbow|Weak grip strength|Pain when lifting objects|Soreness in forearm|Pain with twisting motions',
'Rest the affected arm|Apply ice for 20 minutes|Use a brace|Physical therapy exercises|Avoid repetitive arm movements',
'mild'),
(5, 'Carpal Tunnel Syndrome',
'Carpal tunnel syndrome is a common condition causing pain, numbness, and tingling in the hand and arm caused by a pinched nerve in the wrist.',
'Numbness or tingling in fingers|Weakness in hand|Pain that travels up arm|Dropping objects|Difficulty with fine motor tasks',
'Wear a wrist splint|Take breaks from repetitive tasks|Ice the wrist|Ergonomic adjustments at workstation|Gentle wrist exercises',
'moderate');

-- Illnesses for KNEES
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(6, 'Osteoarthritis',
'Knee osteoarthritis is a degenerative joint disease where the protective cartilage in the knee gradually breaks down, causing pain, swelling, and difficulty moving the joint.',
'Knee pain during or after movement|Stiffness in morning|Swelling|Grating sensation|Loss of flexibility|Bone spurs',
'Maintain healthy weight|Low-impact exercise|Physical therapy|Apply ice and heat|Use supportive footwear|Knee brace support',
'moderate'),
(6, 'Knee Sprain',
'A knee sprain is a stretching or tearing of one or more ligaments that provide stability to the knee joint. Common in sports activities.',
'Sudden pain at injury|Swelling|Bruising|Instability|Limited range of motion',
'RICE method: Rest, Ice, Compression, Elevation|Use crutches if needed|Gradual return to activity|Physical therapy|Avoid high-impact activities',
'moderate');

-- Illnesses for LEGS
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(7, 'Varicose Veins',
'Varicose veins are enlarged, twisted veins that appear just under the skin, usually in the legs. They occur when valves in the veins become weak or damaged.',
'Twisted, bulging veins|Heavy or aching legs|Muscle cramping|Swelling in lower legs|Itching around veins|Skin discoloration',
'Exercise regularly|Maintain healthy weight|Avoid long periods of standing|Elevate legs when resting|Wear compression stockings',
'mild'),
(7, 'Shin Splints',
'Shin splints refer to pain along the shin bone (tibia) on the front of your leg. Common in runners and those who do high-impact activities.',
'Pain along inner edge of shin|Tenderness|Swelling|Pain during exercise|Mild swelling in lower leg',
'Rest from intense activity|Apply ice|Gradual return to exercise|Wear proper footwear|Stretch calf muscles|Cross-training',
'mild');

-- Illnesses for FEET
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(8, 'Plantar Fasciitis',
'Plantar fasciitis is inflammation of the plantar fascia, a thick band of tissue running across the bottom of your foot. It is a common cause of heel pain.',
'Sharp heel pain in morning|Pain after long periods of standing|Stiffness|Tenderness at bottom of heel|Pain after exercise',
'Stretch before getting out of bed|Wear supportive shoes|Use arch support insoles|Ice the heel|Avoid walking barefoot|Maintain healthy weight',
'mild'),
(8, 'Gout',
'Gout is a form of inflammatory arthritis characterized by sudden, severe attacks of pain, swelling, redness and tenderness in the joints, often in the big toe.',
'Sudden severe joint pain|Swelling and redness|Warmth in affected joint|Limited range of motion|Lingering discomfort',
'Stay well hydrated|Avoid alcohol especially beer|Limit high-purine foods|Maintain healthy weight|Elevate affected joint|Apply ice',
'moderate');

-- Illnesses for BACK
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(9, 'Lower Back Pain',
'Lower back pain is one of the most common medical problems worldwide, often caused by muscle strain, poor posture, or structural problems in the spine.',
'Muscle ache|Shooting or stabbing pain|Pain that radiates down leg|Limited flexibility|Inability to stand straight|Pain worsening when sitting',
'Stay active and avoid bed rest|Apply ice then heat|Practice good posture|Strengthen core muscles|Use proper lifting technique|Ergonomic workspace',
'moderate'),
(9, 'Herniated Disc',
'A herniated disc occurs when the soft center of a spinal disc pushes through a crack in the tougher exterior casing. It can irritate nearby nerves causing pain, numbness, or weakness.',
'Arm or leg pain|Numbness or tingling|Muscle weakness|Pain that worsens at night|Radiating pain',
'Rest but remain gently active|Physical therapy|Apply ice and heat alternately|Maintain good posture|Avoid heavy lifting|Core strengthening exercises',
'severe');

-- Illnesses for SHOULDERS
INSERT INTO illnesses (body_part_id, name, description, symptoms, care_tips, severity) VALUES
(10, 'Rotator Cuff Injury',
'A rotator cuff injury involves any type of irritation or damage to the rotator cuff muscles or tendons that stabilize the shoulder joint.',
'Dull ache deep in shoulder|Arm weakness|Difficulty reaching behind back|Disturbed sleep|Clicking sound in shoulder',
'Rest from overhead activities|Apply ice and heat|Physical therapy exercises|Strengthening exercises|Avoid sleeping on affected shoulder',
'moderate'),
(10, 'Frozen Shoulder',
'Frozen shoulder, also called adhesive capsulitis, causes pain and stiffness in the shoulder. It develops slowly in three stages: freezing, frozen, and thawing.',
'Stiffness in shoulder|Dull or aching pain|Difficulty moving shoulder|Pain worsens at night|Limited range of motion',
'Gentle stretching exercises|Physical therapy|Anti-inflammatory medication|Apply heat before exercises|Ice after exercises|Patience - recovery takes time',
'moderate');

-- Medicines
INSERT INTO medicines (illness_id, name, description, dosage, side_effects, is_otc) VALUES
(1, 'Sumatriptan', 'A triptan medication specifically designed for migraines. Helps narrow blood vessels in the brain.', '25-100mg at onset, may repeat after 2 hours. Max 200mg/day', 'Dizziness, nausea, chest tightness, tingling sensation', 0),
(1, 'Ibuprofen', 'NSAID pain reliever effective for mild to moderate migraine pain when taken early.', '400-600mg with food. Max 1200mg/day OTC', 'Stomach upset, heartburn, increased blood pressure', 1),
(2, 'Acetaminophen (Paracetamol)', 'First-line treatment for tension headaches. Effective with fewer stomach side effects than NSAIDs.', '500-1000mg every 4-6 hours. Max 4000mg/day', 'Rare at recommended doses. Liver damage with overdose', 1),
(3, 'Amoxicillin', 'Antibiotic prescribed for bacterial sinusitis. Requires prescription.', '500mg three times daily for 7-10 days as prescribed', 'Nausea, diarrhea, allergic reactions, rash', 0),
(4, 'Diclofenac', 'NSAID for neck and joint pain. Available as tablet or topical gel.', 'Topical: Apply to affected area 3-4 times daily. Oral: 50mg twice daily with food', 'Skin irritation (topical), stomach upset (oral), dizziness', 0),
(6, 'Omeprazole', 'Proton pump inhibitor that reduces stomach acid production for GERD management.', '20-40mg once daily before meal. Use for 4-8 weeks initially', 'Headache, diarrhea, stomach pain, vitamin B12 deficiency with long-term use', 1),
(9, 'Ibuprofen', 'Anti-inflammatory for stomach pain relief in gastritis.', '200-400mg with food three times daily. Max 1200mg/day OTC', 'Worsens existing stomach conditions, nausea, heartburn', 1),
(13, 'Naproxen', 'NSAID effective for osteoarthritis knee pain with longer duration than ibuprofen.', '220-440mg every 8-12 hours with food. Max 660mg/day OTC', 'Stomach upset, cardiovascular risk with long-term use, kidney effects', 1),
(18, 'Colchicine', 'Reduces inflammation in gout attacks by preventing uric acid crystal buildup.', '0.6-1.2mg at first sign, then 0.6mg after 1 hour. Prescription required', 'Nausea, vomiting, diarrhea, muscle weakness', 0),
(19, 'Meloxicam', 'Prescription NSAID for chronic lower back pain management.', '7.5-15mg once daily with food', 'Stomach upset, cardiovascular risk, kidney effects', 0);

-- Doctors
INSERT INTO doctors (body_part_id, name, specialization, hospital, phone, email, experience_years) VALUES
(1, 'Dr. Sarah Johnson', 'Neurologist', 'City Medical Center', '+1-555-0101', 'dr.johnson@citymedical.com', 15),
(1, 'Dr. Michael Chen', 'Headache Specialist', 'Neurology Associates', '+1-555-0102', 'dr.chen@neuroassoc.com', 12),
(2, 'Dr. Patricia Williams', 'Orthopedic Surgeon', 'Spine & Joint Center', '+1-555-0201', 'dr.williams@spinecenter.com', 18),
(3, 'Dr. Robert Martinez', 'Cardiologist', 'Heart & Vascular Institute', '+1-555-0301', 'dr.martinez@heartinst.com', 20),
(3, 'Dr. Emily Davis', 'Pulmonologist', 'Respiratory Care Center', '+1-555-0302', 'dr.davis@respcare.com', 10),
(4, 'Dr. James Wilson', 'Gastroenterologist', 'Digestive Health Clinic', '+1-555-0401', 'dr.wilson@digestivehealth.com', 14),
(5, 'Dr. Lisa Anderson', 'Sports Medicine', 'Athletic Health Center', '+1-555-0501', 'dr.anderson@athletichealth.com', 9),
(6, 'Dr. Thomas Brown', 'Rheumatologist', 'Arthritis & Joint Clinic', '+1-555-0601', 'dr.brown@arthritisclinic.com', 16),
(7, 'Dr. Amanda Taylor', 'Vascular Surgeon', 'Vascular Care Institute', '+1-555-0701', 'dr.taylor@vascularcare.com', 13),
(8, 'Dr. Kevin Harris', 'Podiatrist', 'Foot & Ankle Specialists', '+1-555-0801', 'dr.harris@footankle.com', 11),
(9, 'Dr. Nancy Thompson', 'Spine Specialist', 'Back & Spine Clinic', '+1-555-0901', 'dr.thompson@spineclinic.com', 17),
(10, 'Dr. Daniel Garcia', 'Orthopedic Surgeon', 'Sports Orthopedics Center', '+1-555-1001', 'dr.garcia@sportsortho.com', 14);

-- Health Tips
INSERT INTO health_tips (category, title, description, icon, sort_order) VALUES
('home_care', 'Stay Hydrated Daily', 'Drink at least 8 glasses (2 liters) of water per day. Proper hydration supports organ function, skin health, digestion, and helps flush toxins from the body.', '💧', 1),
('home_care', 'Exercise Regularly', 'Aim for at least 30 minutes of moderate-intensity exercise 5 days a week. Regular physical activity reduces risk of chronic diseases and improves mental health.', '🏃', 2),
('home_care', 'Prioritize Quality Sleep', 'Adults need 7-9 hours of quality sleep nightly. Good sleep improves immunity, mental clarity, mood, metabolism, and overall health.', '😴', 3),
('home_care', 'Maintain a Balanced Diet', 'Eat a rainbow of fruits, vegetables, whole grains, lean proteins, and healthy fats. Limit processed foods, sugar, and excessive salt intake.', '🥗', 4),
('home_care', 'Practice Good Posture', 'Maintain proper posture while sitting, standing, and walking. Poor posture leads to back pain, neck strain, and affects breathing and digestion.', '🧘', 5),
('home_care', 'Manage Stress Effectively', 'Practice mindfulness, meditation, deep breathing, or yoga. Chronic stress weakens immunity and increases risk of heart disease.', '🧠', 6),
('medicine_safety', 'Never Self-Medicate', 'Always consult a qualified healthcare professional before starting any medication. Self-medication can lead to drug interactions, side effects, and delayed proper treatment.', '⚕️', 1),
('medicine_safety', 'Follow Dosage Instructions', 'Take exactly the prescribed dose at specified times. Never double dose if you miss one, and always complete the full course of antibiotics.', '📋', 2),
('medicine_safety', 'Check Expiry Dates', 'Always check medication expiry dates before taking. Expired medicines can be ineffective or potentially harmful and should be properly disposed of.', '📅', 3),
('medicine_safety', 'Store Medicines Safely', 'Keep medicines in cool, dry places away from direct sunlight. Store out of reach of children. Some medicines require refrigeration.', '🏠', 4),
('medicine_safety', 'Know Your Allergies', 'Keep a list of medications you are allergic to and share it with all healthcare providers. Wear a medical alert bracelet if you have severe allergies.', '⚠️', 5),
('medicine_safety', 'Never Share Prescriptions', 'Prescription medications are tailored to individual patients. Sharing prescription drugs is dangerous and illegal. What works for one person can harm another.', '🚫', 6),
('nutrition', 'Reduce Processed Foods', 'Processed foods contain excessive sodium, unhealthy fats, and artificial additives that contribute to chronic diseases. Cook fresh meals whenever possible.', '🥦', 1),
('nutrition', 'Include Antioxidant-Rich Foods', 'Berries, leafy greens, nuts, and colorful vegetables fight oxidative stress, reduce inflammation, and lower risk of cancer and heart disease.', '🫐', 2),
('fitness', 'Stretch Every Morning', 'Morning stretches improve flexibility, reduce injury risk, boost circulation, and set a positive tone for the day. Just 10 minutes makes a difference.', '🤸', 1),
('mental_health', 'Limit Screen Time', 'Excessive screen time affects sleep, posture, eye health, and mental wellbeing. Take regular digital breaks and avoid screens before bedtime.', '📱', 1);
