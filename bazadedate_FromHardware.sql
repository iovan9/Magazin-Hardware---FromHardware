-- 1. Stergem tabelul daca exista
DROP TABLE IF EXISTS produse;

-- 2. Crearea tabelului cu toate caracteristicile cerute
CREATE TABLE produse (
    id INTEGER PRIMARY KEY,
    nume VARCHAR(100) NOT NULL,
    descriere TEXT NOT NULL,
    imagine VARCHAR(255) NOT NULL,
    
    -- Categoria mare (o constrangere CHECK simuleaza ENUM-ul)
    categorie VARCHAR(50) CHECK (categorie IN ('Procesoare', 'Placi_Video', 'Placi_de_Baza', 'Memorie_RAM', 'Surse')),
    
    -- Subcategoria (clasificare secundara)
    subcategorie VARCHAR(50) NOT NULL,
    
    -- Caracteristici numerice
    pret NUMERIC(10, 2) NOT NULL,
    putere_w INTEGER NOT NULL,
    
    -- Caracteristica data calendaristica
    data_adaugare DATE NOT NULL,
    
    -- Caracteristica cu o singura valoare dintr-un set
    culoare VARCHAR(50) NOT NULL,
    
    -- Caracteristica string cu valori multiple separate prin virgula
    porturi VARCHAR(255) NOT NULL,
    
    -- Caracteristica booleana in Postgres
    iluminare_rgb BOOLEAN NOT NULL
);

-- 3. Inserarea celor 15 entitati diversificate
-- PROCESOARE
INSERT INTO produse VALUES (1, 'Procesor AMD Ryzen 7 7800X3D', 'Cel mai bun procesor de gaming la ora actuala.', '/resurse/imagini/produse/ryzen7.jpg', 'Procesoare', 'AM5', 1950, 120, '2024-01-15', 'Argintiu', 'Fara porturi', FALSE);
INSERT INTO produse VALUES (2, 'Procesor Intel Core i9-14900K', 'Performanta suprema pentru productivitate si gaming.', '/resurse/imagini/produse/i9.jpg', 'Procesoare', 'LGA1700', 2900, 253, '2024-02-10', 'Argintiu', 'Fara porturi', FALSE);
INSERT INTO produse VALUES (3, 'Procesor AMD Ryzen 5 7600X', 'Raport calitate-pret imbatabil.', '/resurse/imagini/produse/ryzen5.jpg', 'Procesoare', 'AM5', 1100, 105, '2023-11-20', 'Argintiu', 'Fara porturi', FALSE);

-- PLACI VIDEO
INSERT INTO produse VALUES (4, 'Placa Video NVIDIA RTX 4090', 'Nava amiral NVIDIA, capabila de 4K nativ.', '/resurse/imagini/produse/4090.jpg', 'Placi_Video', 'PCIe 4.0', 9500, 450, '2023-09-05', 'Negru', 'HDMI, DisplayPort', TRUE);
INSERT INTO produse VALUES (5, 'Placa Video AMD Radeon RX 7900 XTX', 'Alternativa excelenta de la AMD cu 24GB VRAM.', '/resurse/imagini/produse/7900xtx.jpg', 'Placi_Video', 'PCIe 4.0', 5200, 355, '2023-10-12', 'Negru', 'HDMI, DisplayPort, USB-C', TRUE);
INSERT INTO produse VALUES (6, 'Placa Video NVIDIA RTX 4070', 'Ideala pentru gaming la rezolutie 1440p.', '/resurse/imagini/produse/4070.jpg', 'Placi_Video', 'PCIe 4.0', 3200, 200, '2024-03-01', 'Alb', 'HDMI, DisplayPort', TRUE);

-- PLACI DE BAZA
INSERT INTO produse VALUES (7, 'Placa de baza ASUS ROG Strix B650-A', 'Placa de baza alba, ideala pentru build-uri clean.', '/resurse/imagini/produse/b650a.jpg', 'Placi_de_Baza', 'AM5', 1300, 40, '2023-08-22', 'Alb', 'USB-C, Ethernet, Audio', TRUE);
INSERT INTO produse VALUES (8, 'Placa de baza MSI MAG Z790 TOMAHAWK', 'Stabilitate si optiuni multiple de conectivitate.', '/resurse/imagini/produse/z790.jpg', 'Placi_de_Baza', 'LGA1700', 1400, 45, '2023-12-05', 'Negru', 'USB-C, Ethernet, Audio, Wi-Fi', FALSE);
INSERT INTO produse VALUES (9, 'Placa de baza Gigabyte B650 AORUS ELITE', 'Design termic avansat pentru procesoare puternice.', '/resurse/imagini/produse/aorus.jpg', 'Placi_de_Baza', 'AM5', 1150, 40, '2024-01-08', 'Negru', 'USB-C, Ethernet, Audio', TRUE);

-- MEMORIE RAM
INSERT INTO produse VALUES (10, 'Memorie Corsair Vengeance RGB 32GB', 'DDR5 rapid cu iluminare personalizabila.', '/resurse/imagini/produse/ram_corsair.jpg', 'Memorie_RAM', 'DDR5', 650, 5, '2024-02-18', 'Alb', 'Fara porturi', TRUE);
INSERT INTO produse VALUES (11, 'Memorie Kingston FURY Beast 32GB', 'Fiabilitate si profil low-profile.', '/resurse/imagini/produse/ram_kingston.jpg', 'Memorie_RAM', 'DDR5', 580, 5, '2023-10-30', 'Negru', 'Fara porturi', FALSE);
INSERT INTO produse VALUES (12, 'Memorie G.Skill Trident Z5 64GB', 'Kit masiv pentru workstation-uri.', '/resurse/imagini/produse/ram_gskill.jpg', 'Memorie_RAM', 'DDR5', 1200, 6, '2024-04-02', 'Argintiu', 'Fara porturi', TRUE);

-- SURSE DE ALIMENTARE
INSERT INTO produse VALUES (13, 'Sursa Seasonic Focus GX-850', 'Certificare 80+ Gold si silentioasa.', '/resurse/imagini/produse/psu_seasonic.jpg', 'Surse', 'ATX', 700, 850, '2023-07-14', 'Negru', 'SATA, PCIe', FALSE);
INSERT INTO produse VALUES (14, 'Sursa Corsair RM1000x', '1000W pentru sisteme entuziast.', '/resurse/imagini/produse/psu_corsair.jpg', 'Surse', 'ATX', 950, 1000, '2023-09-28', 'Negru', 'SATA, PCIe', FALSE);
INSERT INTO produse VALUES (15, 'Sursa ASUS ROG Thor 1000W', 'Sursa cu ecran OLED integrat si iluminare.', '/resurse/imagini/produse/psu_asus.jpg', 'Surse', 'ATX', 1600, 1000, '2024-01-20', 'Negru', 'SATA, PCIe, 12VHPWR', TRUE);

-- 4. Crearea utilizatorului limitat cerut de profesoara
DROP ROLE IF EXISTS user_magazin;
CREATE USER user_magazin WITH PASSWORD 'ParolaMagazin123';
GRANT USAGE ON SCHEMA public TO user_magazin;
GRANT SELECT ON produse TO user_magazin;