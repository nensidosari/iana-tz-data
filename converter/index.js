const packedLatest = require('moment-timezone/data/packed/latest.json');
const moment = require('moment-timezone');
// const oldLatest = require('./latest.json');

function unpackAndUnlink(latest) {
  const unpacked = {
    ...latest,
    zones: latest.zones.map(moment.tz.unpack),
    links: [],
    countries: []
  };

  latest.links.forEach(link => {
    const [ leadTzName, alias ] = link.split('|');
    const leadTzData = unpacked.zones.find(zone => zone.name === leadTzName);

    unpacked.zones.push({
      ...leadTzData,
      name: alias
    });
  });

  latest.countries.forEach((country, i) => {
    const [ countryAlias, leadTzName ] = country.split('|');
    const leadTzData = unpacked.zones.filter(zone => leadTzName.includes(zone.name));
    leadTzData.forEach(lead => {
      lead.countries = lead.countries ? [...lead.countries, countryAlias] : [countryAlias];
    })
    unpacked.countries.push({
      name: countryAlias,
      zones: leadTzName.split(" ")
    });
  });

  const sortFn = (a, b) => {
    return a.replace('/', '').toLowerCase().localeCompare(b.replace('/', '').toLowerCase())
  }

    unpacked.zones = [
      ...unpacked.zones.map(data => {
        // const subset = moment.tz.filterYears(data, 2023);
        const {name, abbrs, offsets, untils, population, countries} = data;

        return {name, abbrs, untils, offsets: offsets.map(offset => parseFloat(offset.toFixed(4))), population, countries}
      })
    ].sort((a, b) => sortFn(a.name, b.name))

    return unpacked;
  }

  const unpackedLatest = unpackAndUnlink(packedLatest);

  var momentTimezoneJson = unpackedLatest;

  var output = {
    version: momentTimezoneJson.version,
    zoneData: {}
  };

  momentTimezoneJson.zones.forEach(({name, abbrs, untils, offsets, isdsts}) => {
    name = name.split('/');
    name.slice(0, -1).reduce(function (tree, item) {
      return tree[item] || (tree[item] = {});
    }, output.zoneData)[name.slice(-1)[0]] = {abbrs, untils, offsets, isdsts};
  })

  console.log(JSON.stringify(output, null, 2));