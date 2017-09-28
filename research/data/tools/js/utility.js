// utility.js
// Mike Van Maele, Talus Analytics LLC
// 28 Sep 2017
//
// Contains utility functions for Canyonlands data processing.
// *Hash tables for function/disease tags and IATI publishers, codes, and similar
// *Conversion and calculation functions that are frequently reused

const Util = {};

Util.calculateAge = (birthday) => { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Save output for the console as JSON
Util.save = function(data, filename){

    if(!data) {
        console.error('Console.save: No data')
        return;
    }

    if(!filename) filename = 'console.json'

        if(typeof data === "object"){
            data = JSON.stringify(data, undefined, 4)
        }

        var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
    };

// IATI standard: Transaction Types (may be old)
Util.old_transaction_type = {"C":"Commitment","D":"Disbursement","E":"Expenditure","IF":"Incoming Funds","IR":"Interest Repayment","LR":"Loan Repayment","R":"Reimbursement","QP":"Purchase of Equity","QS":"Sale of Equity","CG":"Credit Guarantee","11":"11"};

Util.SqlDayToYYYY = (num_days) => {
    const time1 = new Date('1-1-1970');
    const num_msec = num_days * 8.64e+7;
    const time2 = new Date(time1.getTime() + num_msec);
    return time2.getFullYear().toString();
};

// Sums the numbers in an array
Util.sumArr = (arr) => {
    const getSum = (total, num) => {
        return total + num;
    };
    return arr.reduce(getSum);
};

Util.publisher_names = {"21032":"Population Service International","21033":"Transparency International Secretariat","30001":"The Global Alliance for Improved Nutrition","41111":"United Nations Capital Development Fund","41119":"United Nations Population Fund","41120":"UN-Habitat","41122":"United Nations Children's Fund (UNICEF)","41304":"United Nations Educational, Scientific and Cultural Organization (UNESCO)","44000":"The World Bank","46002":"African Development Bank","46004":"Asian Development Bank","47045":"The Global Fund to Fight AIDS, Tuberculosis and Malaria","47111":"Adaptation Fund","47122":"GAVI Alliance","47135":"Climate Investment Funds","NL-KVK-27264198":"ActionAid International","NL-KVK-41217595":"Stichting ActionAId","NP-SWC-27693":"Aasaman Nepal","GB-CHC-274467":"ActionAid UK","GB-CHC-1157009":"Abaseen Foundation UK","GB-CHC-326859":"AbleChildAfrica","US-EIN-042347643":"Abt Associates Inc","GB-CHC-1096908":"Afghanistan and Central Asian Association","GB-CHC-1047501":"Action Against Hunger","UG-RSB-73316":"African Centre for Global Health and Social Transformation","GB-CHC-283302":"Agency for Cooperation and Research in Development (ACORD)","KE-NGC-9381":"Across","GB-COH-04276635":"act4africa","FR-SIRET-4028868160030":"ACTED","GB-COH-294860":"ADD International","PK-VSWA-511-2007":"Acid Survivors Foundation","mz-moj-64vq1":"Ajuda de Desenvolvimento de Povo para Povo (ADPP)","KE-NGC-663":"Adventist Development and Relief Agency (ADRA Somalia)","GB-CHC-1074937":"ADRA-UK","GB-COH-01846493":"AECOM","US-EIN-522044704":"Aeras","GB-CHC-313139":"Africa Educational Trust","FR-3":"Agence Française de Développement","LB-MOI-18291":"Arab foundation for freedoms and equality ","NL-KVK-34148682":"AFEW International ","GB-CHC-1045348":"Afghanaid","NL-KVK-34229026":"Stichting Aflatoun International","GB-CHC-1141028":"AfriKids","GB-CHC-1128267-8":"HelpAge International UK","XI-IATI-ADVZ":"Agência de Desenvolvimento do Vale do Zambeze","NL-KVK-30204842":"AgriProFocus","NL-KVK-41048542":"Agriterra","GB-CHC-1064413":"African Initiatives","XM-DAC-6-4":"AICS - Agenzia Italiana per la Cooperazione allo Sviluppo / Italian Agency for Cooperation and Development","US-501c3-522318905":"AidData","GB-COH-1100897":"Aga Khan Foundation (United Kingdom)","GB-COH-08327972":"Aktis Strategy Ltd","NL-KVK-27327087":"Akvo Foundation","GB-COH-5155300":"Alcis Holdings Limited","MZ-MOJ-203D":"Alfalit","GB-CHC-291691":"All We Can (formerly Methodist Relief and Development Fund) ","NL-KVK-40530953":"Amnesty International The Netherlands","ET-MFA-0001989741":"Amref Health Africa in Ethiopia","GB-CHC-261488":"Amref Health Africa - UK","KE-RCO-C1-61":"Amref Health Africa Headquarters","KE-NCB-93175":"Amref Health Africa in Kenya","MW-NBM-R1527":"Amref Health Africa Malawi","NL-KVK-41150298":"Amref Flying Doctors","UG-NGB-5914-252":"Amref Health Africa in Uganda","BJ-IFU-6201408024805":"The National Association of Municipalities of Benin (ANCB)","MZ-MOJ-F30G1No89":"ANDA","US-EIN-943287156":"Association for Progressive Communication","AF-MOE-1212":"Afghanistan Public Policy Research Organization (APPRO)","BE-GTCF-630789842":"APPRO-Europe","GB-CHC-290836":"APT Action on Poverty","NL-KVK-27248417":"Aqua for All","NG-CAC-5938":"Association for Reproductive and Family Health ","GB-COH-04589451":"ARK (Absolute Return for Kids)","GB-CHC-327421":"Article19","BE-BCE-0447404580":"Avocats Sans Frontières","GB-COH-2732176":"Adam Smith International","GB-CHC-1049160":"Anti-Slavery International","NL-KVK-58279199":"The Access to Nutrition Foundation","GB-COH-01245534":"Atos IT Services Ltd","AU-5":"Australia - Department of  Foreign Affairs and Trade","NL-KVK-34106722":"AWEPA","US-EIN-521291786":"Association for Women's Rights in Development (AWID)","NP-DAO-DANG-18-046/47":"Backward Society Education (BASE)","GB-CHC-1079599":"BasicNeeds","GB-CHC-1108464":"Bees Abroad UK","GB-CHC-1076235":"BBC Media Action","MW-CNM-BCM-CF":"Baylor College of Medicine Children's Foundation Malawi","XM-DAC-2-10":"Belgian Development Cooperation","GB-CHC-1078803":"Bees for Development Trust","GB-SC-044007":"Bioclimate Research and Development","GB-CC-1098893":"Blue Ventures Conservation","DAC-1601":"Bill & Melinda Gates Foundation","XI-IATI-IKI":"International Climate Initiative / BMUB Programmbuero IKI","DE-1":"Germany - Ministry for Economic Cooperation and Development","GB-CHC-1068839":"Bond","NL-KVK-41210098":"Both ENDS","NL-CCI-20081098":"BRAC International","US-EIN-52-1764268":"BSR","BE-BCE_KBO-0264814354":"Belgian development agency (BTC)","GB-CHC-298316":"Build Africa","NP-SWC-27288":"Burns Violence Survivors - Nepal","XI-IATI-CABI":"CABI","GB-CHC-285776":"Catholic Agency For Overseas Development (CAFOD)","GB-CHC-1105851":"Christian Aid","IE-CHY-6998":"Christian Aid Ireland","GB-COH-03259922":"Crown Agents Limited","GB-CHC-1029161":"Camfed International","GB-CHC-1102028":"Canon Collins Trust","GB-COH-05543952":"Cardno Emerging Markets","NL-KVK-41158230":"CARE Nederland","DK-CVR-29439915":"Caritas Denmark","FI-PRO-139407":"Caritas Finland","cbi-nigeria":"The Convention on Business Integrity","NL-KVK-41210820":"Clean Clothes Campaign","NG-CAC-IT-23286":"Centre For Citizens With Disabilities","US-IRS-562339052":"CDA Collaborative Learning Projects","GB-COH-03877777":"CDC Group plc","US-EIN-56-2460366":"Conflict Dynamics International","GB-CHC-1071660":"Cecily's Fund","GB-CHC-293734":"Christian Engineers in Development","GB-CHC-287287":"Centre for Economic Policy Research ","XM-OCHA-CERF":"United Nations Central Emergency Response Fund (CERF)","NL-KVK-32108345":"CHOICE for Youth and Sexuality","US-EIN-54-0536100":"ChildFund International","GB-CHC-328434":"ChildHope UK ","BE-BCE_KBO-0410644946":"Caritas International (Belgium)","GB-CHC-1020488":"Children in Crisis","GB-SC-037597":"CIFAL Scotland ","ciks":"Centre for Indian Knowledge Systems","GB-1-202615":"CARE International UK","NL-KVK-27267681":"Red Cross Red Crescent Climate Centre","NL-KVK-41152832":"Stichting Nederlands Instituut voor Internationale Betrekkingen 'Clingendael'","NL-KVK-40530156":"COC Nederland","GB-CHC-1000717":"CODA International","GB-COH-3799145":"Coffey International Development","GB-CHC-1142516":"ColaLife","GB-CHC-1092236":"Concern Worldwide UK","GB-CHC-1070684":"Cord","NL-KVK-41160054":"Cordaid","GB-COH-8159144":"Construction Sector Transparency Initiative (CoST)","GB-CHC-326568":"Charity Projects Ltd (Comic Relief)","GB-CHC-1055436":"Conciliation Resources","UG-NGB-5914-9186":"CRANE","US-EIN-31-1812979":"CREA USA","US-EIN-13-5563422":"Catholic Relief Services","GB-CHC-1152010":"Child-to-Child ","GB-CHC-272465":"United Purpose","TN-TIN-102123727":"CUAMM Trustees","GB-CHC-1150214":"Carers Worldwide","GB-CHC-1129603":"Cyan International","NL-KVK-41236410":"Dorcas Aid International","GB-COH-1858644":"DAI Europe","NL-KVK-34197379":"dance4life","DK-1":"Denmark - Danida - Danish Ministry of Foreigh Affairs","GPAF-IMP-031":"Development Aid from People to People (DAPP) Malawi","GB-COH-07629751":"Digital Campus","DK-CVR-36980214":"DanChurchAid","NL-KVK-41208813":"Defence for Children International Netherlands - ECPAT Netherlands","GB-CHC-1046001":"Disability and Development Partners","GB-4":"UK - Department of Energy and Climate Change","NL-KVK-27284008":"DECP","GB-CHC-1062638":"Disasters Emergency Committee","GB-7":"UK - Department for Environment, Food and Rural Affairs","GB-COH-08333641":"Delivery Associates Ltd","GB-GOV-1":"UK - Department for International Development (DFID)","NL-KVK-61172863":"Stichting fondsbeheer DGGF lokaal MKB","GB-CHC-1122924":"Developments In Literacy Trust UK","GB-COH-06368740":"Development Initiatives Poverty Research","US-EIN-522043740":"Discovery Learning Alliance, Inc.","IE-CHY-6410":"Dóchas - Irish Association of Non Governmental Development Organisations","GB-GOV-10":"UK - Department of Health (DH)","GB-CHC-1067406":"Doctors of the World UK","US-EIN-27-5026463":"Disability Rights Advocacy Fund","US-EIN-27-5026293":"Disability Rights Fund","ZA-ROC-1999/05072/08":"Desmond Tutu HIV Foundation","GB-9":"UK - Department for Work and Pensions","XI-IATI-EBRD":"European Bank for Reconstruction and Development","XI-IATI-EC_DEVCO":"European Commission - Development and Cooperation-EuropeAid","XI-IATI-EC_ECHO":"European Commission - Humanitarian Aid & Civil Protection","XI-IATI-EC_FPI":"European Commission - Service for Foreign Policy Instruments","XI-IATI-EC_NEAR":"European Commission - Neighbourhood and Enlargement Negotiations","GB-COH-01650169":"Ecorys UK","KE-KROS-270901":"Education Development Trust","GB-CHC-1154085":"Exeter Ethiopia Link","XM-DAC-918-3":"European Investment Bank","XM-DAC-1409":"Enhanced Integrated Framework","BE-BCE_KBO- 0550758080":"European Institute of Peace","GB-CHC-289036":"Emmanuel International UK","NL-KVK-41078390":"European Journalism Centre","GB-OSCR-SC032327":"EMMS International","GB-COH-3578127":"Ethical Trading Initiative","GB-CHC-1089879":"EveryChild","CA-CRA-89980-1815-RR0001":"Engineers Without Borders Canada","GB-CHC-1094478":"Excellent Development","GB-COH-01926828":"Farm Africa","ZW-ES12-WO17/89":"Family Aids Caring Trust","NL-KVK-34141098":"Fairfood International","DE-AG-VR7795":"Fairtrade Labelling Organizations International e.V.","XM-DAC-41301":"Food and Agriculture Organization of the United Nations (FAO)","NI-MIGOB-3602":"Fondo Centroamericano de Mujeres","GB-GOV-3":"UK - Foreign & Commonwealth Office","NP-DAO-27-127/062/063":"Freedom Forum","GB-COH-0277068":"Fauna & Flora International","GB-CHC-328273":"Food for the Hungry UK","CA-4":"Canada Department of Finance / Ministère des Finances Canada","FI-3":"Finland - Ministry of Foreign Affairs","GB-COH-3008440":"Forests Monitor","NL-KVK-27078545":"FMO","GB-CHC-281681":"Friends of the Earth England, Wales and Northern Ireland","GH-DSW-258":"Friends of the Earth-Ghana","NL-KVK-40535338":"Friends of the Earth International","NL-KVK-40530467":"Milieudefensie","US-EIN-131837418":"The Foundation Center","FR-6":"France - Ministry for Europe and Foreign Affairs","GB-CHC-1121273":"FRANK Water","NL-KVK-34308169":"Free a Girl","NL-KVK-52957535":"Free Press Unlimited","US-EIN-47-4128047":"Friends of Publish What You Fund","GB-CHC-291333":"Feed the Minds","NL-KVK-34111374":"Fair Wear Foundation","GB-CHC-250456":"Find Your Feet","CA-3":"Canada - Global Affairs Canada | Affaires mondiales Canada","NP-SWC-13712":"Global Action Nepal","GB-CHC-220949":"British Red Cross","GB-COH-03580586-GEC":"Girls’ Education Challenge – Fund Manager PwC","GB-CHC-1171353":"Global Innovation Fund","NL-KVK-27302841":"Giro555 (Stichting Samenwerkende Hulporganisaties)","ZA-CIPC-2001/005850/08":"Gender Links","US-EIN-300108263":"GlobalGiving.org","NL-KVK-41214768":"Global Network of People Living with HIV (GNP+)","GB-CHC-1107403":"GOAL","XM-DAC-47501":"Global Partnership for Education","NL-KVK-41217404":"GPPAC Foundation","GB-CHC-1139083":"Grow Movement","GB-CHC-1143852":"Hagar International UK","NL-KVK-41207580":"Stichting Health Action International","halo":"The HALO Trust","GB-CHC-1113868":"Hand in Hand International","GB-CHC-1024903":"Hospice Africa Ltd","NL-KVK-41211943":"HealthNet TPO","GB-COH-03054929":"Health Partners International ","NL-KVK-58183167":"HE Foundation","NL-KVK-20093733":"Heifer Nederland","GB-COH-1762840":"HelpAge International","US-EIN-941655673":"The William and Flora Hewlett Foundation","GB-CHC-1117528":"Haiti Hospital Appeal","GB-CHC-1089490":"Hope and Homes for Children","GB-CHC-1017255":"Homeless International","NL-KVK-27290536":"HiiL innovating Justice","GB-CHC-1082565":"Handicap International UK","GB-6":"UK - Home Office","GB-COH-4887855":"HealthProm","GB-CHC-1837621":"Health Poverty Action","ZA-NPO-013484":"Heifer International South Africa","CH-FDJP-CHE-105.834.763":"Helvetas Swiss Intercooperation","GB-COH-06407873":"HTSPE","NL-KVK-30285304":"Sympany+","XI-IATI-035026724":"Hilfswerk Austria Zimbabwe","XI-IATI-IADB":"Inter-American Development Bank","US-EIN-13-3287064NAM":"InterAction's NGO Aid Map","DK-CVR-88136411":"Oxfam IBIS","GB-CHC-1090745":"ICA:UK","NL-KVK-56484038":"ICCO Cooperation","GB-COH-06587734":"InterClimate Network","NL-KVK-41188664":"ICS","XM-DAC-47058":"International IDEA","NL-KVK-53521129":"IDH, the Sustainable Trade Initiative","XM-DAC-47059":"International Development Law Organization","XM-DAC-301-2":"Canada - International Development Research Centre/Centre de recherches pour le développement international","GB-COH-877338":"Institute of Development Studies","GB-CHC-1148404":"Internews Europe ","XM-DAC-41108":"International Fund for Agricultural Development","XM-DAC-903":"International Finance Corporation","GB-CHC-1038860":"International HIV/AIDS Alliance","NL-KVK-41146484":"IHE Delft Institute for Water Education","XM-DAC-41302":"International Labour Organization","GB-CHC-1093861":"International Medical Corps UK","GB-COH-02651349":"IMC WORLDWIDE","XM-DAC-47064":"International Network for Bamboo and Rattan (INBAR)","GB-CHC-1075920":"Indigo Trust","GB-COH-08828458":"International Network of People who Use Drugs (INPUD)","GB-COH-4884328":"Integrity Action","US-EIN-13-3287064":"InterAction","GB-CHC-1122299":"interburns","GB-COH-2153193":"International Alert","US-EIN-550825466":"IntraHealth International","GB-COH-03613839":"IOD PARC","NL-KVK-32037590":"International Procurement Agency","GB-CHC-1114944":"iPartner India","GB-CHC-229476":"International Planned Parenthood Federation","NL-KVK-41151952":"IRC","US-EIN-13-5660870":"The International Rescue Committee","GB-CHC-1065972":"International Rescue Committee UK","XM-DAC-21-1":"Ireland - Department of Foreign Affairs and Trade","GB-CHC-328158":"Islamic Relief Worldwide","GB-COH-1869600":"Itad","BW-CIPA-CO20151011":"International Treatment Preparedness Coalition (ITPC)","XM-DAC-30011":"International Union for Conservation of Nature and Natural Resources","NL-KVK-41180885":"IUCN Nederlands Comité","AU-ACNC-19242959685":"International Women's Development Agency","GB-CHC-1001698":"Interact Worldwide","US-EIN-06-1597-668":"Just Associates","GB-CHC-291167":"Jeevika Trust","XM-DAC-701-8":"Japan International Cooperation Agency (JICA)","GB-CHC-327461":"Karuna Trust","KE-NGC-3372":"I Choose Life Africa","FI-PRO-143138":"Kepa ry","GB-CHC-1142476":"Friends of Kipkelion","NL-KVK-33185213":"Royal Tropical Institute","TZ-BRLA-36057":"KPMG East Africa","GB-COH-OC301540":"KPMG LLP","GB-CHC-1054369":"KwaAfrica","GB-COH-1574821":"Landell Mills","GB-CHC-218186":"Leonard Cheshire Disability","GB-CHC-1048007":"Link Community Development International","GB-SC-SC037959":"Link Community Development Scotland","TR-MOI-27-018-163":"Local Development and Small Projects Support ","GB-COH-4075590":"LEAD International","GB-CHC-1105277":"Learning for Life","GB-CHC-213251":"Lepra","GB-CHC-1101217":"LAMB Health Care Foundation","LR-MPEA-NGO-AC-0298":"YMCA of Liberia","XM-DAC-84":"Lithuania, Ministry of Foreign Affairs","GB-CHC-1125512":"Lively Minds","GB-CHC-800672":"Living Earth Foundation","ZA-NPO-025-359":"mothers2mothers","ES-DIR3-E04585801":"Spain - Ministry of Foreign Affairs and Cooperation","GB-CHC-1083008":"MAG","MZ-MOJ-F2G1No4":"Magariro","NL-KVK-41209946":"Mainline","GB-CHC-1099776":"Malaria Consortium","NL-KVK-41202535":"Mama Cash","IN-":"MAMTA - Health Institute for Mother and Child","GB-COH-04105827":"MannionDaniels","GB-CHC-1126727":"MapAction","GB-SC-SCO45223":"marysmeals","NL-KVK-34219433":"Max Foundation","NL-KVK-855689493":"Stichting Mayday Rescue Foundation","GB-SC-SC030289":"Mercy Corps Europe","GB-COH-FC012665":"McKinsey & Company","XM-DAC-236":"Ministère de l'Economie et des Finances du Bénin","NZ-1":"New Zealand - Ministry of Foreign Affairs and Trade - New Zealand Aid Programme","GB-COH-07669775":"GEMS Education Solutions","IN-ITA-1886":"Micro Insurance Academy","GB-CHC-1120413":"MICAIA","GB-COH-1134415":"MADE in Europe","GB-CHC-1038785":"Mifumi UK","XM-DAC-7":"Netherlands - Ministry of Foreign Affairs","GB-CHC-1104287":"MicroLoan Foundation","NL-KVK-41149831-3":"Mensen met een Missie","MW-MRA-20125995":"Mulanje Mission Hospital","GB-COH-1110949":"Mott MacDonald Limited","NL-KvK-41177601":"Mondiaal FNV","GB-CHC-1079358":"Motivation","GB-COH-RC000346":"UK - Medical Research Council","SL-NRA-1001562-8":"Medical Research Centre (MRC), Sierra Leone","GB-CHC-1091105":"Meningitis Research Foundation","GB-COH-1102208":"Marie Stopes International","GB-COH-00637978":"Maxwell Stamp PLC","GB-CHC-295224":"Muslim Aid","NL-KVK-30195730":"MVO Nederland","GB-COH-02768268":"Nathan Associates London Ltd. ","US-EIN-13-1624114":"Near East Foundation (NEF USA)","GB-CHC-1120932":"Network for Africa","NP-DAO-27-689/063/064":"NGO Federation of Nepal","GB-SC-035314":"Network of International Development Organisations in Scotland","NL-KVK-27189542":"Netherlands Institute for Multiparty Democracy (NIMD)","NL-KVK-41207989":"Aids Fonds - STOP AIDS NOW! - Soa Aids Nederland","NL-KvK-54436222-27541":"CNV Internationaal","NL-KVK-40409352":"Netherlands Red Cross","NO-BRC-971277882":"Norad - Norwegian Agency for Development Cooperation","NO-BRC-871033552":"Norwegian People's Aid","NO-BRC-977538319":"Norwegian Refugee Council","US-EIN-20-4451390":"Natural Resource Governance Institute","GB-COH-00986729":"Natural Resources Institute, University of Greenwich.","GB-COH-SC349355":"Global Network of Sex Work Projects (NSWP)","XM-OCHA-FTS":"OCHA Financial Tracking Service","KR-GOV-021":"Republic of Korea","XI-IATI-OFID":"The OPEC Fund for International Development","US-EIN-20-1173866":"Omidyar Network Fund Inc.","US-DOS-64562614":"One Acre Fund","GB-CHC-1086159":"One to One Children's Fund","NL-KVK-27108436":"Oxfam Novib","IM-CR-024714B":"openmindedly","GB-CHC-000391":"The Open University","GB-COH-3122495":"Oxford Policy Management","GB-COH-05322719":"Opportunity International UK","GB-COH-2695347":"Options Consultancy Services","GB-CHC-1061352":"Orbis Charitable Trust","GB-CHC-202918":"Oxfam GB","IN-MCA-U74999DL2004NPL131340":"Oxfam India","GB-COH-871954":"Practical Action","US-EIN-13-2702768":"Pact ","GB-COH-02394229":"Palladium International Ltd (UK)","NL-KVK-34214586":"partos","NL-KVK-30214009":"PAX","ML-NIF-400100027H":"DNH Mali (Direction Nationale de l’Hydraulique du Mali)","MW-RG-2977":"Palliative Care Support Trust","GB-CHC-1126550":"PEAS (Promoting Equality in African Schools)","GB-CHC-1078768":"People In Aid","NP-DAO-531/062/063":"PHASE Nepal","GB-CHC-1112734":"PHASE Worldwide","GB-CHC-1094272":"Project Harar","XM-DAC-47086":"Private Infrastructure Development Group","CZ-ICO-25755277":"People in Need","FI-PRO-1498487-2":"Plan International Finland","IE-CHY-15037":"Plan Ireland Charitable Assistance Limited","NL-KVK-41198890":"Plan Nederland","GB-COH-1364201":"Plan International UK","US-IRS-13-5661832":"Plan International USA","US-EIN-26-1931968":"Promundo-US","GB-CHC-1125948":"PONT","SK-ZRSR-31784828":"Pontis Foundation","GB-CHC-1059996":"Power International","IN-AR-775":"Pragya India","UG-NGB-63360":"Protecting Families Against HIV/AIDS","GB-COH-04154075":"Penal Reform International","GB-CHC-294329":"Progressio","NL-KVK-41160229":"PUM Netherlands","GB-CHC-1077889":"Pump Aid","GB-COH-03580586":"PwC","GB-COH-07676886":"Publish What You Fund","GB-CHC-1145640":"The Queen Elizabeth Diamond Jubilee Trust","NL-KVK-34200988":"RAIN Foundation","GB-CHC-1058991":"Railway Children","NL-KVK-41022454":"Stichting Red een Kind","GB-COH-4905100":"Resource Extraction Monitoring","GB-CHC-1127488":"Restless Development","GB-CHC-1122799":"Retrak","PK-MSW-633-1965":"Rahnuma-Family Planning Assocation of Pakistan","GB-CHC-1138287":"Rainforest Foundation UK","GB-CHC-1098106":"Relief International UK","GB-CHC-1147083":"Rojiroti UK","GB-CHC-207076":"Royal Society for the Protection of Birds","NL-KVK-41193594":"Rutgers","NL-KVK-27378529":"Netherlands Enterprise Agency","ZA-NPO-061-870":"Southern African Catholic Bishops' Conference Aids Office","SACU":"Send a Cow Uganda","GB-CHC-1043843":"Saferworld","GB-CHC-214779":"The Salvation Army International Development UK","FR-SIRET-77566669600015":"SECOURS CATHOLIQUE - CARITAS FRANCE","GB-SC-SC012302":"Scottish Catholic International Aid Fund (SCIAF)","NL-KVK-41201463":"Save the Children Netherlands","GB-GOV-21":"UK - Scottish Government","GB-CHC-1105489":"The Sabre Charitable Trust","GB-COH-213890":"Save the Children UK","CH-4":"Switzerland - Swiss Agency for Development and Cooperation (SDC)","IE-CHY-6663":"Self Help Africa","GB-CHC-299717":"Send a Cow","GB-CHC-1076497":"Sense International","GB-CHC-1096479":"ShelterBox","NP-SWC-00589":"Shtrii Shakti","GB-CHC-1127206":"StreetInvest","SE-0":"Sweden, through Swedish International Development Cooperation Agency (Sida)","GB-CHC-1151615":"Signal","NL-KVK-40594571":"Simavi","GB-COH-7557881":"Social Impact Lab CIC","GB-COH-8835431":"Simprints","GB-COH-NI630024":"Siren Associates","ZA-PBO-064-502":"Sonke Gender Justice","NL-SKN-41167934":"Stichting Kinderpostzegels Nederland","XM-DAC-69-1":"Ministry of Foreign and European Affairs of the Slovak Republic","NL-KVK-41152786":"SNV Netherlands Development Organisation","NL-KVK-51756811":"Solidaridad","NL-KVK-41223308":"Stichting Onderzoek Multinationale Ondernemingen (SOMO)","BJ-IFU-3200700033415":"Société Nationale des eaux du Bénin (SONEB)","KE-NGCB-149":"SOS Children's Villages Kenya","NL-KVK-41197577":"SOS Children's Villages The Netherlands","GB-COH-2100867":"SOS Sahel International UK","GB-COH-04354941":"Sound Seekers Limited","NL-KVK-41213450":"SPARK","GB-CHC-1001349":"Samaritan's Purse UK","GB-CHC-207544":"Sightsavers","NL-KVK-27251823":"Support Trust for Africa Development (STAD)","GB-CHC-1087997":"Stars Foundation","NL-KVK-41198677":"Hivos","GB-CHC-1128536":"Street Child","XI-IATI-5914-1107":"Stromme Foundation","NL-KVK-41149486":"Stichting Vluchteling","GB-CHC-1065705":"Survivors Fund (SURF)","US-EIN-941191246":"The Asia Foundation","GB-CHC-1112699":"Teach A Man To Fish","GB-CHC-1069208":"Trust for Africa's Orphans","GB-CHC-1098752":"Target TB","US-EIN-13-4128413":"Global Alliance for TB Drug Development","GB-CHC-1071886":"TB Alert","tbi":"Tropenbos International","XI-IATI-1001":"The Coca-Cola Export Corporation","NL-KVK-41149287":"Terre des Hommes Netherlands","NL-KVK-41177385":"TEAR fund Nederland","GB-CHC-265464":"Tearfund","GB-CHC-1104458":"Theatre for a Change UK","MW-NBM-00139":"Theatre for a Change Malawi","GB-COH-1158838":"The Freedom Fund","GB-CHC-254781":"The International Children's Trust","BD-NAB-1301":"Transparency International Bangladesh","GB-CHC-1050327":"The Leprosy Mission England and Wales","KE-RCO-CPR/2009/5689":"TradeMark East Africa","NL-KVK-41201806":"Transnational Institute","US-EIN-13-2626135":"TechnoServe","NL-KVK-27285408-6":"Stichting Tosangana","GB-COH-3031674":"Traidcraft Exchange","DK-CVR-33985339":"Trianglen","GB-COH-03788027":"Triple Line ","GB-COH-NI21482":"Trocaire (Northern Ireland)","TZ-BRE-63966":"Twaweza","GB-CHC-291824":"Twin","US-EIN-03-0419743":"Urgent Action Fund for Women's Human Rights","KE-NCB-200201282375":"Urgent Action Fund-Africa","CO-CCB-00159397":"Urgent Action Fund Latin America and the Caribbean","XM-DAC-77":"Romania Ministry of Foreign Affairs","PS-MOI-RA-22220-A":"Union of Agricultural Work Committees","GB-GOV-8":"UK - Ministry of Defence","XI-IATI-1002":"United Mission to Nepal","XM-DAC-41110":"The Joint United Nations Programme on HIV and AIDS (UNAIDS) Secretariat","XM-DAC-41114":"United Nations Development Programme (UNDP)","US-USAGOV":"United States","NL-KVK-67143555":"United Work","XM-DAC-41127":"United Nations Office for the Coordination of Humanitarian Affairs (OCHA)","41AAA":"United Nations Office for Project Services (UNOPS)","XI-IATI-UNPF":"UN Pooled Funds","XM-DAC-411124":"UN Women","GB-COH-SC301345":"Upper Quartile","US-GOV-1":"United States Agency for International Development (USAID)","XM-DAC-30010":"UNITAID","NL-KVK-34159275":"UTZ","GB-CHC-1081695":"Vision Aid Overseas","GB-CHC-1145119":"Varkey Foundation","GB-CHC-1140123":"Vision for a Nation Foundation","GB-CHC-1053389":"Viva","GB-CHC-313757":"Voluntary Service Overseas (VSO)","US-EIN-84-1166148":"Water for People","GB-COH-2082273":"World Association for Christian Communication (UK)","NL-KVK-09098104":"Wageningen University & Research - Stichting Wageningen Research","XI-IATI-WAI":"WASH Alliance International","NL-KVK-41215393":"War Child Holland","GB-CHC-208724":"War on Want","NL-KVK-41172933":"WASTE advisers on urban environment and development","GB-CHC-288701":"WaterAid","GB-COH-353570":"Water Witness International","GB-CHC-1158206":"Water Works","GB-CHC-1084729":"World Child Cancer UK","GB-CHC-1085096":"Women and Children First (UK)","GB-CHC-1071659":"War Child UK","NL-KVK-41118168":"Stichting Woord en Daad","US-EIN-52-1238773":"Women's Environment & Development Organization","CH-FDJP-66004229946":"World Economic Forum Geneva","GB-CHC-1125217":"Welbodi Partnership","GB-CHC-1110434":"Wellfound","NL-KVK-41201644":"Wemos Foundation","NG-CAC-495140":"Women Environmental Programme","XM-DAC-12-22":"UK - Welsh Government's Wales for Africa Programme","NL-KVK-41153698":"World Federalist Movement - Institute for Global Policy","XM-DAC-41140":"United Nations World Food Programme (WFP)","GB-CHC-1115109":"Women for Women International (UK)","XM-DAC-928":"World Health Organization","NL-KVK-9099028":"Wetlands International","NL-KVK-41177588":"WNF Wereld Natuur Fonds","GB-CHC-328206":"Womankind Worldwide","NL-KVK-27293385":"WO=MEN, Dutch Gender Platform","US-EIN-203908371":"World Economic Forum","GB-COH-NI011322":"War on Want NI","NL-KVK-56083459":"Women Peacemakers Program","GB-COH-5419428":"Water & Sanitation for the Urban Poor (WSUP)","KE-NCB-OP/218/051/915/65":"Windle Trust Kenya","CA-CRA_ARC-119304848":"World University Service of Canada","US-IRS-95-3202116":"World Vision International","NL-KVK-41179943":"World Vision Netherlands","GB-CHC-285908":"World Vision UK","21-PK-WWF":"World Wide Fund for Nature - Pakistan","GB-COH-1081247":"WWF-UK","NL-KVK-66926262":"Win Win Strategies","GB-COH-3195485":"WYG International","GB-CHC-1123946":"Youth Business International","GB-CHC-1109789":"Y Care International","NP-CRO-45995/063/064":"Young Innovations Pvt. Ltd","MW-CNM-C076-1999":"Youth Net and Counselling - YONECO","GB-CHC-327519":"Zimbabwe Educational Trust","NL-KVK-51018586":"Zimmerman & Zimmerman","GB-CHC-1133342":"Zing","NL-KVK-41009723":"ZOA","XI-IATI-WHS-NEPAL":"Nepal Traceability Study 2016"};

// IATI organization type code list
Util.organization_type = {"date-last-modified":"2017-09-18T15:11:23.635208+00:00","version":"","name":"OrganisationType","xml:lang":"en","OrganisationType":[{"code":"10","name":"Government","language":"en"},{"code":"15","name":"Other Public Sector","language":"en"},{"code":"21","name":"International NGO","language":"en"},{"code":"22","name":"National NGO","language":"en"},{"code":"23","name":"Regional NGO","language":"en"},{"code":"30","name":"Public Private Partnership","language":"en"},{"code":"40","name":"Multilateral","language":"en"},{"code":"60","name":"Foundation","language":"en"},{"code":"70","name":"Private Sector","language":"en"},{"code":"80","name":"Academic, Training and Research","language":"en"}]};

Util.funder_aux_hash = {"ES":{"name":"Spain","sector":"Government","country":"Spain"},"IDA":{"name":"International Disability Alliance","sector":"International NGO","country":"International"},"SE":{"name":"Sweden","sector":"Government","country":"Sweden"},"CA":{"name":"Canada","sector":"Government","country":"Canada"},"EU":{"name":"European Union","sector":"Multilateral","country":"International"},"NZ":{"name":"New Zealand","sector":"Government","country":"New Zealand"},"NL":{"name":"Netherlands","sector":"Government","country":"Netherlands"},"IE":{"name":"Ireland","sector":"Government","country":"Ireland"},"GB":{"name":"United Kingdom","sector":"Government","country":"United Kingdom"},"AsDB-Special-Funds":{"name":"Asian Development Bank","sector":"Multilateral","country":"International"},"AU":{"name":"Australia","sector":"Government","country":"Australia"},"XM-DAC-69-02":{"name":"Slovak Agency for Internal Development Cooperation","sector":"Government","country":"Slovakia"},"BE":{"name":"Belgium","sector":"Government","country":"Belgium"},"BMGF":{"name":"Bill & Melinda Gates Foundation","sector":"Foundation","country":"International"},"CH":{"name":"Switzerland","sector":"Government","country":"Switzerland"},"DE":{"name":"Germany","sector":"Government","country":"Germany"},"DK":{"name":"Denmark","sector":"Government","country":"Denmark"},"GB-SC-SC032327":{"name":"EMMS International","sector":"International NGO","country":"International"},"FR":{"name":"France","sector":"Government","country":"France"},"GB-3":{"name":"United Kingdom","sector":"Government","country":"United Kingdom"},"US":{"name":"United States","sector":"Government","country":"United States"},"FI":{"name":"Finland","sector":"Government","country":"Finland"},"AfDB":{"name":"African Development Bank","sector":"Multilateral","country":"International"},"INGO":{"name":"International NGO","sector":"International NGO","country":"International"},"GAVI":{"name":"GAVI Alliance","sector":"Public Private Partnership","country":"International"},"GFFATM":{"name":"Global Fund","sector":"Multilateral","country":"International"},"NL-CCI-20081098":{"name":"BRAC International","sector":"International NGO","country":"International"},"GB-COH-GB-COH-01846493":{"name":"AECOM","sector":"Private Sector","country":"United Kingdom"}};

// IATI data-specific hash table that accepts an IATI sector tag (text) and maps it to the
// corresponding disease and function tag(s) for that sector tag.
// Current mapping
Util.iatiDiseaseFunctionHash = {
  "Basic health care": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Basic health care",
        "c": null
      }
    ]
  },
  "Basic health infrastructure": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Basic health care",
        "c": "Health infrastructure"
      }
    ]
  },
  "Basic nutrition": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Nutrition and food security",
        "c": null
      }
    ]
  },
  "Health education": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Education",
        "c": null
      }
    ]
  },
  "Health personnel development": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Basic health care",
        "c": "Health personnel development"
      }
    ]
  },
  "Health policy and administrative management": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Health policy",
        "c": null
      }
    ]
  },
  "Infectious disease control": {
    "disease_tags": [
      {
        "p": "Infectious disease",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Infection control",
        "c": null
      }
    ]
  },
  "Malaria control": {
    "disease_tags": [
      {
        "p": "Infectious disease",
        "c": "Malaria"
      }
    ],
    "function_tags": [
      {
        "p": "Infection control",
        "c": null
      }
    ]
  },
  "Medical education/training": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Education",
        "c": null
      }
    ]
  },
  "Medical research": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Research and development",
        "c": null
      }
    ]
  },
  "Medical services": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Medical services",
        "c": null
      }
    ]
  },
  "Tuberculosis control": {
    "disease_tags": [
      {
        "p": "Infectious disease",
        "c": "Tuberculosis"
      }
    ],
    "function_tags": [
      {
        "p": "Infection control",
        "c": null
      }
    ]
  },
  "Livestock/veterinary services": {
    "disease_tags": [
      {
        "p": "Unspecified",
        "c": null
      }
    ],
    "function_tags": [
      {
        "p": "Livestock / Veterinary services",
        "c": null
      }
    ]
  }
};

Util.iatiSectorCodeHash = {"11110":"Education policy and administrative management","11120":"Education facilities and training","11130":"Teacher training","11182":"Educational research","11220":"Primary education","11230":"Basic life skills for youth and adults","11231":"Basic life skills for youth","11232":"Primary education equivalent for adults","11240":"Early childhood education","11320":"Secondary education","11321":"Lower secondary education","11322":"Upper secondary education","11330":"Vocational training","11420":"Higher education","11430":"Advanced technical and managerial training","12110":"Health policy and administrative management","12181":"Medical education/training","12182":"Medical research","12191":"Medical services","12220":"Basic health care","12230":"Basic health infrastructure","12240":"Basic nutrition","12250":"Infectious disease control","12261":"Health education","12262":"Malaria control","12263":"Tuberculosis control","12281":"Health personnel development","13010":"Population policy and administrative management","13020":"Reproductive health care","13030":"Family planning","13040":"STD control including HIV/AIDS","13081":"Personnel development for population and reproductive health","14010":"Water sector policy and administrative management","14015":"Water resources conservation (including data collection)","14020":"Water supply and sanitation - large systems","14021":"Water supply - large systems","14022":"Sanitation - large systems","14030":"Basic drinking water supply and basic sanitation","14031":"Basic drinking water supply","14032":"Basic sanitation","14040":"River basins’ development","14050":"Waste management / disposal","14081":"Education and training in water supply and sanitation","15110":"Public sector policy and administrative management","15111":"Public Finance Management (PFM)","15112":"Decentralisation and support to subnational government","15113":"Anti-corruption organisations and institutions","15114":"Domestic Revenue Mobilisation","15116":"Tax collection","15117":"Budget planning","15118":"National audit","15119":"Debt and aid management","15120":"Public sector financial management","15121":"Foreign affairs","15122":"Diplomatic missions","15123":"Administration of developing countries' foreign aid","15124":"General personnel services","15125":"Central procurement","15126":"Other general public services","15127":"National monitoring and evaluation","15128":"Local government finance","15129":"Other central transfers to institutions","15130":"Legal and judicial development","15131":"Justice, law and order policy, planning and administration","15132":"Police","15133":"Fire and rescue services","15134":"Judicial affairs","15135":"Ombudsman","15136":"Immigration","15137":"Prisons","15140":"Government administration","15142":"Macroeconomic policy","15143":"Meteorological services","15144":"National standards development","15150":"Democratic participation and civil society","15151":"Elections","15152":"Legislatures and political parties","15153":"Media and free flow of information","15154":"Executive office","15155":"Tax policy and administration support","15156":"Other non-tax revenue mobilisation","15160":"Human rights","15161":"Elections","15162":"Human rights","15163":"Free flow of information","15164":"Women's equality organisations and institutions","15170":"Women’s equality organisations and institutions","15180":"Ending violence against women and girls","15185":"Local government administration","15210":"Security system management and reform","15220":"Civilian peace-building, conflict prevention and resolution","15230":"Participation in international peacekeeping operations","15240":"Reintegration and SALW control","15250":"Removal of land mines and explosive remnants of war","15261":"Child soldiers (Prevention and demobilisation)","16010":"Social/ welfare services","16011":"Social protection and welfare services policy, planning and administration","16012":"Social security (excl pensions)","16013":"General pensions","16014":"Civil service pensions","16015":"Social services (incl youth development and women+ children)","16020":"Employment policy and administrative management","16030":"Housing policy and administrative management","16040":"Low-cost housing","16050":"Multisector aid for basic social services","16061":"Culture and recreation","16062":"Statistical capacity building","16063":"Narcotics control","16064":"Social mitigation of HIV/AIDS","16065":"Recreation and sport","16066":"Culture","21010":"Transport policy and administrative management","21011":"Transport policy, planning and administration","21012":"Public transport services","21013":"Transport regulation","21020":"Road transport","21021":"Feeder road construction","21022":"Feeder road maintenance","21023":"National road construction","21024":"National road maintenance","21030":"Rail transport","21040":"Water transport","21050":"Air transport","21061":"Storage","21081":"Education and training in transport and storage","22010":"Communications policy and administrative management","22011":"Communications policy, planning and administration","22012":"Postal services","22013":"Information services","22020":"Telecommunications","22030":"Radio/television/print media","22040":"Information and communication technology (ICT)","23010":"Energy policy and administrative management","23020":"Power generation/non-renewable sources","23030":"Power generation/renewable sources","23040":"Electrical transmission/ distribution","23050":"Gas distribution","23061":"Oil-fired power plants","23062":"Gas-fired power plants","23063":"Coal-fired power plants","23064":"Nuclear power plants","23065":"Hydro-electric power plants","23066":"Geothermal energy","23067":"Solar energy","23068":"Wind power","23069":"Ocean power","23070":"Biomass","23081":"Energy education/training","23082":"Energy research","23110":"Energy policy and administrative management","23111":"Energy sector policy, planning and administration","23112":"Energy regulation","23181":"Energy education/training","23182":"Energy research","23183":"Energy conservation and demand-side efficiency","23210":"Energy generation, renewable sources – multiple technologies","23220":"Hydro-electric power plants","23230":"Solar energy","23240":"Wind energy","23250":"Marine energy","23260":"Geothermal energy","23270":"Biofuel-fired power plants","23310":"Energy generation, non-renewable sources – unspecified","23320":"Coal-fired electric power plants","23330":"Oil-fired electric power plants","23340":"Natural gas-fired electric power plants","23350":"Fossil fuel electric power plants with carbon capture and storage (CCS)","23360":"Non-renewable waste-fired electric power plants","23410":"Hybrid energy electric power plants","23510":"Nuclear energy electric power plants","23610":"Heat plants","23620":"District heating and cooling","23630":"Electric power transmission and distribution","23640":"Gas distribution","24010":"Financial policy and administrative management","24020":"Monetary institutions","24030":"Formal sector financial intermediaries","24040":"Informal/semi-formal financial intermediaries","24081":"Education/training in banking and financial services","25010":"Business support services and institutions","25020":"Privatisation","31110":"Agricultural policy and administrative management","31120":"Agricultural development","31130":"Agricultural land resources","31140":"Agricultural water resources","31150":"Agricultural inputs","31161":"Food crop production","31162":"Industrial crops/export crops","31163":"Livestock","31164":"Agrarian reform","31165":"Agricultural alternative development","31166":"Agricultural extension","31181":"Agricultural education/training","31182":"Agricultural research","31191":"Agricultural services","31192":"Plant and post-harvest protection and pest control","31193":"Agricultural financial services","31194":"Agricultural co-operatives","31195":"Livestock/veterinary services","31210":"Forestry policy and administrative management","31220":"Forestry development","31261":"Fuelwood/charcoal","31281":"Forestry education/training","31282":"Forestry research","31291":"Forestry services","31310":"Fishing policy and administrative management","31320":"Fishery development","31381":"Fishery education/training","31382":"Fishery research","31391":"Fishery services","32110":"Industrial policy and administrative management","32120":"Industrial development","32130":"Small and medium-sized enterprises (SME) development","32140":"Cottage industries and handicraft","32161":"Agro-industries","32162":"Forest industries","32163":"Textiles, leather and substitutes","32164":"Chemicals","32165":"Fertilizer plants","32166":"Cement/lime/plaster","32167":"Energy manufacturing","32168":"Pharmaceutical production","32169":"Basic metal industries","32170":"Non-ferrous metal industries","32171":"Engineering","32172":"Transport equipment industry","32182":"Technological research and development","32210":"Mineral/mining policy and administrative management","32220":"Mineral prospection and exploration","32261":"Coal","32262":"Oil and gas","32263":"Ferrous metals","32264":"Nonferrous metals","32265":"Precious metals/materials","32266":"Industrial minerals","32267":"Fertilizer minerals","32268":"Offshore minerals","32310":"Construction policy and administrative management","33110":"Trade policy and administrative Management","33120":"Trade facilitation","33130":"Regional trade agreements (RTAs)","33140":"Multilateral trade negotiations","33150":"Trade-related adjustment","33181":"Trade education/training","33210":"Tourism policy and administrative management","41010":"Environmental policy and administrative management","41020":"Biosphere protection","41030":"Bio-diversity","41040":"Site preservation","41050":"Flood prevention/control","41081":"Environmental education/ training","41082":"Environmental research","43010":"Multisector aid","43030":"Urban development and management","43031":"Urban land policy and management","43032":"Urban development","43040":"Rural development","43041":"Rural land policy and management","43042":"Rural development","43050":"Non-agricultural alternative development","43081":"Multisector education/training","43082":"Research/scientific institutions","51010":"General budget support-related aid","52010":"Food aid/Food security programmes","53030":"Import support (capital goods)","53040":"Import support (commodities)","60010":"Action relating to debt","60020":"Debt forgiveness","60030":"Relief of multilateral debt","60040":"Rescheduling and refinancing","60061":"Debt for development swap","60062":"Other debt swap","60063":"Debt buy-back","72010":"Material relief assistance and services","72040":"Emergency food aid","72050":"Relief co-ordination; protection and support services","73010":"Reconstruction relief and rehabilitation","74010":"Disaster prevention and preparedness","91010":"Administrative costs (non-sector allocable)","92010":"Support to national NGOs","92020":"Support to international NGOs","92030":"Support to local and regional NGOs","93010":"Refugees in donor countries (non-sector allocable)","99810":"Sectors not specified","99820":"Promotion of development awareness (non-sector allocable)"};