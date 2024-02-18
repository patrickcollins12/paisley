const { randomInt } = require("crypto")

merchants = 
// [
// ["Business > Accounting", "LedgerLogic", "NumberNest", "AccountAssure", "BookBalance", "FinanceFirst"],
// ["Business > Legal", "LegalLeverage", "RightPath Law", "JusticeJunction", "LawLadder", "CaseClose"],
// ["Charity", "GiveGlow Foundation", "HopeHarbor", "CharityChain", "AidArc", "GenerousGestures"],
// ["Education > Lunch", "SchoolMeals Plus", "NutriNosh", "LunchLearn", "EduEats", "MealMind"],
// ["Education > Miscellaneous", "EduExtras", "LearnLift", "ScholarStuff", "CampusCollective", "StudySundry"],
// ["Education > School Fees", "FeeFacilitate", "SchoolSpend", "EduInvest", "PaymentPlan Pro", "TuitionTrack"],
// ["Education > Tuition", "TuitionTrend", "EduPay", "LearnLevy", "StudyStipend", "CourseCash"],
// ["Entertainment > Audio", "SoundScape", "AudioAvenue", "EchoEssence", "WaveWorks", "ListenLuxe"],
// ["Entertainment > Books", "PagePursuit", "ReadRealm", "BookBounty", "LiteraryLounge", "NovelNook"],
// ["Entertainment > Event Tickets", "TicketTrove", "EventEntry", "PassPassage", "AdmitAll", "EntryEcho"],
// ["Entertainment > Games", "GameGrove", "PlayPort", "GamerGuild", "QuestQuarters", "FunForge"],
// ["Entertainment > Music", "MelodyMingle", "RhythmRack", "SoundSphere", "MusicMingle", "TuneTrack"],
// ["Entertainment > News", "NewsNest", "InformInbox", "BulletinBoard", "CurrentCrate", "ReportRealm"],
// ["Entertainment > TV/Movies", "ScreenStream", "FlickField", "ShowShare", "MovieMingle", "VisionVault"],
// ["Entertainment > Videos", "VidVortex", "ClipCircle", "StreamSpace", "VisionView", "ReelReach"],
// ["Financial > Bank Fees", "FeeFighters", "ChargeCheck", "BankBite", "CostCurb", "DeductDetect"],
// ["Financial > Bank Fees > ATM Fee", "ATMAdvantage", "CashAccess Charge", "WithdrawWin", "FeeFreedom", "ATMAnswer"],
// ["Financial > Bank Fees > Waived", "WaiveWave", "ChargeChaser", "FeeForgive", "CostClear", "DeductDrop"],
// ["Financial > Interest", "InterestInflux", "ProfitPulse", "YieldYard", "GainGround", "EarningEdge"],
// ["Financial > Investment > Acquisition > Shares", "ShareSweep", "EquityEarn", "StockSurge", "AssetAccrue", "HoldingsHike"],
// ["Financial > Investment > Dividends", "DividendDrive", "ProfitPortion", "YieldYacht", "IncomeIncrease", "PayoutPeak"],
// ["Financial > Investment > Proceeds > Shares", "Quantum Equity Partners", "Fusion Investments", "Nebula Capital", "Orbit Ventures", "Starlight Funds"],
// ["Financial > Investment > Proceeds > Vanguard 529", "Nova Education Fund", "Bright Future 529", "Horizon Scholars Fund", "EduGrow Investments", "Learn & Prosper 529"],
// ["Financial > Mortgage Payment", "HomeFirst Finance", "MortgagePlus", "EquityNest Loans", "BrickSolid Finance", "Household Capital"],
// ["Food > Cafe", "Bean There Cafe", "Cuppa Joe's", "The Grind House", "Brewed Awakenings", "Cafe Mocha Bliss"],
// ["Food > Groceries", "FreshFare Market", "GreenGroves", "Harvest Basket", "Urban Eden", "Nature's Pantry"],
// ["Food > Groceries > Alcohol", "BrewCrafters", "Vine & Spirit", "Barrel Select Market", "Hop Haven", "The Liquor Loft"],
// ["Food > Restaurant", "Savor Symphony", "PlateCrafters", "Gastro Globe", "Flavor Voyage", "Culinary Canvas"],
// ["Food > Take Away", "Quick Bites", "GrabN'Go Gourmet", "Speedy Eats", "Dash Dine", "Rapid Relish"],
// ["Hardware", "TechForge", "GadgetWorks", "IronClad Tools", "BuildRight Hardware", "ToolCrafters"],
// ["Health > Eyecare", "VisionPioneers", "ClearSight Optics", "EyeCare Experts", "BrightView Eyecare", "SightMasters"],
// ["Health > Fitness", "PeakForm Gym", "FitQuest Studios", "Vitality Vibe Fitness", "Pulse Athletic Club", "EnergizeWorkouts"],
// ["Health > Insurance > Premium", "SecureLife Premiums", "PrimeProtect Insurance", "Unity Health Premium", "WellCovered", "GuardianLife Premiums"],
// ["Health > Insurance > Refund", "RefundCare Health", "MoneyBack Health Insurance", "ReturnAssure", "PremiumBack", "InsureRefund"],
// ["Health > Medical Services > Denist", "BrightSmile Dental", "OralWellness Center", "DentalCare Associates", "SmileMakers Dentistry", "PearlyCare Dental"],
// ["Health > Medical Services > Doctor", "MediTrust Clinics", "HealthFirst Physicians", "DocCare Practitioners", "PrimaryHealth Providers", "WellnessDoctors"],
// ["Health > Medical Services > Optical", "FocusEye Clinics", "Visionary Optics", "EyeWise Optical", "Sightline Opticians", "ClarityEyecare"],
// ["Health > Pharmacy", "WellPharma", "CareRx Pharmacy", "MediQuick Pharmacy", "HealthHub Drugs", "PillPackPlus"],
// ["Household > Bank Interest", "Saver's Edge Bank", "InterestMax", "GrowthBank", "WealthWise Savings", "EarnMore Bank"],
// ["Household > Department Store", "Everyday Needs", "Household Haven", "AllUnderOneRoof", "Domestic Delights", "FamilyFinds Department Store"],
// ["Household > Electronics", "GizmoGalaxy", "ElectronHive", "TechTrendz", "Digital Den", "GadgetSphere"],
// ["Household > Improvement", "HomeEnhance", "Makeover Masters", "UpgradeSpace", "RenovateRight", "TransformHome"],
// ["Household > Improvement > Garden", "GreenThumb Gardens", "BloomWorks", "GardenGurus", "PlantParadise", "EcoGarden Experts"],
// ["Household > Improvement > Landscaping", "Landscape Legends", "DesignYard", "OutdoorMakeovers", "GroundsGrace", "NatureNest Landscapes"],
// ["Household > Improvement > Pool", "AquaMaster Pools", "BlueHaven PoolWorks", "SplashRight Pools", "ClearWaters Pools", "PoolPros"],
// ["Household > Improvement > Rental Hire", "RentEase Solutions", "LeaseLift", "HireHub Rental Services", "AssetRental Co.", "EquipRent"],
// ["Household > Improvement > Shed", "ShedMakers", "StorageSolutions", "Backyard Builders", "ShelterCraft", "EcoSheds"],
// ["Household > Office Supplies", "OfficeMaximize", "SupplyStation", "DeskDynamics", "Workplace Wonders", "StationeryWorld"],
// ["Household > Pool", "PoolCare Plus", "AquaLife Pools", "SereneWaters", "Backyard Oasis", "PremierPools"],
// ["Household > Rent", "RentRelief", "HomeLease Helpers", "StaySecure Rentals", "LeaseEase", "DwellingsDirect"],
// ["Household > Services > Gardener", "GreenThumbs Gardening", "NatureNurture Gardens", "EcoGardeners", "BloomKeepers", "Leaf & Lawn"],
// ["Household > Services > HVAC", "CoolFlow Solutions", "HeatBeat HVAC", "AirMasters", "ClimateControl Co.", "BreezeTech"],
// ["Household > Services > Handyperson", "HandyHelpers", "FixItRight Services", "CraftsmanConnection", "RepairRangers", "TaskTacklers"],
// ["Household > Services > Pool", "PureWaters Pool Service", "PoolPerfection", "CrystalClear PoolCare", "AquaGuard Services", "BlueWave PoolTech"],
// ["Household > Utilities > Electricity", "BrightEnergy", "VoltHouse Electric", "SparkElectric", "PowerPulse Utilities", "AmpUp Electricity"],
// ["Household > Utilities > Electricity or Gas", "DualFuel Solutions", "EnerMix Utilities", "HybridEnergy Co.", "FlexFuel Services", "PowerCombo Providers"],
// ["Household > Utilities > Gas", "GasGlow Utilities", "FlameFlex Gas", "EcoGas Energy", "BlueFlame Providers", "ThermoGas"],
// ["Household > Utilities > Internet", "NetSphere Providers", "CyberWave Internet", "InfinityOnline", "WebWired Services", "DataStream Networks"],
// ["Household > Utilities > Mobile", "MobileMatters", "ConnectCell", "VoiceData Mobile", "SignalStream", "CellSphere"],
// ["Insurance > Car", "AutoGuard Insurance", "DriveSafe Insure", "CarCare Coverage", "MotorMate", "WheelWell Insurance"],
// ["Insurance > Health", "HealthHaven", "WellnessGuard Insurance", "MediSure", "LifeLine Health Insurance", "CareCover"],
// ["Insurance > Life", "EternalTrust", "LifeSecure Insurance", "EverLast Assurance", "LegacyLife Insurance", "GuardianLife"],
// ["Investment > Property > Net Rent Received", "RentReturn Realty", "IncomeInvest Properties", "LeaseProfit Real Estate", "RentalYield Co.", "PropertyPayouts"],
// ["Misc > Checks Paid", "Checkmate Payments", "QuickCheck Financials", "PayRight Checks", "SecureSend Payments", "CheckFlow Services"],
// ["Misc > Checks Received", "CheckCollect Services", "ReceiveRight", "PaymentPro Checks", "CheckIn Financials", "CashCheck Solutions"],
// ["Online Shopping", "ShopSphere", "EzBuy Online", "ClickCart", "WebMall", "QuickShop Online"],
// ["Personal > Clothing", "StyleSaga", "FashionFront", "WearWell Clothing", "ClothCraft", "TrendThreads"],
// ["Personal > Hairdresser", "StyleStudio Salons", "CutAbove", "HairHaven", "LocksLuxury", "ShearGenius"],
// ["Personal > Hobbies", "HobbyHarbor", "PassionPursuit", "LeisureLabs", "CraftCorner", "SkillSphere"],
// ["Pet > Supplies", "PawPals PetStore", "FurryFriends Supplies", "PetParadise Shop", "AnimalAllies Goods", "CreatureComforts"],
// ["Pet > Vet", "VetVision Care", "PetWell Clinics", "AnimalAid Veterinary", "HealingPaws Vets", "CompanionCare Vet"],
// ["Pet > Vet > Subscription", "VetVantage Plan", "PawsPreventive Care", "HealthyPet Subscription", "VetSecure Plan", "PetHealth Plus"],
// ["Software > Apps", "AppSphere Solutions", "ClickCrafters", "InnovateApps", "AppFlux", "MobileMind"],
// ["Software > General", "CodeCore Technologies", "SoftSync Solutions", "TechTrend Software", "GlobalSoft", "InnovaTech"],
// ["Software > Storage", "CloudKeep Storage", "DataVault", "InfiniteStorage", "SecureSpace", "ArchiveAssist"],
// ["Travel > Air", "SkyHigh Airlines", "CloudSail Flights", "AeroJourney", "WingSpan Airways", "BlueHorizon Airlines"],
// ["Travel > Air > Holiday", "VacayFly", "HolidayWings", "FestiveFlights", "EscapeAir", "LeisureLift Airlines"],
// ["Travel > Air > Inflight", "SkyService Plus", "AirComfort", "JetSet Amenities", "HighFly Inflight", "CloudNine Services"],
// ["Travel > Car > Fines", "FineResolve", "TicketTamer", "PenaltyPayers", "FineFixers", "InfractionSolution"],
// ["Travel > Car > Fuel", "FuelFleet", "GasGo", "PumpPros", "MileageMax", "EcoFuel Stations"],
// ["Travel > Car > Insurance", "AutoShield Insurance", "DriveWell Insure", "CarGuard Coverage", "MotorProtect", "SafeRoads Insurance"],
// ["Travel > Car > Rego", "RegoRenew", "LicenseLink", "AutoRegister", "TagTrack", "VehicleVault"],
// ["Travel > Transport > Parking", "ParkPlace Solutions", "SpaceSaver Parking", "QuickPark", "LotLocator", "UrbanPark"],
// ["Travel > Transport > Public Transit", "TransitTrust", "CityCommute", "PublicPathways", "MetroMover", "UrbanRide"],
// ["Travel > Transport > Rideshare", "RideRight", "ShareWheels", "JourneyJoint", "CommuteConnect", "RidePool"],
// ["Travel > Transport > Tolls", "TollTracker", "PassPath", "TollTrek", "ChargeCheck", "RouteRuler"]
// ]
[
"Transfer > Credit card payment",
"Transfer > Savings",
"Transfer > Shares",
"Transfer > Wire",
"Tax > Payment",
"Tax > Return",
"Income > Interest",
"Income > Investment Dividends",
"Employer > Expense > Reimbursement > FapRetailers",
"Employer > Expense > Reimbursement > BigTech Inc",
"Employer > Expense > Reimbursement > Zippington",
"Employer > Income > FapRetailers",
"Employer > Income > BigTech Inc",
"Employer > Income > Zippington"
]


let cat_details = {}
// let amount_sizes = ["xs","s","m","l","xl"]

function getRandomSize() {
    let random = Math.random(); // Generate a uniformly distributed number in [0, 1)
    if (random < 0.05) return "xs"; // 5%
    else if (random < 0.25) return "s"; // 20%
    else if (random < 0.75) return "m"; // 50%
    else if (random < 0.95) return "l"; // 20%
    else return "xl"; // 5%
}

// function getRandomSize() {
//     let randomAmount = Math.floor(Math.random() * amount_sizes.length)
//     // console.log(randomAmount)
//     return amount_sizes[randomAmount];
// }

for (let cat of merchants) {
    // console.log(arr)
    // let cat = arr.shift()
    // console.log(cat)
    cat_details[cat] = {}
    cat_details[cat]['merchants'] = []
    cat_details[cat]['subscription'] = "no"
    cat_details[cat]['credit'] = "no"
    cat_details[cat]['transfer'] = "no"

    cat_details[cat]['amount'] = getRandomSize()
}

console.log(cat_details)