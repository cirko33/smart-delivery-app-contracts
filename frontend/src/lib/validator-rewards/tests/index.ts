import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
  getErasValidatorsArray,
  getCommissionAndBlockedForValidatorsInEra,
  getStakingEraValidatorOverviewForValidatorsInEra,
  getStakingRewardPointsForValidatorsInEra,
  getStakingRewardForValidatorsInEra,
  calculateRewardAvailableAfterValidatorCommissionsInEra,
  calculateRewardAfterValidatorCommissionWithAPY
} from '../index';

const era = 1916;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const csvPath = join(__dirname, 'APY Polkadot era 1916 - apy.csv');

function parseCSV() {
  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const data = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length >= 3) {
      const address = columns[1];
      const apy = parseFloat(columns[2].replace('%', ''));
      if (apy > 0) {
        data.set(address, apy);
      }
    }
  }
  
  return data;
}

async function testAPY() {
  console.log('starting apy test for era', era);
  
  const csvData = parseCSV();
  console.log('parsed csv data for', csvData.size, 'validators');
  
  const eraValidators = await getErasValidatorsArray(era);
  console.log('found', eraValidators.length, 'validators for era', era);
  
  const [commissionData, stakingData, rewardPoints, totalReward] = await Promise.all([
    getCommissionAndBlockedForValidatorsInEra(eraValidators),
    getStakingEraValidatorOverviewForValidatorsInEra(eraValidators),
    getStakingRewardPointsForValidatorsInEra(era),
    getStakingRewardForValidatorsInEra(era)
  ]);
  
  const validatorRewards = calculateRewardAvailableAfterValidatorCommissionsInEra(
    rewardPoints.individual.map(([validatorId, points]) => [validatorId, BigInt(points)]),
    BigInt(rewardPoints.total),
    BigInt(totalReward || 0n)
  );
  
  const apyResults = calculateRewardAfterValidatorCommissionWithAPY(
    validatorRewards,
    commissionData,
    stakingData
  );
  
  let matches = 0;
  let total = 0;
  
  for (const result of apyResults) {
    const csvAPY = csvData.get(result.validatorId);
    if (csvAPY !== undefined) {
      total++;
      const calculatedAPY = Math.round(result.apy * 100) / 100;
      const expectedAPY = Math.round(csvAPY * 100) / 100;
      const diff = Math.abs(calculatedAPY - expectedAPY);
      
      if (diff <= 0.1) {
        matches++;
      } else {
        console.log('mismatch:', result.validatorId.substring(0, 8), 'calculated:', calculatedAPY, 'expected:', expectedAPY);
      }
    }
  }
  
  console.log('matched', matches, 'out of', total, 'validators');
  console.log('success rate:', Math.round((matches / total) * 100), '%');
}

testAPY().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
