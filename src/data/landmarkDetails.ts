export interface LandmarkDetail {
  era: string;
  architectOrOrigin: string;
  styleOrType: string;
  scale: string;
  history: string;
  architecture: string;
}

export const LANDMARK_DETAILS: Record<string, LandmarkDetail> = {
  'Table Mountain': {
    era: 'Ordovician (~500 Ma) · Cableway opened 1929',
    architectOrOrigin: 'Peninsula Formation sandstone over Malmesbury shale & granite',
    styleOrType: 'Flat-topped sandstone massif',
    scale: '1,086 m summit · ~3 km upper plateau',
    history:
      'Known to the Khoi inhabitants as Hoerikwaggo (“Mountain in the Sea”), Table Mountain has guided navigators rounding the Cape since the 15th century. Its upper plateau was protected as a national park in 1998 and forms part of the Cape Floral Region World Heritage Site.',
    architecture:
      'Horizontal beds of quartzitic sandstone sit atop a granite and shale base, giving the mountain its sheer vertical cliffs and famously flat skyline. The aerial cableway spans 1,244 m up the western flank using rotating panoramic cabins.',
  },
  'Union Buildings': {
    era: '1910–1913 · Mandela statue unveiled 2013',
    architectOrOrigin: 'Sir Herbert Baker',
    styleOrType: 'Edwardian Classical sandstone complex',
    scale: '285 m total frontage · Twin domed clock towers',
    history:
      'Commissioned to mark the 1910 Union of South Africa, the Union Buildings serve as the official seat of the South African government. Nelson Mandela was inaugurated here on 10 May 1994 before crowds gathered across the terraced amphitheatre below.',
    architecture:
      'Built from warm Free State sandstone with red tiled roofs, Baker’s symmetrical plan bridges two identical wings with a sweeping semicircular colonnade. An amphitheatre and terraced gardens cascade down Meintjieskop toward central Pretoria.',
  },
  'Moses Mabhida Stadium': {
    era: '2006–2009 · Opened November 2009',
    architectOrOrigin: 'gmp Architekten & Osmond Lange',
    styleOrType: 'Cable-suspended steel arch stadium',
    scale: '106 m high arch · 350 m span · 56,000 seats',
    history:
      'Constructed for the 2010 FIFA World Cup on the site of the former Kings Park Soccer Stadium, the venue hosted seven matches including a semi-final. It is named after Moses Mabhida, a key anti-apartheid and trade-union leader.',
    architecture:
      'A monumental twin-footed steel arch splits into a Y over the northern end, symbolizing unity emerging from division. Tension cables suspend the PTFE-coated fibreglass roof membrane cleanly above a sculpted bowl open to sea breezes.',
  },
  'Nelson Mandela Bridge': {
    era: '2002–2003 · Opened July 2003',
    architectOrOrigin: 'ARQ Consulting Engineers & Dissing+Weitling',
    styleOrType: 'Asymmetric cable-stayed steel and concrete bridge',
    scale: '284 m total length · 42 m north pylon',
    history:
      'Built to physically stitch Newtown and the Johannesburg inner city back together with Braamfontein across 42 active railway lines, the bridge became a signature emblem of Johannesburg’s post-apartheid urban renewal.',
    architecture:
      'Its lightweight composite steel-and-concrete deck hangs from two asymmetric H-shaped steel pylons—42 m and 27 m tall—anchored by fan-arranged stay cables that minimize disruption to the busy rail corridor below.',
  },
  'The Big Hole': {
    era: '1871–1914 · Open-cast & underground diamond mining',
    architectOrOrigin: 'Hand-excavated by ~50,000 prospectors',
    styleOrType: 'Flooded vertical kimberlite volcanic pipe',
    scale: '463 m wide · 215 m visible depth · 17 ha surface',
    history:
      'Following the 1871 discovery of diamonds on Colesberg Kopje, tens of thousands of diggers worked individual claims with picks and shovels until 1914, yielding 2,722 kg of diamonds and launching South Africa’s industrial mining era.',
    architecture:
      'The excavation traces the near-vertical walls of an ancient volcanic kimberlite pipe through surrounding Karoo shales and basalt. An adjacent open-air museum preserves period iron-and-timber headgear and 19th-century Kimberley streetscapes.',
  },
  'Voortrekker Monument': {
    era: '1937–1949 · Inaugurated 16 December 1949',
    architectOrOrigin: 'Gerard Moerdijk',
    styleOrType: 'Monumental Art Deco granite monolith',
    scale: '40 m cube · Surrounded by 64 carved ox-wagon laager wall',
    history:
      'Erected to commemorate the pioneers who left the Cape Colony during the Great Trek of the 1830s–1840s, the hilltop sanctuary now forms part of a broader heritage nature reserve overlooking Pretoria.',
    architecture:
      'Moerdijk combined stepped Art Deco massing with Zimbabwe-inspired stonework chevron motifs. An oculus in the domed ceiling channels a precise beam of sunlight onto the lower Hall of Heroes cenotaph every 16 December at noon.',
  },
  'Cape Point Lighthouse': {
    era: 'Old tower 1860 · New lower tower 1919',
    architectOrOrigin: 'Alexander Gordon (cast-iron tower)',
    styleOrType: 'Cast-iron coastal beacon',
    scale: '238 m high upper headland · 87 m lower beacon',
    history:
      'After ships continued mistaking False Bay in heavy sea mist, the 1860 cast-iron lighthouse on Cape Point peak proved too high—frequently shrouded in low cloud. Following the wreck of the SS Lusitania in 1911, a lower point beacon was built closer to the surf.',
    architecture:
      'The upper 9 m white cast-iron tower remains the highest lighthouse site in South Africa and is reached via the electric Flying Dutchman funicular, while the 1919 masonry beacon clings to Dias Point below.',
  },
  'Bo-Kaap': {
    era: '1760s–1850s · Auwal Mosque founded 1794',
    architectOrOrigin: 'Cape Malay artisans and freed residents',
    styleOrType: 'Terraced Cape Dutch & Georgian lime-plastered houses',
    scale: 'Cobbled hillside grid along Signal Hill’s lower slope',
    history:
      'Originally developed as huishuise rental cottages for artisans, enslaved craftspeople, and political exiles brought from Southeast Asia and across Africa, Bo-Kaap became the heart of Cape Muslim life and home to South Africa’s oldest mosque.',
    architecture:
      'Row houses step down steep cobbled streets, mixing flat-parapet Georgian facades with curved Cape Dutch stoep steps and sash windows. Vibrant pastel and jewel-toned plasterwork celebrates freedom and community identity.',
  },
  'FNB Stadium (Soccer City)': {
    era: 'Opened 1989 · Rebuilt 2007–2009',
    architectOrOrigin: 'Populous & Boogertman + Partners',
    styleOrType: 'Calabash-inspired terracotta mosaic bowl',
    scale: '94,736 seats · Africa’s largest stadium',
    history:
      'Originally opened in 1989 and site of Nelson Mandela’s first major Johannesburg address after his 1990 release, the stadium was dramatically rebuilt for the 2010 FIFA World Cup, hosting both the opening match and the final.',
    architecture:
      'Its doubly curved facade is clad in 33,600 fibre-cement tiles shaded from earthy ochre to charcoal to evoke a traditional African pot (calabash). A ring of warm night lighting glimmers beneath the cantilevered roof ring.',
  },
  'Three Rondavels': {
    era: 'Proterozoic quartzite (~2.1 Ga)',
    architectOrOrigin: 'Erosion by the Blyde (Motlatse) River',
    styleOrType: 'Conical dolomite & quartzite canyon buttresses',
    scale: 'Canyon depth ~800 m · 26 km gorge length',
    history:
      'Overlooking the Blyde River Canyon—one of the largest green canyons on Earth—these three rounded peaks were named by local travelers for their resemblance to traditional thatched grass-roofed rondavel homesteads.',
    architecture:
      'Hard, iron-rich quartzite caps protected softer underlying dolomite layers from river erosion, sculpting three steep-sided cylinders crowned with green summit caps above the turquoise reservoir of the Blyderivierspoort Dam.',
  },
  Baobab: {
    era: 'Carbon-dated individuals over 1,000–2,000 years old',
    architectOrOrigin: 'Adansonia digitata (Savanna flora)',
    styleOrType: 'Succulent-trunked deciduous monolith',
    scale: 'Up to 25 m tall · Trunk girth exceeding 10–30 m',
    history:
      'Sacred to Limpopo communities as gathering places, granaries, and shelters for centuries, ancient baobabs have trunks large enough to house natural hollows once used as meeting rooms and bush outposts.',
    architecture:
      'Adapted to seasonal drought, the fibrous grey trunk swells like a living water tower while leafless winter branches spread upward like exposed roots—giving rise to the legend of the “upside-down tree.”',
  },
  'Hole in the Wall': {
    era: 'Permian Beaufort shales & dolerite cliffs',
    architectOrOrigin: 'Wave action & Mpako River tidal erosion',
    styleOrType: 'Detached coastal sea arch',
    scale: '~15 m tall sandstone-shale stack with central tunnel',
    history:
      'Called esiKhaleni (“Place of Sound”) in isiXhosa because of the thunderous boom produced when Indian Ocean swells crash through its tidal tunnel, this Wild Coast landmark is steeped in Xhosa maritime folklore.',
    architecture:
      'Composed of dark mudstone and hardened sandstone veined by volcanic dolerite, waves exploited a vertical fracture zone to carve a clean natural archway off the mouth of the Mpako River.',
  },
  'Castle of Good Hope': {
    era: '1666–1679 · Oldest surviving colonial building in SA',
    architectOrOrigin: 'Dutch East India Company (VOC) engineers',
    styleOrType: 'Pentagonal Vauban star fort',
    scale: 'Five named bastions · ~160 m across',
    history:
      'Built by the Dutch East India Company with labour from soldiers, sailors, and enslaved artisans to replace Jan van Riebeeck’s earlier mud fort, the Castle served for centuries as the administrative, military, and judicial hub of the Cape.',
    architecture:
      'Its five-pointed star plan—bastions Oranje, Leerdam, Buren, Katzenellenbogen, and Nassau—enabled overlapping cannon fire with no blind corners. Thick stone-and-coral-lime walls enclose the central Kat Balcony courtyard.',
  },
  'Drakensberg Amphitheatre': {
    era: 'Jurassic basalt flows (~182 Ma)',
    architectOrOrigin: 'Drakensberg volcanic escarpment & Tugela erosion',
    styleOrType: 'Vertical flood-basalt escarpment wall',
    scale: '5 km wide arc · ~1,200 m sheer face · 948 m Tugela Falls',
    history:
      'Known in isiZulu as uKhahlamba (“Barrier of Spears”), this high mountain range shelters thousands of San rock paintings in its sandstone caves and forms part of the Maloti-Drakensberg Transfrontier World Heritage Site.',
    architecture:
      'Over a kilometre of dark stacked volcanic basalt rests squarely atop golden Clarens sandstone. During summer rains, the Tugela River plunges off the Mont-aux-Sources summit plateau in five free-falling cascades.',
  },
  'Palace of the Lost City': {
    era: '1991–1992 · Opened December 1992',
    architectOrOrigin: 'Wimberly Allison Tong & Goo (WAT&G)',
    styleOrType: 'Fantasy Afro-baroque resort architecture',
    scale: '63 m King’s Tower · 338 guest suites',
    history:
      'Conceived by hotelier Sol Kerzner inside the extinct volcanic bowl of Pilanesberg, the hotel was designed around a fictional lost African kingdom discovered after an earthquake—complete with hand-carved animal friezes and botanical gardens.',
    architecture:
      'Warm sandstone-toned precast concrete, hand-painted mosaic domes, bronze kudu sculptures, and soaring elephant-tusk-inspired rotunda columns crown the hillside above a man-made wave pool and jungle valley.',
  },
  'Golden Gate Highlands': {
    era: 'Triassic-Jurassic Clarens Formation (~200 Ma)',
    architectOrOrigin: 'Wind-deposited desert dunes lithified into sandstone',
    styleOrType: 'Eroded ochre & gold sandstone cliffs',
    scale: 'Brandwag Buttress rises ~200 m above valley floor',
    history:
      'Proclaimed a national park in 1963 to protect the Maluti foothills and rare bearded vulture habitat, Golden Gate takes its name from the dazzling gold glow cast onto its twin sandstone bluffs by late-afternoon sun.',
    architecture:
      'Cross-bedded wind-blown desert sands hardened into pale yellow Clarens sandstone, stained gold and copper by iron oxides and weathered into overhanging caves and dramatic vertical buttresses like Brandwag.',
  },
  'Kruger National Park': {
    era: 'Sabie Game Reserve 1898 · National Park 1926',
    architectOrOrigin: 'Lowveld granite & basalt plains between Crocodile & Limpopo rivers',
    styleOrType: 'Protected savanna biosphere reserve',
    scale: '19,623 km² · 360 km north to south',
    history:
      'First protected in 1898 as the Sabie Game Reserve and expanded into South Africa’s flagship national park in 1926, Kruger is home to the Big Five, Iron Age stone sites such as Thulamela, and iconic rest camps.',
    architecture:
      'West-to-east geology shifts from undulating granite kopjes with knobthorn and marula bushveld to fertile eastern basalt plains supporting large herds of elephant, buffalo, and white rhinoceros.',
  },
  'Ponte City': {
    era: '1975 · Africa’s tallest residential skyscraper',
    architectOrOrigin: 'Rodney Grosskopff & Manfred Hermer',
    styleOrType: 'Brutalist cylindrical residential tower',
    scale: '173 m tall · 54 storeys · Hollow central lightwell',
    history:
      'Built during Johannesburg’s 1970s high-rise boom as luxury apartments overlooking Berea and Hillbrow, Ponte City weathered decades of dramatic urban transition before undergoing full restoration into a thriving vertical neighbourhood.',
    architecture:
      'A hollow concrete cylinder with a 150-metre open core lets daylight and air reach every apartment’s interior windows, while an unmistakable circular rooftop crown carries South Africa’s largest illuminated skyline sign.',
  },
  'Boulders Beach': {
    era: 'Cape Peninsula granite (~540 Ma) · Penguin colony established 1982',
    architectOrOrigin: 'Weathering of Cape Granite plutons',
    styleOrType: 'Sheltered granite-boulder cove',
    scale: 'Rounded batholith domes up to 8 m high',
    history:
      'Named for the massive rounded granite domes shielding False Bay coves from ocean swell, Boulders Beach became world-famous after a pair of endangered African penguins settled here in 1982 and grew into a protected boardwalk colony.',
    architecture:
      'Spheroidal weathering along ancient joints rounded the hard crystalline granite into smooth whale-backed boulders that trap calm, turquoise sandy inlets ideal for both penguins and swimmers.',
  },
  'Cape Agulhas Lighthouse': {
    era: '1848–1849 · First lit 1 March 1849',
    architectOrOrigin: 'Colonel Charles Michell',
    styleOrType: 'Pharos-inspired red-and-white limestone tower',
    scale: '27 m tower · Southernmost tip of Africa',
    history:
      'Inspired by the ancient Lighthouse of Alexandria, the Cape Agulhas beacon was built after numerous shipwrecks along the treacherous reefs where the Atlantic and Indian oceans officially meet.',
    architecture:
      'Built from local limestone plastered and painted in iconic red-and-white horizontal bands, the tower houses a lighthouse museum and narrow steep timber staircases rising to its 1849-era lantern deck.',
  },
  'Orlando Towers': {
    era: 'Built 1951 · Decommissioned 1998 · Murals painted 2000s',
    architectOrOrigin: 'Johannesburg Electricity Department',
    styleOrType: 'Hyperbolic reinforced-concrete cooling towers',
    scale: '100 m high twin concrete shells',
    history:
      'Originally built to cool water for Soweto’s coal-fired Orlando Power Station, the twin cooling towers were transformed after closure into a landmark canvas of giant community murals and an adventure bungee and suspension-bridge hub.',
    architecture:
      'Thin hyperbolic paraboloid reinforced-concrete shells achieve remarkable structural stiffness with minimal wall thickness, creating an iconic industrial silhouette painted in bold geometric Soweto artwork.',
  },
  'Bourke’s Luck Potholes': {
    era: 'Black Reef quartzite sculpted over millennia',
    architectOrOrigin: 'Confluence of Blyde & Treur rivers',
    styleOrType: 'Fluvial cylindrical bedrock potholes',
    scale: 'Up to 6 m deep whirlpool-bored shafts',
    history:
      'Named after gold prospector Tom Bourke, who staked an adjacent claim in the late 19th century predicting nearby reefs, the site marks the upper entrance to the Blyde River Canyon.',
    architecture:
      'Where the swift Treur River meets the Blyde, sand and hard pebbles trapped in eddies act like drills, grinding smooth cylindrical holes and interlocking bridges straight into layered pink-and-gold quartzite.',
  },
  'Augrabies Falls': {
    era: 'Namaqualand gneiss & granite gorge',
    architectOrOrigin: 'Orange (Gariep) River plunge',
    styleOrType: 'Flood-carved granite gorge waterfall',
    scale: '56 m main drop · 18 km solid granite canyon',
    history:
      'Called Aukoerebis (“Place of Great Noise”) by the Nama people, the falls transform from braided desert channels into a roaring torrent during summer Orange River floods.',
    architecture:
      'Polished, sun-baked pink granite walls up to 240 m deep confine the Orange River into a narrow slot gorge beneath wooden viewing boardwalks overlooking the main plunge pool.',
  },
  'SALT Telescope': {
    era: '2000–2005 · Inaugurated November 2005',
    architectOrOrigin: 'South African Astronomical Observatory & international consortium',
    styleOrType: 'Segmented-mirror optical observatory',
    scale: '11.1 × 9.8 m hexagonal primary mirror (91 segments)',
    history:
      'Sited at 1,798 m elevation on the arid Karoo plateau near Sutherland for its dark, cloud-free skies, the Southern African Large Telescope is the largest single optical telescope in the Southern Hemisphere.',
    architecture:
      'Inspired by the Hobby-Eberly Telescope, its geodesic-inspired dome rotates smoothly atop a concrete pier while 91 hexagonal 1 m mirror segments focus distant starlight to a tracker beam suspended high overhead.',
  },
  'Bloukrans Bridge': {
    era: '1980–1984 · Opened 1984',
    architectOrOrigin: 'Liebenberg & Stander',
    styleOrType: 'Single-span reinforced-concrete arch bridge',
    scale: '272 m main arch span · 216 m above river gorge',
    history:
      'Carrying the N2 Garden Route highway smoothly across the deep wooded gorge separating the Western and Eastern Cape, Bloukrans Bridge is also home to the world’s highest commercial bridge bungee jump.',
    architecture:
      'Constructed via suspended cantilever cabling anchored into the gorge cliffs, its hollow concrete box-girder arch supports slender vertical spandrel columns without disturbing the river bed 216 m below.',
  },
  'Pilanesberg Crater': {
    era: 'Proterozoic alkaline volcanic complex (~1.2 Ga)',
    architectOrOrigin: 'Collapsed ring-dyke magma chamber',
    styleOrType: 'Concentric alkaline ring-complex hills',
    scale: '24 km circular crater diameter',
    history:
      'Long occupied by Iron Age and Batswana communities before being restored into a malaria-free Big Five reserve in 1979 (“Operation Genesis”), Pilanesberg sits directly inside one of Earth’s rarest volcanic ring structures.',
    architecture:
      'Successive magma intrusions and caldera collapses left concentric rings of steep syenite hills cradling a central spring-fed pan (Mankwe Dam), clearly visible as a bullseye geological crater.',
  },
  'Robben Island': {
    era: '17th century settlement · Maximum security prison 1961–1991',
    architectOrOrigin: 'Table Bay Malmesbury slate outcrop',
    styleOrType: 'Low-lying island prison & lighthouse complex',
    scale: '5.07 km² island · 7 km off Cape Town harbour',
    history:
      'Used as a quarantine station, leper colony, military fort, and prison over four centuries, Robben Island is internationally revered as the place where Nelson Mandela was held for 18 of his 27 years of imprisonment before becoming a UNESCO World Heritage Site in 1999.',
    architecture:
      'Flat windswept slate terrain holds the stone lime quarry, cylindrical 1865 lighthouse, and the austere concrete Courtyard and B-Section cell block constructed from grey island stone.',
  },
  'Chapman’s Peak Drive': {
    era: '1915–1922 · Modern rockfall catch-fences added 2003',
    architectOrOrigin: 'Sir Frederic de Waal & Robert Glenday',
    styleOrType: 'Half-gallery cliff-carved coastal road',
    scale: '9 km route · 114 curves above Hout Bay',
    history:
      'Built over seven years using convict labour along cliffs once thought impassable, Chapman’s Peak Drive became one of the world’s most celebrated marine drives connecting Hout Bay and Noordhoek.',
    architecture:
      'Blasted straight into the boundary plane where horizontal Table Mountain sandstone meets ancient Cape granite, the road features cantilevered concrete half-tunnels and dynamic steel rockfall canopies.',
  },
  Isandlwana: {
    era: 'Karoo sandstone & dolerite butte · Battle 22 January 1879',
    architectOrOrigin: 'Eroded Zululand tableland spur',
    styleOrType: 'Sphinx-shaped sandstone hill & battlefield memorial',
    scale: 'Rises ~180 m sharply above the Nquthu plain',
    history:
      'On 22 January 1879, an amaZulu army of roughly 20,000 warriors outflanked and decisively defeated a British imperial force encamped beneath the hill—one of the most consequential victories of the Anglo-Zulu War.',
    architecture:
      'The hill’s unmistakable sphinx-like profile of hard dolerite caprock over Ecca shales overlooks a grassy plain marked by white stone cairns commemorating the fallen on both sides.',
  },
  'Gariep Dam': {
    era: '1966–1971 · Opened 1972 (formerly Hendrik Verwoerd Dam)',
    architectOrOrigin: 'Department of Water Affairs & Gibb-Hawkins',
    styleOrType: 'Double-curvature concrete arch-gravity dam',
    scale: '88 m tall · 914 m crest length · 374 km² reservoir',
    history:
      'Constructed as the cornerstone of the Orange River Project to regulate floods, irrigate semi-arid Karoo farmland, and generate hydroelectricity, Gariep forms South Africa’s largest water storage reservoir.',
    architecture:
      'Its sweeping curved concrete arch transfers immense hydrostatic thrust into basalt-dolerite canyon abutments while six massive chute spillways and four turbine intakes sit below the crest roadway.',
  },
  'Cradle of Humankind': {
    era: 'Dolomitic limestone caves (~2–3.5 Ma hominin fossils)',
    architectOrOrigin: 'Karst dissolution of Malmani dolomite',
    styleOrType: 'Subterranean karst cavern & modern tumulus visitor pavilion',
    scale: '47,000 ha World Heritage landscape · Maropeng Tumulus',
    history:
      'Home to Sterkfontein, Swartkrans, Kromdraai, and Rising Star caves, the area has yielded famous hominin fossils including “Mrs Ples” (1947), “Little Foot,” and Homo naledi, illuminating over three million years of human origins.',
    architecture:
      'The Maropeng visitor centre rises from the grassland like an ancient grass-covered burial mound (tumulus), concealing a sleek cantilevered steel-and-glass exhibition facade facing the Witwatersberg hills.',
  },
  'Mapungubwe Hill': {
    era: 'Kingdom flourished c. 1075–1290 CE',
    architectOrOrigin: 'Ancestors of Shona and Venda polities',
    styleOrType: 'Sandstone citadel & golden court sanctuary',
    scale: '300 m long flat-topped sandstone mesa rising ~30 m',
    history:
      'Capital of southern Africa’s first state-level society, Mapungubwe traded ivory and gold via the Limpopo and Indian Ocean trade networks. Royal burials yielded the iconic gold foil rhinoceros now housed in the Mapungubwe Collection.',
    architecture:
      'Dry-stone retaining walls and narrow cleft stairways guarded the royal acropolis atop sheer Cave Sandstone cliffs, separating the sacred hilltop court from commoner terraces below.',
  },
  'Kgalagadi Red Dunes': {
    era: 'Quaternary windblown Kalahari sands',
    architectOrOrigin: 'Prevalent northwesterly winds & iron-oxide patina',
    styleOrType: 'Linear red-sand desert dunes & dry riverbeds',
    scale: '38,000 km² transfrontier desert park',
    history:
      'Uniting South Africa’s Kalahari Gemsbok National Park with Botswana’s Gemsbok National Park into Africa’s first formally declared Peace Park in 2000, the Kgalagadi preserves nomadic desert ecology and San heritage.',
    architecture:
      'Iron-oxide coatings paint parallel longitudinal dunes deep terracotta red along the fossil valleys of the Nossob and Auob rivers, anchored sparsely by camelthorn trees and towering sociable-weaver nests.',
  },
  'Storms River Mouth': {
    era: 'Table Mountain quartzite gorge · Suspension bridge built 1969 (replaced 2006)',
    architectOrOrigin: 'Coastal river incision along the Tsitsikamma coast',
    styleOrType: 'Twin-cable pedestrian suspension bridge',
    scale: '77 m span · 7 m above surging Indian Ocean channel',
    history:
      'Located inside Tsitsikamma—Africa’s oldest marine protected area, proclaimed in 1964—the mouth of the Storms River marks the dramatic trailhead of the famous five-day Otter Trail along the Wild Coast of the Garden Route.',
    architecture:
      'Steep evergreen-forested cliffs funnel tea-coloured mountain water directly into crashing ocean swells, spanned lightly by steel suspension cables and slatted timber decking.',
  },
  'Groot Constantia': {
    era: 'Estate founded 1685 · Manor rebuilt 1791',
    architectOrOrigin: 'Simon van der Stel · Louis Michel Thibault & Anton Anreith',
    styleOrType: 'Classical Cape Dutch homestead & cellar',
    scale: 'H-plan limewashed manor with sculpted gable pediment',
    history:
      'Established in 1685 by Cape Governor Simon van der Stel, Groot Constantia is South Africa’s oldest wine-producing estate. Its dessert wine, Vin de Constance, was prized across 18th- and 19th-century Europe.',
    architecture:
      'An exemplar of Cape Dutch symmetry: whitewashed thick brick walls, a sweeping curvilinear centre gable by Thibault, dark teak shutters, high thatch roofs, and Anton Anreith’s carved Dionysian wine-cellar pediment.',
  },
  'Hermanus Whale Watching': {
    era: 'Cliff path developed 1920s–present',
    architectOrOrigin: 'Table Mountain sandstone shore of Walker Bay',
    styleOrType: 'Coastal sandstone promontory & deep-water bay',
    scale: '12 km cliffside boardwalk above sheltered bay',
    history:
      'Once a small fishing village, Hermanus is renowned globally for land-based whale watching. Every spring, southern right whales migrate from sub-Antarctic waters to calve just metres off Gearings Point.',
    architecture:
      'Layered coastal sandstone benches drop straight into deep, clear Walker Bay water, allowing an uninterrupted shoreline promenade with stone lookouts and the town’s iconic kelp-horn whale crier.',
  },
  'iSimangaliso Wetland Park': {
    era: 'Proclaimed SA’s first UNESCO World Heritage Site in 1999',
    architectOrOrigin: 'Quaternary coastal sand-dune barriers & estuarine lagoons',
    styleOrType: 'Barrier-lagoon estuary & forested coastal dunes',
    scale: '3,280 km² · 220 km coastline · Lake St Lucia (80 km long)',
    history:
      'Integrating five distinct ecosystems from coral reefs to swamp forests, iSimangaliso (“miracle and wonder” in isiZulu) protects Africa’s largest estuarine system along with leatherback turtle nesting beaches and large hippo populations.',
    architecture:
      'Vegetated parabolic sand dunes rising over 150 m trap freshwater pans and warm brackish waters inside Lake St Lucia, sheltered behind a narrow tidal inlet to the Indian Ocean.',
  },
  'Sani Pass': {
    era: 'Pack-horse trail 1913 · First motorized crossing 1948',
    architectOrOrigin: 'Basotho traders & Godfrey Edmonds',
    styleOrType: 'Gravel mountain switchback escarpment pass',
    scale: '9 km ascent · Climbs 1,332 m to 2,876 m summit',
    history:
      'Forged early in the 20th century as a steep mule route linking Mokhotlong in Lesotho with Underberg markets in KwaZulu-Natal, Sani Pass remains the iconic high-altitude 4x4 crossing between the two countries.',
    architecture:
      'Tight gravel hairpin bends cling to exposed basalt cliffs beside the Mkomazana River valley, cresting at the Lesotho border plateau overlooking endless Maluti mountain ridges.',
  },
  Richtersveld: {
    era: 'Gariep Supergroup mountains · UNESCO site declared 2007',
    architectOrOrigin: 'Nama pastoralist landscape & Gariep River bend',
    styleOrType: 'Arid mountain desert & quiver-tree plateau',
    scale: '1,624 km² core cultural desert reserve',
    history:
      'Continuously inhabited and grazed sustainably for at least two millennia by Nama herders moving with seasonal rains in portable reed-mat |haru oms huts, the Richtersveld is recognized for living cultural heritage and extraordinary succulent biodiversity.',
    architecture:
      'Jagged mineral-rich ridges of folded shale and granite shelter halfmens succulents and branching Aloe dichotoma (quiver trees), whose hollowed fibrous limbs were historically used by San hunters as arrow quivers.',
  },
  'Vredefort Dome': {
    era: 'Impact ~2.023 billion years ago · UNESCO site 2005',
    architectOrOrigin: '10–15 km asteroid impact structure',
    styleOrType: 'Complex multi-ring meteorite impact dome',
    scale: '~300 km original crater · 70 km surviving central dome',
    history:
      'Recognized as the oldest and largest verified meteorite impact structure on Earth, the Vredefort event vaporized rock across ancient southern Africa and preserved tilted Witwatersrand gold-bearing strata deep underground.',
    architecture:
      'Deep crustal granite rebounded upward at the centre after impact, surrounded by concentric upturned rings of quartzite ridges sliced dramatically by the Vaal River.',
  },
  'Hartbeespoort Dam': {
    era: '1918–1923 · Cableway opened 1973 (modernized 2010)',
    architectOrOrigin: 'F. E. Kanthack & Irrigation Department',
    styleOrType: 'Variable-radius concrete arch dam',
    scale: '59 m wall height · 149 m crest across Crocodile River gorge',
    history:
      'Built through a narrow cleft in the Magaliesberg mountains originally called Schoemansdrift, the dam transformed the Crocodile River valley into an agricultural and lakeside recreation hub.',
    architecture:
      'Its graceful thin concrete arch braces directly against upturned quartzite cliffs of the Magaliesberg range, topped by a monumental neoclassical triumphal-arch road gateway.',
  },
  'Knysna Heads': {
    era: 'Table Mountain sandstone coastal headlands',
    architectOrOrigin: 'Tidal breach into Knysna estuarine lagoon',
    styleOrType: 'Twin sandstone sea-entrance cliffs',
    scale: 'Channel ~160 m wide · Cliffs rising ~100 m',
    history:
      'From the 1817 arrival of the brig Emu to the late-19th-century timber trade, mariners revered and feared the narrow, reef-lined passage through the Heads—requiring skilled pilot boats to guide vessels into safe lagoon waters.',
    architecture:
      'Eastern and Western Heads stand like sculpted sandstone gateposts, framing sheltered tidal mudflats, Featherbed cliffs, and dense indigenous coastal forests.',
  },
  'Donkin Reserve': {
    era: 'Pyramid built 1820 · Lighthouse built 1861',
    architectOrOrigin: 'Sir Rufane Donkin',
    styleOrType: 'Regency stone pyramid & octagonal coastal lighthouse',
    scale: '10 m limestone pyramid · 17 m harbour-hill lighthouse',
    history:
      'Sir Rufane Donkin laid out this hilltop park in memory of his late wife Elizabeth—after whom he named Port Elizabeth—building the stone pyramid in 1820. Today it forms the anchor of Route 67, celebrating 67 years of Nelson Mandela’s public service.',
    architecture:
      'A steep ashlar limestone pyramid stands beside a whitewashed octagonal 1861 lighthouse and monumental South African flag overlooking Algoa Bay and the Gqeberha harbour.',
  },
};
