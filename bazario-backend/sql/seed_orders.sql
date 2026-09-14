-- =============================================================
-- Bazario — sample commandes (orders) seed
-- Creates realistic orders referencing real catalogue products,
-- spread across the full order lifecycle / status set.
-- Run AFTER seed_reset.sql.
-- =============================================================

BEGIN;

-- Order 1 — delivered, full lifecycle
WITH o AS (
  INSERT INTO commands (nom, prenom, adresse, telephone, email, type, status, created_at, updated_at, treated_by_id)
  VALUES ('Cherif','Amina','12 Rue Larbi Ben M''hidi, Alger','0661234567','amina.cherif@gmail.com','COMMANDE','LIVREE',
          now() - interval '18 days', now() - interval '10 days', 2)
  RETURNING id
),
i AS (
  INSERT INTO command_items (command_id, product_id, libelle_snapshot, prix_snapshot, quantite)
  SELECT o.id, v.product_id, v.libelle, v.prix, v.qty FROM o,
  (VALUES (13::bigint,'Câble U-1000 RO2V 3G6mm² (au mètre)'::text,52.00::numeric,50),
          (514::bigint,'Legrand Céliane Prise 2P+T avec obturateurs',38.00,10)) AS v(product_id,libelle,prix,qty)
  RETURNING 1
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, s.status, s.changed_at, s.changed_by FROM o,
(VALUES ('EN_ATTENTE'::text, now() - interval '18 days', NULL::text),
        ('CONFIRMEE', now() - interval '17 days', 'Karim Benali'),
        ('EN_PREPARATION', now() - interval '15 days', 'Karim Benali'),
        ('EXPEDIEE', now() - interval '13 days', 'Karim Benali'),
        ('LIVREE', now() - interval '10 days', 'Karim Benali')) AS s(status,changed_at,changed_by);

-- Order 2 — en route
WITH o AS (
  INSERT INTO commands (nom, prenom, adresse, telephone, email, type, status, created_at, updated_at, treated_by_id)
  VALUES ('Boumediene','Yacine','Zone Industrielle Es Sénia, Oran','0771122334','y.boumediene@outlook.com','COMMANDE','EN_ROUTE',
          now() - interval '9 days', now() - interval '1 days', 2)
  RETURNING id
),
i AS (
  INSERT INTO command_items (command_id, product_id, libelle_snapshot, prix_snapshot, quantite)
  SELECT o.id, v.product_id, v.libelle, v.prix, v.qty FROM o,
  (VALUES (516::bigint,'Legrand XL3 400 Armoire modulaire 4 rangées 96 modules'::text,3290.00::numeric,1),
          (7::bigint,'Legrand DX3 20A 2P courbe C 4.5kA',175.00,5)) AS v(product_id,libelle,prix,qty)
  RETURNING 1
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, s.status, s.changed_at, s.changed_by FROM o,
(VALUES ('EN_ATTENTE'::text, now() - interval '9 days', NULL::text),
        ('CONFIRMEE', now() - interval '8 days', 'Karim Benali'),
        ('EXPEDIEE', now() - interval '3 days', 'Karim Benali'),
        ('EN_ROUTE', now() - interval '1 days', 'Karim Benali')) AS s(status,changed_at,changed_by);

-- Order 3 — brand new, still pending
WITH o AS (
  INSERT INTO commands (nom, prenom, adresse, telephone, email, type, status, created_at, updated_at)
  VALUES ('Haddad','Nadia','8 Rue des Frères Bouadou, Constantine','0555443322','nadia.haddad@gmail.com','COMMANDE','EN_ATTENTE',
          now() - interval '2 hours', now() - interval '2 hours')
  RETURNING id
),
i AS (
  INSERT INTO command_items (command_id, product_id, libelle_snapshot, prix_snapshot, quantite)
  SELECT o.id, v.product_id, v.libelle, v.prix, v.qty FROM o,
  (VALUES (517::bigint,'Philips Hue White & Color Ambiance E27'::text,95.00::numeric,6)) AS v(product_id,libelle,prix,qty)
  RETURNING 1
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, 'EN_ATTENTE', now() - interval '2 hours', NULL FROM o;

-- Order 4 — cancelled
WITH o AS (
  INSERT INTO commands (nom, prenom, adresse, telephone, email, type, status, created_at, updated_at, treated_by_id)
  VALUES ('Meziane','Sofiane','Cité 500 Logements, Annaba','0662345678','s.meziane@yahoo.fr','COMMANDE','ANNULEE',
          now() - interval '6 days', now() - interval '5 days', 1)
  RETURNING id
),
i AS (
  INSERT INTO command_items (command_id, product_id, libelle_snapshot, prix_snapshot, quantite)
  SELECT o.id, v.product_id, v.libelle, v.prix, v.qty FROM o,
  (VALUES (523::bigint,'Milwaukee M18 FPD3 Perceuse-percussion sans fil 18V'::text,4390.00::numeric,1)) AS v(product_id,libelle,prix,qty)
  RETURNING 1
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, s.status, s.changed_at, s.changed_by FROM o,
(VALUES ('EN_ATTENTE'::text, now() - interval '6 days', NULL::text),
        ('ANNULEE', now() - interval '5 days', 'Administrateur')) AS s(status,changed_at,changed_by);

-- Order 5 — confirmed, awaiting preparation
WITH o AS (
  INSERT INTO commands (nom, prenom, adresse, telephone, email, type, status, created_at, updated_at, treated_by_id)
  VALUES ('Bensalah','Lamia','Route de Boufarik, Blida','0673456789','lamia.bensalah@gmail.com','COMMANDE','CONFIRMEE',
          now() - interval '3 days', now() - interval '2 days', 2)
  RETURNING id
),
i AS (
  INSERT INTO command_items (command_id, product_id, libelle_snapshot, prix_snapshot, quantite)
  SELECT o.id, v.product_id, v.libelle, v.prix, v.qty FROM o,
  (VALUES (522::bigint,'Bosch GBH 2-26 DFR Perforateur SDS-plus 830W'::text,3200.00::numeric,2),
          (67::bigint,'Coffret 7 tournevis isolés VDE 1000V Wera',385.00,2)) AS v(product_id,libelle,prix,qty)
  RETURNING 1
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, s.status, s.changed_at, s.changed_by FROM o,
(VALUES ('EN_ATTENTE'::text, now() - interval '3 days', NULL::text),
        ('CONFIRMEE', now() - interval '2 days', 'Karim Benali')) AS s(status,changed_at,changed_by);

-- Order 6 — validated (accepted, entering delivery tracking)
WITH o AS (
  INSERT INTO commands (nom, prenom, adresse, telephone, email, type, status, created_at, updated_at, treated_by_id)
  VALUES ('Kaci','Riad','Zone Industrielle El Eulma, Sétif','0554567890','riad.kaci@proton.me','COMMANDE','VALIDEE',
          now() - interval '4 days', now() - interval '3 days', 1)
  RETURNING id
),
i AS (
  INSERT INTO command_items (command_id, product_id, libelle_snapshot, prix_snapshot, quantite)
  SELECT o.id, v.product_id, v.libelle, v.prix, v.qty FROM o,
  (VALUES (519::bigint,'Fronius Symo 10.0-3-M Onduleur triphasé 10kW'::text,6800.00::numeric,1),
          (53::bigint,'Panneau solaire JA Solar 400Wc monocristallin',1650.00,10)) AS v(product_id,libelle,prix,qty)
  RETURNING 1
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, s.status, s.changed_at, s.changed_by FROM o,
(VALUES ('EN_ATTENTE'::text, now() - interval '4 days', NULL::text),
        ('VALIDEE', now() - interval '3 days', 'Administrateur')) AS s(status,changed_at,changed_by);

-- Order 7 — delivered, security equipment order
WITH o AS (
  INSERT INTO commands (nom, prenom, adresse, telephone, email, type, status, created_at, updated_at, treated_by_id)
  VALUES ('Amrani','Fatima Zohra','Boulevard Emir Abdelkader, Tlemcen','0785678901','fz.amrani@gmail.com','COMMANDE','LIVREE',
          now() - interval '25 days', now() - interval '20 days', 2)
  RETURNING id
),
i AS (
  INSERT INTO command_items (command_id, product_id, libelle_snapshot, prix_snapshot, quantite)
  SELECT o.id, v.product_id, v.libelle, v.prix, v.qty FROM o,
  (VALUES (524::bigint,'Ajax MotionCam Détecteur de mouvement avec caméra intégrée'::text,2450.00::numeric,3),
          (71::bigint,'Caméra dôme IP Hikvision 4MP PoE IR 40m',1250.00,2)) AS v(product_id,libelle,prix,qty)
  RETURNING 1
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, s.status, s.changed_at, s.changed_by FROM o,
(VALUES ('EN_ATTENTE'::text, now() - interval '25 days', NULL::text),
        ('CONFIRMEE', now() - interval '24 days', 'Karim Benali'),
        ('EXPEDIEE', now() - interval '22 days', 'Karim Benali'),
        ('LIVREE', now() - interval '20 days', 'Karim Benali')) AS s(status,changed_at,changed_by);

-- Order 8 — returned after delivery
WITH o AS (
  INSERT INTO commands (nom, prenom, adresse, telephone, email, type, status, created_at, updated_at, treated_by_id)
  VALUES ('Belkacem','Mourad','Rue Ahmed Ouyahia, Béjaïa','0669876543','m.belkacem@gmail.com','COMMANDE','RETOURNEE',
          now() - interval '30 days', now() - interval '19 days', 1)
  RETURNING id
),
i AS (
  INSERT INTO command_items (command_id, product_id, libelle_snapshot, prix_snapshot, quantite)
  SELECT o.id, v.product_id, v.libelle, v.prix, v.qty FROM o,
  (VALUES (521::bigint,'Netatmo Prise Connectée NLP Wi-Fi 16A'::text,165.00::numeric,4)) AS v(product_id,libelle,prix,qty)
  RETURNING 1
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, s.status, s.changed_at, s.changed_by FROM o,
(VALUES ('EN_ATTENTE'::text, now() - interval '30 days', NULL::text),
        ('CONFIRMEE', now() - interval '29 days', 'Administrateur'),
        ('EXPEDIEE', now() - interval '26 days', 'Administrateur'),
        ('LIVREE', now() - interval '23 days', 'Administrateur'),
        ('RETOURNEE', now() - interval '19 days', 'Administrateur')) AS s(status,changed_at,changed_by);

-- Order 9 — demande d'information (no items)
WITH o AS (
  INSERT INTO commands (nom, prenom, telephone, email, type, status, created_at, updated_at)
  VALUES ('Aggoun','Samira','0661112233','samira.aggoun@gmail.com','DEMANDE_INFO','EN_ATTENTE',
          now() - interval '1 days', now() - interval '1 days')
  RETURNING id
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, 'EN_ATTENTE', now() - interval '1 days', NULL FROM o;

-- Order 10 — demande d'information (no items)
WITH o AS (
  INSERT INTO commands (nom, prenom, telephone, email, type, status, created_at, updated_at)
  VALUES ('Ferhat','Hocine','0552223344','hocine.ferhat@outlook.com','DEMANDE_INFO','EN_ATTENTE',
          now() - interval '5 hours', now() - interval '5 hours')
  RETURNING id
)
INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
SELECT o.id, 'EN_ATTENTE', now() - interval '5 hours', NULL FROM o;

COMMIT;
