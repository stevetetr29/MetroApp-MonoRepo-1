/**
 * Transit route datasets — polyline overlays + station coordinate seeds for
 * the interactive map. Coordinates are WGS-84; Shanghai markers/polylines are
 * shifted into GCJ-02 at render time (see StationMap) so they align with the
 * AMAP basemap.
 */
import type { City } from '../../index';

/** Official line colors — MTA / Shanghai Metro palettes. */
export const LINE_COLORS: Record<string, string> = {
  // NYC MTA
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C',
  '7': '#B933AD',
  'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
  'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
  'G': '#6CBE45',
  'J': '#996633', 'Z': '#996633',
  'L': '#A7A9AC',
  'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
  'S': '#808183',
  // Shanghai Metro
  'Line 1': '#E4002B', 'Line 2': '#00A0E9', 'Line 3': '#F9D616',
  'Line 4': '#6B2D90', 'Line 5': '#B07CC6', 'Line 6': '#D4017D',
  'Line 7': '#F18A00', 'Line 8': '#009CDA', 'Line 9': '#8DC8E8',
  'Line 10': '#C1A7E2', 'Line 11': '#76232F', 'Line 12': '#00A03E',
  'Line 13': '#E877C4', 'Line 14': '#7C5830', 'Line 15': '#C4975F',
  'Line 16': '#3BB44A', 'Line 17': '#D8C6A0', 'Line 18': '#008D86',
  // Rest of the World
  'Line A': '#E11D48', 'Line B': '#3B82F6', 'Line C': '#22C55E',
};

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface TransitRoute {
  /** Service name — matches LINE_COLORS / faction keys where single-line. */
  line: string;
  /** Official line color (MTA / Shanghai Metro palette). */
  color: string;
  /** Ordered station/waypoint coordinates along the line. */
  coordinates: LatLng[];
}

const pt = (latitude: number, longitude: number): LatLng => ({ latitude, longitude });

// ── NYC MTA — one polyline per trunk/service group ────────────────────────────

const NYC_ROUTES: TransitRoute[] = [
  {
    // Broadway–7th Avenue: 1 local / 2,3 express
    line: '1',
    color: LINE_COLORS['1'],
    coordinates: [
      pt(40.7939, -73.9723), // 96 St
      pt(40.7859, -73.9762), // 86 St
      pt(40.7839, -73.9799), // 79 St
      pt(40.7784, -73.9819), // 72 St
      pt(40.7734, -73.9822), // 66 St–Lincoln Ctr
      pt(40.7682, -73.9819), // 59 St–Columbus Cir
      pt(40.7617, -73.9838), // 50 St
      pt(40.7553, -73.9877), // Times Sq–42 St
      pt(40.7504, -73.9912), // 34 St–Penn
      pt(40.7472, -73.9934), // 28 St
      pt(40.7441, -73.9956), // 23 St
      pt(40.7410, -73.9978), // 18 St
      pt(40.7378, -74.0001), // 14 St
      pt(40.7328, -74.0027), // Christopher St
      pt(40.7290, -74.0046), // Houston St
      pt(40.7261, -74.0067), // Canal St
      pt(40.7227, -74.0069), // Franklin St
      pt(40.7155, -74.0092), // Chambers St
      pt(40.7102, -74.0076), // Fulton St
      pt(40.7062, -74.0095), // Cortlandt St
      pt(40.7026, -74.0129), // Rector St
      pt(40.7017, -74.0131), // South Ferry
    ],
  },
  {
    // Lexington Avenue: 4,5 express / 6 local
    line: '4',
    color: LINE_COLORS['4'],
    coordinates: [
      pt(40.8105, -73.9262), // 138 St–Grand Concourse
      pt(40.8041, -73.9374), // 125 St
      pt(40.7986, -73.9414), // 116 St
      pt(40.7950, -73.9443), // 110 St
      pt(40.7906, -73.9475), // 103 St
      pt(40.7856, -73.9510), // 96 St
      pt(40.7795, -73.9555), // 86 St
      pt(40.7736, -73.9598), // 77 St
      pt(40.7681, -73.9639), // 68 St–Hunter Coll.
      pt(40.7626, -73.9676), // 59 St
      pt(40.7571, -73.9719), // 51 St
      pt(40.7527, -73.9772), // Grand Central–42 St
      pt(40.7461, -73.9821), // 33 St
      pt(40.7431, -73.9842), // 28 St
      pt(40.7399, -73.9866), // 23 St
      pt(40.7359, -73.9911), // 14 St–Union Sq
      pt(40.7300, -73.9910), // Astor Pl
      pt(40.7259, -73.9946), // Bleecker St
      pt(40.7223, -73.9973), // Spring St
      pt(40.7180, -74.0001), // Canal St
      pt(40.7131, -74.0040), // Brooklyn Br–City Hall
      pt(40.7102, -74.0076), // Fulton St
      pt(40.7075, -74.0118), // Wall St
      pt(40.7048, -74.0143), // Bowling Green
      pt(40.6844, -73.9777), // Atlantic Av–Barclays
      pt(40.6752, -73.9710), // Grand Army Plaza
    ],
  },
  {
    // Flushing line: Times Sq ⇄ Flushing
    line: '7',
    color: LINE_COLORS['7'],
    coordinates: [
      pt(40.7558, -74.0019), // 34 St–Hudson Yards
      pt(40.7553, -73.9877), // Times Sq–42 St
      pt(40.7538, -73.9810), // 5 Av
      pt(40.7527, -73.9772), // Grand Central–42 St
      pt(40.7426, -73.9535), // Vernon Blvd–Jackson Av
      pt(40.7423, -73.9489), // Hunters Pt Av
      pt(40.7478, -73.9453), // Court Sq
      pt(40.7506, -73.9403), // Queensboro Plaza
      pt(40.7444, -73.9309), // 33 St–Rawson St
      pt(40.7431, -73.9184), // 46 St–Bliss St
      pt(40.7441, -73.9126), // 52 St
      pt(40.7456, -73.9030), // 61 St–Woodside
      pt(40.7463, -73.8965), // 69 St
      pt(40.7466, -73.8913), // Jackson Hts–Roosevelt
      pt(40.7477, -73.8837), // 82 St–Jackson Hts
      pt(40.7484, -73.8766), // 90 St–Elmhurst Av
      pt(40.7491, -73.8693), // Junction Blvd
      pt(40.7499, -73.8627), // 103 St–Corona Plaza
      pt(40.7517, -73.8553), // 111 St
      pt(40.7546, -73.8456), // Mets–Willets Pt
      pt(40.7596, -73.8300), // Flushing–Main St
    ],
  },
  {
    // 8th Avenue: A express / C local / E (8 Av–53 St branch)
    line: 'A',
    color: LINE_COLORS['A'],
    coordinates: [
      pt(40.8408, -73.9395), // 168 St
      pt(40.8248, -73.9448), // 145 St
      pt(40.8111, -73.9522), // 125 St
      pt(40.7682, -73.9819), // 59 St–Columbus Cir
      pt(40.7624, -73.9859), // 50 St
      pt(40.7573, -73.9897), // 42 St–Port Authority
      pt(40.7522, -73.9934), // 34 St–Penn
      pt(40.7453, -73.9986), // 23 St
      pt(40.7403, -74.0023), // 14 St
      pt(40.7323, -74.0007), // W 4 St–Wash Sq
      pt(40.7262, -74.0037), // Spring St
      pt(40.7208, -74.0052), // Canal St
      pt(40.7155, -74.0092), // Chambers St
      pt(40.7102, -74.0076), // Fulton St
      pt(40.6993, -73.9905), // High St (Brooklyn)
    ],
  },
  {
    // 6th Avenue: B,D express / F,M local
    line: 'B',
    color: LINE_COLORS['B'],
    coordinates: [
      pt(40.7814, -73.9721), // 81 St–Museum
      pt(40.7762, -73.9764), // 72 St
      pt(40.7682, -73.9819), // 59 St–Columbus Cir
      pt(40.7647, -73.9808), // 57 St–7 Av
      pt(40.7586, -73.9813), // 47–50 Sts–Rock Ctr
      pt(40.7538, -73.9834), // 42 St–Bryant Pk
      pt(40.7497, -73.9879), // 34 St–Herald Sq
      pt(40.7429, -73.9928), // 23 St
      pt(40.7397, -74.0003), // 14 St
      pt(40.7323, -74.0007), // W 4 St–Wash Sq
      pt(40.7253, -73.9962), // Broadway–Lafayette
      pt(40.7183, -73.9938), // Grand St
    ],
  },
  {
    // Brooklyn Crosstown: Queens ⇄ south Brooklyn
    line: 'G',
    color: LINE_COLORS['G'],
    coordinates: [
      pt(40.7478, -73.9453), // Court Sq
      pt(40.7314, -73.9544), // Greenpoint Av
      pt(40.7245, -73.9510), // Nassau Av
      pt(40.7128, -73.9514), // Metropolitan Av
      pt(40.7061, -73.9503), // Broadway
      pt(40.7004, -73.9502), // Flushing Av
      pt(40.6946, -73.9490), // Myrtle–Willoughby
      pt(40.6896, -73.9535), // Bedford–Nostrand
      pt(40.6889, -73.9600), // Classon Av
      pt(40.6881, -73.9668), // Clinton–Washington
      pt(40.6871, -73.9753), // Fulton St
      pt(40.6885, -73.9850), // Hoyt–Schermerhorn
      pt(40.6861, -73.9908), // Bergen St
      pt(40.6803, -73.9950), // Carroll St
      pt(40.6736, -73.9959), // Smith–9 Sts
    ],
  },
  {
    // Nassau St / Jamaica el: J local / Z skip-stop
    line: 'J',
    color: LINE_COLORS['J'],
    coordinates: [
      pt(40.7029, -73.8008), // Jamaica Ctr–Parsons
      pt(40.7005, -73.8284), // 121 St
      pt(40.6973, -73.8366), // 111 St
      pt(40.6952, -73.8444), // 104 St
      pt(40.6938, -73.8523), // Woodhaven Blvd
      pt(40.6924, -73.8600), // 85 St–Forest Pkwy
      pt(40.6895, -73.8725), // Cypress Hills
      pt(40.6832, -73.8737), // Crescent St
      pt(40.6814, -73.8801), // Norwood Av
      pt(40.6799, -73.8850), // Cleveland St
      pt(40.6780, -73.8917), // Van Siclen Av
      pt(40.6770, -73.8986), // Alabama Av
      pt(40.6793, -73.9047), // Broadway Jct
      pt(40.6829, -73.9102), // Chauncey St
      pt(40.6864, -73.9165), // Halsey St
      pt(40.6898, -73.9221), // Gates Av
      pt(40.6932, -73.9285), // Kosciuszko St
      pt(40.6972, -73.9357), // Myrtle Av
      pt(40.7004, -73.9410), // Flushing Av
      pt(40.7039, -73.9474), // Lorimer St
      pt(40.7069, -73.9535), // Hewes St
      pt(40.7084, -73.9578), // Marcy Av
      pt(40.7183, -73.9874), // Delancey–Essex
      pt(40.7203, -73.9934), // Bowery
      pt(40.7181, -73.9999), // Canal St
      pt(40.7132, -74.0034), // Chambers St
      pt(40.7102, -74.0076), // Fulton St
      pt(40.7065, -74.0110), // Broad St
    ],
  },
  {
    // 14th St–Canarsie: Manhattan ⇄ Brooklyn
    line: 'L',
    color: LINE_COLORS['L'],
    coordinates: [
      pt(40.7403, -74.0023), // 8 Av
      pt(40.7397, -74.0003), // 6 Av
      pt(40.7359, -73.9911), // 14 St–Union Sq
      pt(40.7328, -73.9862), // 3 Av
      pt(40.7309, -73.9816), // 1 Av
      pt(40.7173, -73.9569), // Bedford Av
      pt(40.7141, -73.9502), // Lorimer St
      pt(40.7146, -73.9444), // Graham Av
      pt(40.7119, -73.9406), // Grand St
      pt(40.7077, -73.9398), // Montrose Av
      pt(40.7061, -73.9330), // Morgan Av
      pt(40.7066, -73.9229), // Jefferson St
      pt(40.7038, -73.9180), // DeKalb Av
      pt(40.6994, -73.9123), // Myrtle–Wyckoff
      pt(40.6956, -73.9051), // Halsey St
      pt(40.6889, -73.9040), // Wilson Av
      pt(40.6828, -73.9053), // Bushwick–Aberdeen
      pt(40.6788, -73.9033), // Broadway Jct
      pt(40.6753, -73.9030), // Atlantic Av
      pt(40.6692, -73.9018), // Sutter Av
      pt(40.6640, -73.9004), // Livonia Av
      pt(40.6588, -73.8993), // New Lots Av
    ],
  },
  {
    // Broadway: N,W express-ish / Q,R local
    line: 'N',
    color: LINE_COLORS['N'],
    coordinates: [
      pt(40.7750, -73.9120), // Astoria–Ditmars
      pt(40.7703, -73.9178), // Astoria Blvd
      pt(40.7668, -73.9214), // 30 Av
      pt(40.7619, -73.9254), // Broadway
      pt(40.7568, -73.9295), // 36 Av
      pt(40.7527, -73.9328), // 39 Av–Dutch Kills
      pt(40.7506, -73.9403), // Queensboro Plaza
      pt(40.7626, -73.9676), // Lexington Av/59 St
      pt(40.7647, -73.9808), // 57 St–7 Av
      pt(40.7599, -73.9842), // 49 St
      pt(40.7553, -73.9877), // Times Sq–42 St
      pt(40.7497, -73.9879), // 34 St–Herald Sq
      pt(40.7454, -73.9887), // 28 St
      pt(40.7413, -73.9892), // 23 St
      pt(40.7359, -73.9911), // 14 St–Union Sq
      pt(40.7303, -73.9925), // 8 St–NYU
      pt(40.7243, -73.9977), // Prince St
      pt(40.7195, -74.0018), // Canal St
      pt(40.7133, -74.0069), // City Hall
      pt(40.7107, -74.0114), // Cortlandt St
      pt(40.7075, -74.0130), // Rector St
      pt(40.7031, -74.0130), // Whitehall St
      pt(40.6844, -73.9777), // Atlantic Av–Barclays
      pt(40.6906, -73.9818), // DeKalb Av
      pt(40.6773, -73.9831), // Union St
      pt(40.6708, -73.9882), // 9 St
      pt(40.6654, -73.9929), // Prospect Av
      pt(40.6607, -73.9981), // 25 St
      pt(40.6551, -74.0036), // 36 St
      pt(40.6489, -74.0101), // 45 St
      pt(40.6414, -74.0179), // 59 St
      pt(40.6350, -74.0233), // Bay Ridge Av
      pt(40.6297, -74.0255), // 77 St
      pt(40.6227, -74.0284), // 86 St
      pt(40.6166, -74.0309), // Bay Ridge–95 St
    ],
  },
  {
    // 42 St Shuttle: Times Sq ⇄ Grand Central
    line: 'S',
    color: LINE_COLORS['S'],
    coordinates: [
      pt(40.7553, -73.9877), // Times Sq
      pt(40.7527, -73.9772), // Grand Central
    ],
  },
];

// ── Shanghai Metro — one polyline per line (Lines 1–18) ───────────────────────

const SHANGHAI_ROUTES: TransitRoute[] = [
  {
    line: 'Line 1',
    color: LINE_COLORS['Line 1'],
    coordinates: [
      pt(31.3795, 121.4345), // Fujin Rd
      pt(31.3398, 121.4424), // Gongfu Xincun
      pt(31.2955, 121.4462), // Wenshui Rd
      pt(31.2787, 121.4537), // Shanghai Circus World
      pt(31.2494, 121.4557), // Shanghai Railway Station
      pt(31.2430, 121.4592), // Hanzhong Rd
      pt(31.2335, 121.4690), // People's Square
      pt(31.2220, 121.4640), // Huangpi S Rd
      pt(31.2170, 121.4574), // South Shaanxi Rd
      pt(31.1940, 121.4374), // Xujiahui
      pt(31.1780, 121.4310), // Shanghai Indoor Stadium
      pt(31.1544, 121.4297), // Shanghai South
      pt(31.1410, 121.4150), // Jinjiang Park
      pt(31.1240, 121.3860), // Xinzhuang
    ],
  },
  {
    line: 'Line 2',
    color: LINE_COLORS['Line 2'],
    coordinates: [
      pt(31.1943, 121.3207), // Hongqiao T2
      pt(31.1960, 121.3380), // Hongqiao T1
      pt(31.2180, 121.3740), // Beixinjing
      pt(31.2190, 121.3900), // Weining Rd
      pt(31.2185, 121.4164), // Zhongshan Park
      pt(31.2206, 121.4272), // Jiangsu Rd
      pt(31.2234, 121.4453), // Jing'an Temple
      pt(31.2297, 121.4599), // W Nanjing Rd
      pt(31.2335, 121.4690), // People's Square
      pt(31.2406, 121.4839), // E Nanjing Rd
      pt(31.2386, 121.5014), // Lujiazui
      pt(31.2380, 121.5160), // Dongchang Rd
      pt(31.2337, 121.5264), // Century Ave
      pt(31.2200, 121.5430), // Science & Tech Museum
      pt(31.2180, 121.5510), // Century Park
      pt(31.2033, 121.5564), // Longyang Rd
      pt(31.2040, 121.5880), // Zhangjiang
      pt(31.2070, 121.6200), // Guanglan Rd
      pt(31.1510, 121.7985), // Pudong Int'l Airport
    ],
  },
  {
    line: 'Line 3',
    color: LINE_COLORS['Line 3'],
    coordinates: [
      pt(31.3800, 121.4740), // Jiangyang N Rd
      pt(31.3500, 121.4840), // Zhanghuabang
      pt(31.3160, 121.4880), // Jiangwan Town
      pt(31.2900, 121.4850), // Chifeng Rd
      pt(31.2720, 121.4790), // Hongkou Football Stadium
      pt(31.2600, 121.4700), // Baoxing Rd
      pt(31.2520, 121.4560), // Shanghai Railway Station
      pt(31.2490, 121.4450), // Zhongtan Rd
      pt(31.2390, 121.4330), // Zhenping Rd
      pt(31.2320, 121.4170), // Caoyang Rd
      pt(31.2220, 121.4120), // Zhongshan Park
      pt(31.2060, 121.4190), // Yan'an W Rd
      pt(31.1960, 121.4240), // Hongqiao Rd
      pt(31.1860, 121.4270), // Yishan Rd
      pt(31.1730, 121.4330), // Longcao Rd
      pt(31.1600, 121.4320), // Shilong Rd
      pt(31.1544, 121.4297), // Shanghai South
    ],
  },
  {
    // Loop line — drawn as its core arc through downtown
    line: 'Line 4',
    color: LINE_COLORS['Line 4'],
    coordinates: [
      pt(31.1860, 121.4270), // Yishan Rd
      pt(31.1830, 121.4360), // Shanghai Gymnasium
      pt(31.1880, 121.4440), // Shanghai Stadium
      pt(31.1900, 121.4550), // Dong'an Rd
      pt(31.1960, 121.4620), // Damuqiao Rd
      pt(31.2040, 121.4700), // Luban Rd
      pt(31.2020, 121.4870), // Xizang S Rd
      pt(31.2130, 121.4980), // Nanpu Bridge
      pt(31.2250, 121.5140), // Pudong Ave
      pt(31.2337, 121.5264), // Century Ave
      pt(31.2400, 121.5330), // Pudian Rd
      pt(31.2510, 121.5290), // Beiyangjing Rd
      pt(31.2600, 121.5050), // Dalian Rd
      pt(31.2650, 121.4950), // Linping Rd
      pt(31.2570, 121.4980), // Hailun Rd
      pt(31.2600, 121.4700), // Baoshan Rd
      pt(31.2520, 121.4560), // Shanghai Railway Station
      pt(31.2390, 121.4330), // Zhenping Rd
      pt(31.2320, 121.4170), // Caoyang Rd
      pt(31.2220, 121.4120), // Zhongshan Park
      pt(31.2060, 121.4190), // Yan'an W Rd
      pt(31.1960, 121.4240), // Hongqiao Rd
      pt(31.1860, 121.4270), // Yishan Rd (loop close)
    ],
  },
  {
    line: 'Line 5',
    color: LINE_COLORS['Line 5'],
    coordinates: [
      pt(31.1240, 121.3860), // Xinzhuang
      pt(31.1000, 121.3810), // Chunshen Rd
      pt(31.0840, 121.3830), // Yindu Rd
      pt(31.0750, 121.3850), // Zhuanqiao
      pt(31.0650, 121.3980), // Beiqiao
      pt(31.0460, 121.4050), // Jianchuan Rd
      pt(31.0270, 121.4130), // Dongchuan Rd
      pt(31.0060, 121.4170), // Jiangchuan Rd
      pt(30.9910, 121.4050), // Minhang Dev. Zone
    ],
  },
  {
    line: 'Line 6',
    color: LINE_COLORS['Line 6'],
    coordinates: [
      pt(31.3580, 121.5800), // Gangcheng Rd
      pt(31.3350, 121.5840), // Waigaoqiao N
      pt(31.3090, 121.5770), // Juzhong Rd
      pt(31.2810, 121.5680), // Boshan Rd
      pt(31.2510, 121.5450), // Yuanshen Stadium
      pt(31.2380, 121.5330), // Pudian Rd
      pt(31.2337, 121.5264), // Century Ave
      pt(31.2270, 121.5170), // Shangcheng Rd
      pt(31.2130, 121.4980), // Nanpu Bridge
      pt(31.1960, 121.4950), // Tangqiao
      pt(31.1700, 121.4900), // Gaoqing Rd
      pt(31.1528, 121.4822), // Oriental Sports Center
    ],
  },
  {
    line: 'Line 7',
    color: LINE_COLORS['Line 7'],
    coordinates: [
      pt(31.4040, 121.3520), // Meilan Lake
      pt(31.3440, 121.3830), // Gucun Park
      pt(31.3180, 121.4000), // Liuhang
      pt(31.2930, 121.4200), // Shanghai Univ
      pt(31.2730, 121.4350), // Dahuasan Rd
      pt(31.2570, 121.4400), // Xincun Rd
      pt(31.2400, 121.4370), // Changshou Rd
      pt(31.2234, 121.4453), // Jing'an Temple
      pt(31.2130, 121.4520), // Changshu Rd
      pt(31.2000, 121.4570), // Zhaojiabang Rd
      pt(31.1860, 121.4580), // Middle Longhua Rd
      pt(31.1900, 121.4950), // Shibo Ave
      pt(31.1980, 121.5200), // Yanggao S Rd
      pt(31.2100, 121.5650), // Huamu Rd
    ],
  },
  {
    line: 'Line 8',
    color: LINE_COLORS['Line 8'],
    coordinates: [
      pt(31.3260, 121.5300), // Shiguang Rd
      pt(31.3010, 121.5160), // Huangxing Park
      pt(31.2830, 121.4890), // Quyang Rd
      pt(31.2680, 121.4820), // Middle Xizang Rd
      pt(31.2520, 121.4760), // Zhongxing Rd
      pt(31.2430, 121.4720), // Qufu Rd
      pt(31.2335, 121.4690), // People's Square
      pt(31.2250, 121.4800), // Dashijie
      pt(31.2180, 121.4870), // Laoximen
      pt(31.2070, 121.4940), // Lujiabang Rd
      pt(31.2020, 121.4870), // Xizang S Rd
      pt(31.1750, 121.4850), // Chengshan Rd
      pt(31.1528, 121.4822), // Oriental Sports Center
      pt(31.1200, 121.4980), // Sanlu Highway
      pt(31.1000, 121.5080), // Shendu Highway
    ],
  },
  {
    line: 'Line 9',
    color: LINE_COLORS['Line 9'],
    coordinates: [
      pt(30.9850, 121.2270), // Songjiang S Railway
      pt(31.0150, 121.2440), // Songjiang Sports Ctr
      pt(31.0400, 121.2300), // Songjiang Xincheng
      pt(31.1050, 121.2500), // Sijing
      pt(31.1400, 121.2800), // Jiuting
      pt(31.1590, 121.3180), // Zhongchun Rd
      pt(31.1590, 121.3500), // Qibao
      pt(31.1700, 121.3750), // Hechuan Rd
      pt(31.1860, 121.4270), // Yishan Rd
      pt(31.1940, 121.4374), // Xujiahui
      pt(31.2040, 121.4500), // Jiashan Rd
      pt(31.2050, 121.4600), // Dapuqiao
      pt(31.2090, 121.4710), // Madang Rd
      pt(31.2110, 121.4990), // Xiaonanmen
      pt(31.2200, 121.5150), // Shangcheng Rd
      pt(31.2337, 121.5264), // Century Ave
      pt(31.2430, 121.5600), // Middle Yanggao Rd
      pt(31.2550, 121.6050), // Jinqiao
      pt(31.2720, 121.6550), // Caolu
    ],
  },
  {
    line: 'Line 10',
    color: LINE_COLORS['Line 10'],
    coordinates: [
      pt(31.1943, 121.3207), // Hongqiao T2
      pt(31.1900, 121.3620), // Shanghai Zoo
      pt(31.1960, 121.3880), // Longxi Rd
      pt(31.2020, 121.4100), // Shuicheng Rd
      pt(31.2040, 121.4320), // Jiaotong Univ
      pt(31.2080, 121.4450), // Shanghai Library
      pt(31.2170, 121.4574), // South Shaanxi Rd
      pt(31.2159, 121.4756), // Xintiandi
      pt(31.2200, 121.4850), // Laoximen
      pt(31.2273, 121.4922), // Yuyuan Garden
      pt(31.2406, 121.4839), // E Nanjing Rd
      pt(31.2430, 121.4800), // Tiantong Rd
      pt(31.2570, 121.4980), // Hailun Rd
      pt(31.2700, 121.5060), // Youdian Xincun
      pt(31.2860, 121.5090), // Tongji Univ
      pt(31.3050, 121.5050), // Guoquan Rd
      pt(31.3320, 121.5140), // Xinjiangwancheng
    ],
  },
  {
    line: 'Line 11',
    color: LINE_COLORS['Line 11'],
    coordinates: [
      pt(31.2950, 121.0980), // Huaqiao
      pt(31.2890, 121.1570), // Anting
      pt(31.2800, 121.3000), // Nanxiang
      pt(31.2800, 121.3650), // Taopu Xincun
      pt(31.2650, 121.3850), // Wuwei Rd
      pt(31.2480, 121.4020), // Zhenru
      pt(31.2400, 121.4120), // Caoyang Rd
      pt(31.2300, 121.4200), // Longde Rd
      pt(31.2206, 121.4272), // Jiangsu Rd
      pt(31.2040, 121.4320), // Jiaotong Univ
      pt(31.1940, 121.4374), // Xujiahui
      pt(31.1820, 121.4420), // Shanghai Swimming Ctr
      pt(31.1700, 121.4550), // Longhua
      pt(31.1528, 121.4822), // Oriental Sports Center
      pt(31.1530, 121.5400), // Pusan Rd
      pt(31.1530, 121.5920), // Luoshan Rd
      pt(31.1400, 121.6120), // Xiuyan Rd
      pt(31.1493, 121.6688), // Disney Resort
    ],
  },
  {
    line: 'Line 12',
    color: LINE_COLORS['Line 12'],
    coordinates: [
      pt(31.1580, 121.3470), // Qixin Rd
      pt(31.1650, 121.3850), // Hongmei Rd
      pt(31.1750, 121.4180), // Guilin Park
      pt(31.1830, 121.4360), // Caobao Rd
      pt(31.1780, 121.4460), // Longcao Rd
      pt(31.1930, 121.4460), // Dapuqiao
      pt(31.2170, 121.4574), // South Shaanxi Rd
      pt(31.2297, 121.4599), // W Nanjing Rd
      pt(31.2430, 121.4590), // Hanzhong Rd
      pt(31.2420, 121.4720), // Qufu Rd
      pt(31.2430, 121.4800), // Tiantong Rd
      pt(31.2510, 121.4920), // Int'l Cruise Terminal
      pt(31.2570, 121.4980), // Dalian Rd
      pt(31.2630, 121.5600), // Jufeng Rd
      pt(31.2630, 121.6200), // Jinhai Rd
    ],
  },
  {
    line: 'Line 13',
    color: LINE_COLORS['Line 13'],
    coordinates: [
      pt(31.2410, 121.3360), // Jinyun Rd
      pt(31.2420, 121.3760), // Zhenbei Rd
      pt(31.2360, 121.3940), // Daduhe Rd
      pt(31.2320, 121.4110), // Jinshajiang Rd
      pt(31.2320, 121.4250), // Longde Rd
      pt(31.2360, 121.4370), // Wuning Rd
      pt(31.2340, 121.4460), // Changshou Rd
      pt(31.2297, 121.4599), // W Nanjing Rd
      pt(31.2200, 121.4640), // Middle Huaihai Rd
      pt(31.2159, 121.4756), // Xintiandi
      pt(31.2090, 121.4710), // Madang Rd
      pt(31.1950, 121.4830), // World Expo Museum
      pt(31.1900, 121.4950), // Shibo Ave
      pt(31.1960, 121.5400), // Zhongke Rd
      pt(31.2040, 121.5900), // Zhangjiang Rd
    ],
  },
  {
    line: 'Line 14',
    color: LINE_COLORS['Line 14'],
    coordinates: [
      pt(31.2690, 121.3240), // Fengbang
      pt(31.2650, 121.3450), // Zhenxin Xincun
      pt(31.2630, 121.3600), // Tongchuan Rd
      pt(31.2620, 121.3960), // Zhenxin?  (Lancun Rd)
      pt(31.2480, 121.4020), // Zhenru
      pt(31.2410, 121.4150), // Zhongning Rd
      pt(31.2350, 121.4340), // Wuding Rd
      pt(31.2280, 121.4400), // Jing'an Temple N
      pt(31.2234, 121.4453), // Jing'an Temple
      pt(31.2200, 121.4640), // Middle Huaihai Rd
      pt(31.2220, 121.4750), // Dashijie
      pt(31.2273, 121.4922), // Yuyuan Garden
      pt(31.2350, 121.4970), // Lujiazui W
      pt(31.2386, 121.5014), // Lujiazui
      pt(31.2400, 121.5150), // Pudong Ave
      pt(31.2440, 121.5350), // Yuanshen Rd
      pt(31.2490, 121.5830), // Jinqiao Rd
      pt(31.2550, 121.6350), // Guilin Rd? (Dongming Rd)
    ],
  },
  {
    line: 'Line 15',
    color: LINE_COLORS['Line 15'],
    coordinates: [
      pt(31.3440, 121.3830), // Gucun Park
      pt(31.3190, 121.3930), // Jinqiu Rd
      pt(31.2950, 121.3990), // Fengxiang Rd
      pt(31.2780, 121.3980), // South Chen Rd
      pt(31.2560, 121.3900), // Qilianshan Rd
      pt(31.2400, 121.3860), // Wuwei E Rd
      pt(31.2230, 121.3840), // Changfeng Park
      pt(31.2130, 121.3980), // Shilong Rd? (Loushanguan)
      pt(31.2040, 121.4050), // Hongbaoshi Rd
      pt(31.1940, 121.4080), // Yao Hong Rd
      pt(31.1860, 121.4080), // Guilin Rd
      pt(31.1700, 121.4200), // Guilin Park S
      pt(31.1544, 121.4297), // Shanghai South
      pt(31.1350, 121.4370), // Luoxiu Rd
      pt(31.1000, 121.4450), // Yongde Rd
      pt(31.0600, 121.4600), // Yuanjiang Rd
      pt(31.0290, 121.4720), // Zizhu High-Tech Park
    ],
  },
  {
    line: 'Line 16',
    color: LINE_COLORS['Line 16'],
    coordinates: [
      pt(31.2033, 121.5564), // Longyang Rd
      pt(31.1800, 121.5750), // Huaxia Middle Rd
      pt(31.1530, 121.5920), // Luoshan Rd
      pt(31.1320, 121.6170), // Zhoupu E
      pt(31.1070, 121.6000), // Hangtou
      pt(31.0800, 121.6400), // E Hanghai Rd
      pt(31.0500, 121.7050), // Wild Animal Park
      pt(31.0530, 121.7630), // Huinan
      pt(30.9800, 121.8400), // East Huinan
      pt(30.9070, 121.9280), // Dishui Lake
    ],
  },
  {
    line: 'Line 17',
    color: LINE_COLORS['Line 17'],
    coordinates: [
      pt(31.1943, 121.3207), // Hongqiao T2
      pt(31.1900, 121.3050), // Middle Yinggang
      pt(31.1860, 121.2900), // Xujing
      pt(31.1840, 121.2720), // Panlong Rd
      pt(31.1830, 121.2500), // Zhaoxiang
      pt(31.1800, 121.2220), // Jiasong Middle Rd
      pt(31.1720, 121.1800), // Huijin Rd
      pt(31.1590, 121.1210), // Qingpu Xincheng
      pt(31.1400, 121.0900), // Zhujiajiao
      pt(31.1040, 121.0170), // Oriental Land
    ],
  },
  {
    line: 'Line 18',
    color: LINE_COLORS['Line 18'],
    coordinates: [
      pt(31.1070, 121.6000), // Hangtou
      pt(31.1110, 121.5850), // Xiasha
      pt(31.1500, 121.5760), // Yuqiao
      pt(31.1760, 121.5590), // Beizhong Rd
      pt(31.1900, 121.5550), // Fangxin Rd
      pt(31.2033, 121.5564), // Longyang Rd
      pt(31.2240, 121.5490), // Yingchun Rd
      pt(31.2380, 121.5420), // Changyi Rd
      pt(31.2400, 121.5380), // Minsheng Rd
      pt(31.2540, 121.5360), // Danyang Rd
      pt(31.2630, 121.5340), // Pingliang Rd
      pt(31.2680, 121.5200), // Jiangpu Park
      pt(31.2750, 121.5120), // Jiangpu Rd
      pt(31.2980, 121.4990), // Fudan Univ
      pt(31.3100, 121.5020), // Shanghai Univ of Finance
      pt(31.3200, 121.5010), // Yin'gao Rd
      pt(31.3330, 121.4880), // South Changjiang Rd
    ],
  },
];

// ── Rest of the World — generic starter network ───────────────────────────────

const WORLD_ROUTES: TransitRoute[] = [
  {
    line: 'Line A',
    color: LINE_COLORS['Line A'],
    coordinates: [pt(40.0, -74.0), pt(40.005, -74.01), pt(40.012, -74.02)],
  },
  {
    line: 'Line B',
    color: LINE_COLORS['Line B'],
    coordinates: [pt(39.99, -73.98), pt(39.995, -73.99), pt(40.008, -73.995)],
  },
  {
    line: 'Line C',
    color: LINE_COLORS['Line C'],
    coordinates: [pt(39.99, -74.005), pt(39.985, -74.015)],
  },
];

/** All drawable metro routes, keyed by city mode. */
export const TRANSIT_ROUTES: Record<City, TransitRoute[]> = {
  NYC: NYC_ROUTES,
  Shanghai: SHANGHAI_ROUTES,
  'Rest of the World': WORLD_ROUTES,
};
