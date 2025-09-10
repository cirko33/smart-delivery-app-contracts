
# PolkaSteak

### How to run project

    bun install

    bun run dev

### How to run test

First, comment out ``` import SmWorker from "polkadot-api/smoldot/worker?worker"; ``` 

From the file ```./frontend/src/lib/validator-rewards/core/providers.ts```

Then:

    bun run test

-------------

### Code Structure

The primary code for the project can be found in ``` ./frontend/src/lib/... ```

I split the code into:

* ```account-manager/``` - Handles the connectivity of the accounts connecting to polkadot wallets

* ```papi-utils/``` - Used for any small utility based functions that could be used across the polkadot-api such as conversions

* ```validator-rewards/``` - Here you will find the meat of the application. It contains:
  * ```core/``` folder which holds the integral components needed to interact with the papi api such as the connection manager and providers (could be abstracted out in future if application grows). This also contains the logic for swapping between the smoldot provider and the websockets provider
  * ```test/``` provides a test file that checks the APY against the CSV file provided for a known era (using currently active validators), 
  * ```index.ts``` contains the exported code used in the frontend application - it interacts with polkadot-api directly to query the storage for things needed to calculate the APY etc... to help calculate the most profitable APYs accross all the currently active validators for a given era
    *  Handles both single validator and bulk validator analysis
    * Historical performance tracking across eras
    * Accumulated profit calculations 


-----------

## Future Improvements

* Break up ```validator-rewards/index.ts``` large functions into smaller and more composed functions
* Provide better comments for my functions in the ```validator-rewards/index.ts``` file, documenting the param values and return data
* Create a seperate file for my composed presentation layer functions in the ```validator-rewards/index.ts``` file, to seperate them from the functions used to form them (after breaking them up)

-----------

## Process of Getting to Where The Dapp Currently is 

#### I started off by exploring what the polkadot-api provided me via the papi console

By exploring the the possible storage I could read I was able to deduce a few things I could possibly need for this project and created wrapper functions with comments explaining what they could provide me

#### Initial Naive Approach to APY
```typescript
// Original oversimplified thinking:
const apy = (dailyReward / totalStake) * 365 * 100;
```

#### Refined Understanding - The Real Calculation

First Iteration - Accumulated Profits Averaging
I thought I could get more accurate APY by accumulating profits across multiple eras and averaging.


I believed this would give a better long-term picture of validator performance. However, after discussing with Josep, I realized this approach was fundamentally flawed because:
* Nominator changes: I hadn't considered that stakers come and go between eras
* Dynamic stake amounts: I overlooked that total staked amounts fluctuate significantly
* Commission variations: I missed that validators adjust commission rates over time
* Market conditions: I didn't account for network-wide reward rate changes

#### Final Understanding - Era-Specific Snapshots
I learned that APY must be calculated per era using that era's specific conditions - I can't average (I have now instead averaged the APY after calculating all the APYs in the validator dashboard)

#### Era Data Collection Process
I built a data pipeline:

1. **Era Information**: `getCurrentEra()` - Get current era details
2. **Validator Lists**: `getActiveValidators()` - Current validator set
3. **Commission Data**: `getCommissionAndBlockedForValidatorsInEra()` - Commission rates per era
4. **Staking Overview**: `getStakingEraValidatorOverviewForValidatorsInEra()` - Stake amounts
5. **Reward Points**: `getStakingRewardPointsForValidatorsInEra()` - Performance points
6. **Era Rewards**: `getStakingRewardForValidatorsInEra()` - Total era rewards

#### The Critical Insight: Points-Based Distribution
I discovered that rewards aren't distributed by stake alone, but by **performance points**:

```typescript
const validatorShare = (totalRewardForEra * points) / totalPointsForEra;
```

#### Validation & Testing

#### CSV-Based Validation
I created a testing system using real Polkadot data provided to me by the PBA team:
- **Test Data**: `APY Polkadot era 1916 - apy.csv` with 500+ validators
- **Validation Logic**: Compare calculated vs. expected APY

```typescript
// Testing approach in tests/index.ts
const diff = Math.abs(calculatedAPY - expectedAPY);
if (diff <= 0.1) {
  matches++;
} else {
  console.log('mismatch:', result.validatorId, 'calculated:', calculatedAPY, 'expected:', expectedAPY);
}
```

### Other Technical Breakthrough Moments

#### 1. Understanding Perbill Commission Rates
```typescript
const perbillToDecimal = (perbillValue: number | bigint): number => {
  const PERBILL_DIVISOR = 1_000_000_000; 
  return Number(perbillValue) / PERBILL_DIVISOR;
}
```

#### 2. Planck to DOT Conversion Precision
```typescript
const plancksToDot = (value: bigint): number => {
  return Number(value) / (10 ** 10);
}
```


# Second Half of Assignment - Addons

------------------- 
## Part 1 - .1

##### ***Investigate if there is a minimum bond required to enter staking***

* Yes the minimum bond is required to enter staking and retrieve rewards, this bond amount is retrieved via the Staking.getMinimumNominatorBond ==> 250 dot 
  
  * Initially thought it could be getMinimumActiveStake() but after seeing it on subscan as 250 dot I realised that was wrong - Not sure exactly what this refers to now though
    
------------------- 
## Part 1 - .2

##### ***Investigate if there is a minimum bond required to earn rewards***

* I assume this is the same amount as what is needed to enter staking but I could be wrong and maybe that is what ``Staking.MinimumActiveStake`` is used for and it is a dynamic amount - but that doesn't make much sense to me if the required amount to be eligible for staking is 250 dot - couldn't find clarity on this unfortunately  
  
------------------- 
## Part 1 - .3

##### ***Given an address, find out if it meets the requirements to enter staking and earn rewards***

#### Implementation

See "Check Account Reward Eligibility" to open dialogue that allows the user to check against an inputted account or their own account retrieved from injected wallet - this checks that the nominators stake is above the minimum bond amount and states they are eligible if it is.

------------------- 
## Part 1 - .4 & .5

##### ***Not all nominators receive rewards in every era. Active nominators are selected through [staking bags](https://wiki.polkadot.network/docs/learn-staking-advanced#bags-list).). For a given nominator not earning rewards, find out if it's something that can be easily fixed by managing the bag it's in, or by adding more stake.***

* Yes - nominators higher in the bags list and in higher bags lists are more likely to become active nominators and receive rewards. This can happen via various reasons as new nominators are added (the blockchain doesn't tidy this up automatically resulting in semi sorted list that needs to be sorted out via extrinsic calls "In Front Of" moving the nominator to the correct position in the bag, and "Rebag" putting the nominator into the correct bag it should be in given its stake amount)
##### ***Besides that, nominators can end up in the wrong bag while compounding their rewards. Find all misplaced nominators.***

#### Implementation
   
See eligibility dialogue "Check Account Reward Eligibility" - this shows users how a nominator could optimise their position in the bags list and rebag if in the wrong bag for increased chances of earning rewards --- this is done by checking the current bag position using list nodes for a given nominator, then checks if in correct bag by using the score returned - checking against the smallest threshold from all bags to find where their stake fits into. Then checks if their position in the bag by starting at the bags head from bag upper and iterates through "next" until at the nominator (number of steps to get to the account addr is their position). The analysis on if they are in the wrong bag or in the wrong position is deduced via this process. This process is propagated by the checkNominatorStatus fn which searches for the list nominator from ``VoterList.ListNodes`` and then does what is described above from that data.

------------------- 


## Part 2

##### ***Given an account address, show the nomination status of that account. Is it nominating? How much has it bonded? Is it earning rewards? Which validators has it selected? Which validator has been active per era?***

#### Implementation

See "Check Account Reward Eligibility" to open dialogue and input a nominator address - the validators that have been nominated by the nominator is listed via ``Staking.Nominators`` - the bonded amount is retrieved via ``Balances.Holds``

-- I was not able to do "Which validator has been active per era?"

------------------- 
##### ***As a bonus, integrate your dApp with a wallet of your choice (Browser extension, ledger device, WalletConnect, etc.) and let the user select an account from that wallet. Show the status of the selected account.***
#### Implementation

See "Check Account Reward Eligibility" - it provides an option for you to check these details on your own account retrieved via the connected accounts. ``  getInjectedExtensions ``, ``connectInjectedExtension `` are used to prompt the user to connect their wallets to the page and after a wallet is connected, my getAccounts() fn in ``./lib/account-manager/index.ts`` returns the array of connected accounts. 
 
----------------

### Additional

* Following Josep's recommendation to add caching to ``.getEntries()`` where data was reused, I added in a file ``./frontend/lib/validator-rewards/cache.ts`` which has an in memory cache (clears after page refresh) - I tried using ``localStorage`` but data size exceeded the quota and so I left it as just in memory with a 60 min ttl. In a more production rebuild of this I would use a db such as redis to store and fetch this data.

* Added the "Explore Nominators" button in the table that allows users to see the number of active nominators for a specific validator in a given era and the total amount bonded - it lists all the active nominators and the top 5 nominators by stake 

    * I implemented this to provide me more nominator accounts that I could use to test the eligibility dialogue with seems as I had the data coming back from ``Staking.ErasStakersPaged`` which I initially thought I would need for the optimisation of bags list but later realised it wasn't needed

