import axios from 'axios';

export function parseM3U(rawText) {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const channels = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      current = parseExtinfLine(line);
    } else if (line.startsWith('#')) {
      continue;
    } else if (current) {
      current.streamUrl = line;
      channels.push(current);
      current = null;
    }
  }
  return channels;
}

function parseExtinfLine(line) {
  const nameMatch = line.match(/,(.*)$/);
  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
  const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
  const groupMatch = line.match(/group-title="([^"]*)"/);
  return {
    rawName: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
    tvgId: tvgIdMatch ? tvgIdMatch[1] : null,
    logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
    sourceGroup: groupMatch ? groupMatch[1] : 'Uncategorized',
    streamUrl: null,
  };
}

export async function fetchAndParsePlaylist(playlistUrl) {
  const { data } = await axios.get(playlistUrl, { responseType: 'text', timeout: 10000, headers: { 'User-Agent': 'CipherStream/1.0' } });
  return parseM3U(data);
}

export function curateChannels(rawChannels, curationMap) {
  const curated = [];
  for (const raw of rawChannels) {
    const key = raw.tvgId || raw.rawName;
    const mapping = curationMap[key];
    if (!mapping) continue;
    curated.push({
      displayName: mapping.displayName,
      category: mapping.category,
      tier: mapping.tier,
      description: mapping.description || '',
      logo: raw.logo,
      streamUrl: raw.streamUrl,
      sourceGroup: raw.sourceGroup,
    });
  }
  return curated;
}
