module.exports = {

  'Transfer > Credit card payment': {
    merchants: [],
    descriptions: [
        "BIGBANK CREDIT CRD AUTOPAY                    PPD ID: $TID",
        "AUTOMATIC PAYMENT - THANK YOU"],
    rules: [
        "BIGBANK CREDIT CRD AUTOPAY",
        "AUTOMATIC PAYMENT - THANK YOU"],
    subscription: 'no',
    credit: 'no',
    amount: 'l'
  },
  'Transfer > Savings': {
    merchants: [],
    descriptions: [
        "Direct Transfer - Payee Mrs Bickus Dickoos (Ref: $TID)",
        "REAL TIME TRANSFER RECD FROM ABA/CONTR BNK-$TID",
        "IB TRANSFER $TID"
      ],
    rules: [ 
        "Direct Transfer - Payee",
        "REAL TIME TRANSFER RECD",
        "IB TRANSFER"
      ],
    subscription: 'no',
    credit: 'no',
    amount: 's'
  },
  'Transfer > Shares': {
    merchants: [],
    descriptions: [
        "ONLINE DOMESTIC WIRE TRANSFER VIA: BIG BANK NA/$TID A/C: WISE US INC NEW YORK NY 10010 US REF: $TID/BNF/$TID/TIME",
        "Direct Credit $TID MASTERBANKY SEC BANK"],
    rules: [
        "ONLINE DOMESTIC WIRE TRANSFER VIA",
        "Direct Credit"
    ],
    subscription: 'no',
    credit: 'no',
    amount: 'xl'
  },
  'Transfer > Wire': {
    merchants: [],
    descriptions: [
      "TRANSFER FROM CHK XXXXX1234",
      "TRANSFER TO SAV XXXXX5678 01/09"],
    rules: [
      "TRANSFER FROM CHK",
      "TRANSFER TO SAV"
    ],
    subscription: 'no',
    credit: 'no',
    amount: 'xl'
  },
  'Tax > Payment': {
    merchants: ["IRS Payment"],
    subscription: 'no',
    credit: 'no',
    amount: 'xl'
  },
  'Tax > Return': {
    merchants: ["IRS Payment"],
    subscription: 'no',
    credit: 'yes',
    amount: 'xl'
  },
  'Income > Interest': {
    merchants: ["Bank Interest Earned"],
    subscription: 'no',
    credit: 'yes',
    amount: 'xs'
  },
  'Income > Investment Dividends': {
    merchants: ["Dividend Payment"],
    subscription: 'no',
    credit: 'yes',
    amount: 'm'
  },
  'Employer > Expense > Reimbursement > FapRetailers': {
    merchants: ["FAP EXPENSE"],
    subscription: 'no',
    credit: 'yes',
    amount: 'l'
  },
  'Employer > Expense > Reimbursement > BigTech Inc': {
    merchants: ["BigTechEXPENSE"],
    subscription: 'no',
    credit: 'yes',
    amount: 'l'
  },
  'Employer > Expense > Reimbursement > Zippington': {
    merchants: ["Zippington"],
    subscription: 'no',
    credit: 'yes',
    amount: 'l'
  },
  'Employer > Income > FapRetailers': {
    merchants: ["Fap Retailers"],
    subscription: 'yes',
    credit: 'yes',
    amount: 'xl'
  },
  'Employer > Income > BigTech Inc': {
    merchants: ["BigTech Inc"],
    subscription: 'yes',
    credit: 'yes',
    amount: 'xl'
  },
  'Employer > Income > Zippington': {
    merchants: ["Zippington"],
    subscription: 'yes',
    credit: 'yes',
    amount: 'xl'
  },
  'Business > Accounting': {
    merchants: [
      'LedgerLogic',
      'NumberNest',
      'AccountAssure',
      'BookBalance',
      'FinanceFirst'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Business > Legal': {
    merchants: [
      'LegalLeverage',
      'RightPath Law',
      'JusticeJunction',
      'LawLadder',
      'CaseClose'
    ],
    subscription: 'no',
    amount: 'l'
  },
  Charity: {
    merchants: [
      'GiveGlow Foundation',
      'HopeHarbor',
      'CharityChain',
      'AidArc',
      'GenerousGestures'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Education > Lunch': {
    merchants: [
      'SchoolMeals Plus',
      'NutriNosh',
      'LunchLearn',
      'EduEats',
      'MealMind'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Education > Miscellaneous': {
    merchants: [
      'EduExtras',
      'LearnLift',
      'ScholarStuff',
      'CampusCollective',
      'StudySundry'
    ],
    subscription: 'no',
    amount: 'xs'
  },
  'Education > School Fees': {
    merchants: [
      'FeeFacilitate',
      'SchoolSpend',
      'EduInvest',
      'PaymentPlan Pro',
      'TuitionTrack'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Education > Tuition': {
    merchants: [
      'TuitionTrend',
      'EduPay',
      'LearnLevy',
      'StudyStipend',
      'CourseCash'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Entertainment > Audio': {
    merchants: [
      'SoundScape',
      'AudioAvenue',
      'EchoEssence',
      'WaveWorks',
      'ListenLuxe'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Entertainment > Books': {
    merchants: [
      'PagePursuit',
      'ReadRealm',
      'BookBounty',
      'LiteraryLounge',
      'NovelNook'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Entertainment > Event Tickets': {
    merchants: [
      'TicketTrove',
      'EventEntry',
      'PassPassage',
      'AdmitAll',
      'EntryEcho'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Entertainment > Games': {
    merchants: [
      'GameGrove',
      'PlayPort',
      'GamerGuild',
      'QuestQuarters',
      'FunForge'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Entertainment > Music': {
    merchants: [
      'MelodyMingle',
      'RhythmRack',
      'SoundSphere',
      'MusicMingle',
      'TuneTrack'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Entertainment > News': {
    merchants: [
      'NewsNest',
      'InformInbox',
      'BulletinBoard',
      'CurrentCrate',
      'ReportRealm'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Entertainment > TV/Movies': {
    merchants: [
      'ScreenStream',
      'FlickField',
      'ShowShare',
      'MovieMingle',
      'VisionVault'
    ],
    subscription: 'yes',
    amount: 's'
  },
  'Entertainment > Videos': {
    merchants: [
      'VidVortex',
      'ClipCircle',
      'StreamSpace',
      'VisionView',
      'ReelReach'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Financial > Bank Fees': {
    merchants: [
      'FeeFighters',
      'ChargeCheck',
      'BankBite',
      'CostCurb',
      'DeductDetect'
    ],
    subscription: 'no',
    amount: 'xs'
  },
  'Financial > Bank Fees > ATM Fee': {
    merchants: [
      'ATMAdvantage',
      'CashAccess Charge',
      'WithdrawWin',
      'FeeFreedom',
      'ATMAnswer'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Financial > Bank Fees > Waived': {
    merchants: [
      'WaiveWave',
      'ChargeChaser',
      'FeeForgive',
      'CostClear',
      'DeductDrop'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Financial > Interest': {
    merchants: [
      'InterestInflux',
      'ProfitPulse',
      'YieldYard',
      'GainGround',
      'EarningEdge'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Financial > Investment > Acquisition > Shares': {
    merchants: [
      'ShareSweep',
      'EquityEarn',
      'StockSurge',
      'AssetAccrue',
      'HoldingsHike'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Financial > Investment > Dividends': {
    merchants: [
      'DividendDrive',
      'ProfitPortion',
      'YieldYacht',
      'IncomeIncrease',
      'PayoutPeak'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Financial > Investment > Proceeds > Shares': {
    merchants: [
      'Quantum Equity Partners',
      'Fusion Investments',
      'Nebula Capital',
      'Orbit Ventures',
      'Starlight Funds'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Financial > Investment > Proceeds > Vanguard 529': {
    merchants: [
      'Nova Education Fund',
      'Bright Future 529',
      'Horizon Scholars Fund',
      'EduGrow Investments',
      'Learn & Prosper 529'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Financial > Mortgage Payment': {
    merchants: [
      'HomeFirst Finance',
      'MortgagePlus',
      'EquityNest Loans',
      'BrickSolid Finance',
      'Household Capital'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Food > Cafe': {
    merchants: [
      'Bean There Cafe',
      "Cuppa Joe's",
      'The Grind House',
      'Brewed Awakenings',
      'Cafe Mocha Bliss'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Food > Groceries': {
    merchants: [
      'FreshFare Market',
      'GreenGroves',
      'Harvest Basket',
      'Urban Eden',
      "Nature's Pantry"
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Food > Groceries > Alcohol': {
    merchants: [
      'BrewCrafters',
      'Vine & Spirit',
      'Barrel Select Market',
      'Hop Haven',
      'The Liquor Loft'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Food > Restaurant': {
    merchants: [
      'Savor Symphony',
      'PlateCrafters',
      'Gastro Globe',
      'Flavor Voyage',
      'Culinary Canvas'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Food > Take Away': {
    merchants: [
      'Quick Bites',
      "GrabN'Go Gourmet",
      'Speedy Eats',
      'Dash Dine',
      'Rapid Relish'
    ],
    subscription: 'no',
    amount: 's'
  },
  Hardware: {
    merchants: [
      'TechForge',
      'GadgetWorks',
      'IronClad Tools',
      'BuildRight Hardware',
      'ToolCrafters'
    ],
    subscription: 'no',
    amount: 'xs'
  },
  'Health > Eyecare': {
    merchants: [
      'VisionPioneers',
      'ClearSight Optics',
      'EyeCare Experts',
      'BrightView Eyecare',
      'SightMasters'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Health > Fitness': {
    merchants: [
      'PeakForm Gym',
      'FitQuest Studios',
      'Vitality Vibe Fitness',
      'Pulse Athletic Club',
      'EnergizeWorkouts'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Health > Insurance > Premium': {
    merchants: [
      'SecureLife Premiums',
      'PrimeProtect Insurance',
      'Unity Health Premium',
      'WellCovered',
      'GuardianLife Premiums'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Health > Insurance > Refund': {
    merchants: [
      'RefundCare Health',
      'MoneyBack Health Insurance',
      'ReturnAssure',
      'PremiumBack',
      'InsureRefund'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Health > Medical Services > Denist': {
    merchants: [
      'BrightSmile Dental',
      'OralWellness Center',
      'DentalCare Associates',
      'SmileMakers Dentistry',
      'PearlyCare Dental'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Health > Medical Services > Doctor': {
    merchants: [
      'MediTrust Clinics',
      'HealthFirst Physicians',
      'DocCare Practitioners',
      'PrimaryHealth Providers',
      'WellnessDoctors'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Health > Medical Services > Optical': {
    merchants: [
      'FocusEye Clinics',
      'Visionary Optics',
      'EyeWise Optical',
      'Sightline Opticians',
      'ClarityEyecare'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Health > Pharmacy': {
    merchants: [
      'WellPharma',
      'CareRx Pharmacy',
      'MediQuick Pharmacy',
      'HealthHub Drugs',
      'PillPackPlus'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Household > Bank Interest': {
    merchants: [
      "Saver's Edge Bank",
      'InterestMax',
      'GrowthBank',
      'WealthWise Savings',
      'EarnMore Bank'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Household > Department Store': {
    merchants: [
      'Everyday Needs',
      'Household Haven',
      'AllUnderOneRoof',
      'Domestic Delights',
      'FamilyFinds Department Store'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Household > Electronics': {
    merchants: [
      'GizmoGalaxy',
      'ElectronHive',
      'TechTrendz',
      'Digital Den',
      'GadgetSphere'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Household > Improvement': {
    merchants: [
      'HomeEnhance',
      'Makeover Masters',
      'UpgradeSpace',
      'RenovateRight',
      'TransformHome'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Household > Improvement > Garden': {
    merchants: [
      'GreenThumb Gardens',
      'BloomWorks',
      'GardenGurus',
      'PlantParadise',
      'EcoGarden Experts'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Household > Improvement > Landscaping': {
    merchants: [
      'Landscape Legends',
      'DesignYard',
      'OutdoorMakeovers',
      'GroundsGrace',
      'NatureNest Landscapes'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Household > Improvement > Pool': {
    merchants: [
      'AquaMaster Pools',
      'BlueHaven PoolWorks',
      'SplashRight Pools',
      'ClearWaters Pools',
      'PoolPros'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Household > Improvement > Rental Hire': {
    merchants: [
      'RentEase Solutions',
      'LeaseLift',
      'HireHub Rental Services',
      'AssetRental Co.',
      'EquipRent'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Household > Improvement > Shed': {
    merchants: [
      'ShedMakers',
      'StorageSolutions',
      'Backyard Builders',
      'ShelterCraft',
      'EcoSheds'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Household > Office Supplies': {
    merchants: [
      'OfficeMaximize',
      'SupplyStation',
      'DeskDynamics',
      'Workplace Wonders',
      'StationeryWorld'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Household > Pool': {
    merchants: [
      'PoolCare Plus',
      'AquaLife Pools',
      'SereneWaters',
      'Backyard Oasis',
      'PremierPools'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Household > Rent': {
    merchants: [
      'RentRelief',
      'HomeLease Helpers',
      'StaySecure Rentals',
      'LeaseEase',
      'DwellingsDirect'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Household > Services > Gardener': {
    merchants: [
      'GreenThumbs Gardening',
      'NatureNurture Gardens',
      'EcoGardeners',
      'BloomKeepers',
      'Leaf & Lawn'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Household > Services > HVAC': {
    merchants: [
      'CoolFlow Solutions',
      'HeatBeat HVAC',
      'AirMasters',
      'ClimateControl Co.',
      'BreezeTech'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Household > Services > Handyperson': {
    merchants: [
      'HandyHelpers',
      'FixItRight Services',
      'CraftsmanConnection',
      'RepairRangers',
      'TaskTacklers'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Household > Services > Pool': {
    merchants: [
      'PureWaters Pool Service',
      'PoolPerfection',
      'CrystalClear PoolCare',
      'AquaGuard Services',
      'BlueWave PoolTech'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Household > Utilities > Electricity': {
    merchants: [
      'BrightEnergy',
      'VoltHouse Electric',
      'SparkElectric',
      'PowerPulse Utilities',
      'AmpUp Electricity'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Household > Utilities > Electricity or Gas': {
    merchants: [
      'DualFuel Solutions',
      'EnerMix Utilities',
      'HybridEnergy Co.',
      'FlexFuel Services',
      'PowerCombo Providers'
    ],
    subscription: 'yes',
    amount: 'xs'
  },
  'Household > Utilities > Gas': {
    merchants: [
      'GasGlow Utilities',
      'FlameFlex Gas',
      'EcoGas Energy',
      'BlueFlame Providers',
      'ThermoGas'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Household > Utilities > Internet': {
    merchants: [
      'NetSphere Providers',
      'CyberWave Internet',
      'InfinityOnline',
      'WebWired Services',
      'DataStream Networks'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Household > Utilities > Mobile': {
    merchants: [
      'MobileMatters',
      'ConnectCell',
      'VoiceData Mobile',
      'SignalStream',
      'CellSphere'
    ],
    subscription: 'yes',
    amount: 's'
  },
  'Insurance > Car': {
    merchants: [
      'AutoGuard Insurance',
      'DriveSafe Insure',
      'CarCare Coverage',
      'MotorMate',
      'WheelWell Insurance'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Insurance > Health': {
    merchants: [
      'HealthHaven',
      'WellnessGuard Insurance',
      'MediSure',
      'LifeLine Health Insurance',
      'CareCover'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Insurance > Life': {
    merchants: [
      'EternalTrust',
      'LifeSecure Insurance',
      'EverLast Assurance',
      'LegacyLife Insurance',
      'GuardianLife'
    ],
    subscription: 'yes',
    amount: 's'
  },
  'Investment > Property > Net Rent Received': {
    merchants: [
      'RentReturn Realty',
      'IncomeInvest Properties',
      'LeaseProfit Real Estate',
      'RentalYield Co.',
      'PropertyPayouts'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Misc > Checks Paid': {
    merchants: [
      'Checkmate Payments',
      'QuickCheck Financials',
      'PayRight Checks',
      'SecureSend Payments',
      'CheckFlow Services'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Misc > Checks Received': {
    merchants: [
      'CheckCollect Services',
      'ReceiveRight',
      'PaymentPro Checks',
      'CheckIn Financials',
      'CashCheck Solutions'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Online Shopping': {
    merchants: [
      'ShopSphere',
      'EzBuy Online',
      'ClickCart',
      'WebMall',
      'QuickShop Online'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Personal > Clothing': {
    merchants: [
      'StyleSaga',
      'FashionFront',
      'WearWell Clothing',
      'ClothCraft',
      'TrendThreads'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Personal > Hairdresser': {
    merchants: [
      'StyleStudio Salons',
      'CutAbove',
      'HairHaven',
      'LocksLuxury',
      'ShearGenius'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Personal > Hobbies': {
    merchants: [
      'HobbyHarbor',
      'PassionPursuit',
      'LeisureLabs',
      'CraftCorner',
      'SkillSphere'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Pet > Supplies': {
    merchants: [
      'PawPals PetStore',
      'FurryFriends Supplies',
      'PetParadise Shop',
      'AnimalAllies Goods',
      'CreatureComforts'
    ],
    subscription: 'no',
    amount: 'l'
  },
  'Pet > Vet': {
    merchants: [
      'VetVision Care',
      'PetWell Clinics',
      'AnimalAid Veterinary',
      'HealingPaws Vets',
      'CompanionCare Vet'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Pet > Vet > Subscription': {
    merchants: [
      'VetVantage Plan',
      'PawsPreventive Care',
      'HealthyPet Subscription',
      'VetSecure Plan',
      'PetHealth Plus'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Software > Apps': {
    merchants: [
      'AppSphere Solutions',
      'ClickCrafters',
      'InnovateApps',
      'AppFlux',
      'MobileMind'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Software > General': {
    merchants: [
      'CodeCore Technologies',
      'SoftSync Solutions',
      'TechTrend Software',
      'GlobalSoft',
      'InnovaTech'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Software > Storage': {
    merchants: [
      'CloudKeep Storage',
      'DataVault',
      'InfiniteStorage',
      'SecureSpace',
      'ArchiveAssist'
    ],
    subscription: 'yes',
    amount: 'm'
  },
  'Travel > Air': {
    merchants: [
      'SkyHigh Airlines',
      'CloudSail Flights',
      'AeroJourney',
      'WingSpan Airways',
      'BlueHorizon Airlines'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Travel > Air > Holiday': {
    merchants: [
      'VacayFly',
      'HolidayWings',
      'FestiveFlights',
      'EscapeAir',
      'LeisureLift Airlines'
    ],
    subscription: 'no',
    amount: 'xl'
  },
  'Travel > Air > Inflight': {
    merchants: [
      'SkyService Plus',
      'AirComfort',
      'JetSet Amenities',
      'HighFly Inflight',
      'CloudNine Services'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Travel > Car > Fines': {
    merchants: [
      'FineResolve',
      'TicketTamer',
      'PenaltyPayers',
      'FineFixers',
      'InfractionSolution'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Travel > Car > Fuel': {
    merchants: [
      'FuelFleet',
      'GasGo',
      'PumpPros',
      'MileageMax',
      'EcoFuel Stations'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Travel > Car > Insurance': {
    merchants: [
      'AutoShield Insurance',
      'DriveWell Insure',
      'CarGuard Coverage',
      'MotorProtect',
      'SafeRoads Insurance'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Travel > Car > Rego': {
    merchants: [
      'RegoRenew',
      'LicenseLink',
      'AutoRegister',
      'TagTrack',
      'VehicleVault'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Travel > Transport > Parking': {
    merchants: [
      'ParkPlace Solutions',
      'SpaceSaver Parking',
      'QuickPark',
      'LotLocator',
      'UrbanPark'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Travel > Transport > Public Transit': {
    merchants: [
      'TransitTrust',
      'CityCommute',
      'PublicPathways',
      'MetroMover',
      'UrbanRide'
    ],
    subscription: 'no',
    amount: 'm'
  },
  'Travel > Transport > Rideshare': {
    merchants: [
      'RideRight',
      'ShareWheels',
      'JourneyJoint',
      'CommuteConnect',
      'RidePool'
    ],
    subscription: 'no',
    amount: 's'
  },
  'Travel > Transport > Tolls': {
    merchants: [
      'TollTracker',
      'PassPath',
      'TollTrek',
      'ChargeCheck',
      'RouteRuler'
    ],
    subscription: 'no',
    amount: 'l'
  }
  
}
