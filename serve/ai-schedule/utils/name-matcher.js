function fuzzyMatchName(input, target) {
  if (!input || !target) {
    return false;
  }
  
  const normalizedInput = input.trim().toLowerCase();
  const normalizedTarget = target.trim().toLowerCase();
  
  if (normalizedInput === normalizedTarget) {
    return true;
  }
  
  if (normalizedTarget.includes(normalizedInput) || normalizedInput.includes(normalizedTarget)) {
    return true;
  }
  
  const inputChars = normalizedInput.split('');
  const targetChars = normalizedTarget.split('');
  
  let matchCount = 0;
  let inputIndex = 0;
  
  for (let i = 0; i < targetChars.length; i++) {
    if (inputIndex < inputChars.length && targetChars[i] === inputChars[inputIndex]) {
      matchCount++;
      inputIndex++;
    }
  }
  
  const similarity = matchCount / Math.max(inputChars.length, targetChars.length);
  return similarity >= 0.6;
}

function findBestMatch(input, candidates, nameField = 'name') {
  if (!input || !candidates || candidates.length === 0) {
    return null;
  }
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const name = candidate[nameField] || candidate.username || candidate.customer_name;
    if (!name) continue;
    
    if (fuzzyMatchName(input, name)) {
      const score = calculateMatchScore(input, name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }
  }
  
  return bestMatch;
}

function calculateMatchScore(input, target) {
  const normalizedInput = input.trim().toLowerCase();
  const normalizedTarget = target.trim().toLowerCase();
  
  if (normalizedInput === normalizedTarget) {
    return 1.0;
  }
  
  if (normalizedTarget.includes(normalizedInput)) {
    return 0.9;
  }
  
  if (normalizedInput.includes(normalizedTarget)) {
    return 0.8;
  }
  
  const commonChars = [...normalizedInput].filter(char => normalizedTarget.includes(char)).length;
  const totalChars = Math.max(normalizedInput.length, normalizedTarget.length);
  
  return commonChars / totalChars;
}

module.exports = {
  fuzzyMatchName,
  findBestMatch,
  calculateMatchScore
};
