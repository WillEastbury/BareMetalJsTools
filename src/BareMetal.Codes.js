var BareMetal=(typeof BareMetal!=='undefined')?BareMetal:{};
BareMetal.Codes=(function(){'use strict';
function l(v){return(v==null?'':String(v)).toLowerCase();}function d(raw,map,key,search){var a,m;function p(){if(a)return a;a=[];m={};raw.replace(/[^\n]+/g,function(r){var o=map(r.split('|'));a.push(o);m[l(key(o))]=o;});return a;}return{list:function(){return p().slice();},get:function(k){return p(),m[l(k)]||null;},search:function(q){q=l(q);return q?p().filter(function(o){return l(search(o)).indexOf(q)>-1;}):p().slice();}};}
var R={countries:`AD|Andorra|EUR|376
AE|United Arab Emirates|AED|971
AF|Afghanistan|AFN|93
AG|Antigua and Barbuda|XCD|1268
AI|Anguilla|XCD|1264
AL|Albania|ALL|355
AM|Armenia|AMD|374
AO|Angola|AOA|244
AQ|Antarctica||
AR|Argentina|ARS|54
AS|American Samoa|USD|1684
AT|Austria|EUR|43
AU|Australia|AUD|61
AW|Aruba|AWG|297
AX|Åland Islands|EUR|35818
AZ|Azerbaijan|AZN|994
BA|Bosnia and Herzegovina|BAM|387
BB|Barbados|BBD|1246
BD|Bangladesh|BDT|880
BE|Belgium|EUR|32
BF|Burkina Faso|XOF|226
BG|Bulgaria|BGN|359
BH|Bahrain|BHD|973
BI|Burundi|BIF|257
BJ|Benin|XOF|229
BL|Saint Barthélemy|EUR|590
BM|Bermuda|BMD|1441
BN|Brunei|BND|673
BO|Bolivia|BOB|591
BQ|Caribbean Netherlands|USD|599
BR|Brazil|BRL|55
BS|Bahamas|BSD|1242
BT|Bhutan|BTN|975
BV|Bouvet Island|NOK|47
BW|Botswana|BWP|267
BY|Belarus|BYN|375
BZ|Belize|BZD|501
CA|Canada|CAD|1
CC|Cocos (Keeling) Islands|AUD|61
CD|DR Congo|CDF|243
CF|Central African Republic|XAF|236
CG|Congo|XAF|242
CH|Switzerland|CHF|41
CI|Ivory Coast|XOF|225
CK|Cook Islands|NZD|682
CL|Chile|CLP|56
CM|Cameroon|XAF|237
CN|China|CNY|86
CO|Colombia|COP|57
CR|Costa Rica|CRC|506
CU|Cuba|CUP|53
CV|Cape Verde|CVE|238
CW|Curaçao|ANG|599
CX|Christmas Island|AUD|61
CY|Cyprus|EUR|357
CZ|Czechia|CZK|420
DE|Germany|EUR|49
DJ|Djibouti|DJF|253
DK|Denmark|DKK|45
DM|Dominica|XCD|1767
DO|Dominican Republic|DOP|1
DZ|Algeria|DZD|213
EC|Ecuador|USD|593
EE|Estonia|EUR|372
EG|Egypt|EGP|20
EH|Western Sahara|DZD|2
ER|Eritrea|ERN|291
ES|Spain|EUR|34
ET|Ethiopia|ETB|251
FI|Finland|EUR|358
FJ|Fiji|FJD|679
FK|Falkland Islands|FKP|500
FM|Micronesia|USD|691
FO|Faroe Islands|DKK|298
FR|France|EUR|33
GA|Gabon|XAF|241
GB|United Kingdom|GBP|44
GD|Grenada|XCD|1473
GE|Georgia|GEL|995
GF|French Guiana|EUR|594
GG|Guernsey|GBP|44
GH|Ghana|GHS|233
GI|Gibraltar|GIP|350
GL|Greenland|DKK|299
GM|Gambia|GMD|220
GN|Guinea|GNF|224
GP|Guadeloupe|EUR|590
GQ|Equatorial Guinea|XAF|240
GR|Greece|EUR|30
GS|South Georgia|SHP|500
GT|Guatemala|GTQ|502
GU|Guam|USD|1671
GW|Guinea-Bissau|XOF|245
GY|Guyana|GYD|592
HK|Hong Kong|HKD|852
HM|Heard Island and McDonald Islands|AUD|
HN|Honduras|HNL|504
HR|Croatia|EUR|385
HT|Haiti|HTG|509
HU|Hungary|HUF|36
ID|Indonesia|IDR|62
IE|Ireland|EUR|353
IL|Israel|ILS|972
IM|Isle of Man|GBP|44
IN|India|INR|91
IO|British Indian Ocean Territory|USD|246
IQ|Iraq|IQD|964
IR|Iran|IRR|98
IS|Iceland|ISK|354
IT|Italy|EUR|39
JE|Jersey|GBP|44
JM|Jamaica|JMD|1876
JO|Jordan|JOD|962
JP|Japan|JPY|81
KE|Kenya|KES|254
KG|Kyrgyzstan|KGS|996
KH|Cambodia|KHR|855
KI|Kiribati|AUD|686
KM|Comoros|KMF|269
KN|Saint Kitts and Nevis|XCD|1869
KP|North Korea|KPW|850
KR|South Korea|KRW|82
KW|Kuwait|KWD|965
KY|Cayman Islands|KYD|1345
KZ|Kazakhstan|KZT|7
LA|Laos|LAK|856
LB|Lebanon|LBP|961
LC|Saint Lucia|XCD|1758
LI|Liechtenstein|CHF|423
LK|Sri Lanka|LKR|94
LR|Liberia|LRD|231
LS|Lesotho|LSL|266
LT|Lithuania|EUR|370
LU|Luxembourg|EUR|352
LV|Latvia|EUR|371
LY|Libya|LYD|218
MA|Morocco|MAD|212
MC|Monaco|EUR|377
MD|Moldova|MDL|373
ME|Montenegro|EUR|382
MF|Saint Martin|EUR|590
MG|Madagascar|MGA|261
MH|Marshall Islands|USD|692
MK|North Macedonia|MKD|389
ML|Mali|XOF|223
MM|Myanmar|MMK|95
MN|Mongolia|MNT|976
MO|Macau|MOP|853
MP|Northern Mariana Islands|USD|1670
MQ|Martinique|EUR|596
MR|Mauritania|MRU|222
MS|Montserrat|XCD|1664
MT|Malta|EUR|356
MU|Mauritius|MUR|230
MV|Maldives|MVR|960
MW|Malawi|MWK|265
MX|Mexico|MXN|52
MY|Malaysia|MYR|60
MZ|Mozambique|MZN|258
NA|Namibia|NAD|264
NC|New Caledonia|XPF|687
NE|Niger|XOF|227
NF|Norfolk Island|AUD|672
NG|Nigeria|NGN|234
NI|Nicaragua|NIO|505
NL|Netherlands|EUR|31
NO|Norway|NOK|47
NP|Nepal|NPR|977
NR|Nauru|AUD|674
NU|Niue|NZD|683
NZ|New Zealand|NZD|64
OM|Oman|OMR|968
PA|Panama|PAB|507
PE|Peru|PEN|51
PF|French Polynesia|XPF|689
PG|Papua New Guinea|PGK|675
PH|Philippines|PHP|63
PK|Pakistan|PKR|92
PL|Poland|PLN|48
PM|Saint Pierre and Miquelon|EUR|508
PN|Pitcairn Islands|NZD|64
PR|Puerto Rico|USD|1
PS|Palestine|EGP|970
PT|Portugal|EUR|351
PW|Palau|USD|680
PY|Paraguay|PYG|595
QA|Qatar|QAR|974
RE|Réunion|EUR|262
RO|Romania|RON|40
RS|Serbia|RSD|381
RU|Russia|RUB|7
RW|Rwanda|RWF|250
SA|Saudi Arabia|SAR|966
SB|Solomon Islands|SBD|677
SC|Seychelles|SCR|248
SD|Sudan|SDG|249
SE|Sweden|SEK|46
SG|Singapore|SGD|65
SH|Saint Helena, Ascension and Tristan da Cunha|GBP|2
SI|Slovenia|EUR|386
SJ|Svalbard and Jan Mayen|NOK|4779
SK|Slovakia|EUR|421
SL|Sierra Leone|SLE|232
SM|San Marino|EUR|378
SN|Senegal|XOF|221
SO|Somalia|SOS|252
SR|Suriname|SRD|597
SS|South Sudan|SSP|211
ST|São Tomé and Príncipe|STN|239
SV|El Salvador|USD|503
SX|Sint Maarten|ANG|1721
SY|Syria|SYP|963
SZ|Eswatini|SZL|268
TC|Turks and Caicos Islands|USD|1649
TD|Chad|XAF|235
TF|French Southern and Antarctic Lands|EUR|262
TG|Togo|XOF|228
TH|Thailand|THB|66
TJ|Tajikistan|TJS|992
TK|Tokelau|NZD|690
TL|Timor-Leste|USD|670
TM|Turkmenistan|TMT|993
TN|Tunisia|TND|216
TO|Tonga|TOP|676
TR|Türkiye|TRY|90
TT|Trinidad and Tobago|TTD|1868
TV|Tuvalu|AUD|688
TW|Taiwan|TWD|886
TZ|Tanzania|TZS|255
UA|Ukraine|UAH|380
UG|Uganda|UGX|256
UM|United States Minor Outlying Islands|USD|268
US|United States|USD|1
UY|Uruguay|UYU|598
UZ|Uzbekistan|UZS|998
VA|Vatican City|EUR|3
VC|Saint Vincent and the Grenadines|XCD|1784
VE|Venezuela|VES|58
VG|British Virgin Islands|USD|1284
VI|United States Virgin Islands|USD|1340
VN|Vietnam|VND|84
VU|Vanuatu|VUV|678
WF|Wallis and Futuna|XPF|681
WS|Samoa|WST|685
XK|Kosovo|EUR|383
YE|Yemen|YER|967
YT|Mayotte|EUR|262
ZA|South Africa|ZAR|27
ZM|Zambia|ZMW|260
ZW|Zimbabwe|ZWG|263`,currencies:`AED|UAE Dirham|AED|2
AFN|Afghani|؋|2
ALL|Lek|ALL|2
AMD|Armenian Dram|֏|2
ANG|ANG|ANG|2
AOA|Kwanza|Kz|2
ARS|Argentine Peso|$|2
AUD|Australian Dollar|$|2
AWG|Aruban Florin|AWG|2
AZN|Azerbaijan Manat|₼|2
BAM|Convertible Mark|KM|2
BBD|Barbados Dollar|$|2
BDT|Taka|৳|2
BGN|BGN|BGN|2
BHD|Bahraini Dinar|BHD|3
BIF|Burundi Franc|BIF|0
BMD|Bermudian Dollar|$|2
BND|Brunei Dollar|$|2
BOB|Boliviano|Bs|2
BRL|Brazilian Real|R$|2
BSD|Bahamian Dollar|$|2
BTN|Ngultrum|BTN|2
BWP|Pula|P|2
BYN|Belarusian Ruble|BYN|2
BZD|Belize Dollar|$|2
CAD|Canadian Dollar|$|2
CDF|Congolese Franc|CDF|2
CHF|Swiss Franc|CHF|2
CLP|Chilean Peso|$|0
CNY|Yuan Renminbi|¥|2
COP|Colombian Peso|$|2
CRC|Costa Rican Colon|₡|2
CUP|Cuban Peso|$|2
CVE|Cabo Verde Escudo|CVE|2
CZK|Czech Koruna|Kč|2
DJF|Djibouti Franc|DJF|0
DKK|Danish Krone|kr|2
DOP|Dominican Peso|$|2
DZD|Algerian Dinar|DZD|2
EGP|Egyptian Pound|E£|2
ERN|Nakfa|ERN|2
ETB|Ethiopian Birr|ETB|2
EUR|Euro|€|2
FJD|Fiji Dollar|$|2
FKP|Falkland Islands Pound|£|2
GBP|Pound Sterling|£|2
GEL|Lari|₾|2
GHS|Ghana Cedi|GH₵|2
GIP|Gibraltar Pound|£|2
GMD|Dalasi|GMD|2
GNF|Guinean Franc|FG|0
GTQ|Quetzal|Q|2
GYD|Guyana Dollar|$|2
HKD|Hong Kong Dollar|$|2
HNL|Lempira|L|2
HTG|Gourde|HTG|2
HUF|Forint|Ft|2
IDR|Rupiah|Rp|2
ILS|New Israeli Sheqel|₪|2
INR|Indian Rupee|₹|2
IQD|Iraqi Dinar|IQD|3
IRR|Iranian Rial|IRR|2
ISK|Iceland Krona|kr|0
JMD|Jamaican Dollar|$|2
JOD|Jordanian Dinar|JOD|3
JPY|Yen|¥|0
KES|Kenyan Shilling|KES|2
KGS|Som|⃀|2
KHR|Riel|៛|2
KMF|Comorian Franc |CF|0
KPW|North Korean Won|₩|2
KRW|Won|₩|0
KWD|Kuwaiti Dinar|KWD|3
KYD|Cayman Islands Dollar|$|2
KZT|Tenge|₸|2
LAK|Lao Kip|₭|2
LBP|Lebanese Pound|L£|2
LKR|Sri Lanka Rupee|Rs|2
LRD|Liberian Dollar|$|2
LSL|Loti|LSL|2
LYD|Libyan Dinar|LYD|3
MAD|Moroccan Dirham|MAD|2
MDL|Moldovan Leu|MDL|2
MGA|Malagasy Ariary|Ar|2
MKD|Denar|MKD|2
MMK|Kyat|K|2
MNT|Tugrik|₮|2
MOP|Pataca|MOP|2
MRU|Ouguiya|MRU|2
MUR|Mauritius Rupee|Rs|2
MVR|Rufiyaa|MVR|2
MWK|Malawi Kwacha|MWK|2
MXN|Mexican Peso|$|2
MYR|Malaysian Ringgit|RM|2
MZN|Mozambique Metical|MZN|2
NAD|Namibia Dollar|$|2
NGN|Naira|₦|2
NIO|Cordoba Oro|C$|2
NOK|Norwegian Krone|kr|2
NPR|Nepalese Rupee|Rs|2
NZD|New Zealand Dollar|$|2
OMR|Rial Omani|OMR|3
PAB|Balboa|PAB|2
PEN|Sol|PEN|2
PGK|Kina|PGK|2
PHP|Philippine Peso|₱|2
PKR|Pakistan Rupee|Rs|2
PLN|Zloty|zł|2
PYG|Guarani|₲|0
QAR|Qatari Rial|QAR|2
RON|Romanian Leu|lei|2
RSD|Serbian Dinar|RSD|2
RUB|Russian Ruble|₽|2
RWF|Rwanda Franc|RF|0
SAR|Saudi Riyal|SAR|2
SBD|Solomon Islands Dollar|$|2
SCR|Seychelles Rupee|SCR|2
SDG|Sudanese Pound|SDG|2
SEK|Swedish Krona|kr|2
SGD|Singapore Dollar|$|2
SHP|Saint Helena Pound|£|2
SLE|Leone|SLE|2
SOS|Somali Shilling|SOS|2
SRD|Surinam Dollar|$|2
SSP|South Sudanese Pound|£|2
STN|Dobra|Db|2
SYP|Syrian Pound|£|2
SZL|Lilangeni|SZL|2
THB|Baht|฿|2
TJS|Somoni|TJS|2
TMT|Turkmenistan New Manat|TMT|2
TND|Tunisian Dinar|TND|3
TOP|Pa’anga|T$|2
TRY|Turkish Lira|₺|2
TTD|Trinidad and Tobago Dollar|$|2
TWD|New Taiwan Dollar|$|2
TZS|Tanzanian Shilling|TZS|2
UAH|Hryvnia|₴|2
UGX|Uganda Shilling|UGX|0
USD|US Dollar|$|2
UYU|Peso Uruguayo|$|2
UZS|Uzbekistan Sum|UZS|2
VES|Bolívar Soberano|VES|2
VND|Dong|₫|0
VUV|Vatu|VUV|0
WST|Tala|WST|2
XAF|CFA Franc BEAC|FCFA|0
XCD|East Caribbean Dollar|$|2
XOF|CFA Franc BCEAO|F CFA|0
XPF|CFP Franc|CFPF|0
YER|Yemeni Rial|YER|2
ZAR|Rand|R|2
ZMW|Zambian Kwacha|ZK|2
ZWG|Zimbabwe Gold|ZWG|2`,days:`Monday|Mon|1
Tuesday|Tue|2
Wednesday|Wed|3
Thursday|Thu|4
Friday|Fri|5
Saturday|Sat|6
Sunday|Sun|7`,months:`January|Jan|1|31
February|Feb|2|28
March|Mar|3|31
April|Apr|4|30
May|May|5|31
June|Jun|6|30
July|Jul|7|31
August|Aug|8|31
September|Sep|9|30
October|Oct|10|31
November|Nov|11|30
December|Dec|12|31`,languages:`aa|Afar|Afaraf
ab|Abkhaz|аҧсуа бызшәа
ae|Avestan|avesta
af|Afrikaans|Afrikaans
ak|Akan|Akan
am|Amharic|አማርኛ
an|Aragonese|aragonés
ar|Arabic|اَلْعَرَبِيَّةُ
as|Assamese|অসমীয়া
av|Avaric|авар мацӀ
ay|Aymara|aymar aru
az|Azerbaijani|azərbaycan dili
ba|Bashkir|башҡорт теле
be|Belarusian|беларуская мова
bg|Bulgarian|български език
bi|Bislama|Bislama
bm|Bambara|bamanankan
bn|Bengali|বাংলা
bo|Tibetan|བོད་ཡིག
br|Breton|brezhoneg
bs|Bosnian|bosanski jezik
ca|Catalan|Català
ce|Chechen|нохчийн мотт
ch|Chamorro|Chamoru
co|Corsican|corsu
cr|Cree|ᓀᐦᐃᔭᐍᐏᐣ
cs|Czech|čeština
cu|Old Church Slavonic|ѩзыкъ словѣньскъ
cv|Chuvash|чӑваш чӗлхи
cy|Welsh|Cymraeg
da|Danish|dansk
de|German|Deutsch
dv|Divehi|ދިވެހި
dz|Dzongkha|རྫོང་ཁ
ee|Ewe|Eʋegbe
el|Greek|Ελληνικά
en|English|English
eo|Esperanto|Esperanto
es|Spanish|Español
et|Estonian|eesti
eu|Basque|euskara
fa|Persian|فارسی
ff|Fula|Fulfulde
fi|Finnish|suomi
fj|Fijian|vosa Vakaviti
fo|Faroese|føroyskt
fr|French|Français
fy|Western Frisian|Frysk
ga|Irish|Gaeilge
gd|Scottish Gaelic|Gàidhlig
gl|Galician|galego
gn|Guaraní|Avañe'ẽ
gu|Gujarati|ગુજરાતી
gv|Manx|Gaelg
ha|Hausa|هَوُسَ
he|Hebrew|עברית
hi|Hindi|हिन्दी
ho|Hiri Motu|Hiri Motu
hr|Croatian|Hrvatski
ht|Haitian|Kreyòl ayisyen
hu|Hungarian|magyar
hy|Armenian|Հայերեն
hz|Herero|Otjiherero
ia|Interlingua|Interlingua
id|Indonesian|Bahasa Indonesia
ie|Interlingue|Interlingue
ig|Igbo|Asụsụ Igbo
ii|Nuosu|ꆈꌠ꒿ Nuosuhxop
ik|Inupiaq|Iñupiaq
io|Ido|Ido
is|Icelandic|Íslenska
it|Italian|Italiano
iu|Inuktitut|ᐃᓄᒃᑎᑐᑦ
ja|Japanese|日本語
jv|Javanese|basa Jawa
ka|Georgian|ქართული
kg|Kongo|Kikongo
ki|Kikuyu|Gĩkũyũ
kj|Kwanyama|Kuanyama
kk|Kazakh|қазақ тілі
kl|Kalaallisut|kalaallisut
km|Khmer|ខេមរភាសា
kn|Kannada|ಕನ್ನಡ
ko|Korean|한국어
kr|Kanuri|Kanuri
ks|Kashmiri|कश्मीरी
ku|Kurdish|Kurdî
kv|Komi|коми кыв
kw|Cornish|Kernewek
ky|Kyrgyz|Кыргызча
la|Latin|latine
lb|Luxembourgish|Lëtzebuergesch
lg|Ganda|Luganda
li|Limburgish|Limburgs
ln|Lingala|Lingála
lo|Lao|ພາສາລາວ
lt|Lithuanian|lietuvių kalba
lu|Luba-Katanga|Kiluba
lv|Latvian|latviešu valoda
mg|Malagasy|fiteny malagasy
mh|Marshallese|Kajin M̧ajeļ
mi|Māori|te reo Māori
mk|Macedonian|македонски јазик
ml|Malayalam|മലയാളം
mn|Mongolian|Монгол хэл
mr|Marathi|मराठी
ms|Malay|Bahasa Melayu
mt|Maltese|Malti
my|Burmese|ဗမာစာ
na|Nauru|Dorerin Naoero
nb|Norwegian Bokmål|Norsk bokmål
nd|Northern Ndebele|isiNdebele
ne|Nepali|नेपाली
ng|Ndonga|Owambo
nl|Dutch|Nederlands
nn|Norwegian Nynorsk|Norsk nynorsk
no|Norwegian|Norsk
nr|Southern Ndebele|isiNdebele
nv|Navajo|Diné bizaad
ny|Chichewa|chiCheŵa
oc|Occitan|occitan
oj|Ojibwe|ᐊᓂᔑᓈᐯᒧᐎᓐ
om|Oromo|Afaan Oromoo
or|Oriya|ଓଡ଼ିଆ
os|Ossetian|ирон æвзаг
pa|Panjabi|ਪੰਜਾਬੀ
pi|Pāli|पाऴि
pl|Polish|Polski
ps|Pashto|پښتو
pt|Portuguese|Português
qu|Quechua|Runa Simi
rm|Romansh|rumantsch grischun
rn|Kirundi|Ikirundi
ro|Romanian|Română
ru|Russian|Русский
rw|Kinyarwanda|Ikinyarwanda
sa|Sanskrit|संस्कृतम्
sc|Sardinian|sardu
sd|Sindhi|सिन्धी
se|Northern Sami|Davvisámegiella
sg|Sango|yângâ tî sängö
si|Sinhala|සිංහල
sk|Slovak|slovenčina
sl|Slovenian|slovenščina
sm|Samoan|gagana fa'a Samoa
sn|Shona|chiShona
so|Somali|Soomaaliga
sq|Albanian|Shqip
sr|Serbian|српски језик
ss|Swati|SiSwati
st|Southern Sotho|Sesotho
su|Sundanese|Basa Sunda
sv|Swedish|Svenska
sw|Swahili|Kiswahili
ta|Tamil|தமிழ்
te|Telugu|తెలుగు
tg|Tajik|тоҷикӣ
th|Thai|ไทย
ti|Tigrinya|ትግርኛ
tk|Turkmen|Türkmençe
tl|Tagalog|Wikang Tagalog
tn|Tswana|Setswana
to|Tonga|faka Tonga
tr|Turkish|Türkçe
ts|Tsonga|Xitsonga
tt|Tatar|татар теле
tw|Twi|Twi
ty|Tahitian|Reo Tahiti
ug|Uyghur|ئۇيغۇرچە‎
uk|Ukrainian|Українська
ur|Urdu|اردو
uz|Uzbek|Ўзбек
ve|Venda|Tshivenḓa
vi|Vietnamese|Tiếng Việt
vo|Volapük|Volapük
wa|Walloon|walon
wo|Wolof|Wollof
xh|Xhosa|isiXhosa
yi|Yiddish|ייִדיש
yo|Yoruba|Yorùbá
za|Zhuang|Saɯ cueŋƅ
zh|Chinese|中文
zu|Zulu|isiZulu`,timezones:`Etc/UTC|+00:00|UTC
Pacific/Honolulu|-10:00|Honolulu
America/Anchorage|-09:00|Anchorage
America/Los_Angeles|-08:00|Los Angeles
America/Phoenix|-07:00|Phoenix
America/Denver|-07:00|Denver
America/Chicago|-06:00|Chicago
America/New_York|-05:00|New York
America/Toronto|-05:00|Toronto
America/Halifax|-04:00|Halifax
America/St_Johns|-03:30|St Johns
America/Mexico_City|-06:00|Mexico City
America/Bogota|-05:00|Bogota
America/Lima|-05:00|Lima
America/Caracas|-04:00|Caracas
America/Santiago|-04:00|Santiago
America/Argentina/Buenos_Aires|-03:00|Buenos Aires
America/Sao_Paulo|-03:00|Sao Paulo
America/Montevideo|-03:00|Montevideo
Atlantic/Azores|-01:00|Azores
Atlantic/Cape_Verde|-01:00|Cape Verde
Europe/London|+00:00|London
Europe/Dublin|+00:00|Dublin
Europe/Lisbon|+00:00|Lisbon
Europe/Madrid|+01:00|Madrid
Europe/Paris|+01:00|Paris
Europe/Brussels|+01:00|Brussels
Europe/Amsterdam|+01:00|Amsterdam
Europe/Berlin|+01:00|Berlin
Europe/Zurich|+01:00|Zurich
Europe/Rome|+01:00|Rome
Europe/Vienna|+01:00|Vienna
Europe/Prague|+01:00|Prague
Europe/Warsaw|+01:00|Warsaw
Europe/Budapest|+01:00|Budapest
Europe/Stockholm|+01:00|Stockholm
Europe/Oslo|+01:00|Oslo
Europe/Copenhagen|+01:00|Copenhagen
Europe/Helsinki|+02:00|Helsinki
Europe/Athens|+02:00|Athens
Europe/Bucharest|+02:00|Bucharest
Europe/Sofia|+02:00|Sofia
Europe/Kyiv|+02:00|Kyiv
Europe/Istanbul|+03:00|Istanbul
Europe/Minsk|+03:00|Minsk
Europe/Moscow|+03:00|Moscow
Europe/Samara|+04:00|Samara
Asia/Yerevan|+04:00|Yerevan
Asia/Tbilisi|+04:00|Tbilisi
Asia/Baku|+04:00|Baku
Asia/Jerusalem|+02:00|Jerusalem
Africa/Casablanca|+00:00|Casablanca
Africa/Algiers|+01:00|Algiers
Africa/Lagos|+01:00|Lagos
Africa/Accra|+00:00|Accra
Africa/Cairo|+02:00|Cairo
Africa/Johannesburg|+02:00|Johannesburg
Africa/Nairobi|+03:00|Nairobi
Africa/Addis_Ababa|+03:00|Addis Ababa
Africa/Khartoum|+02:00|Khartoum
Indian/Mauritius|+04:00|Mauritius
Asia/Riyadh|+03:00|Riyadh
Asia/Baghdad|+03:00|Baghdad
Asia/Tehran|+03:30|Tehran
Asia/Dubai|+04:00|Dubai
Asia/Muscat|+04:00|Muscat
Asia/Kabul|+04:30|Kabul
Asia/Karachi|+05:00|Karachi
Asia/Kolkata|+05:30|Kolkata
Asia/Kathmandu|+05:45|Kathmandu
Asia/Colombo|+05:30|Colombo
Asia/Dhaka|+06:00|Dhaka
Asia/Yangon|+06:30|Yangon
Asia/Bangkok|+07:00|Bangkok
Asia/Ho_Chi_Minh|+07:00|Ho Chi Minh
Asia/Jakarta|+07:00|Jakarta
Asia/Singapore|+08:00|Singapore
Asia/Kuala_Lumpur|+08:00|Kuala Lumpur
Asia/Manila|+08:00|Manila
Asia/Hong_Kong|+08:00|Hong Kong
Asia/Shanghai|+08:00|Shanghai
Asia/Taipei|+08:00|Taipei
Asia/Seoul|+09:00|Seoul
Asia/Tokyo|+09:00|Tokyo
Australia/Perth|+08:00|Perth
Australia/Darwin|+09:30|Darwin
Australia/Adelaide|+09:30|Adelaide
Australia/Brisbane|+10:00|Brisbane
Australia/Sydney|+10:00|Sydney
Pacific/Port_Moresby|+10:00|Port Moresby
Pacific/Guam|+10:00|Guam
Pacific/Auckland|+12:00|Auckland
Pacific/Fiji|+12:00|Fiji
Pacific/Apia|+13:00|Apia
Pacific/Tahiti|-10:00|Tahiti
Pacific/Tongatapu|+13:00|Tongatapu
Asia/Novosibirsk|+07:00|Novosibirsk
Asia/Vladivostok|+10:00|Vladivostok`,http:`100|Continue|info
101|Switching Protocols|info
102|Processing|info
103|Early Hints|info
200|OK|success
201|Created|success
202|Accepted|success
203|Non-Authoritative Information|success
204|No Content|success
205|Reset Content|success
206|Partial Content|success
207|Multi-Status|success
208|Already Reported|success
226|IM Used|success
300|Multiple Choices|redirect
301|Moved Permanently|redirect
302|Found|redirect
303|See Other|redirect
304|Not Modified|redirect
305|Use Proxy|redirect
307|Temporary Redirect|redirect
308|Permanent Redirect|redirect
400|Bad Request|client
401|Unauthorized|client
402|Payment Required|client
403|Forbidden|client
404|Not Found|client
405|Method Not Allowed|client
406|Not Acceptable|client
407|Proxy Authentication Required|client
408|Request Timeout|client
409|Conflict|client
410|Gone|client
411|Length Required|client
412|Precondition Failed|client
413|Content Too Large|client
414|URI Too Long|client
415|Unsupported Media Type|client
416|Range Not Satisfiable|client
417|Expectation Failed|client
418|I'm a Teapot|client
421|Misdirected Request|client
422|Unprocessable Content|client
423|Locked|client
424|Failed Dependency|client
425|Too Early|client
426|Upgrade Required|client
428|Precondition Required|client
429|Too Many Requests|client
431|Request Header Fields Too Large|client
451|Unavailable For Legal Reasons|client
500|Internal Server Error|server
501|Not Implemented|server
502|Bad Gateway|server
503|Service Unavailable|server
504|Gateway Timeout|server
505|HTTP Version Not Supported|server
506|Variant Also Negotiates|server
507|Insufficient Storage|server
508|Loop Detected|server
510|Not Extended|server
511|Network Authentication Required|server`,mime:`3g2|video/3gpp2
3gp|video/3gpp
7z|application/x-7z-compressed
aac|audio/aac
abw|application/x-abiword
apng|image/apng
atom|application/atom+xml
avi|video/x-msvideo
avif|image/avif
azw|application/vnd.amazon.ebook
bat|application/x-msdownload
bin|application/octet-stream
bmp|image/bmp
bz2|application/x-bzip2
csh|application/x-csh
css|text/css
csv|text/csv
deb|application/octet-stream
dll|application/octet-stream
dmg|application/octet-stream
doc|application/msword
docx|application/vnd.openxmlformats-officedocument.wordprocessingml.document
eot|application/vnd.ms-fontobject
epub|application/epub+zip
exe|application/octet-stream
flac|audio/x-flac
gif|image/gif
gz|application/gzip
heic|image/heic
heif|image/heif
htm|text/html
html|text/html
ico|image/vnd.microsoft.icon
ics|text/calendar
img|application/octet-stream
iso|application/octet-stream
jar|application/java-archive
jpeg|image/jpeg
jpg|image/jpeg
js|application/javascript
json|application/json
jsonld|application/ld+json
kml|application/vnd.google-earth.kml+xml
kmz|application/vnd.google-earth.kmz
m4a|audio/mp4
m4v|video/x-m4v
map|application/json
markdown|text/markdown
md|text/markdown
mid|audio/midi
midi|audio/midi
mjs|text/javascript
mov|video/quicktime
mp3|audio/mp3
mp4|application/mp4
mpeg|video/mpeg
mpg|video/mpeg
msi|application/octet-stream
odp|application/vnd.oasis.opendocument.presentation
ods|application/vnd.oasis.opendocument.spreadsheet
odt|application/vnd.oasis.opendocument.text
oga|audio/ogg
ogg|audio/ogg
ogv|video/ogg
opus|audio/ogg
otf|font/otf
pdf|application/pdf
php|application/x-httpd-php
png|image/png
ppt|application/vnd.ms-powerpoint
pptx|application/vnd.openxmlformats-officedocument.presentationml.presentation
rar|application/vnd.rar
rss|application/rss+xml
rtf|application/rtf
sh|application/x-sh
sql|application/sql
sqlite|application/vnd.sqlite3
svg|image/svg+xml
tar|application/x-tar
tex|application/x-tex
tif|image/tiff
tiff|image/tiff
tsv|text/tab-separated-values
ttf|font/ttf
txt|text/plain
vsd|application/vnd.visio
war|application/java-archive
wasm|application/wasm
wav|audio/wav
weba|audio/webm
webm|video/webm
webmanifest|application/manifest+json
webp|image/webp
woff|font/woff
woff2|font/woff2
xhtml|application/xhtml+xml
xls|application/vnd.ms-excel
xlsx|application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
xml|application/xml
xz|application/x-xz
yaml|text/yaml
yml|text/yaml
zip|application/x-zip-compressed`,colours:`aliceblue|#F0F8FF
antiquewhite|#FAEBD7
aqua|#00FFFF
aquamarine|#7FFFD4
azure|#F0FFFF
beige|#F5F5DC
bisque|#FFE4C4
black|#000000
blanchedalmond|#FFEBCD
blue|#0000FF
blueviolet|#8A2BE2
brown|#A52A2A
burlywood|#DEB887
cadetblue|#5F9EA0
chartreuse|#7FFF00
chocolate|#D2691E
coral|#FF7F50
cornflowerblue|#6495ED
cornsilk|#FFF8DC
crimson|#DC143C
cyan|#00FFFF
darkblue|#00008B
darkcyan|#008B8B
darkgoldenrod|#B8860B
darkgray|#A9A9A9
darkgreen|#006400
darkgrey|#A9A9A9
darkkhaki|#BDB76B
darkmagenta|#8B008B
darkolivegreen|#556B2F
darkorange|#FF8C00
darkorchid|#9932CC
darkred|#8B0000
darksalmon|#E9967A
darkseagreen|#8FBC8F
darkslateblue|#483D8B
darkslategray|#2F4F4F
darkslategrey|#2F4F4F
darkturquoise|#00CED1
darkviolet|#9400D3
deeppink|#FF1493
deepskyblue|#00BFFF
dimgray|#696969
dimgrey|#696969
dodgerblue|#1E90FF
firebrick|#B22222
floralwhite|#FFFAF0
forestgreen|#228B22
fuchsia|#FF00FF
gainsboro|#DCDCDC
ghostwhite|#F8F8FF
gold|#FFD700
goldenrod|#DAA520
gray|#808080
green|#008000
greenyellow|#ADFF2F
grey|#808080
honeydew|#F0FFF0
hotpink|#FF69B4
indianred|#CD5C5C
indigo|#4B0082
ivory|#FFFFF0
khaki|#F0E68C
lavender|#E6E6FA
lavenderblush|#FFF0F5
lawngreen|#7CFC00
lemonchiffon|#FFFACD
lightblue|#ADD8E6
lightcoral|#F08080
lightcyan|#E0FFFF
lightgoldenrodyellow|#FAFAD2
lightgray|#D3D3D3
lightgreen|#90EE90
lightgrey|#D3D3D3
lightpink|#FFB6C1
lightsalmon|#FFA07A
lightseagreen|#20B2AA
lightskyblue|#87CEFA
lightslategray|#778899
lightslategrey|#778899
lightsteelblue|#B0C4DE
lightyellow|#FFFFE0
lime|#00FF00
limegreen|#32CD32
linen|#FAF0E6
magenta|#FF00FF
maroon|#800000
mediumaquamarine|#66CDAA
mediumblue|#0000CD
mediumorchid|#BA55D3
mediumpurple|#9370DB
mediumseagreen|#3CB371
mediumslateblue|#7B68EE
mediumspringgreen|#00FA9A
mediumturquoise|#48D1CC
mediumvioletred|#C71585
midnightblue|#191970
mintcream|#F5FFFA
mistyrose|#FFE4E1
moccasin|#FFE4B5
navajowhite|#FFDEAD
navy|#000080
oldlace|#FDF5E6
olive|#808000
olivedrab|#6B8E23
orange|#FFA500
orangered|#FF4500
orchid|#DA70D6
palegoldenrod|#EEE8AA
palegreen|#98FB98
paleturquoise|#AFEEEE
palevioletred|#DB7093
papayawhip|#FFEFD5
peachpuff|#FFDAB9
peru|#CD853F
pink|#FFC0CB
plum|#DDA0DD
powderblue|#B0E0E6
purple|#800080
rebeccapurple|#663399
red|#FF0000
rosybrown|#BC8F8F
royalblue|#4169E1
saddlebrown|#8B4513
salmon|#FA8072
sandybrown|#F4A460
seagreen|#2E8B57
seashell|#FFF5EE
sienna|#A0522D
silver|#C0C0C0
skyblue|#87CEEB
slateblue|#6A5ACD
slategray|#708090
slategrey|#708090
snow|#FFFAFA
springgreen|#00FF7F
steelblue|#4682B4
tan|#D2B48C
teal|#008080
thistle|#D8BFD8
tomato|#FF6347
turquoise|#40E0D0
violet|#EE82EE
wheat|#F5DEB3
white|#FFFFFF
whitesmoke|#F5F5F5
yellow|#FFFF00
yellowgreen|#9ACD32`,cards:`Visa|^4|13,16,19|3
Mastercard|^(5[1-5]/2(2[2-9]/[3-6]\\d/7[01]/720))|16|3
Amex|^3[47]|15|4
Discover|^(6011/65/64[4-9]/622(12[6-9]/1[3-9]\\d/[2-8]\\d{2}/9([01]\\d/2[0-5])))|16,19|3
Diners|^(30[0-5]/36/38/39)|14,16,19|3
JCB|^(2131/1800/35\\d{3})|15,16,17,18,19|3
UnionPay|^62|16,17,18,19|3
Maestro|^(5018/5020/5038/5893/6304/6759/676[1-3])|12,13,14,15,16,17,18,19|3`,units:`length|km|mi|0.621371192237334|
length|mi|km|1.609344|
length|m|ft|3.28083989501312|
length|ft|m|0.3048|
length|cm|in|0.393700787401575|
length|in|cm|2.54|
length|km|nmi|0.539956803455724|
length|nmi|km|1.852|
length|yd|m|0.9144|
length|m|yd|1.09361329833771|
weight|kg|lb|2.20462262184878|
weight|lb|kg|0.45359237|
weight|g|oz|0.0352739619495804|
weight|oz|g|28.349523125|
weight|st|kg|6.35029318|
weight|kg|st|0.15747304441777|
volume|l|gal|0.264172052358148|
volume|gal|l|3.785411784|
volume|ml|floz|0.033814022701843|
volume|floz|ml|29.5735295625|
volume|m3|ft3|35.3146667214886|
volume|ft3|m3|0.028316846592|
temperature|c|f||x*9/5+32
temperature|f|c||(x-32)*5/9
temperature|c|k||x+273.15
temperature|k|c||x-273.15`};
var countries=d(R.countries,function(v){return{code:v[0],name:v[1],currency:v[2],phone:v[3]};},function(o){return o.code;},function(o){return o.name+' '+o.code+' '+o.currency+' '+o.phone;});
var currencies=d(R.currencies,function(v){return{code:v[0],name:v[1],symbol:v[2],decimals:+v[3]};},function(o){return o.code;},function(o){return o.name+' '+o.code+' '+o.symbol;});
var days=d(R.days,function(v){return{name:v[0],abbr:v[1],num:+v[2]};},function(o){return o.num;},function(o){return o.name+' '+o.abbr+' '+o.num;});
var months=d(R.months,function(v){return{name:v[0],abbr:v[1],num:+v[2],days:+v[3]};},function(o){return o.num;},function(o){return o.name+' '+o.abbr+' '+o.num;});
var languages=d(R.languages,function(v){return{code:v[0],name:v[1],native:v[2]};},function(o){return o.code;},function(o){return o.name+' '+o.native+' '+o.code;});
var timezones=d(R.timezones,function(v){return{id:v[0],offset:v[1],description:v[2]};},function(o){return o.id;},function(o){return o.id+' '+o.description+' '+o.offset;});
var http=d(R.http,function(v){return{code:+v[0],phrase:v[1],category:v[2]};},function(o){return o.code;},function(o){return o.code+' '+o.phrase+' '+o.category;});
var mime=(function(){var a,m,r=d(R.mime,function(v){return{ext:v[0],type:v[1]};},function(o){return o.ext;},function(o){return o.ext+' '+o.type;});function p(){if(a)return a;a=r.list();m={};a.forEach(function(o){if(!m[l(o.type)])m[l(o.type)]=o;});return a;}return{list:function(){return p().slice();},get:function(k){return r.get(k);},fromType:function(t){p();return m[l(t)]||null;},search:function(q){return r.search(q);}};}());
var colours=d(R.colours,function(v){return{name:v[0],hex:v[1]};},function(o){return o.name;},function(o){return o.name+' '+o.hex;});
var cards=(function(){var a,m;function p(){if(a)return a;a=[];m={};R.cards.replace(/[^\n]+/g,function(r){var v=r.split('|'),o={name:v[0],pattern:v[1],lengths:v[2].split(',').map(function(x){return+x;}),cvv:+v[3]};o.regex=new RegExp(o.pattern);a.push(o);m[l(o.name)]=o;});return a;}return{list:function(){return p().slice();},get:function(k){p();return m[l(k)]||null;},search:function(q){q=l(q);return q?p().filter(function(o){return l(o.name).indexOf(q)>-1;}):p().slice();},detect:function(n){n=String(n||'').replace(/\D/g,'');if(!n)return null;return p().find(function(o){return o.regex.test(n)&&o.lengths.indexOf(n.length)>-1;})||null;}};}());
var units=(function(){var a,m;function p(){if(a)return a;a=[];m={};R.units.replace(/[^\n]+/g,function(r){var v=r.split('|'),o={category:v[0],from:v[1],to:v[2]};if(v[3])o.factor=+v[3];if(v[4])o.formula=v[4];a.push(o);m[l(o.from+'>'+o.to)]=o;});return a;}function run(o,x){if(Object.prototype.hasOwnProperty.call(o,'factor'))return x*o.factor;if(o.formula)return Function('x','return '+o.formula)(x);throw new Error('No conversion rule');}return{list:function(){return p().slice();},get:function(k){p();return m[l(k)]||null;},search:function(q){q=l(q);return q?p().filter(function(o){return l(o.category+' '+o.from+' '+o.to).indexOf(q)>-1;}):p().slice();},convert:function(v,from,to){from=l(from);to=l(to);if(from===to)return v;var o=this.get(from+'>'+to);if(!o)throw new Error('Unknown conversion: '+from+' to '+to);return run(o,+v);}};}());
var S={};function subdivisions(code){code=String(code||'').toUpperCase();if(!code)return Promise.resolve([]);if(S[code])return Promise.resolve(S[code]);if(typeof fetch!=='function')return Promise.resolve(S[code]=[]);S[code]=fetch('codes/'+code+'.json').then(function(r){return r&&r.ok&&typeof r.json==='function'?r.json():[];}).catch(function(){return[];}).then(function(v){return S[code]=Array.isArray(v)?v:[];});return Promise.resolve(S[code]);}
return{countries:countries,currencies:currencies,days:days,months:months,languages:languages,timezones:timezones,http:http,mime:mime,colours:colours,cards:cards,units:units,subdivisions:subdivisions};
})();
