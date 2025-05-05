import React, {useState, useEffect} from 'react';
import type {JSX} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient'; // Install this library if not already installed
import {BankData} from './types';
import RNBootSplash from "react-native-bootsplash";

// First update the ValidationResult type to handle both single and multiple accounts
type ValidationResult = {
  isValid: boolean;
  message?: string;
  // Single account response fields
  account_number?: string;
  account_name?: string;
  first_name?: string;
  last_name?: string;
  other_name?: string;
  bank_name?: string;
  bank_code?: string;
  // Multiple accounts response field
  accounts?: Array<{
    account_number: string;
    account_name: string;
    first_name?: string;
    last_name?: string;
    other_name?: string;
    bank_name: string;
    bank_code: string;
  }>;
};

// Add this type at the top with other type definitions
type WebSocketMessage = {
  account?: {
    account_number: string;
    account_name: string;
    first_name?: string;
    last_name?: string;
    other_name?: string;
    bank_name: string;
    bank_code: string;
  };
  final: boolean;
  error?: string;
};

export default function App(): JSX.Element {
  useEffect(() => {
    const initApp = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        // You can add more initialization logic here
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    RNBootSplash.hide({ fade: true });
  }, []);

  const [accountNumber, setAccountNumber] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true); // Add initializing state
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banks, setBanks] = useState<BankData>({});
  const [initError, setInitError] = useState<string | null>(null);
  const [bankSearch, setBankSearch] = useState<string>(''); // Add this with the other useState declarations at the top of the component

  // At the component level, add a WebSocket ref
  const wsRef = React.useRef<WebSocket | null>(null);

  // At component level, add a search params ref to track current search
  const searchParamsRef = React.useRef<{
    accountNumber: string;
    bankCode: string;
    name: string;
  } | null>(null);

  // At component level, add a pending message ref
  const pendingMessageRef = React.useRef<any>(null);

  // Load bank data when component mounts
  useEffect(() => {
    console.log('App mounting, initializing bank data...');

    try {
      const bankData: BankData = {
        '000034': 'SIGNATURE BANK',
        '000036': 'OPTIMUS BANK',
        '000001': 'STERLING BANK',
        '000002': 'KEYSTONE BANK',
        '000003': 'FIRST CITY MONUMENT BANK',
        '000004': 'UNITED BANK FOR AFRICA',
        '000006': 'JAIZ BANK',
        '000007': 'FIDELITY BANK',
        '000008': 'POLARIS BANK',
        '000009': 'CITI BANK',
        '000010': 'ECOBANK',
        '000011': 'UNITY BANK',
        '000012': 'STANBIC IBTC BANK',
        '000013': 'GTBANK PLC',
        '000014': 'ACCESS BANK',
        '000015': 'ZENITH BANK',
        '000016': 'FIRST BANK OF NIGERIA',
        '000017': 'WEMA BANK',
        '000018': 'UNION BANK',
        '000019': 'ENTERPRISE BANK',
        '000021': 'STANDARD CHARTERED BANK',
        '000022': 'SUNTRUST BANK',
        '000023': 'PROVIDUS BANK',
        '060001': 'CORONATION MERCHANT BANK',
        '070001': 'NPF MICROFINANCE BANK',
        '070002': 'FORTIS MICROFINANCE BANK',
        '070008': 'PAGE MFBANK',
        '090001': 'ASO SAVINGS',
        '090003': 'JUBILEE LIFE',
        '090006': 'SAFETRUST',
        '090107': 'FIRST TRUST MORTGAGE BANK PLC',
        '090108': 'NEW PRUDENTIAL BANK',
        '100002': 'PAGA',
        '100003': 'PARKWAY-READYCASH',
        '100005': 'CELLULANT',
        '100006': 'ETRANZACT',
        '100007': 'STANBIC IBTC @EASE WALLET',
        '100008': 'ECOBANK XPRESS ACCOUNT',
        '100009': 'GT MOBILE',
        '100010': 'TEASY MOBILE',
        '090267': 'KUDA MICROFINANCE BANK',
        '100012': 'VT NETWORKS',
        '100036': 'KEGOW(CHAMSMOBILE)',
        '100039': 'PAYSTACK-TITAN',
        '100016': 'FORTIS MOBILE',
        '100017': 'HEDONMARK',
        '100018': 'ZENITH MOBILE',
        '100019': 'FIDELITY MOBILE',
        '100020': 'MONEY BOX',
        '100021': 'EARTHOLEUM',
        '100022': 'STERLING MOBILE',
        '100023': 'TAGPAY',
        '100024': 'IMPERIAL HOMES MORTGAGE BANK',
        '999999': 'NIP VIRTUAL BANK',
        '090111': 'FINATRUST MICROFINANCE BANK',
        '090112': 'SEED CAPITAL MICROFINANCE BANK',
        '090115': 'IBANK MICROFINANCE BANK',
        '090114': 'EMPIRE TRUST MICROFINANCE BANK',
        '090113': 'MICROVIS MICROFINANCE BANK ',
        '090116': 'AMML MICROFINANCE BANK ',
        '090117': 'BOCTRUST MICROFINANCE BANK LIMITED',
        '090120': 'WETLAND  MICROFINANCE BANK',
        '090118': 'IBILE MICROFINANCE BANK',
        '090125': 'REGENT MICROFINANCE BANK',
        '090128': 'NDIORAH MICROFINANCE BANK',
        '090127': 'BC KASH MICROFINANCE BANK',
        '090121': 'HASAL MICROFINANCE BANK',
        '060002': 'FBNQUEST MERCHANT BANK',
        '090132': 'RICHWAY MICROFINANCE BANK',
        '090135': 'PERSONAL TRUST MICROFINANCE BANK',
        '090136': 'MICROCRED MICROFINANCE BANK',
        '090122': 'GOWANS MICROFINANCE BANK',
        '000024': 'RAND MERCHANT BANK',
        '090142': 'YES MICROFINANCE BANK',
        '090140': 'SAGAMU MICROFINANCE BANK',
        '090129': 'MONEY TRUST MICROFINANCE BANK',
        '070012': 'LAGOS BUILDING AND INVESTMENT COMPANY',
        '070009': 'GATEWAY MORTGAGE BANK',
        '070010': 'ABBEY MORTGAGE BANK',
        '070014': 'FIRST GENERATION MORTGAGE BANK',
        '070013': 'PLATINUM MORTGAGE BANK',
        '070016': 'INFINITY TRUST MORTGAGE BANK',
        '090119': 'OHAFIA MICROFINANCE BANK',
        '090124': 'XSLNCE MICROFINANCE BANK',
        '090130': 'CONSUMER MICROFINANCE BANK',
        '090131': 'ALLWORKERS MICROFINANCE BANK',
        '090134': 'ACCION MICROFINANCE BANK',
        '090139': 'VISA MICROFINANCE BANK',
        '090141': 'CHIKUM MICROFINANCE BANK',
        '090143': 'APEKS MICROFINANCE BANK',
        '090144': 'CIT MICROFINANCE BANK',
        '090145': 'FULLRANGE MICROFINANCE BANK',
        '090153': 'FFS MICROFINANCE BANK',
        '090160': 'ADDOSSER MICROFINANCE BANK',
        '090126': 'FIDFUND MICROFINANCE BANK',
        '100028': 'AG MORTGAGE BANK',
        '090137': 'PECANTRUST MICROFINANCE BANK',
        '090148': 'BOWEN MICROFINANCE BANK',
        '090158': 'FUTO MICROFINANCE BANK',
        '070011': 'REFUGE MORTGAGE BANK',
        '070015': 'BRENT MORTGAGE BANK',
        '090138': 'ROYAL EXCHANGE MICROFINANCE BANK',
        '090147': 'HACKMAN MICROFINANCE BANK',
        '090146': 'TRIDENT MICROFINANCE BANK',
        '090157': 'INFINITY MICROFINANCE BANK',
        '090159': 'CREDIT AFRIQUE MICROFINANCE BANK',
        '090156': 'E-BARCS MICROFINANCE BANK',
        '090110': 'VFD MFB',
        '100030': 'ECOMOBILE',
        '100029': 'INNOVECTIVES KESH',
        '090097': 'EKONDO MICROFINANCE BANK',
        '090150': 'VIRTUE MICROFINANCE BANK',
        '090149': 'IRL MICROFINANCE BANK',
        '100031': 'FCMB MOBILE',
        '090151': 'MUTUAL TRUST MICROFINANCE BANK',
        '090161': 'OKPOGA MICROFINANCE BANK',
        '060003': 'NOVA MERCHANT BANK',
        '090154': 'CEMCS MICROFINANCE BANK',
        '090167': 'DAYLIGHT MICROFINANCE BANK',
        '070017': 'HAGGAI MORTGAGE BANK LIMITED',
        '090171': 'MAINSTREET MICROFINANCE BANK',
        '090178': 'GREENBANK MICROFINANCE BANK',
        '090179': 'FAST MICROFINANCE BANK',
        '090177': 'LAPO MICROFINANCE BANK',
        '000020': 'HERITAGE BANK',
        '090251': 'UNIVERSITY OF NIGERIA, NSUKKA MICROFINANCE BANK',
        '090196': 'PENNYWISE MICROFINANCE BANK ',
        '090197': 'ABU MICROFINANCE BANK ',
        '090194': 'NIRSAL NATIONAL MICROFINANCE BANK',
        '090176': 'BOSAK MICROFINANCE BANK',
        '090172': 'ASTRAPOLARIS MICROFINANCE BANK',
        '090261': 'QUICKFUND MICROFINANCE BANK',
        '090259': 'ALEKUN MICROFINANCE BANK',
        '090198': 'RENMONEY MICROFINANCE BANK ',
        '090262': 'STELLAS MICROFINANCE BANK ',
        '090205': 'NEW DAWN MICROFINANCE BANK',
        '090169': 'ALPHA KAPITAL MICROFINANCE BANK ',
        '090264': 'AUCHI MICROFINANCE BANK ',
        '090270': 'AB MICROFINANCE BANK ',
        '090263': 'NIGERIAN NAVY MICROFINANCE BANK ',
        '090258': 'IMO STATE MICROFINANCE BANK',
        '090276': 'TRUSTFUND MICROFINANCE BANK ',
        '090706': 'UCEE MFB',
        '090701': 'ISUA MFB',
        '090708': 'TransPay MICROFINANCE BANK ',
        '090445': 'CAPSTONE MF BANK',
        '090596': 'DAL MICROFINANCE BANK ',
        '000040': 'UBA MONI',
        '090710': 'ILE-OLUJI MICROFINANCE BANK',
        '090716': 'TENN MICROFINANCE BANK',
        '090725': 'IHALA MICROFINANCE BANK',
        '050019': 'ZEDVANCE FINANCE LIMITED',
        '090700': 'OMAK MICROFINANCE BANK',
        '090698': 'AKALABO MICROFINANCE BANK ',
        '090195': 'GROOMING MICROFINANCE BANK',
        '090714': 'TOFA MICROFINANCE BANK',
        '090712': 'EMAAR MICROFINANCE BANK',
        '090711': 'THE MILLENNIUM MICROFINANCE BANK',
        '090260': 'ABOVE ONLY MICROFINANCE BANK ',
        '090272': 'OLABISI ONABANJO UNIVERSITY MICROFINANCE ',
        '090268': 'ADEYEMI COLLEGE STAFF MICROFINANCE BANK',
        '090280': 'MEGAPRAISE MICROFINANCE BANK',
        '000026': 'TAJ BANK',
        '090282': 'ARISE MICROFINANCE BANK',
        '090274': 'PRESTIGE MICROFINANCE BANK',
        '090278': 'GLORY MICROFINANCE BANK',
        '090188': 'BAINES CREDIT MICROFINANCE BANK',
        '000005': 'ACCESS(DIAMOND) BANK',
        '090289': 'PILLAR MICROFINANCE BANK',
        '090286': 'SAFE HAVEN MICROFINANCE BANK',
        '090292': 'AFEKHAFE MICROFINANCE BANK',
        '000027': 'GLOBUS BANK',
        '090285': 'FIRST OPTION MICROFINANCE BANK',
        '090296': 'POLYUNWANA MICROFINANCE BANK',
        '090295': 'OMIYE MICROFINANCE BANK',
        '090287': 'ASSETMATRIX MICROFINANCE BANK',
        '000025': 'TITAN TRUST BANK',
        '090271': 'LAVENDER MICROFINANCE BANK',
        '090290': 'FCT MICROFINANCE BANK',
        '090279': 'IKIRE MICROFINANCE BANK',
        '090303': 'PURPLEMONEY MICROFINANCE BANK',
        '100052': 'ACCESS YELLO & BETA',
        '090123': 'TRUSTBANC J6 MICROFINANCE BANK LIMITED',
        '090305': 'SULSPAP MICROFINANCE BANK',
        '090166': 'ESO-E MICROFINANCE BANK',
        '090273': 'EMERALD MICROFINANCE BANK',
        '100013': 'ACCESS MONEY',
        '090297': 'ALERT MICROFINANCE BANK',
        '090308': 'BRIGHTWAY MICROFINANCE BANK',
        '100033': 'PALMPAY',
        '090325': 'SPARKLE',
        '090326': 'BALOGUN GAMBARI MICROFINANCE BANK',
        '090317': 'PATRICKGOLD MICROFINANCE BANK',
        '070019': 'MAYFRESH MORTGAGE BANK',
        '090327': 'TRUST MICROFINANCE BANK',
        '090133': 'AL-BARAKAH MICROFINANCE BANK',
        '090328': 'EYOWO',
        '090304': 'EVANGEL MICROFINANCE BANK ',
        '090332': 'EVERGREEN MICROFINANCE BANK',
        '090333': 'OCHE MICROFINANCE BANK',
        '090364': 'NUTURE MICROFINANCE BANK',
        '100014': 'FIRSTMONIE WALLET',
        '090329': 'NEPTUNE MICROFINANCE BANK',
        '090315': 'U & C MICROFINANCE BANK',
        '090331': 'UNAAB MICROFINANCE BANK',
        '090324': 'IKENNE MICROFINANCE BANK',
        '090321': 'MAYFAIR MICROFINANCE BANK',
        '090322': 'REPHIDIM MICROFINANCE BANK',
        '090299': 'KONTAGORA MICROFINANCE BANK',
        '090360': 'CASHCONNECT MICROFINANCE BANK',
        '090336': 'BIPC MICROFINANCE BANK',
        '090362': 'MOLUSI MICROFINANCE BANK',
        '090372': 'LEGEND MICROFINANCE BANK',
        '090369': 'SEEDVEST MICROFINANCE BANK',
        '090294': 'EAGLE FLIGHT MICROFINANCE BANK',
        '090373': 'THINK FINANCE MICROFINANCE BANK',
        '100001': 'FETS',
        '090374': 'COASTLINE MICROFINANCE BANK',
        '090281': 'MINT-FINEX MFB',
        '090363': 'HEADWAY MICROFINANCE BANK',
        '090377': 'ISALEOYO MICROFINANCE BANK',
        '090378': 'NEW GOLDEN PASTURES MICROFINANCE BANK',
        '400001': 'FSDH',
        '090365': 'CORESTEP MICROFINANCE BANK',
        '090298': 'FEDPOLY NASARAWA MICROFINANCE BANK',
        '090366': 'FIRMUS MICROFINANCE BANK',
        '090383': 'MANNY MICROFINANCE BANK',
        '090391': 'DAVODANI  MICROFINANCE BANK',
        '090389': 'EK-RELIABLE MICROFINANCE BANK',
        '090385': 'GTI MICROFINANCE BANK',
        '090252': 'YOBE MICROFINANCE  BANK',
        '120001': '9 PAYMENT SOLUTIONS BANK',
        '100004': 'OPAY',
        '090175': 'RUBIES MICROFINANCE BANK',
        '090392': 'MOZFIN MICROFINANCE BANK',
        '090386': 'INTERLAND MICROFINANCE BANK',
        '090400': 'FINCA MICROFINANCE BANK',
        '100025': 'KONGAPAY',
        '090370': 'ILISAN MICROFINANCE BANK',
        '090399': 'NWANNEGADI MICROFINANCE BANK',
        '090186': 'GIREI MICROFINANACE BANK',
        '090396': 'OSCOTECH MICROFINANCE BANK',
        '090393': 'BRIDGEWAY MICROFINANACE BANK',
        '090380': 'KREDI MONEY MICROFINANCE BANK ',
        '090401': 'SHERPERD TRUST MICROFINANCE BANK',
        '100032': 'NOWNOW DIGITAL SYSTEMS LIMITED',
        '090394': 'AMAC MICROFINANCE BANK',
        '070007': 'LIVINGTRUST MORTGAGE BANK PLC',
        '100035': 'M36',
        '090283': 'NNEW WOMEN MICROFINANCE BANK ',
        '090408': 'GMB MICROFINANCE BANK',
        '090005': 'TRUSTBOND MORTGAGE BANK',
        '090152': 'NAGARTA MICROFINANCE BANK',
        '090155': 'ADVANS LA FAYETTE  MICROFINANCE BANK',
        '090162': 'STANFORD MICROFINANCE BANK',
        '090164': 'FIRST ROYAL MICROFINANCE BANK',
        '090165': 'PETRA MICROFINANCE BANK',
        '090168': 'GASHUA MICROFINANCE BANK',
        '090173': 'RELIANCE MICROFINANCE BANK',
        '090174': 'MALACHY MICROFINANCE BANK',
        '090180': 'AMJU UNIQUE MICROFINANCE BANK',
        '090189': 'ESAN MICROFINANCE BANK',
        '090190': 'MUTUAL BENEFITS MICROFINANCE BANK',
        '090191': 'KCMB MICROFINANCE BANK',
        '090192': 'MIDLAND MICROFINANCE BANK',
        '090193': 'UNICAL MICROFINANCE BANK',
        '090265': 'LOVONUS MICROFINANCE BANK',
        '090266': 'UNIBEN MICROFINANCE BANK',
        '090269': 'GREENVILLE MICROFINANCE BANK',
        '090277': 'AL-HAYAT MICROFINANCE BANK',
        '090293': 'BRETHREN MICROFINANCE BANK',
        '090310': 'EDFIN MICROFINANCE BANK',
        '090318': 'FEDERAL UNIVERSITY DUTSE MICROFINANCE BANK',
        '090320': 'KADPOLY MICROFINANCE BANK',
        '090323': 'MAINLAND MICROFINANCE BANK',
        '090376': 'APPLE MICROFINANCE BANK',
        '090395': 'BORGU  MICROFINANCE BANK',
        '090398': 'FEDERAL POLYTECHNIC NEKEDE MICROFINANCE BANK',
        '090404': 'OLOWOLAGBA MICROFINANCE BANK',
        '090406': 'BUSINESS SUPPORT MICROFINANCE BANK',
        '090202': 'ACCELEREX NETWORK LIMITED',
        '120002': 'HOPEPSB',
        '090316': 'BAYERO UNIVERSITY MICROFINANCE BANK',
        '090410': 'MARITIME MICROFINANCE BANK',
        '090371': 'AGOSASA MICROFINANCE BANK',
        '100034': 'ZENITH EASY WALLET',
        '070021': 'COOP MORTGAGE BANK',
        '100026': 'CARBON',
        '090435': 'LINKS MICROFINANCE BANK',
        '090433': 'RIGO MICROFINANCE BANK',
        '090402': 'PEACE MICROFINANCE BANK',
        '090436': 'SPECTRUM MICROFINANCE BANK ',
        '060004': 'GREENWICH MERCHANT BANK',
        '000029': 'LOTUS BANK',
        '090426': 'TANGERINE MONEY',
        '000030': 'PARALLEX BANK',
        '090448': 'Moyofade MF Bank',
        '090449': 'REX  Microfinance Bank',
        '090450': 'Kwasu MF Bank',
        '090451': 'ATBU  Microfinance Bank',
        '090452': 'UNILAG  Microfinance Bank',
        '090453': 'Uzondu MF Bank',
        '090454': 'Borstal Microfinance Bank',
        '090471': 'Oluchukwu Microfinance Bank',
        '090472': 'Caretaker Microfinance Bank',
        '090473': 'Assets Microfinance Bank',
        '090709': 'FOCUS MFB',
        '090605': 'MADOBI MFB',
        '090474': 'Verdant Microfinance Bank',
        '090475': 'Giant Stride Microfinance Bank',
        '090476': 'Anchorage Microfinance Bank',
        '090477': 'Light Microfinance Bank',
        '090478': 'Avuenegbe Microfinance Bank',
        '090479': 'First Heritage Microfinance Bank',
        '090480': 'KOLOMONI MICROFINANCE BANK',
        '090481': 'Prisco  Microfinance Bank',
        '090483': 'Ada Microfinance Bank',
        '090484': 'Garki Microfinance Bank',
        '090485': 'SAFEGATE MICROFINANCE BANK',
        '090486': 'Fortress Microfinance Bank',
        '090487': 'Kingdom College  Microfinance Bank',
        '090488': 'Ibu-Aje Microfinance',
        '090489': 'Alvana Microfinance Bank',
        '090455': 'MKOBO MICROFINANCE BANK LTD',
        '090456': 'Ospoly Microfinance Bank',
        '090459': 'Nice Microfinance Bank',
        '090460': 'Oluyole Microfinance Bank',
        '090461': 'Uniibadan Microfinance Bank',
        '090462': 'Monarch Microfinance Bank',
        '090463': 'Rehoboth Microfinance Bank',
        '090464': 'UNIMAID MICROFINANCE BANK',
        '090465': 'Maintrust Microfinance Bank',
        '090466': 'YCT MICROFINANCE BANK',
        '090467': 'Good Neighbours Microfinance Bank',
        '090468': 'Olofin Owena Microfinance Bank',
        '090469': 'Aniocha Microfinance Bank',
        '090446': 'SUPPORT MICROFINANCE BANK',
        '000028': 'CBN',
        '090482': 'CLEARPAY MICROFINANCE BANK',
        '090470': 'DOT MICROFINANCE BANK',
        '090504': 'ZIKORA MICROFINANCE BANK',
        '090506': 'SOLID ALLIANZE MICROFINANCE BANK',
        '000031': 'PREMIUM TRUST  BANK',
        '120004': 'SMARTCASH PAYMENT SERVICE BANK',
        '090405': 'MONIEPOINT MICROFINANCE BANK',
        '070024': 'HOMEBASE MORTGAGE BANK',
        '120003': 'MOMO PAYMENT SERVICE BANK ',
        '090490': 'Chukwunenye  Microfinance Bank',
        '090491': 'Nsuk  Microfinance Bank',
        '090492': 'Oraukwu  Microfinance Bank',
        '090493': 'Iperu Microfinance Bank',
        '090494': 'Boji Boji Microfinance Bank',
        '090495': 'Prospa Capital MICROFINANCE BANK',
        '090496': 'Radalpha Microfinance Bank',
        '090497': 'Palmcoast Microfinance Bank',
        '090498': 'Catland Microfinance Bank',
        '090499': 'Pristine Divitis Microfinance Bank',
        '050002': 'FEWCHORE FINANCE COMPANY LIMITED',
        '070006': 'COVENANT MICROFINANCE BANK',
        '090500': 'Gwong Microfinance Bank',
        '090501': 'Boromu Microfinance Bank',
        '090502': 'Shalom Microfinance Bank',
        '090503': 'Projects Microfinance Bank',
        '090505': 'Nigeria Prisons Microfinance Bank',
        '090507': 'Fims Microfinance Bank',
        '090508': 'Borno Renaissance Microfinance Bank',
        '090509': 'Capitalmetriq Swift Microfinance Bank',
        '090510': 'Umunnachi Microfinance Bank',
        '090511': 'Cloverleaf  Microfinance Bank',
        '090512': 'Bubayero Microfinance Bank',
        '090513': 'Seap Microfinance Bank',
        '090514': 'Umuchinemere Procredit Microfinance Bank',
        '090515': 'Rima Growth Pathway Microfinance Bank ',
        '090516': 'Numo Microfinance Bank',
        '090517': 'Uhuru Microfinance Bank',
        '090518': 'Afemai Microfinance Bank',
        '090519': 'Ibom Fadama Microfinance Bank',
        '090520': 'IC Globalmicrofinance Bank',
        '090521': 'Foresight Microfinance Bank',
        '090523': 'Chase Microfinance Bank',
        '090524': 'Solidrock Microfinance Bank',
        '090525': 'Triple A Microfinance Bank',
        '090526': 'Crescent Microfinance Bank',
        '090527': 'Ojokoro Microfinance Bank',
        '090528': 'Mgbidi Microfinance Bank',
        '090529': 'Bankly Microfinance Bank',
        '090530': 'Confidence Microfinance Bank Ltd',
        '090531': 'Aku Microfinance Bank',
        '090532': 'Ibolo Micorfinance Bank Ltd',
        '090534': 'PolyIbadan Microfinance Bank',
        '090535': 'Nkpolu-Ust Microfinance',
        '090536': 'Ikoyi-Osun Microfinance Bank',
        '090537': 'Lobrem Microfinance Bank',
        '090538': 'Blue Investments Microfinance Bank',
        '090539': 'Enrich Microfinance Bank',
        '090540': 'Aztec Microfinance Bank',
        '090541': 'Excellent Microfinance Bank',
        '090542': 'Otuo Microfinance Bank Ltd',
        '090543': 'Iwoama Microfinance Bank',
        '090544': 'Aspire Microfinance Bank Ltd',
        '090545': 'Abulesoro Microfinance Bank Ltd',
        '090546': 'Ijebu-Ife Microfinance Bank Ltd',
        '090547': 'Rockshield Microfinance Bank',
        '090548': 'Ally Microfinance Bank',
        '090549': 'Kc Microfinance Bank',
        '090550': 'Green Energy Microfinance Bank Ltd',
        '090551': 'Fairmoney Microfinance Bank Ltd',
        '090552': 'Ekimogun Microfinance Bank',
        '090553': 'Consistent Trust Microfinance Bank Ltd',
        '090554': 'Kayvee Microfinance Bank',
        '090555': 'Bishopgate Microfinance Bank',
        '090556': 'Egwafin Microfinance Bank Ltd',
        '090557': 'Lifegate Microfinance Bank Ltd',
        '090558': 'Shongom Microfinance Bank Ltd',
        '090559': 'Shield Microfinance Bank Ltd',
        '090560': 'TANADI MFB (CRUST)',
        '090561': 'Akuchukwu Microfinance Bank Ltd',
        '090562': 'Cedar Microfinance Bank Ltd',
        '090563': 'Balera Microfinance Bank Ltd',
        '090564': 'Supreme Microfinance Bank Ltd',
        '090565': 'Oke-Aro Oredegbe Microfinance Bank Ltd',
        '090566': 'Okuku Microfinance Bank Ltd',
        '090567': 'Orokam Microfinance Bank Ltd',
        '090568': 'Broadview Microfinance Bank Ltd',
        '090569': 'Qube Microfinance Bank Ltd',
        '090570': 'Iyamoye Microfinance Bank Ltd',
        '090571': 'Ilaro Poly Microfinance Bank Ltd',
        '090572': 'Ewt Microfinance Bank',
        '090573': 'Snow Microfinance Bank',
        '090574': 'GOLDMAN MICROFINANCE BANK',
        '090575': 'Firstmidas Microfinance Bank Ltd',
        '090576': 'Octopus Microfinance Bank Ltd',
        '090578': 'Iwade Microfinance Bank Ltd',
        '090579': 'Gbede Microfinance Bank',
        '090580': 'Otech Microfinance Bank Ltd',
        '090581': 'BANC CORP MICROFINANCE BANK',
        '090583': 'STATESIDE MFB',
        '090584': 'Island MFB',
        '090586': 'GOMBE MICROFINANCE BANK LTD',
        '090587': 'Microbiz Microfinance Bank',
        '090588': 'Orisun MFB',
        '090589': 'Mercury MFB',
        '090590': 'WAYA MICROFINANCE BANK LTD',
        '090591': 'Gabsyn Microfinance Bank',
        '090592': 'KANO POLY MFB',
        '090593': 'TASUED MICROFINANCE BANK LTD',
        '090598': 'IBA MFB ',
        '090599': 'Greenacres MFB',
        '090600': 'AVE MARIA MICROFINANCE BANK LTD',
        '090602': 'KENECHUKWU MICROFINANCE BANK',
        '090603': 'Macrod MFB',
        '090606': 'KKU Microfinance Bank',
        '090608': 'Akpo Microfinance Bank',
        '090609': 'Ummah Microfinance Bank ',
        '090610': 'AMOYE MICROFINANCE BANK',
        '090611': 'Creditville Microfinance Bank',
        '090612': 'Medef Microfinance Bank',
        '090613': 'Total Trust Microfinance Bank',
        '090614': 'AELLA MFB',
        '090615': 'Beststar Microfinance Bank',
        '090616': 'RAYYAN Microfinance Bank',
        '090620': 'Iyin Ekiti MFB',
        '090621': 'GIDAUNIYAR ALHERI MICROFINANCE BANK',
        '090623': 'Mab Allianz MFB',
        '090649': 'CASHRITE MICROFINANCE BANK',
        '090657': 'PYRAMID MICROFINANCE BANK',
        '090659': 'MICHAEL OKPARA UNIAGRIC MICROFINANCE BANK',
        '090424': 'ABUCOOP  MICROFINANCE BANK',
        '070025': 'AKWA SAVINGS & LOANS LIMITED',
        '000037': 'ALTERNATIVE BANK LIMITED',
        '090307': 'ARAMOKO MICROFINANCE BANK',
        '090181': 'BALOGUN FULANI  MICROFINANCE BANK',
        '090425': 'BANEX MICROFINANCE BANK',
        '090413': 'BENYSTA MICROFINANCE BANK',
        '090431': 'BLUEWHALES  MICROFINANCE BANK',
        '090444': 'BOI MF BANK',
        '090319': 'BONGHE MICROFINANCE BANK',
        '050006': 'Branch International Finance Company Limited',
        '090415': 'CALABAR MICROFINANCE BANK',
        '999001': 'CBN_TSA',
        '090397': 'CHANELLE BANK',
        '090440': 'CHERISH MICROFINANCE BANK',
        '090416': 'CHIBUEZE MICROFINANCE BANK',
        '090343': 'CITIZEN TRUST MICROFINANCE BANK LTD',
        '090254': 'COALCAMP MICROFINANCE BANK',
        '050001': 'COUNTY FINANCE LTD',
        '090429': 'CROSSRIVER  MICROFINANCE BANK',
        '090414': 'CRUTECH  MICROFINANCE BANK',
        '070023': 'DELTA TRUST MORTGAGE BANK',
        '050013': 'DIGNITY FINANCE',
        '090427': 'EBSU MICROFINANCE BANK',
        '000033': 'ENAIRA',
        '050012': 'ENCO FINANCE',
        '090330': 'FAME MICROFINANCE BANK',
        '050009': 'FAST CREDIT',
        '090409': 'FCMB MICROFINANCE BANK',
        '070026': 'FHA MORTGAGE BANK LTD',
        '090163': 'FIRST MULTIPLE MICROFINANCE BANK',
        '050010': 'FUNDQUEST FINANCIAL SERVICES LTD',
        '090438': 'FUTMINNA MICROFINANCE BANK',
        '090411': 'GIGINYA MICROFINANCE BANK',
        '090441': 'GIWA MICROFINANCE BANK',
        '090335': 'GRANT MF BANK',
        '090291': 'HALACREDIT MICROFINANCE BANK',
        '090418': 'HIGHLAND MICROFINANCE BANK',
        '050005': 'AAA FINANCE',
        '090439': 'IBETO  MICROFINANCE BANK',
        '090350': 'ILLORIN MICROFINANCE BANK',
        '090430': 'ILORA MICROFINANCE BANK',
        '090417': 'IMOWO MICROFINANCE BANK',
        '090434': 'INSIGHT MICROFINANCE BANK',
        '090428': 'ISHIE  MICROFINANCE BANK',
        '090353': 'ISUOFIA MICROFINANCE BANK',
        '090211': 'ITEX INTEGRATED SERVICES LIMITED',
        '090337': 'IYERU OKIN MICROFINANCE BANK LTD',
        '090421': 'IZON MICROFINANCE BANK',
        '090352': 'JESSEFIELD MICROFINANCE BANK',
        '090422': 'LANDGOLD  MICROFINANCE BANK',
        '090420': 'LETSHEGO MFB',
        '090423': 'MAUTECH MICROFINANCE BANK',
        '090432': 'MEMPHIS MICROFINANCE BANK',
        '090275': 'MERIDIAN MICROFINANCE BANK',
        '090349': 'NASARAWA MICROFINANCE BANK',
        '050004': 'NEWEDGE FINANCE LTD',
        '090676': 'NUGGETS MFB',
        '090437': 'OAKLAND MICROFINANCE BANK',
        '090345': 'OAU MICROFINANCE BANK LTD',
        '090390': 'PARKWAY MF BANK',
        '090004': 'PARRALEX MICROFINANCE BANK',
        '090379': 'PENIEL MICORFINANCE BANK LTD',
        '090412': 'PREEMINENT MICROFINANCE BANK',
        '090170': 'RAHAMA MICROFINANCE BANK',
        '090443': 'RIMA MICROFINANCE BANK',
        '050003': 'SAGEGREY FINANCE LIMITED',
        '050008': 'SIMPLE FINANCE LIMITED',
        '090182': 'STANDARD MICROFINANCE BANK',
        '100015': 'KEGOW',
        '100040': 'XPRESS WALLET',
        '070022': 'STB MORTGAGE BANK',
        '090340': 'STOCKCORP  MICROFINANCE BANK',
        '090302': 'SUNBEAM MICROFINANCE BANK',
        '080002': 'TAJWALLET',
        '050007': 'TEKLA FINANCE LTD',
        '050014': 'TRINITY FINANCIAL SERVICES LIMITED',
        '090403': 'UDA MICROFINANCE BANK',
        '090341': 'UNILORIN MICROFINANCE BANK',
        '090338': 'UNIUYO MICROFINANCE BANK',
        '050020': 'VALE FINANCE LIMITED',
        '090419': 'WINVIEW BANK',
        '090631': 'WRA MICROFINANCE BANK',
        '090672': 'BELLABANK MICROFINANCE BANK',
        '090201': 'XPRESS PAYMENTS',
        '120005': 'MONEY MASTER PSB',
        '090703': 'Bokkos MFB',
      };

      console.log(
        'Bank data loaded successfully:',
        Object.keys(bankData).length,
      );
      setBanks(bankData);

      if (Object.keys(bankData).length > 0) {
        setSelectedBank(Object.keys(bankData)[0]);
        console.log('Selected default bank:', Object.keys(bankData)[0]);
      } else {
        console.warn('No banks available to select');
        setInitError('No banks available');
      }
    } catch (err) {
      console.error('Failed to initialize bank data:', err);
      setInitError(err instanceof Error ? err.message : 'Failed to initialize');
    } finally {
      setInitializing(false);
    }
  }, []);

  // Debug when banks or selectedBank changes
  useEffect(() => {
    console.log('Banks object updated:', Object.keys(banks).length);
    console.log('Selected bank:', selectedBank);
  }, [banks, selectedBank]);

  useEffect(() => {
    console.log('Current state:', {
      initializing,
      initError,
      banksLength: Object.keys(banks).length,
      selectedBank,
    });
  }, [initializing, initError, banks, selectedBank]);

  const validateAccountNumber = (text: string): void => {
    // Allow only digits and asterisks
    const cleaned = text.replace(/[^0-9*]/g, '');

    // Limit to 10 characters
    setAccountNumber(cleaned.slice(0, 10));
  };

  const handleSubmit = async (): Promise<void> => {
    // Form validation
    if (!accountNumber.trim()) {
      Alert.alert('Error', 'Please enter an account number');
      return;
    }

    const hasPattern = accountNumber.includes('*');

    if (!selectedBank) {
      Alert.alert('Error', 'Please select a bank');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (hasPattern) {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        const baseUrl = Platform.OS === 'android' 
          ? 'ws://10.0.2.2:8080' 
          : 'ws://localhost:8080';
        
        pendingMessageRef.current = {
          account_number: accountNumber,
          bank_code: selectedBank,
          name,
        };
        
        const ws = new WebSocket(`${baseUrl}/ws/search-account`);
        wsRef.current = ws;

        let localAccounts: ValidationResult['accounts'] = [];
        let isConnected = false;
        let isClosing = false;

        ws.onopen = () => {
          console.log('WebSocket Connected');
          isConnected = true;
          if (pendingMessageRef.current) {
            ws.send(JSON.stringify(pendingMessageRef.current));
            pendingMessageRef.current = null;
          }
        };

        ws.onmessage = (event: MessageEvent) => {
          if (!isConnected || isClosing) return;
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('Received message:', message);

          if (message.error) {
            setError(message.error);
            setLoading(false);
            isClosing = true;
            ws.close();
            return;
          }

          if (message.account && message.account.account_number && 
              message.account.account_name && message.account.bank_name && 
              message.account.bank_code) {
            localAccounts.push(message.account);
            setResult({
              isValid: true,
              accounts: [...localAccounts],
            });
          }

          if (message.final) {
            if (localAccounts.length === 0 && !message.error) {
              setError('No matching accounts found');
            }
            setLoading(false);
            isClosing = true;
            ws.close();
          }
        };

        ws.onerror = (event: Event) => {
          if (!isClosing) {
            console.error('WebSocket error:', event);
            setError('Connection error occurred');
            setLoading(false);
            isClosing = true;
          }
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          isConnected = false;
          if (!isClosing) {
            setLoading(false);
          }
        };
      } else {
        // Use HTTP API for direct account validation
        const baseUrl = Platform.OS === 'android'
          ? 'http://10.0.2.2:8080'
          : 'http://localhost:8080';

        console.log(`Sending request to: ${baseUrl}/api/validate-account`);
        console.log('Request payload:', {
          account_number: accountNumber,
          bank_code: selectedBank,
          name: name,
        });

        const response = await fetch(`${baseUrl}/api/validate-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            account_number: accountNumber,
            bank_code: selectedBank,
            name: name,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (data.isValid) {
          setResult({
            isValid: true,
            account_number: data.account_number,
            account_name: data.account_name,
            first_name: data.first_name,
            last_name: data.last_name,
            other_name: data.other_name,
            bank_name: data.bank_name,
            bank_code: data.bank_code,
          });
        } else {
          setError(data.message || 'Validation failed');
        }
      }
    } catch (err) {
      console.error('Request failed:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to connect to server';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator while initializing
  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if initialization failed
  if (initError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {initError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('About to render, state:', {
    initializing,
    initError,
    banksLength: Object.keys(banks).length,
    selectedBank,
  });

  console.log('Rendering main app UI');

  // Check if banks object is empty
  if (Object.keys(banks).length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No banks available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <LinearGradient
        colors={['#f3e5f5', '#e1bee7']}
        style={styles.gradientBackground}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Account Validator</Text>
              <Text style={styles.subtitle}>
                Verify account details instantly
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>
                Account Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={validateAccountNumber}
                placeholder="Enter account number (e.g., 903***7364)"
                placeholderTextColor="#333"
                keyboardType="default"
                maxLength={10}
              />

              <Text style={styles.label}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter account holder name"
                placeholderTextColor="#333"
              />

              <Text style={styles.label}>
                Select Bank <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={bankSearch}
                  onChangeText={setBankSearch}
                  placeholder="Search banks..."
                  placeholderTextColor="#333"
                  clearButtonMode="while-editing"
                />
                {selectedBank && (
                  <Picker
                    selectedValue={selectedBank}
                    onValueChange={(itemValue: string) =>
                      setSelectedBank(itemValue)
                    }
                    style={[styles.picker, {color: '#333'}]}
                    dropdownIconColor="#333">
                    {(Object.entries(banks) as [string, string][])
                      .filter(([_bankCode, bankName]: [string, string]) =>
                        bankName
                          .toLowerCase()
                          .includes(bankSearch.toLowerCase()),
                      )
                      .map(([bankCode, bankName]: [string, string]) => (
                        <Picker.Item
                          key={bankCode}
                          label={bankName}
                          value={bankCode}
                          color="#333"
                        />
                      ))}
                  </Picker>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Validate Account</Text>
                )}
              </TouchableOpacity>
            </View>

            {(loading || result) && (
              <View style={styles.resultsCard}>
                <Text style={styles.resultTitle}>Results</Text>
                {loading && (
                  <View style={styles.loadingResults}>
                    <ActivityIndicator size="small" color="#6a1b9a" />
                    <Text style={styles.loadingText}>Searching...</Text>
                  </View>
                )}
                {result && !result.isValid && (
                  <View style={styles.messageCard}>
                    <Text style={styles.errorText}>
                      {result.message || 'No matching account found'}
                    </Text>
                  </View>
                )}
                {result && result.isValid && (
                  <>
                    {result.accounts ? (
                      <View style={styles.resultsSection}>
                        <Text style={styles.resultCount}>
                          Found {result.accounts.length} matching accounts:
                        </Text>
                        <View style={styles.accountsList}>
                          {result.accounts.map((account, index) => (
                            <View
                              key={`account-${index}`}
                              style={styles.accountCard}>
                              <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Account:</Text>
                                <Text style={styles.resultValue}>
                                  {account.account_number}
                                </Text>
                              </View>
                              <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Name:</Text>
                                <Text style={styles.resultValue}>
                                  {account.account_name}
                                </Text>
                              </View>
                              <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Bank:</Text>
                                <Text style={styles.resultValue}>
                                  {account.bank_name}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.accountCard}>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Account:</Text>
                          <Text style={styles.resultValue}>
                            {result.account_number}
                          </Text>
                        </View>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Name:</Text>
                          <Text style={styles.resultValue}>
                            {result.account_name}
                          </Text>
                        </View>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Bank:</Text>
                          <Text style={styles.resultValue}>
                            {result.bank_name}
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    // Add padding top for status bar
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16, // Add top margin to header
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6a1b9a',
  },
  subtitle: {
    fontSize: 16,
    color: '#9c27b0',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333333',
    fontWeight: '500',
  },
  required: {
    color: '#d32f2f',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 48,
    color: '#333',
  },
  searchInput: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingHorizontal: 10,
    marginBottom: 8,
    color: '#333',
  },
  button: {
    backgroundColor: '#7b1fa2',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6a1b9a',
    marginBottom: 16,
  },
  resultCount: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  accountCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
    width: '40%',
  },
  resultValue: {
    fontSize: 16,
    color: '#6a1b9a',
    fontWeight: '600',
    flex: 1,
  },
  errorText: {
    color: '#d9534f',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  resultsList: {
    flexGrow: 1,
    height: '100%',
  },
  resultsContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsSection: {
    flex: 1,
    minHeight: 100,
  },
  mainScroll: {
    flex: 1,
    paddingTop: 8, // Add padding to scroll view
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingTop: 8, // Add padding to content
  },
  accountsList: {
    paddingTop: 8,
  },
  loadingResults: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
  },
});
