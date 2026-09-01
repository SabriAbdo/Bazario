-- =============================================================
-- Marketo DB Schema — SQL Server 2022
-- Run once against BazarioDB database
-- =============================================================

USE BazarioDB;
GO

-- Users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
  id           BIGINT IDENTITY PRIMARY KEY,
  email        NVARCHAR(255) NOT NULL UNIQUE,
  password     NVARCHAR(255) NOT NULL,
  full_name    NVARCHAR(255) NOT NULL,
  role         NVARCHAR(20)  NOT NULL DEFAULT 'BUYER',
  avatar_url   NVARCHAR(500),
  is_active    BIT NOT NULL DEFAULT 1,
  created_at   DATETIME2 DEFAULT GETDATE(),
  updated_at   DATETIME2 DEFAULT GETDATE()
);
GO

-- Refresh tokens
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='refresh_tokens' AND xtype='U')
CREATE TABLE refresh_tokens (
  id           BIGINT IDENTITY PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token        NVARCHAR(500) NOT NULL UNIQUE,
  expires_at   DATETIME2 NOT NULL,
  revoked      BIT NOT NULL DEFAULT 0
);
GO

-- Categories
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categories' AND xtype='U')
CREATE TABLE categories (
  id            BIGINT IDENTITY PRIMARY KEY,
  name          NVARCHAR(255) NOT NULL,
  slug          NVARCHAR(255) NOT NULL UNIQUE,
  parent_id     BIGINT REFERENCES categories(id),
  icon_name     NVARCHAR(100),
  display_order INT DEFAULT 0
);
GO

-- Products
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
CREATE TABLE products (
  id           BIGINT IDENTITY PRIMARY KEY,
  seller_id    BIGINT NOT NULL REFERENCES users(id),
  category_id  BIGINT NOT NULL REFERENCES categories(id),
  name         NVARCHAR(255) NOT NULL,
  slug         NVARCHAR(255) NOT NULL UNIQUE,
  description  NVARCHAR(MAX),
  price        DECIMAL(18,2) NOT NULL,
  stock_qty    INT NOT NULL DEFAULT 0,
  image_urls   NVARCHAR(MAX),
  is_active    BIT NOT NULL DEFAULT 1,
  avg_rating   DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at   DATETIME2 DEFAULT GETDATE(),
  updated_at   DATETIME2 DEFAULT GETDATE()
);
GO

-- Orders
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' AND xtype='U')
CREATE TABLE orders (
  id             BIGINT IDENTITY PRIMARY KEY,
  buyer_id       BIGINT NOT NULL REFERENCES users(id),
  status         NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
  total_amount   DECIMAL(18,2) NOT NULL,
  shipping_addr  NVARCHAR(500),
  created_at     DATETIME2 DEFAULT GETDATE(),
  updated_at     DATETIME2 DEFAULT GETDATE()
);
GO

-- Order items
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_items' AND xtype='U')
CREATE TABLE order_items (
  id           BIGINT IDENTITY PRIMARY KEY,
  order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   BIGINT NOT NULL REFERENCES products(id),
  quantity     INT NOT NULL,
  unit_price   DECIMAL(18,2) NOT NULL
);
GO

-- Reviews
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reviews' AND xtype='U')
CREATE TABLE reviews (
  id           BIGINT IDENTITY PRIMARY KEY,
  product_id   BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id     BIGINT NOT NULL REFERENCES users(id),
  rating       TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      NVARCHAR(2000),
  created_at   DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT UQ_review_product_buyer UNIQUE (product_id, buyer_id)
);
GO

-- Wishlist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='wishlist_items' AND xtype='U')
CREATE TABLE wishlist_items (
  id           BIGINT IDENTITY PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id   BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at     DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT UQ_wishlist_user_product UNIQUE (user_id, product_id)
);
GO

-- Cart items
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cart_items' AND xtype='U')
CREATE TABLE cart_items (
  id           BIGINT IDENTITY PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id   BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity     INT NOT NULL DEFAULT 1,
  added_at     DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT UQ_cart_user_product UNIQUE (user_id, product_id)
);
GO

-- App config
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='app_config' AND xtype='U')
CREATE TABLE app_config (
  config_key   NVARCHAR(100) PRIMARY KEY,
  config_value NVARCHAR(2000),
  updated_at   DATETIME2 DEFAULT GETDATE()
);
GO

-- Seed default config
IF NOT EXISTS (SELECT 1 FROM app_config WHERE config_key = 'upload.dir')
  INSERT INTO app_config (config_key, config_value) VALUES ('upload.dir', './uploads');
GO


-- =============================================================
-- BazarioDB -- Seed data
-- Run AFTER first app startup (Hibernate creates tables via ddl-auto=update)
-- =============================================================

-- ---- Seed admin user (password: Admin1234!) ----
-- BCrypt hash of "Admin1234!" with 10 rounds
IF OBJECT_ID('users', 'U') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin@bazario.com')
BEGIN
  INSERT INTO users (username, password, full_name, role, is_active, created_at) VALUES
    ('admin@bazario.com',
     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     N'Administrateur Bazario', 'ADMIN', 1, GETDATE());
END
GO
-- NOTE: The hash above encodes "password" (bcrypt 10 rounds).
-- Change it via the app UI after first login, or generate your own hash.

-- ---- Category seeds (product_categories table) ----
IF OBJECT_ID('product_categories', 'U') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_categories WHERE slug = 'electronique')
BEGIN
  INSERT INTO product_categories (slug, label) VALUES
    ('electronique',     N'Electronique'),
    ('informatique',     N'Informatique'),
    ('telephonie',       N'Telephonie et Accessoires'),
    ('mode-femme',       N'Mode Femme'),
    ('mode-homme',       N'Mode Homme'),
    ('mode-enfant',      N'Mode Enfant'),
    ('chaussures',       N'Chaussures'),
    ('maison-deco',      N'Maison et Decoration'),
    ('electromenager',   N'Electromenager'),
    ('sport-fitness',    N'Sport et Fitness'),
    ('beaute-sante',     N'Beaute et Sante'),
    ('alimentation',     N'Alimentation et Boissons'),
    ('livres-culture',   N'Livres et Culture'),
    ('jouets-jeux',      N'Jouets et Jeux'),
    ('auto-moto',        N'Auto et Moto'),
    ('jardin',           N'Jardin et Plein Air'),
    ('animalerie',       N'Animalerie'),
    ('bricolage',        N'Bricolage'),
    ('voyage-bagages',   N'Voyage et Bagages'),
    ('bureau-papeterie', N'Bureau et Papeterie');
END
GO

-- ---- Mock product seeds (products table) ----
IF OBJECT_ID('products', 'U') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM products WHERE reference = 'SEED-001')
BEGIN
  INSERT INTO products (libelle, prix, prix_promo, prix_actif, description, reference, marque, categorie, unite, quantite_min, is_deleted, created_by_id, created_at) VALUES
  -- Electronique
  (N'Smart TV 55" 4K UHD',          1299.00, 999.00,  1, N'Televiseur LED 4K Ultra HD 55 pouces, HDR10+, Wi-Fi integre, 3x HDMI',               'SEED-001', N'Samsung',    'electronique',     'PIECE', 1, 0, NULL, GETDATE()),
  (N'Casque Audio Sans Fil Pro',     249.00,  NULL,    1, N'Casque Bluetooth 5.0, reduction de bruit active, autonomie 30h, coussinets memoire', 'SEED-002', N'Sony',       'electronique',     'PIECE', 1, 0, NULL, GETDATE()),
  -- Informatique
  (N'Ordinateur Portable 15.6"',     899.00,  749.00,  1, N'Processeur Intel Core i5, 16 Go RAM, SSD 512 Go, ecran Full HD, Windows 11',         'SEED-003', N'HP',         'informatique',     'PIECE', 1, 0, NULL, GETDATE()),
  (N'Souris Gaming RGB',             59.00,   NULL,    1, N'Souris optique 12 000 DPI, eclairage RGB personnalisable, 7 boutons programmables',   'SEED-004', N'Logitech',   'informatique',     'PIECE', 1, 0, NULL, GETDATE()),
  -- Telephonie
  (N'Smartphone 128 Go 5G',          699.00,  599.00,  1, N'Ecran AMOLED 6.5", triple capteur 108 MP, batterie 5000 mAh, charge rapide 65W',     'SEED-005', N'Xiaomi',     'telephonie',       'PIECE', 1, 0, NULL, GETDATE()),
  (N'Coque Protection iPhone 15',    19.90,   NULL,    1, N'Coque rigide transparente anti-choc, compatible recharge sans fil, bords surelevees', 'SEED-006', N'OtterBox',   'telephonie',       'PIECE', 1, 0, NULL, GETDATE()),
  -- Mode Femme
  (N'Robe Florale Ete',              49.90,   34.90,   1, N'Robe legere en viscose, motif floral, col V, longueur midi, disponible S-XL',         'SEED-007', N'Zara',       'mode-femme',       'PIECE', 1, 0, NULL, GETDATE()),
  (N'Sac a Main Cuir Vegane',        89.00,   NULL,    1, N'Sac cabas en simili cuir de qualite, anses doubles, fermeture magnetique, 3 poches',  'SEED-008', N'Mango',      'mode-femme',       'PIECE', 1, 0, NULL, GETDATE()),
  -- Mode Homme
  (N'Chemise Oxford Slim Fit',       45.00,   NULL,    1, N'Chemise en coton oxford 100%, coupe slim, manches longues, coloris blanc et bleu',    'SEED-009', N'Hugo Boss',  'mode-homme',       'PIECE', 1, 0, NULL, GETDATE()),
  (N'Jean Slim Stretch',             59.90,   44.90,   1, N'Jean coupe slim en denim stretch, 5 poches, fermeture a glissiere, tailles 28-38',    'SEED-010', N'Levi''s',    'mode-homme',       'PIECE', 1, 0, NULL, GETDATE()),
  -- Mode Enfant
  (N'Pyjama Enfant Licorne 4-6 ans', 24.90,   NULL,    1, N'Ensemble pyjama 2 pieces en coton doux, motif licorne, fermeture pressions, 4-6 ans', 'SEED-011', N'Petit Bateau','mode-enfant',     'PIECE', 1, 0, NULL, GETDATE()),
  (N'T-Shirt Dinosaure 3-8 ans',     14.90,   9.90,    1, N'T-shirt en coton bio, imprime dinosaure, lavable a 40 degres, disponible 3 a 8 ans', 'SEED-012', N'Sergent Major','mode-enfant',    'PIECE', 1, 0, NULL, GETDATE()),
  -- Chaussures
  (N'Basket Running Femme',          99.00,   79.00,   1, N'Chaussure de running legere, semelle amortissante EVA, mesh respirant, tailles 36-42','SEED-013', N'Nike',       'chaussures',       'PIECE', 1, 0, NULL, GETDATE()),
  (N'Derby Cuir Homme',              129.00,  NULL,    1, N'Chaussure de ville en cuir pleine fleur, semelle cuir, finition Goodyear, tailles 40-46','SEED-014', N'Clarks',   'chaussures',       'PIECE', 1, 0, NULL, GETDATE()),
  -- Maison et Decoration
  (N'Lampe de Bureau LED Tactile',   45.00,   35.00,   1, N'Lampe LED avec variateur tactile, 3 temperatures de couleur, port USB integre, bras flexible','SEED-015', N'Philips','maison-deco',  'PIECE', 1, 0, NULL, GETDATE()),
  (N'Coussin Velours 45x45 cm',      22.90,   NULL,    1, N'Coussin decoratif en velours doux, garnissage microfibre, fermeture invisible, 6 coloris','SEED-016', N'La Redoute','maison-deco',   'PIECE', 1, 0, NULL, GETDATE()),
  -- Electromenager
  (N'Robot Cuiseur Multifonction',   299.00,  249.00,  1, N'Robot 1200W, 12 programmes, bol inox 4L, cuit vapeur, hache, petrit, balance integree','SEED-017', N'Moulinex',  'electromenager',   'PIECE', 1, 0, NULL, GETDATE()),
  (N'Aspirateur Robot Wi-Fi',        349.00,  NULL,    1, N'Aspirateur robot connecte, cartographie laser, compatible Alexa et Google Home, bac 0.5L','SEED-018', N'Rowenta',  'electromenager',   'PIECE', 1, 0, NULL, GETDATE()),
  -- Sport et Fitness
  (N'Tapis de Yoga Antiderapant',    29.90,   NULL,    1, N'Tapis de yoga 183x61 cm, epaisseur 6mm, surface antiderapante, sangle de transport incluse','SEED-019', N'Domyos',  'sport-fitness',    'PIECE', 1, 0, NULL, GETDATE()),
  (N'Halteres Reglables 20 kg',      89.00,   69.00,   1, N'Paire d''halteres en fonte avec disques interchangeables, de 2 a 20 kg par haltere',  'SEED-020', N'Decathlon', 'sport-fitness',    'PIECE', 1, 0, NULL, GETDATE()),
  -- Beaute et Sante
  (N'Serum Vitamin C 30ml',          34.90,   NULL,    1, N'Serum eclat a la vitamine C 15%, anti-taches, anti-age, convient a tous types de peau','SEED-021', N'L''Oreal',  'beaute-sante',     'PIECE', 1, 0, NULL, GETDATE()),
  (N'Brosse a Dents Electrique',     49.00,   39.00,   1, N'Brosse a dents sonique 38 000 vibrations/min, 5 modes, minuterie 2 min, tete interchangeable','SEED-022', N'Oral-B', 'beaute-sante',   'PIECE', 1, 0, NULL, GETDATE()),
  -- Alimentation
  (N'Cafe Bio Arabica 1 kg',         18.90,   NULL,    1, N'Cafe 100% arabica issu de l''agriculture biologique, torrefaction artisanale, moulu ou grain','SEED-023', N'Nespresso','alimentation',  'KG',    1, 0, NULL, GETDATE()),
  (N'Huile d''Olive Vierge Extra 1L',12.90,   10.90,   1, N'Huile d''olive extra vierge AOC premiere pression a froid, bouteille verre 1 litre',  'SEED-024', N'Puget',     'alimentation',     'PIECE', 1, 0, NULL, GETDATE()),
  -- Livres et Culture
  (N'Roman Bestseller 2024',         21.90,   NULL,    1, N'Roman contemporain laureat du prix Goncourt 2024, 320 pages, broche, edition francaise','SEED-025', N'Gallimard', 'livres-culture',   'PIECE', 1, 0, NULL, GETDATE()),
  (N'Coffret BD Collector 3 Tomes',  39.90,   29.90,   1, N'Coffret collector 3 albums BD en couleur, edition limitee, format 24x32 cm, sous etui','SEED-026', N'Dargaud',   'livres-culture',   'PIECE', 1, 0, NULL, GETDATE()),
  -- Jouets et Jeux
  (N'LEGO Creator 500 pieces',       49.90,   NULL,    1, N'Set LEGO Creator 3-en-1, 500 pieces, a partir de 8 ans, instructions incluses, sans piles','SEED-027', N'LEGO',    'jouets-jeux',      'PIECE', 1, 0, NULL, GETDATE()),
  (N'Jeu de Societe Famille',        29.90,   22.90,   1, N'Jeu de plateau pour 2 a 6 joueurs, a partir de 7 ans, parties de 30 min, bilingue FR/EN','SEED-028', N'Asmodee',  'jouets-jeux',      'PIECE', 1, 0, NULL, GETDATE()),
  -- Auto et Moto
  (N'Dashcam 4K Full Vision',        89.00,   69.00,   1, N'Camera de bord 4K, angle 170 degres, vision nocturne, detection de mouvement, Wi-Fi',  'SEED-029', N'Nextbase',  'auto-moto',        'PIECE', 1, 0, NULL, GETDATE()),
  (N'Kit Nettoyage Voiture Complet', 34.90,   NULL,    1, N'Kit 8 produits nettoyage auto: shampoing, cire, microfibre, nettoyant jante, vitres',  'SEED-030', N'Meguiar''s','auto-moto',        'PIECE', 1, 0, NULL, GETDATE()),
  -- Jardin
  (N'Tondeuse Electrique 1800W',     149.00,  119.00,  1, N'Tondeuse filaire 1800W, largeur de coupe 42 cm, hauteur reglable 6 positions, bac 50L', 'SEED-031', N'Bosch',     'jardin',           'PIECE', 1, 0, NULL, GETDATE()),
  (N'Arrosoir Inox 8 Litres',        24.90,   NULL,    1, N'Arrosoir en inox brossé, contenance 8L, pomme amovible, bec long, poignee ergonomique','SEED-032', N'Gardena',   'jardin',           'PIECE', 1, 0, NULL, GETDATE()),
  -- Animalerie
  (N'Croquettes Premium Chien 4 kg', 32.90,   27.90,   1, N'Croquettes sans cereales, 80% viande, riche en proteines, adapte chien adulte toutes races','SEED-033', N'Royal Canin','animalerie',  'KG',    1, 0, NULL, GETDATE()),
  (N'Arbre a Chat Multi-niveaux',    79.00,   NULL,    1, N'Arbre a chat 150 cm, 3 plateformes, griffoir sisal, hamac, maison, peluche incluse',   'SEED-034', N'Zolux',     'animalerie',       'PIECE', 1, 0, NULL, GETDATE()),
  -- Bricolage
  (N'Perceuse Visseuse 18V sans Fil',89.00,   74.00,   1, N'Perceuse 18V Li-Ion, couple 40 Nm, 2 batteries 2Ah, chargeur rapide, mallette incluse','SEED-035', N'Bosch',     'bricolage',        'PIECE', 1, 0, NULL, GETDATE()),
  (N'Set Tournevis Precision 32 pcs',19.90,   NULL,    1, N'Coffret 32 embouts de precision, poignee ergonomique anti-derapante, magnetique, etui','SEED-036', N'Stanley',   'bricolage',        'PIECE', 1, 0, NULL, GETDATE()),
  -- Voyage et Bagages
  (N'Valise Cabine Rigide 55 cm',    89.00,   69.00,   1, N'Valise cabine 55x35x20 cm, coque ABS ultralegere, 4 roues 360, serrure TSA, extensible','SEED-037', N'Delsey',   'voyage-bagages',   'PIECE', 1, 0, NULL, GETDATE()),
  (N'Sac a Dos Voyage 40L',          59.00,   NULL,    1, N'Sac a dos 40 litres, compartiment ordinateur 15.6", sangles rembourrées, imperméable',  'SEED-038', N'Eastpak',   'voyage-bagages',   'PIECE', 1, 0, NULL, GETDATE()),
  -- Bureau et Papeterie
  (N'Chaise de Bureau Ergonomique',  199.00,  159.00,  1, N'Chaise ergonomique reglable, accoudoirs 4D, appuie-tete, lombaire, roulettes silencieuses','SEED-039', N'Ikea',   'bureau-papeterie', 'PIECE', 1, 0, NULL, GETDATE()),
  (N'Stylos Gel Premium Pack 12',    12.90,   NULL,    1, N'Lot 12 stylos gel 0.5mm, encre noire et coloree, rechargeable, pointe fine, grip caoutchouc','SEED-040', N'Pilot', 'bureau-papeterie', 'PIECE', 1, 0, NULL, GETDATE());
END
GO