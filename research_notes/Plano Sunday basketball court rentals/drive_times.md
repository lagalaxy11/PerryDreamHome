# Routed drive times from the church of Christ on McDermott Road to candidate indoor basketball facilities

**Method (read first).** All times below were computed with routing engines, not estimated by eye. They are free-flow times with no live traffic.
- **Origin.** 3600 McDermott Rd, Plano TX 75025, at lat 33.1010089, lon -96.7646909. The coordinates come from the schema.org data on the church's own website. The US Census geocoder places 3600 McDermott Rd within 0.04 mi of that point.
- **Geocoding.** Each facility was geocoded two ways: by address with the US Census geocoder (Public_AR_Current) and by name with OSM Nominatim. When both returned a point within 0.6 mi of each other, the OSM building or POI point was used. Otherwise the address point was used, with one exception: for Life Time, the OSM POI carries the exact street address, so it was used.
- **Routing.** The primary engine is OSRM (router.project-osrm.org, car profile). Each route was cross-checked on routing.openstreetmap.de, which is also OSRM, and on Valhalla (valhalla1.openstreetmap.de, auto costing), a separate engine. Toll-free alternatives were computed with Valhalla, because the OSRM demo server rejects `exclude=toll`.
- **Buffer and verdicts.** The buffer is OSRM time × 1.2.
  - **Clearly ≤15**: the buffered time is ≤15 min and the Valhalla time is ≤15 min.
  - **Borderline**: the OSRM time is ≤15 min but the buffered time or the Valhalla time is over 15.
  - **>15**: the OSRM free-flow time is over 15 min.
- **Files.** The scripts are in `/tmp/claude-0/-home-user-PerryDreamHome/fbcf352e-a6ba-559d-933a-d088bf84e8b2/scratchpad/`: `drive_times.py`, `notoll.py` and `make_table.py`. The results are in `results.json` and `notoll.json` in the same folder. All 229 raw API responses (Census, Nominatim, OSRM, FOSSGIS-OSRM, Valhalla) are in its `raw/api/` subfolder.

## 1. Where exactly is the church, and what are its cross streets?

### Takeaway
The church is at 3600 McDermott Rd, Plano TX 75025. It is on the south side of McDermott Rd, between Coit Rd (about 0.35–0.4 mi west) and Independence Pkwy (about 0.8 mi east). Gifford Dr meets McDermott immediately east of the church. The Plano Family YMCA (3300 McDermott) and Fowler Middle School (3801 McDermott) are its immediate neighbors.

### Cited Findings
- The church's own site gives "3600 McDermott Rd, Plano, TX 75025", phone (972) 712-2727, and geo coordinates 33.1010089, -96.76469089999999. — [ccmcdermott.org (JSON-LD on home page)](https://www.ccmcdermott.org)
- The US Census geocoder matches "3600 MCDERMOTT RD, PLANO, TX, 75025" at 33.10092, -96.76530, on the 3600–3698 address range. — [Census geocoder query](https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=3600+McDermott+Rd%2C+Plano%2C+TX+75025&benchmark=Public_AR_Current&format=json)
- OSM reverse-geocodes the church coordinates to "McDermott Road, Plano, Collin County, Texas, 75025". The church itself is not tagged by name in OSM: a Nominatim name search returned nothing. — [Nominatim reverse](https://nominatim.openstreetmap.org/reverse?format=json&lat=33.1010089&lon=-96.7646909&zoom=18)
- OSRM snaps the origin to the eastbound lanes of McDermott Rd. In OSRM's step data, the first right turn is onto **Gifford Drive** about 86 m east of the origin. The McDermott/**Independence Pkwy** intersection is at about lon -96.7503, about 0.83 mi east. **Coit Rd** runs at about lon -96.7715, about 0.4 mi west. — OSRM raw outputs `osrm_carpenter.json` and `osrm_mathews.json` in the `raw/api/` folder ([OSRM demo](https://router.project-osrm.org/route/v1/driving/-96.7646909,33.1010089;-96.77191,33.06352?overview=false&steps=true))

### Inferences
- In OSM, the YMCA (3300, even number) sits south of McDermott and Fowler MS (3801, odd number) sits north of it. So even numbers are on the south side, which puts the church (3600) on the south side, between Gifford Dr and Coit Rd. Wyatt Elementary (8900 Coit Rd) is just to its southwest. This is an inference from address parity and OSM positions; I did not confirm it with imagery.
- The earlier notes guessed the church was near Independence Pkwy. It is actually closer to **Coit Rd**, which favors facilities reached by Coit, such as Carpenter Park, Christ UMC and Frisco ISD campuses on Coit and Rolater.

### Gaps
- No imagery check of which driveway or side street the church parking lot uses. A start from Gifford Dr instead of McDermott would change local-campus times by well under 1 min.

## 2. Drive-time table (sorted by OSRM free-flow time)

### Takeaway
Of 46 facilities routed, **32 are clearly within 15 minutes** even with a 20% buffer. That covers every requested Plano ISD campus, the nearest Frisco and Allen ISD campuses, Carpenter Park Rec Center, the YMCA, PSA Preston Meadow and PSA Seabrook, Frisco Athletic Center, Sports Academy at The Star, Life Time Allen, and four churches (Christ UMC, CRUMC, Seton, Hunters Glen). **Three are borderline**: Apex Centre, PSA McKinney and John Paul II HS. **Eleven are over 15 min**, including Tom Muehlenbeck (15.2), Liberty, Oak Point, Joe Farmer, FieldhouseUSA, Prestonwood and Collin College.

### Cited Findings
Routing sources: OSRM demo `https://router.project-osrm.org/route/v1/driving/-96.7646909,33.1010089;{lon},{lat}?overview=false&steps=true`; Valhalla `https://valhalla1.openstreetmap.de/route?json=…` ([OSRM demo server](https://router.project-osrm.org/), [Valhalla FOSSGIS](https://valhalla1.openstreetmap.de/)). Road names in the routing notes come from OSRM step names, keeping roads driven for more than 0.5 mi.

| # | Facility | Address used | Dist (mi) | OSRM free-flow (min) | +20% buffer (min) | Valhalla check (min / mi) | Verdict | Routing notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Plano Family YMCA | 3300 McDermott Rd, Plano, TX 75025 | 0.5 | 1.3 | 1.5 | 1.4 / 0.5 | Clearly ≤15 | McDermott Rd, east 0.5 mi |
| 2 | Fowler Middle School (PISD) | 3801 McDermott Rd, Plano, TX 75025 (building is on the Mason Dr side) | 0.6 | 1.6 | 1.9 | 1.1 / 0.3 | Clearly ≤15 | via McDermott Rd (U-turn, since the church is on the eastbound side) |
| 3 | Wyatt Elementary (PISD) | 8900 Coit Rd, Plano, TX 75025 | 0.5 | 2.7 | 3.2 | 3.9 / 0.4 | Clearly ≤15 | local streets (Gifford Dr) |
| 4 | Rice Middle School (PISD) | 8500 Gifford Dr, Plano, TX 75025 | 1.0 | 3.2 | 3.8 | 3.7 / 1.0 | Clearly ≤15 | via Gifford Dr |
| 5 | Coram Deo Academy (Collin County campus) | 9645 Independence Pkwy, Plano, TX 75025 | 1.5 | 3.3 | 4.0 | 3.6 / 1.5 | Clearly ≤15 | via McDermott/Ridgeview Dr to Independence |
| 6 | Skaggs Elementary (PISD) | 3201 Russell Creek Dr, Plano, TX 75025 | 1.2 | 3.4 | 4.1 | 4.3 / 1.7 | Clearly ≤15 | via Gifford Dr |
| 7 | Curtsinger Elementary (FISD) | 12450 Jereme Trl, Frisco, TX 75035 | 2.4 | 5.2 | 6.3 | 5.2 / 2.2 | Clearly ≤15 | via McDermott Rd, Coit Rd north |
| 8 | Lawler Middle School (FISD) | 12921 Rolater Rd, Frisco, TX 75035 (OSM address) | 3.2 | 6.0 | 7.2 | 8.7 / 3.4 | Clearly ≤15 | via McDermott Rd, Coit Rd north |
| 9 | Vandeventer Middle School (FISD) | 6075 Independence Pkwy, Frisco, TX 75035 | 2.6 | 6.0 | 7.2 | 6.7 / 2.8 | Clearly ≤15 | via Ridgeview Dr, Independence Pkwy north |
| 10 | Mathews Elementary (PISD) | 7500 Marchman Way, Plano, TX 75025 | 2.8 | 6.2 | 7.4 | 6.8 / 2.8 | Clearly ≤15 | via McDermott Rd, Independence Pkwy south |
| 11 | Beverly Elementary (**Plano ISD**, Allen address) | 715 Duchess Dr, Allen, TX 75013 | 3.1 | 6.4 | 7.7 | 9.6 / 3.2 | Clearly ≤15 | via McDermott, Independence, Hedgcoxe Rd |
| 12 | Hedgcoxe Elementary (PISD) | 7701 Prescott Dr, Plano, TX 75025 | 3.5 | 7.1 | 8.5 | 8.2 / 3.5 | Clearly ≤15 | via McDermott, Independence, Hedgcoxe Rd |
| 13 | Carpenter Park Recreation Center (Plano) | 6701 Coit Rd, Plano, TX 75024 | 3.1 | 7.3 | 8.8 | 7.5 / 3.1 | Clearly ≤15 | via Gifford/Stonehaven Dr, Coit Rd south |
| 14 | Centennial High School (FISD) | 6901 Coit Rd, Frisco, TX 75035 | 3.3 | 7.4 | 8.9 | 8.0 / 3.0 | Clearly ≤15 | via McDermott Rd, Coit Rd north |
| 15 | Clark Middle School (FISD) | Lebanon Rd, Frisco, TX 75035 (OSM POI; street only) | 3.5 | 7.8 | 9.3 | 7.9 / 3.2 | Clearly ≤15 | via McDermott, Coit Rd, Lebanon Rd west |
| 16 | Mary Evans Elementary (Allen ISD) | 1225 Walnut Springs Dr, Allen, TX 75013 | 3.4 | 7.8 | 9.3 | 8.7 / 3.5 | Clearly ≤15 | via Ridgeview Dr east |
| 17 | Custer Road United Methodist Church | 6601 Custer Rd, Plano, TX 75023 | 4.0 | 7.9 | 9.5 | 8.6 / 4.0 | Clearly ≤15 | via McDermott, Independence, Hedgcoxe, Custer Rd south |
| 18 | Isbell Elementary (FISD) | Taychas Trail, Frisco, TX 75035 (OSM POI; street only) | 3.4 | 8.1 | 9.8 | 9.4 / 3.3 | Clearly ≤15 | via Ridgeview Dr, Independence Pkwy |
| 19 | Smith Elementary (FISD) | Ruth Borchardt Dr, Frisco, TX 75035 (OSM POI; street only) | 3.6 | 8.2 | 9.8 | 8.3 / 3.3 | Clearly ≤15 | via McDermott, Coit Rd, Lebanon Rd |
| 20 | Ereckson Middle School (Allen ISD) | 450 Tatum Dr, Allen, TX 75013 | 4.0 | 8.3 | 9.9 | 9.2 / 4.0 | Clearly ≤15 | McDermott Rd east (becomes W McDermott Dr in Allen) |
| 21 | Plano Sports Authority – Preston Meadow | 6500 Preston Meadow Dr, Plano, TX 75024 | 3.5 | 8.6 | 10.3 | 8.9 / 3.5 | Clearly ≤15 | via Stonehaven Dr, Coit Rd, Preston Meadow Dr |
| 22 | St. Elizabeth Ann Seton (gym at Faith Formation Center) | 3100 W Spring Creek Pkwy, Plano, TX 75023 (routed to OSM church point, 2700 W Spring Creek, 0.27 mi away) | 4.2 | 8.7 | 10.4 | 9.2 / 4.2 | Clearly ≤15 | via McDermott, Independence Pkwy south |
| 23 | Rasor Elementary (PISD) | 945 Hedgcoxe Rd, Plano, TX 75025 | 4.4 | 8.7 | 10.5 | 9.5 / 4.4 | Clearly ≤15 | via McDermott, Independence, Hedgcoxe Rd east |
| 24 | Hendrick Middle School (PISD) | 7400 Red River Dr, Plano, TX 75025 | 4.0 | 9.2 | 11.1 | 10.3 / 4.0 | Clearly ≤15 | via McDermott, Independence, Hedgcoxe, USA Dr |
| 25 | Green Elementary (Allen ISD) | Abilene Ct, Allen, TX 75013 (OSM POI; street only) | 4.7 | 9.9 | 11.8 | 11.7 / 4.7 | Clearly ≤15 | McDermott east, N Alma Dr |
| 26 | Christ United Methodist Church | 3101 Coit Rd, Plano, TX 75075 | 4.8 | 10.3 | 12.4 | 10.5 / 4.8 | Clearly ≤15 | via Stonehaven Dr, Coit Rd south |
| 27 | Hunters Glen Baptist Church | 4001 Custer Rd, Plano, TX 75023 | 5.2 | 10.5 | 12.6 | 11.3 / 5.2 | Clearly ≤15 | via McDermott, Independence, Hedgcoxe, Custer Rd |
| 28 | Sports Academy at The Star | 3800 Gaylord Pkwy, Frisco, TX 75034 | 5.2 | 10.9 | 13.0 | 10.6 / 4.9 | Clearly ≤15 | McDermott Rd west (becomes Warren Pkwy), Ohio Dr |
| 29 | Life Time Allen | 971 State Hwy 121, Allen, TX 75013 | 6.8 | 10.9 | 13.1 | 12.5 / 7.2 | Clearly ≤15 | via Ridgeview Dr, **Sam Rayburn Tollway (toll)**, SH-121 frontage. Toll-free alternative (Valhalla): 13.9 min / 6.6 mi via Ridgeview, Custer, McDermott |
| 30 | Frisco Athletic Center | 5828 Nancy Jane Ln, Frisco, TX 75035 | 4.9 | 11.0 | 13.2 | 11.6 / 4.6 | Clearly ≤15 | via McDermott, Coit Rd, Lebanon Rd west |
| 31 | Kerr Elementary (Allen ISD) | Glendover Dr, Allen, TX 75013 (OSM POI; street only) | 6.0 | 11.1 | 13.3 | 13.2 / 5.8 | Clearly ≤15 (thin margin) | via Ridgeview Dr, SH-121 frontage, N Alma Dr |
| 32 | Plano Sports Authority – Seabrook | 601 Seabrook Dr, Plano, TX 75023 | 5.8 | 11.6 | 13.9 | 12.7 / 5.9 | Clearly ≤15 (thin margin) | via McDermott, Independence, Hedgcoxe, Alma Dr |
| 33 | Apex Centre (McKinney) | **3003 Alma Rd, McKinney, TX 75070** (corrected) | 7.4 | 13.7 | 16.4 | 15.6 / 7.6 | **Borderline** | via Custer Rd (FM 2478) north, SH-121 frontage, Stonebridge Dr |
| 34 | PSA McKinney (Gabe Nesbitt Park) | 7205 Eldorado Pkwy, McKinney, TX 75070 | 7.6 | 14.1 | 16.9 | 16.0 / 7.8 | **Borderline** | via Custer Rd north, SH-121 frontage, Stonebridge Dr, Eldorado Pkwy |
| 35 | John Paul II High School | 900 Coit Rd, Plano, TX 75075 | 6.7 | 14.6 | 17.5 | 15.1 / 6.7 | **Borderline** | Coit Rd south all the way (many signals) |
| 36 | Tom Muehlenbeck Recreation Center | 5801 W Parker Rd, Plano, TX 75093 | 8.2 | 15.2 | 18.2 | 16.6 / 8.8 | >15 (just over) | McDermott west, **Dallas North Tollway (toll)** south. Toll-free alternative (Valhalla): 17.3 min / 7.7 mi via Coit, Spring Creek, Preston, Parker |
| 37 | Liberty Recreation Center | 2601 Glencliff Dr, Plano, TX 75075 | 7.4 | 15.6 | 18.7 | 17.4 / 8.3 | >15 | Independence Pkwy south |
| 38 | Oak Point Recreation Center | 6000 Jupiter Rd, Plano, TX 75074 | 7.8 | 15.9 | 19.1 | 17.3 / 7.9 | >15 | Independence, Hedgcoxe, Alma, Legacy Dr east |
| 39 | Joe Farmer Recreation Center (Allen) | 1201 E Bethany Dr, Allen, TX 75002 | 8.1 | 16.3 | 19.5 | 17.8 / 8.1 | >15 | McDermott east, S Watters Rd, Bethany Dr east |
| 40 | FieldhouseUSA Frisco | 6155 Sports Village Rd, Frisco, TX 75033 | 8.1 | 16.7 | 20.0 | 18.8 / 10.7 | >15 | McDermott, Coit, Lebanon, Parkwood Blvd |
| 41 | Prestonwood Baptist Church / Prestonwood Christian Academy | 6801 W Park Blvd, Plano, TX 75093 | 10.0 | 17.7 | 21.3 | 18.4 / 10.6 | >15 | McDermott west, **Dallas North Tollway (toll)**, W Park Blvd. Toll-free alternative: 20.2 min |
| 42 | Collin College Plano Campus (Spring Creek) | 2800 E Spring Creek Pkwy, Plano, TX 75074 | 8.6 | 17.9 | 21.5 | 19.5 / 8.7 | >15 | Hedgcoxe, Alma, Legacy, E Spring Creek Pkwy |
| 43 | Areté Athletics Center | 1720 Bray Central Dr, McKinney, TX 75069 | 13.5 | 19.3 | 23.2 | 18.8 / 13.9 | >15 | **Sam Rayburn Tollway (toll)**, US-75 north. Toll-free alternative: 21.8 min |
| 44 | Douglass Community Center | 1111 H Ave, Plano, TX 75074 | 9.5 | 19.4 | 23.3 | 22.6 / 12.1 | >15 | Independence, Custer, 15th St east |
| 45 | Old Settler's Recreation Center | 1201 E Louisiana St, McKinney, TX 75069 | 12.8 | 19.7 | 23.6 | 21.1 / 13.6 | >15 | **Sam Rayburn Tollway (toll)**, SH-5/McDonald St. Toll-free alternative: 24.8 min |
| 46 | Kingdom Performance Academy | 2621 Summit Ave, Plano, TX 75074 | 10.9 | 21.6 | 26.0 | 24.4 / 14.1 | >15 | Independence, Hedgcoxe, Alma, Legacy, Jupiter Rd |

- **Router agreement.** OSRM demo and routing.openstreetmap.de returned **identical** time and distance for all 46 routes. Both run OSRM's car profile on the same OSM data, so they are not an independent check. Valhalla, a different engine, ran a median **9% longer** than OSRM for routes over 2 mi, with a range of 0.97× to 1.49×. The biggest gaps were on very short trips (Wyatt, Beverly, Lawler), where Valhalla charges more for turns and signals. — raw outputs `osrm_*.json`, `fossgis_*.json` and `valhalla_*.json` in the `raw/api/` folder

### Inferences
- Valhalla's typical +9% sits inside the +20% buffer, so the buffered OSRM column is a reasonable conservative figure for a light-traffic Sunday evening. Neither engine models signal waits in detail. Routes that run long on Coit, Independence or Custer, such as JP2, Liberty and Seton, carry the most signal risk.
- **Apex Centre and PSA McKinney** are in the same park, Gabe Nesbitt Community Park at Alma and Eldorado. Each is about 14 min free-flow and 15.6–16 min on Valhalla. Expect roughly 14–17 min on a Sunday night: usable if the group accepts a soft 15-min limit.
- **Tom Muehlenbeck** is just over the limit at 15.2 min free-flow, and only using the Dallas North Tollway. Without tolls it is about 17 min. Treat it as outside.
- **Life Time Allen's** 10.9 min uses the Sam Rayburn Tollway (SH-121 toll lanes). The toll-free route is still about 14 min, so it stays within 15 either way.
- The densest cluster of options within 10 minutes is: the YMCA; Plano ISD (Fowler, Wyatt, Rice, Skaggs, Mathews, Hedgcoxe, Rasor, Hendrick); Frisco ISD (Curtsinger, Lawler, Vandeventer, Centennial HS, Clark MS); Allen ISD (Evans, Ereckson); Carpenter Park; PSA Preston Meadow; CRUMC; Seton.

### Gaps
- No live or historical traffic source (Google or Apple) was queried. The +20% buffer is the stand-in.
- Campus entrance points: routes end at the OSM building or POI point, or at a Census address point. For big campuses such as Collin College, Prestonwood and FieldhouseUSA, the gym door may be 0.1–0.3 mi from that point.

## 3. Address verification and corrections

### Takeaway
One real address correction: **Apex Centre is at 3003 Alma Rd, McKinney 75070**, not 3110 Eldorado Pkwy. The Census geocoder placed the wrong address about 2.9 mi east, on W Eldorado Pkwy. Several other clarifications follow. Most addresses were confirmed on the facility's own website or by agreement between the Census and OSM geocoders, within 0.3 mi.

### Cited Findings
**Corrections and clarifications**
- **Apex Centre: corrected to 3003 Alma Rd, McKinney TX 75070**, inside Gabe Nesbitt Community Park. The OSM POI also gives "Apex Centre, 3003 Alma Road, McKinney 75070". — [McKinney Apex Guide Spring 2026 (city PDF)](https://www.mckinneytexas.org/DocumentCenter/View/38975/Apex_Guide_Spring2026_Final); [Community Impact, Apex NinjaCross](https://communityimpact.com/mckinney/impacts/first-indoor-ninjacross-water-obstacle-course-in-texas-to-open-at-mckinney-apex-centre/); [Nominatim result](https://nominatim.openstreetmap.org/search?format=jsonv2&q=Apex+Centre%2C+McKinney)
- **PSA McKinney** is in the same park. PSA's site describes it at "Eldorado Parkway and Alma Drive", and the Census geocoder places 7205 Eldorado Pkwy at that corner. — [psaplano.org](https://www.psaplano.org/)
- **Beverly Elementary (715 Duchess Dr, Allen 75013) is a Plano ISD school, not Allen ISD.** Allen ISD's similarly named school is Beverly Cheatham Elementary, 1501 Hopewell Dr, Allen. — [SchoolDigger Allen list](https://schooldigger.com/go/TX/city/Allen/search.aspx)
- **Tom Muehlenbeck (5801 W Parker Rd)**: the address is correct, but the Census geocoder mis-matched it to "5801 Deer Park Ln". The OSM POI at 5801 West Parker Road was used instead. — [Plano, Tom Muehlenbeck Rec Center](https://www.plano.gov/1478/Tom-Muehlenbeck-Recreation-Center)
- **Life Time Allen**: the official site's street address is "971 TX-121". The Census geocoder's interpolation along SH-121 was 1.1 mi off, so the OSM POI was used, which carries the same address. — [lifetime.life Allen](https://www.lifetime.life/locations/tx/allen.html)
- **Fowler MS**: the postal address is 3801 McDermott Rd, but the OSM building sits on the Mason Dr side, about 0.1 mi from the Census point. — [Census geocoder match](https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=3801+McDermott+Rd%2C+Plano%2C+TX+75025&benchmark=Public_AR_Current&format=json)
- **St. Elizabeth Ann Seton**: OSM places the church at 2700 W Spring Creek Pkwy. The gym address from earlier notes, 3100 W Spring Creek Pkwy (Faith Formation Center), geocodes 0.27 mi away on the same campus. — [Nominatim](https://nominatim.openstreetmap.org/search?format=jsonv2&q=St.+Elizabeth+Ann+Seton%2C+Plano)
- **Christ United Methodist Church (3101 Coit Rd)**: confirmed by OSM and Census agreeing within 0.06 mi. Caution: the domain christumc.org belongs to a different church, in Kettering, OH. — [christumc.org (wrong church)](https://christumc.org/)

**Confirmed on the facility's own site (fetched this session)**
- Plano Family YMCA: 3300 McDermott Rd., Plano TX 75025. — [ymcadallas.org](https://ymcadallas.org/locations/plano-family-ymca)
- Plano ISD schools:
  - Hendrick MS, 7400 Red River Drive. — [hendrick.pisd.edu](https://hendrick.pisd.edu/)
  - Rice MS, 8500 Gifford Drive. — [rice.pisd.edu](https://rice.pisd.edu/)
  - Hedgcoxe ES, 7701 Prescott Drive. — [hedgcoxe.pisd.edu](https://hedgcoxe.pisd.edu/)
  - Rasor ES, 945 Hedgcoxe Road. — [rasor.pisd.edu](https://rasor.pisd.edu/)
  - Mathews ES, 7500 Marchman Way. — [mathews.pisd.edu](https://mathews.pisd.edu/)
  - All five are in Plano TX 75025.
- Frisco Athletic Center: 5828 Nancy Jane Lane, Frisco TX 75035. — [friscotexas.gov](https://www.friscotexas.gov/Facilities/Facility/Details/Frisco-Athletic-Center-117)
- Joe Farmer Rec Center: 1201 E. Bethany Dr., Allen TX 75002. — [cityofallen.org](https://www.cityofallen.org/departments/parks_recreation/recreation_facilities/joe_farmer_recreation_center/index.php)
- PSA Preston Meadow: 6500 Preston Meadow Dr, Plano 75024. — [psaplano.org](https://www.psaplano.org/)
- FieldhouseUSA: 6155 Sports Village Rd., Frisco. — [fieldhouseusa.com/frisco](https://www.fieldhouseusa.com/frisco)
- Areté Athletics Center: 1720 Bray Central Dr, Ste 200, McKinney TX 75069. — [areteathletics.com AAC](https://areteathletics.com/about-arete/arete-athletics-center-aac/)
- Prestonwood Baptist: 6801 W. Park Blvd., Plano TX 75093. — [prestonwood.org](https://www.prestonwood.org/)
- Prestonwood Christian Academy: 6801 W Park Blvd, Plano TX 75093. — [prestonwoodchristian.org](https://www.prestonwoodchristian.org/)
- Custer Road UMC: 6601 Custer Rd, Plano TX 75023. — [crumc.org](https://crumc.org/)
- Coram Deo Academy, Collin County campus: 9645 Independence Pkwy, Plano TX 75025. — [coramdeoacademy.org/contact](https://www.coramdeoacademy.org/contact)

**Confirmed by secondary sources plus geocoder agreement (official site not fetched)**
- Plano rec centers:
  - Carpenter Park Rec Center, 6701 Coit Rd. — [Plano Parks & Rec catalog, Summer 2023](https://issuu.com/pard2011/docs/summer_2023_recreation_catalog); [Community Impact](https://communityimpact.com/dallas-fort-worth/city-county/2016/05/23/plano-memorial-day-holiday-schedule/)
  - Oak Point Rec Center, 6000 Jupiter Rd. — [Community Impact, MLK closings](https://communityimpact.com/plano/city-county/city-of-plano-lists-closings-for-martin-luther-king-jr-holiday/)
  - Liberty Rec Center, 2601 Glencliff Dr. — same Community Impact notice
  - Douglass Community Center, 1111 Avenue H. — [Plano catalog](https://issuu.com/pard2011/docs/summer_2023_recreation_catalog)
  - OSM POIs matched Carpenter and Oak Point within 0.12 mi. plano.gov pages render with JavaScript and gave no address text to curl.
- Frisco ISD: Curtsinger ES, 12450 Jereme Trail, Frisco 75035; Vandeventer MS, 6075 Independence Pkwy, Frisco 75035. — [HAR Vandeventer](https://www.har.com/web/DeborahLoria/tools/school/campus_detail/043905054/vandeventer-middle-school); [Texas Tribune Curtsinger](https://lege-lookup.texastribune.org/districts/frisco-isd/curtsinger-elementary-school)
- Lawler MS (12921 Rolater Rd) and Centennial HS (6901 Coit Rd): addresses from OSM tags. — [Nominatim](https://nominatim.openstreetmap.org/search?format=jsonv2&q=Lawler+Middle+School%2C+Frisco)
- Allen ISD: Ereckson MS, 450 Tatum Dr, Allen 75013. — [HAR](https://old.har.com/school/043901044/ereckson-middle-school)
- Mary Evans ES, 1225 Walnut Springs Dr, Allen 75013. — [Moonpreneur directory (low-quality source)](https://moonpreneur.com/school/e/tx/allen/mary-evans-el-20012). OSM puts the school on Walnut Springs Dr, which is consistent.
- From earlier sibling notes, not re-verified on the facility's own site:
  - Sports Academy at The Star, 3800 Gaylord Pkwy, Frisco 75034
  - Kingdom Performance Academy, 2621 Summit Ave, Plano 75074
  - PSA Seabrook, 601 Seabrook Dr, Plano 75023
  - Collin College Plano (Spring Creek) Campus, 2800 E Spring Creek Pkwy, Plano 75074
  - John Paul II HS, 900 Coit Rd, Plano 75075
  - Hunters Glen Baptist, 4001 Custer Rd, Plano 75023
  - Old Settler's Rec Center, 1201 E Louisiana St, McKinney 75069

  The Census geocoder matched each one exactly. Where OSM had the POI (JP2, Hunters Glen, Old Settler's), it agreed within 0.22 mi. — see `census_*.json` and `nominatim_*.json` in the `raw/api/` folder

### Inferences
- **Nearest Frisco ISD campuses** (identified by an OSM school search around the church): Curtsinger ES (5 min), Lawler MS and Vandeventer MS (6 min), Centennial HS (7 min), Clark MS and Smith ES (8 min), Isbell ES (8 min). All are north of McDermott in the 75035 part of Frisco, along Coit, Rolater and Independence.
- **Nearest Allen ISD campuses**: Mary Evans ES (8 min), Ereckson MS (8 min), Green ES (10 min), Kerr ES (11 min).
- The church is also very close to Plano ISD's Wyatt ES and Skaggs ES, which were not on the original list. Both are under 4 min.

### Gaps
- Official address pages could not be fetched for:
  - plano.gov rec centers (JavaScript-rendered)
  - McKinney city pages (HTTP 403 to curl)
  - Fowler MS (fowler.pisd.edu timed out)
  - Hunters Glen, JP2, Collin College, Seton, Sports Academy, Kingdom Performance (their sites timed out, returned 403, or I didn't have the domain)

  For these, the addresses rest on secondary sources plus geocoder agreement.
- House numbers for Isbell ES, Clark MS, Smith ES, Green ES and Kerr ES were not confirmed; only the OSM building point and street name were used. This does not affect the drive times.
- Whether any of these gyms is actually rentable on Sunday nights is outside this note. See the sibling notes.
