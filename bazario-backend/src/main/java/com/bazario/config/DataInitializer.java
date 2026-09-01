package com.bazario.config;

import com.bazario.entity.Category;
import com.bazario.entity.Product;
import com.bazario.entity.User;
import com.bazario.repository.CategorieRepository;
import com.bazario.repository.ProductRepository;
import com.bazario.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CategorieRepository categorieRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        // ── Categories ─────────────────────────────────────────────────────────
        seedCategory("DISJONCTEUR", "Disjoncteurs",          "ElectricalServices");
        seedCategory("CABLE",       "Câbles & Fils",          "Cable");
        seedCategory("PRISE",       "Prises & Interrupteurs", "Power");
        seedCategory("TABLEAU",     "Tableaux & Coffrets",    "Dashboard");
        seedCategory("ECLAIRAGE",   "Éclairage",               "Lightbulb");
        seedCategory("TRANSFO",     "Transformateurs",        "ElectricMeter");
        seedCategory("MOTEUR",      "Moteurs & Variateurs",   "SettingsInputComponent");
        seedCategory("SOLAIRE",     "Énergie Solaire",         "WbSunny");
        seedCategory("DOMOTIQUE",   "Domotique & Smart Home", "Router");
        seedCategory("OUTILLAGE",   "Outillage Électrique",    "Handyman");
        seedCategory("SECURITE",    "Sécurité & Alarme",       "Shield");
        seedCategory("AUTRE",       "Autre",                   "Category");

        // --- Users ---
        User admin;
        if (!userRepository.existsByUsername("admin")) {
            admin = userRepository.save(User.builder()
                    .username("admin").password(passwordEncoder.encode("Admin@123"))
                    .fullName("Administrateur").role(User.Role.ADMIN).active(true).build());
            System.out.println("[DataInitializer] Admin created — admin / Admin@123");
        } else {
            admin = userRepository.findByUsername("admin").orElseThrow();
        }

        if (!userRepository.existsByUsername("operateur1")) {
            userRepository.save(User.builder()
                    .username("operateur1").password(passwordEncoder.encode("Oper@123"))
                    .fullName("Karim Benali").role(User.Role.OPERATEUR).active(true).build());
        }
        if (!userRepository.existsByUsername("stock1")) {
            userRepository.save(User.builder()
                    .username("stock1").password(passwordEncoder.encode("Stock@123"))
                    .fullName("Sara Mansouri").role(User.Role.STOCK_OPERATEUR).active(true).build());
        }

        // --- Electrical products ---
        if (productRepository.count() > 0) return;

        List<Product> products = List.of(
            // ── Disjoncteurs ──────────────────────────────────────────────────────
            p("Schneider iC60N 10A 1P+N courbe C",
              "Disjoncteur modulaire Acti 9 unipolaire+neutre, 10A courbe C, 6kA. Réf. A9F74110. Protection circuits terminaux éclairage.",
              142.0, "DISJONCTEUR", "Schneider", admin),
            p("Schneider iC60N 16A 2P courbe C",
              "Disjoncteur bipolaire Acti 9, 16A courbe C, 6kA. Réf. A9F74216. Usage domestique et tertiaire, prises 16A.",
              188.0, "DISJONCTEUR", "Schneider", admin),
            p("Schneider iC60H 32A 2P courbe C",
              "Disjoncteur bipolaire haute capacité Acti 9, 32A 10kA. Réf. A9F85232. Protection circuits de puissance.",
              310.0, "DISJONCTEUR", "Schneider", admin),
            p("Schneider iC60N 63A 3P courbe C",
              "Disjoncteur tripolaire Acti 9, 63A 6kA courbe C. Réf. A9F74363. Tableau général BT industriel.",
              545.0, "DISJONCTEUR", "Schneider", admin),
            p("Hager MBN516 16A 1P+N 6kA",
              "Disjoncteur automatique unipolaire+neutre 16A 6kA courbe B. Conforme NF EN 60898-1. Rail DIN.",
              165.0, "DISJONCTEUR", "Hager", admin),
            p("Schneider iDPN N Vigi 16A 30mA AC",
              "Disjoncteur différentiel 16A type AC 30mA, 1P+N. Réf. A9D31616. Protection personnes et circuits.",
              285.0, "DISJONCTEUR", "Schneider", admin),
            p("Legrand DX3 20A 2P courbe C 4.5kA",
              "Disjoncteur bipolaire DX3, 20A courbe C, 4.5kA. Rail DIN 35mm. Bornes à cage. Conforme NF EN 60898-1.",
              175.0, "DISJONCTEUR", "Legrand", admin),
            p("ABB S201 25A courbe C 6kA",
              "Disjoncteur unipolaire ABB System Pro M compact, 25A courbe C, 6kA, 1 module DIN.",
              198.0, "DISJONCTEUR", "ABB", admin),
            p("Schneider iC60N 40A 3P courbe D",
              "Disjoncteur tripolaire Acti 9, 40A courbe D, 6kA. Réf. A9F75340. Idéal pour charges inductives et moteurs.",
              485.0, "DISJONCTEUR", "Schneider", admin),

            // ── Câbles & Fils ─────────────────────────────────────────────────────
            p("Câble Nexans H07V-R 1.5mm² rouge 100m",
              "Câble rigide unipolaire cuivre 1.5mm², gaine PVC rouge, bobine 100m. Circuits éclairage 230V. NF C 32-201.",
              375.0, "CABLE", "Nexans", admin),
            p("Câble Nexans H07V-R 2.5mm² bleu 100m",
              "Câble rigide unipolaire cuivre 2.5mm², gaine PVC bleue, bobine 100m. Prises de courant 16A.",
              595.0, "CABLE", "Nexans", admin),
            p("Câble Prysmian XVB-F2 3G2.5mm² 50m",
              "Câble souple 3 conducteurs 2.5mm², isolant XLPE, gaine PVC noire, 50m. Pose en conduit ou apparent.",
              790.0, "CABLE", "Prysmian", admin),
            p("Câble U-1000 RO2V 3G6mm² (au mètre)",
              "Câble armé basse tension 3×6mm², isolation PVC noire. Pose enterrée et en apparent. Prix au mètre.",
              52.0, "CABLE", "Nexans", admin),
            p("Câble souple H07RN-F 3G1.5mm² 50m",
              "Câble souple industriel 3×1.5mm², gaine caoutchouc EPDM résistant aux huiles. Usage extérieur, chantier. Bobine 50m.",
              520.0, "CABLE", "Nexans", admin),
            p("Câble solaire PV1-F 4mm² rouge 100m",
              "Câble PV unipolaire 4mm² rouge, isolation résistante UV, -40°C/+90°C, 1500V DC. Certifié TÜV. Bobine 100m.",
              680.0, "CABLE", "Prysmian", admin),
            p("Câble armé U1000 RVFV 4G4mm² 25m",
              "Câble blindé BT 4×4mm², armure acier galvanisé, gaine PVC noire. Pose enterrée ou en galerie. Bobine 25m.",
              1480.0, "CABLE", "Nexans", admin),
            p("Câble réseau Cat6 SFTP LSZH 305m bobine",
              "Câble Ethernet Cat6 blindé 4 paires torsadées, gaine LSZH, 305m. Débit 1Gbps.",
              1850.0, "CABLE", "Nexans", admin),

            // ── Prises & Interrupteurs ────────────────────────────────────────────
            p("Schneider Domae Prise 2P+T 16A Blanc",
              "Prise de courant encastrable Domae 16A 250V, bornes automatiques, finition blanc pur.",
              52.0, "PRISE", "Schneider", admin),
            p("Schneider Domae Interrupteur Va-et-vient 10A",
              "Interrupteur va-et-vient 10A 250V, montage encastré, bornes automatiques, blanc.",
              42.0, "PRISE", "Schneider", admin),
            p("Legrand Niloe Prise USB Type-A+C 30W",
              "Double prise USB chargeur intégré Type-A + Type-C 30W, blanc. Compatible smartphones et tablettes.",
              128.0, "PRISE", "Legrand", admin),
            p("Schneider Odace Prise étanche IP44 16A",
              "Prise de courant extérieure IP44 avec couvercle à clapet, 16A 250V, blanc.",
              98.0, "PRISE", "Schneider", admin),
            p("Legrand Mosaic Prise 2P+T 45° 16A",
              "Prise de courant 45° 16A, 2 modules Mosaic. Compatible habillages Céliane et Niloe. Blanc.",
              68.0, "PRISE", "Legrand", admin),
            p("Prise industrielle Gewiss 32A 3P+N+T IP67",
              "Prise mobile mâle 32A 400V 3P+N+T, 9h, IP67, CEE EN 60309-2. Usage chantier, atelier.",
              245.0, "PRISE", "Gewiss", admin),
            p("Multiprise 5 prises + 2 USB parafoudre 1.8m",
              "Bloc multiprise 5×2P+T 16A + 2 USB-A 2.4A, parafoudre 700J, câble 1.8m. Interrupteur lumineux.",
              155.0, "PRISE", "Brennenstuhl", admin),
            p("Variateur de lumière mural Schneider Odace 400W",
              "Variateur rotatif encastrable 400W LED/halogène, compatible ampoules LED dimmables.",
              145.0, "PRISE", "Schneider", admin),

            // ── Tableaux & Coffrets ───────────────────────────────────────────────
            p("Schneider Rési9 Tableau 2R 24 modules",
              "Coffret électrique encastrable 2 rangées 24 modules DIN. Réf. R9H24200. Porte opaque, IP30 IK07.",
              1290.0, "TABLEAU", "Schneider", admin),
            p("Schneider Pragma Coffret étanche IP65 18M",
              "Coffret industriel IP65 18 modules, polyester, pour milieux humides et poussiéreux.",
              950.0, "TABLEAU", "Schneider", admin),
            p("Hager Volta Coffret en saillie 24M",
              "Coffret apparent 24 modules DIN, matière ABS blanc RAL9003, porte transparente, IP40.",
              620.0, "TABLEAU", "Hager", admin),
            p("Schneider Rési9 Tableau principal 4R 48M",
              "Tableau divisionnaire 48 modules 4 rangées, porte transparente, IP40. Réf. R9H48200.",
              2550.0, "TABLEAU", "Schneider", admin),
            p("Coffret de chantier 63A 4×16A + 1×32A IP44",
              "Coffret distribution chantier 63A triphasé. 4 prises 16A 3P+N+T + 1 prise 32A 3P+N+T. IP44.",
              3200.0, "TABLEAU", "Legrand", admin),
            p("Legrand XL3 S 160 Coffret 48 modules",
              "Coffret distribution XL3 S 160, 3 rangées 16 modules, IP43, porte opaque. Fixation murale.",
              2850.0, "TABLEAU", "Legrand", admin),
            p("Hager GD106A Armoire de comptage 1 rangée 12M",
              "Armoire comptage IP43, 1 rangée 12 modules, porte vitrée, serrure quart de tour.",
              1350.0, "TABLEAU", "Hager", admin),

            // ── Éclairage ─────────────────────────────────────────────────────────
            p("Philips CorePro LED E27 9W 806lm 2700K",
              "Ampoule LED frosted blanc chaud 2700K, culot E27, 806lm, équivalent 60W. Durée de vie 15000h.",
              32.0, "ECLAIRAGE", "Philips", admin),
            p("Schneider SpaceLogic Panneau LED 60×60 40W",
              "Plafonnier LED encastrable 600×600mm, 40W 4000lm, blanc neutre 4000K. Driver DALI inclus.",
              445.0, "ECLAIRAGE", "Schneider", admin),
            p("Spot LED encastrable GU10 7W 4000K orientable",
              "Spot orientable 7W GU10 4000K, angle 38°, blanc neutre, classe énergétique G.",
              88.0, "ECLAIRAGE", "Philips", admin),
            p("Réglette LED étanche IP65 1200mm 36W",
              "Luminaire industriel IP65 T8 1200mm 36W, diffuseur polycarbonate, 3600lm, blanc neutre 4000K.",
              310.0, "ECLAIRAGE", "Philips", admin),
            p("Downlight LED rond 18W 1800lm 3000K",
              "Plafonnier LED encastrable 18W, 1800lm, blanc chaud 3000K, IP20, découpe Ø205mm.",
              165.0, "ECLAIRAGE", "Philips", admin),
            p("Projecteur LED extérieur 100W IP66 10000lm",
              "Projecteur haute puissance 100W, 10000lm, 4000K, IP66 IK08. Usage chantier, entrepôt, façade.",
              850.0, "ECLAIRAGE", "Philips", admin),
            p("Tube LED T8 G13 120cm 18W 4000K",
              "Tube LED 120cm 18W, 1800lm, blanc neutre 4000K. Remplacement TL 36W. Branchement direct.",
              55.0, "ECLAIRAGE", "Philips", admin),
            p("Détecteur de mouvement 360° plafond 1200W",
              "Capteur infrarouge passif plafond 360°, portée 6m, temporisation 5s–10min, charge 1200W.",
              220.0, "ECLAIRAGE", "Schneider", admin),
            p("Guirlande LED guinguette E27 10 douilles 10m",
              "Guirlande extérieure 10 douilles E27 IP44, câble noir 10m. Livrée avec 10 ampoules ST64 2W 2200K.",
              195.0, "ECLAIRAGE", "Philips", admin),

            // ── Transformateurs & Alimentations ──────────────────────────────────
            p("Schneider Phaseo ABL6TS10B Transfo 100VA",
              "Transformateur d'isolement séparateur 100VA, 230V/12-24V, classe II TBTS. Réf. ABL6TS10B.",
              480.0, "TRANSFO", "Schneider", admin),
            p("Transformateur monophasé 1kVA 230/400V",
              "Transformateur d'alimentation 1000VA, 230/400V, rendement 97%, boîtier IP20 standard rail DIN.",
              1920.0, "TRANSFO", "Legrand", admin),
            p("APC Back-UPS ES 650VA 400W",
              "Onduleur interactif 650VA / 400W, autonomie ~10min, 4 prises IEC C13, port USB de monitoring.",
              1250.0, "TRANSFO", "APC", admin),
            p("Alimentation rail DIN 24VDC 5A 120W Mean Well",
              "Alimentation à découpage rail DIN 24VDC 5A 120W. Entrée 85-264VAC. Protection surcharge.",
              520.0, "TRANSFO", "Mean Well", admin),
            p("Alimentation rail DIN 12VDC 10A 120W Mean Well",
              "Alimentation slim 12VDC 10A 120W, rail DIN 35mm. Protection surcharge et court-circuit.",
              480.0, "TRANSFO", "Mean Well", admin),

            // ── Moteurs & Variateurs ──────────────────────────────────────────────
            p("Schneider Altivar 12 Variateur 0.75kW 230V",
              "Variateur de vitesse Altivar 12, 0.75kW moteur AC monophasé 230V, IP20, rail DIN. Réf. ATV12H075M2.",
              2180.0, "MOTEUR", "Schneider", admin),
            p("Schneider Altivar 320 7.5kW 400V triphasé",
              "Variateur de vitesse ATV320, 7.5kW, 400V 3P, IP20. Communication Modbus RTU intégrée.",
              4850.0, "MOTEUR", "Schneider", admin),
            p("ABB ACS310 5.5kW 400V IP20",
              "Variateur de fréquence ACS310, 5.5kW, 400V 3P, IP20. Panneau de commande inclus.",
              3650.0, "MOTEUR", "ABB", admin),
            p("Moteur triphasé Leroy Somer LS90L 2.2kW IE3",
              "Moteur asynchrone 2.2kW, 4 pôles, 1450tr/min, B3 patte, IE3, 400V/50Hz, carcasse aluminium.",
              1980.0, "MOTEUR", "Leroy Somer", admin),
            p("Contacteur Schneider LC1D25 25A 230V AC3",
              "Contacteur tripolaire 25A, bobine 230V 50Hz, 1NO+1NC auxiliaires. Réf. LC1D25P7.",
              380.0, "MOTEUR", "Schneider", admin),
            p("Démarreur progressif Schneider ATS22D17S6 7.5kW",
              "Démarreur doux 17A 7.5kW 400V, rampe de démarrage 1-30s. Communication Modbus.",
              2680.0, "MOTEUR", "Schneider", admin),

            // ── Énergie Solaire ───────────────────────────────────────────────────
            p("Panneau solaire JA Solar 400Wc monocristallin",
              "Module monocristallin PERC 400Wc, rendement 20.7%, certifié IEC 61215/61730. Garantie 25 ans.",
              1650.0, "SOLAIRE", "JA Solar", admin),
            p("Onduleur solaire Huawei SUN2000-3KTL 3kW",
              "Onduleur réseau monophasé 3kW, double MPPT, rendement 97.8%, Wi-Fi intégré. Garantie 5 ans.",
              4200.0, "SOLAIRE", "Huawei", admin),
            p("Onduleur hybride Growatt MIN 5000TL-X 5kW",
              "Onduleur hybride 5kW, gestion batterie LiFePO4, double MPPT 500V, Wi-Fi Shine Monitor.",
              5800.0, "SOLAIRE", "Growatt", admin),
            p("Batterie LiFePO4 Pylontech US5000 100Ah 48V",
              "Batterie lithium 48V 100Ah, BMS intégré, communication CAN/RS485. Garantie 10 ans.",
              12500.0, "SOLAIRE", "Pylontech", admin),
            p("Régulateur MPPT Victron BlueSolar 75/50",
              "Régulateur MPPT 75V/50A pour systèmes 12/24/48V. Algorithme MPPT rapide, Bluetooth intégré.",
              1580.0, "SOLAIRE", "Victron", admin),
            p("Kit câble solaire 6mm² + connecteurs MC4 10m",
              "Deux fois 10m de câble PV1-F 6mm² rouge et noir avec 4 connecteurs MC4 certifiés TÜV. 1500V DC.",
              380.0, "SOLAIRE", "Prysmian", admin),

            // ── Domotique & Smart Home ────────────────────────────────────────────
            p("Module Wi-Fi Shelly Plus 1PM 16A",
              "Interrupteur connecté Wi-Fi 16A avec mesure de puissance. Compatible Google Home, Alexa, HomeKit.",
              195.0, "DOMOTIQUE", "Shelly", admin),
            p("Thermostat connecté Netatmo NTH01 Wi-Fi",
              "Thermostat intelligent Wi-Fi, apprentissage automatique, programmation par app iOS/Android.",
              1480.0, "DOMOTIQUE", "Netatmo", admin),
            p("Moteur tubulaire Somfy LT 50 io 6Nm",
              "Moteur volet roulant 6Nm io-homecontrol, compatible TaHoma Switch, silencieux 35dB.",
              1850.0, "DOMOTIQUE", "Somfy", admin),
            p("Télérupteur Schneider iCT 10A 230V unipolaire",
              "Télérupteur à accrochage électronique 10A 230V, 1 contact NO, 2 modules DIN. Réf. A9C30811.",
              210.0, "DOMOTIQUE", "Schneider", admin),
            p("Minuterie digitale journalière 16A DIN Hager",
              "Minuterie programmable 16A 3680W, 16 programmes par 24h, précision quartz. 2 modules DIN.",
              185.0, "DOMOTIQUE", "Hager", admin),

            // ── Outillage Électrique ──────────────────────────────────────────────
            p("Multimètre True RMS Fluke 87V",
              "Multimètre 6000 points True RMS, CAT III 1000V. Mesure AC/DC, résistance, fréquence, température.",
              4200.0, "OUTILLAGE", "Fluke", admin),
            p("Pince ampèremétrique AC/DC Fluke 376 FC 400A",
              "Pince ampère True RMS 400A AC/DC avec sonde iFlex, Bluetooth. CAT IV 600V.",
              3650.0, "OUTILLAGE", "Fluke", admin),
            p("Perceuse-visseuse sans fil Makita DDF486 18V",
              "Perceuse brushless 18V, couple 80Nm, 2 vitesses, mandrin 13mm. Livrée avec 2 batteries 3Ah et chargeur rapide.",
              2850.0, "OUTILLAGE", "Makita", admin),
            p("Coffret 7 tournevis isolés VDE 1000V Wera",
              "7 tournevis certifiés VDE, testés 10000V. Plats 3×75, 4×100, 5.5×125 et PH0, PH1, PH2, PZ2.",
              385.0, "OUTILLAGE", "Wera", admin),
            p("Testeur de tension sans contact Fluke LVD2",
              "Détecteur tension AC 24-1000V sans contact, signal sonore et LED, torche intégrée. CAT IV 1000V.",
              285.0, "OUTILLAGE", "Fluke", admin),
            p("Testeur de prise Brennenstuhl PM232",
              "Testeur de prise T12 230V: raccordement, inversion phase/neutre, présence de terre. 3 LED couleur.",
              95.0, "OUTILLAGE", "Brennenstuhl", admin),

            // ── Sécurité & Alarme ─────────────────────────────────────────────────
            p("Détecteur de fumée certifié NF Kidde 29HD",
              "Détecteur optique pile 9V, alarme 85dB, LED test mensuel. NF EN 14604. Modèle 29HD-FR.",
              95.0, "SECURITE", "Kidde", admin),
            p("Caméra dôme IP Hikvision 4MP PoE IR 40m",
              "Caméra IP 4MP H.265+, IR 40m, PoE 802.3af, IP67 IK10. Détection mouvement deep learning.",
              1250.0, "SECURITE", "Hikvision", admin),
            p("Centrale alarme Ajax Hub 2 Plus Wi-Fi LTE",
              "Hub alarme IP+Wi-Fi+GSM LTE, 100 appareils, 25 zones. App iOS/Android, backup batterie 16h.",
              3200.0, "SECURITE", "Ajax", admin),
            p("Bouton arrêt urgence Schneider ZB4-BS934",
              "Coup de poing Ø40mm à clé, tête rouge/fond jaune, 2 contacts NF. Conforme EN 60947-5-5 PLe Cat.4.",
              420.0, "SECURITE", "Schneider", admin),
            p("Détecteur CO + fumée Kidde 10SCO 10 ans",
              "Détecteur combiné fumée optique + CO. Pile lithium 10 ans scellée, alarme voix numérique.",
              285.0, "SECURITE", "Kidde", admin)
        );

        productRepository.saveAll(products);
        System.out.println("[DataInitializer] Seeded " + products.size() + " products across 11 categories.");
    }

    private void seedCategory(String slug, String label, String icon) {
        if (!categorieRepository.existsBySlug(slug)) {
            categorieRepository.save(Category.builder().slug(slug).label(label).icon(icon).build());
        }
    }

    private Product p(String libelle, String description, double prix,
                      String categorie, String marque, User createdBy) {
        return Product.builder()
                .libelle(libelle).description(description)
                .prix(BigDecimal.valueOf(prix)).prixActif(true).deleted(false)
                .categorie(categorie).marque(marque)
                .createdBy(createdBy).build();
    }
}
