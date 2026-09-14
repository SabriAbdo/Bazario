-- =============================================================
-- Bazario DB reset/reseed script
-- 1) Wipes all commande (order) data
-- 2) Removes leftover schemathesis fuzz-test junk products
-- 3) Adds real, catalogue-appropriate electrical products
-- =============================================================

BEGIN;

-- ---- 1. Wipe all commande (order) data ----
DELETE FROM order_status_history;
DELETE FROM command_items;
DELETE FROM commands;

-- ---- 2. Remove fuzz-test junk products (no brand set => not a real seeded product) ----
DELETE FROM comments WHERE product_id IN (SELECT id FROM products WHERE marque IS NULL OR btrim(marque) = '');
DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE marque IS NULL OR btrim(marque) = '');
DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE marque IS NULL OR btrim(marque) = '');
DELETE FROM product_category_link WHERE product_id IN (SELECT id FROM products WHERE marque IS NULL OR btrim(marque) = '');
DELETE FROM products WHERE marque IS NULL OR btrim(marque) = '';

-- Remove the bogus "TEST" category left by fuzzing, if now unused
DELETE FROM product_categories
WHERE slug = 'TEST'
  AND NOT EXISTS (SELECT 1 FROM product_category_link WHERE category_id = product_categories.id);

-- ---- 3. Add real products, tagged BZR-1xx so they're easy to find afterwards ----
INSERT INTO products (libelle, prix, prix_promo, prix_actif, description, reference, marque, categorie, unite, quantite_min, is_deleted, approved_by_admin, created_by_id, created_at)
VALUES
('Siemens 5SL6116-6 Disjoncteur 16A 1P+N courbe C 6kA',
 158.00, NULL, true, N'Disjoncteur modulaire 5SL6, unipolaire+neutre, 16A courbe C, pouvoir de coupure 6kA. Rail DIN.',
 'BZR-101', 'Siemens', 'DISJONCTEUR', 'PIECE', 1, false, true, 1, now()),

('ABB SH202L-C20 Disjoncteur 20A 2P courbe C 6kA',
 210.00, NULL, true, N'Disjoncteur bipolaire ABB System pro M compact, 20A courbe C, 6kA, 2 modules DIN.',
 'BZR-102', 'ABB', 'DISJONCTEUR', 'PIECE', 1, false, true, 1, now()),

('Câble Nexans H07V-U 6mm² vert-jaune (terre) 100m',
 445.00, 399.00, true, N'Câble rigide de mise à la terre 6mm², gaine vert/jaune, bobine 100m. Conforme NF C 32-201.',
 'BZR-103', 'Nexans', 'CABLE', 'BOBINE', 1, false, true, 1, now()),

('Câble réseau Legrand Cat6A U/FTP LSZH 100m',
 890.00, NULL, true, N'Câble Ethernet Cat6A blindé U/FTP, gaine LSZH, bobine 100m. Débit jusqu''à 10 Gbps.',
 'BZR-104', 'Legrand', 'CABLE', 'BOBINE', 1, false, true, 1, now()),

('Legrand Céliane Prise 2P+T avec obturateurs',
 38.00, NULL, true, N'Prise de courant 16A à obturateurs, finition Céliane, montage encastré, bornes automatiques.',
 'BZR-105', 'Legrand', 'PRISE', 'PIECE', 1, false, true, 1, now()),

('Schneider Unica Interrupteur va-et-vient double',
 46.00, NULL, true, N'Double interrupteur va-et-vient 10A 250V, finition Unica, montage encastré.',
 'BZR-106', 'Schneider', 'PRISE', 'PIECE', 1, false, true, 1, now()),

('Legrand XL3 400 Armoire modulaire 4 rangées 96 modules',
 3650.00, 3290.00, true, N'Armoire de distribution XL3 400, 4 rangées de 24 modules, IP30, porte pleine. Fixation murale.',
 'BZR-107', 'Legrand', 'TABLEAU', 'PIECE', 1, false, true, 1, now()),

('Philips Hue White & Color Ambiance E27',
 95.00, NULL, true, N'Ampoule connectée Bluetooth/Zigbee, 16 millions de couleurs, compatible Hue Bridge, Alexa, Google Home.',
 'BZR-108', 'Philips', 'ECLAIRAGE', 'PIECE', 1, false, true, 1, now()),

('Philips CoreLine Réglette LED 1500mm 48W',
 145.00, NULL, true, N'Réglette LED industrielle 1500mm, 48W, 5000lm, IP20, blanc neutre 4000K.',
 'BZR-109', 'Philips', 'ECLAIRAGE', 'PIECE', 1, false, true, 1, now()),

('Fronius Symo 10.0-3-M Onduleur triphasé 10kW',
 6800.00, NULL, true, N'Onduleur photovoltaïque triphasé 10kW, double MPPT, communication Wi-Fi/Ethernet intégrée. Garantie 5 ans.',
 'BZR-110', 'Fronius', 'SOLAIRE', 'PIECE', 1, false, true, 1, now()),

('SolarEdge SE5000H Onduleur HD-Wave 5kW',
 5200.00, 4790.00, true, N'Onduleur monophasé 5kW avec technologie HD-Wave, compatible optimiseurs de puissance, monitoring cloud.',
 'BZR-111', 'SolarEdge', 'SOLAIRE', 'PIECE', 1, false, true, 1, now()),

('Netatmo Prise Connectée NLP Wi-Fi 16A',
 165.00, NULL, true, N'Prise connectée avec mesure de consommation, pilotage à distance via app, compatible Alexa et Google Home.',
 'BZR-112', 'Netatmo', 'DOMOTIQUE', 'PIECE', 1, false, true, 1, now()),

('Bosch GBH 2-26 DFR Perforateur SDS-plus 830W',
 3200.00, NULL, true, N'Perforateur burineur 830W, mandrin SDS-plus, 3 fonctions, coffret de transport inclus.',
 'BZR-113', 'Bosch', 'OUTILLAGE', 'PIECE', 1, false, true, 1, now()),

('Milwaukee M18 FPD3 Perceuse-percussion sans fil 18V',
 4850.00, 4390.00, true, N'Perceuse-percussion brushless 18V, couple 135Nm, mandrin 13mm, livrée sans batterie (nu).',
 'BZR-114', 'Milwaukee', 'OUTILLAGE', 'PIECE', 1, false, true, 1, now()),

('Ajax MotionCam Détecteur de mouvement avec caméra intégrée',
 2450.00, NULL, true, N'Détecteur PIR sans fil avec caméra photo intégrée pour vérification visuelle, portée 12m, autonomie 5 ans.',
 'BZR-115', 'Ajax', 'SECURITE', 'PIECE', 1, false, true, 1, now());

-- ---- Link new products to their category via product_category_link ----
INSERT INTO product_category_link (product_id, category_id)
SELECT p.id, c.id
FROM products p
JOIN product_categories c ON c.slug = p.categorie
WHERE p.reference LIKE 'BZR-1%'
  AND NOT EXISTS (
    SELECT 1 FROM product_category_link l WHERE l.product_id = p.id AND l.category_id = c.id
  );

COMMIT;
